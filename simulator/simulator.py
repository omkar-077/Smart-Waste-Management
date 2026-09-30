#!/usr/bin/env python3
"""
SmartWaste IoT Sensor Simulator
================================
Simulates 50–1000 smart waste bins sending realistic sensor data to Firebase.
Designed to be a drop-in replacement for real ESP32 + HC-SR04 hardware.

Author: SmartWaste Team
Demo City: Nashik, Maharashtra
"""

import firebase_admin
from firebase_admin import credentials, db
import json
import time
import random
import math
import logging
import uuid
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

# ─── Logging ────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("SmartWasteSimulator")

# ─── Load Config ─────────────────────────────────────────────────────────────
with open(os.path.join(os.path.dirname(__file__), "config.json")) as f:
    CONFIG = json.load(f)

THRESHOLDS = CONFIG["thresholds"]
SENSOR_CFG = CONFIG["sensor"]
SIM_CFG = CONFIG["simulation"]
SCENARIOS = CONFIG["scenarios"]
MUNICIPALITY = CONFIG["municipality"]
WARDS = MUNICIPALITY["wards"]
BIN_TYPES = CONFIG["binTypes"]

EMPTY_DIST = SENSOR_CFG["emptyDistanceCm"]
FULL_DIST = SENSOR_CFG["fullDistanceCm"]
MIN_VALID_DIST = SENSOR_CFG["minValidDistanceCm"]
MAX_VALID_DIST = SENSOR_CFG["maxValidDistanceCm"]


# ─── Firebase Init ───────────────────────────────────────────────────────────
def init_firebase():
    """Initialize Firebase Admin SDK with service account credentials."""
    service_account_path = os.getenv(
        "FIREBASE_SERVICE_ACCOUNT_PATH",
        CONFIG["firebase"]["serviceAccountPath"]
    )
    if not os.path.isabs(service_account_path):
        service_account_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), service_account_path)
    database_url = os.getenv(
        "FIREBASE_DATABASE_URL",
        CONFIG["firebase"]["databaseURL"]
    )

    if not os.path.exists(service_account_path):
        logger.error(
            f"Service account file not found: {service_account_path}\n"
            "Please download serviceAccount.json from Firebase Console:\n"
            "  Project Settings → Service Accounts → Generate New Private Key\n"
            "And place it in the simulator/ directory."
        )
        raise FileNotFoundError(f"serviceAccount.json not found at {service_account_path}")

    cred = credentials.Certificate(service_account_path)
    firebase_admin.initialize_app(cred, {"databaseURL": database_url})
    logger.info(f"Firebase initialized. Database: {database_url}")


# ─── Bin Coordinate Generator ────────────────────────────────────────────────
def generate_nashik_coordinates(ward_index: int, bin_index_in_ward: int) -> tuple:
    """
    Generate realistic GPS coordinates around Nashik, Maharashtra.
    Center: 19.9975°N, 73.7898°E
    Spread across different wards/neighborhoods.
    """
    # Neighborhood centers for each ward in Nashik
    ward_centers = [
        (20.0112, 73.7857),   # Ward 1 - Panchavati
        (19.9936, 73.7952),   # Ward 2 - Shalimar
        (19.9650, 73.8291),   # Ward 3 - Nashik Road
        (20.0055, 73.7610),   # Ward 4 - Cidco
        (19.9890, 73.7540),   # Ward 5 - Satpur
        (19.9500, 73.8400),   # Ward 6 - Deolali
        (20.0200, 73.7700),   # Ward 7 - Gangapur
        (19.9750, 73.8050),   # Ward 8 - Indira Nagar
        (19.9980, 73.7900),   # Ward 9 - Ashok Stambh
        (19.9820, 73.7780),   # Ward 10 - Canada Corner
    ]

    center_lat, center_lng = ward_centers[ward_index % len(ward_centers)]
    # Spread bins within ~300m of the ward center
    spread = 0.003
    lat = center_lat + random.uniform(-spread, spread)
    lng = center_lng + random.uniform(-spread, spread)
    return round(lat, 6), round(lng, 6)


# ─── Bin Profile ────────────────────────────────────────────────────────────
class BinProfile:
    """
    Simulates realistic fill-level behavior for a single smart bin.
    Patterns mimic real-world waste accumulation patterns.
    """

    PATTERNS = {
        "normal":   {"rate": SCENARIOS["normalFillRate"],  "variance": 0.3},
        "rapid":    {"rate": SCENARIOS["rapidFillRate"],   "variance": 0.5},
        "slow":     {"rate": SCENARIOS["slowFillRate"],    "variance": 0.1},
        "market":   {"rate": 1.5,                          "variance": 0.8},
        "hospital": {"rate": 0.8,                          "variance": 0.2},
    }

    def __init__(self, bin_id: str, ward: str, ward_index: int, bin_index: int, pattern: str = None):
        self.bin_id = bin_id
        self.ward = ward

        # Randomly assign or use given pattern
        if pattern is None:
            weights = [0.4, 0.2, 0.2, 0.15, 0.05]
            pattern = random.choices(list(self.PATTERNS.keys()), weights=weights)[0]
        self.pattern = pattern

        # Initial fill level (random so dashboard shows variety immediately)
        self.fill_percentage = random.uniform(5, 85)
        self.battery = random.uniform(60, 100)
        self.is_online = True
        self.low_battery_flag = False

        # GPS
        self.latitude, self.longitude = generate_nashik_coordinates(ward_index, bin_index)

        # Bin metadata
        self.bin_type = random.choice(BIN_TYPES)
        self.capacity = random.choice([50, 100, 150, 200])

        # Sensor state
        self.sensor_status = "ONLINE"
        self.failure_counter = 0
        self.offline_duration = 0
        self.last_valid_fill = self.fill_percentage

        # Track abnormal reading injection
        self.injected_abnormal = False

    def calculate_distance(self, fill_pct: float) -> float:
        """Convert fill percentage to HC-SR04 distance reading (cm)."""
        # Reverse of: fill = (empty - dist) / (empty - full) * 100
        dist = EMPTY_DIST - (fill_pct / 100.0) * (EMPTY_DIST - FULL_DIST)
        # Add realistic sensor noise ±1 cm
        noise = random.uniform(-1.0, 1.0)
        dist = max(FULL_DIST - 2, min(EMPTY_DIST + 2, dist + noise))
        return round(dist, 1)

    def calculate_fill_from_distance(self, dist_cm: float) -> float:
        """HC-SR04 fill percentage formula as used on the real device."""
        fill = ((EMPTY_DIST - dist_cm) / (EMPTY_DIST - FULL_DIST)) * 100
        return max(0, min(100, round(fill, 1)))

    def get_status(self) -> str:
        if self.fill_percentage >= THRESHOLDS["critical"]:
            return "CRITICAL"
        elif self.fill_percentage >= THRESHOLDS["high"]:
            return "HIGH"
        elif self.fill_percentage >= THRESHOLDS["medium"]:
            return "MEDIUM"
        return "NORMAL"

    def update(self) -> dict:
        """
        Advance simulation by one time step.
        Returns the sensor reading dict to push to Firebase.
        """
        pattern = self.PATTERNS[self.pattern]
        interval_minutes = SIM_CFG["updateIntervalSeconds"] / 60.0

        # ── Battery drain ────────────────────────────────────────────────────
        drain = SCENARIOS["batteryDrainRate"] * interval_minutes
        self.battery = max(0, self.battery - drain)
        if self.battery < SCENARIOS["lowBatteryThreshold"]:
            self.low_battery_flag = True
            self.sensor_status = "LOW_BATTERY"

        # ── Sensor failure simulation ────────────────────────────────────────
        if self.is_online:
            if random.random() < SCENARIOS["sensorFailureProbability"]:
                self.is_online = False
                self.offline_duration = random.randint(2, 8)
                self.sensor_status = "OFFLINE"
                self.failure_counter += 1
                logger.warning(f"[{self.bin_id}] Sensor went OFFLINE")
        else:
            self.offline_duration -= 1
            if self.offline_duration <= 0:
                self.is_online = True
                self.sensor_status = "ONLINE" if not self.low_battery_flag else "LOW_BATTERY"
                logger.info(f"[{self.bin_id}] Sensor back ONLINE")

        if not self.is_online:
            # Return offline reading (no fill update)
            return self._build_reading(abnormal=False, offline=True)

        # ── Abnormal reading injection ────────────────────────────────────────
        if random.random() < SCENARIOS["abnormalReadingProbability"]:
            abnormal_fill = random.uniform(0, 15)  # sudden drop — suspicious
            dist_cm = self.calculate_distance(abnormal_fill)
            self.sensor_status = "INVALID_READING"
            logger.warning(f"[{self.bin_id}] Abnormal reading: {abnormal_fill:.1f}% (prev: {self.last_valid_fill:.1f}%)")
            return self._build_reading(fill_override=abnormal_fill, dist_override=dist_cm, abnormal=True)

        # Recover status after abnormal
        if self.sensor_status == "INVALID_READING":
            self.sensor_status = "ONLINE" if not self.low_battery_flag else "LOW_BATTERY"

        # ── Realistic fill level change ───────────────────────────────────────
        # Time-of-day multiplier (busier during day)
        hour = datetime.now().hour
        if 7 <= hour <= 12:
            tod_multiplier = 1.5
        elif 12 < hour <= 18:
            tod_multiplier = 1.2
        elif 18 < hour <= 22:
            tod_multiplier = 0.9
        else:
            tod_multiplier = 0.3

        fill_increment = (
            pattern["rate"]
            * tod_multiplier
            * interval_minutes
            + random.gauss(0, pattern["variance"] * interval_minutes)
        )
        fill_increment = max(0, fill_increment)  # Fill only increases (until collection)

        self.fill_percentage = min(100, self.fill_percentage + fill_increment)
        self.last_valid_fill = self.fill_percentage

        dist_cm = self.calculate_distance(self.fill_percentage)
        return self._build_reading(dist_override=dist_cm)

    def reset_after_collection(self, new_fill: float = None):
        """Called when collection is detected from Firebase."""
        self.fill_percentage = new_fill if new_fill is not None else random.uniform(3, 10)
        self.last_valid_fill = self.fill_percentage
        logger.info(f"[{self.bin_id}] Collection detected → reset to {self.fill_percentage:.1f}%")

    def _build_reading(
        self,
        fill_override: float = None,
        dist_override: float = None,
        abnormal: bool = False,
        offline: bool = False
    ) -> dict:
        fill = fill_override if fill_override is not None else self.fill_percentage
        dist = dist_override if dist_override is not None else self.calculate_distance(fill)
        now = datetime.now(timezone.utc).isoformat()

        return {
            "binId": self.bin_id,
            "ward": self.ward,
            "binType": self.bin_type,
            "capacity": self.capacity,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "fillPercentage": round(fill, 1) if not offline else None,
            "distanceCm": round(dist, 1) if not offline else None,
            "battery": round(self.battery, 1),
            "sensorStatus": self.sensor_status if offline else (
                "INVALID_READING" if abnormal else self.sensor_status
            ),
            "status": self.get_status() if not offline else "UNKNOWN",
            "isAbnormal": abnormal,
            "lastUpdated": now,
        }


# ─── Alert Engine ────────────────────────────────────────────────────────────
class AlertEngine:
    """
    Server-side alert generation.
    Ensures one active alert per bin (no duplicate spam).
    """

    def __init__(self):
        self.active_alerts: dict[str, str] = {}  # binId → alertId
        self._load_existing_alerts()

    def _load_existing_alerts(self):
        """Load existing OPEN/ASSIGNED alerts from Firebase to prevent duplicates on restart."""
        try:
            alerts_ref = db.reference("smartwaste/alerts")
            all_alerts = alerts_ref.get() or {}
            for alert_id, alert in all_alerts.items():
                if alert.get("status") in ("OPEN", "ASSIGNED", "IN_PROGRESS"):
                    self.active_alerts[alert["binId"]] = alert_id
            logger.info(f"Loaded {len(self.active_alerts)} existing active alerts")
        except Exception as e:
            logger.warning(f"Could not load existing alerts: {e}")

    def process(self, reading: dict):
        """Evaluate a sensor reading and create/resolve alerts as needed."""
        bin_id = reading["binId"]
        fill = reading.get("fillPercentage")

        if fill is None or reading.get("isAbnormal"):
            return

        if fill >= THRESHOLDS["high"]:
            self._ensure_alert(bin_id, fill, reading)
        else:
            # Fill dropped below threshold — may have been collected externally
            if bin_id in self.active_alerts:
                pass  # Alert resolution is handled by collection workflow

    def _ensure_alert(self, bin_id: str, fill: float, reading: dict):
        """Create a new alert only if none is currently active for this bin."""
        if bin_id in self.active_alerts:
            return  # Already has an active alert

        if fill >= THRESHOLDS["critical"]:
            priority = "CRITICAL"
        else:
            priority = "HIGH"

        alert_id = f"ALT-{int(time.time() * 1000) % 100000:05d}"
        now = datetime.now(timezone.utc).isoformat()

        alert = {
            "alertId": alert_id,
            "binId": bin_id,
            "ward": reading.get("ward", ""),
            "fillPercentage": fill,
            "priority": priority,
            "status": "OPEN",
            "createdAt": now,
            "updatedAt": now,
            "assignedEmployee": None,
            "resolvedAt": None,
        }

        db.reference(f"smartwaste/alerts/{alert_id}").set(alert)
        self.active_alerts[bin_id] = alert_id
        logger.info(f"🚨 Alert {alert_id} created for {bin_id} ({priority} {fill:.1f}%)")

    def clear_alert(self, bin_id: str):
        """Mark alert resolved (called after collection)."""
        if bin_id in self.active_alerts:
            del self.active_alerts[bin_id]


# ─── Sensor Validator ────────────────────────────────────────────────────────
def validate_reading(reading: dict, previous_fill: float) -> tuple[bool, str]:
    """
    Validate sensor reading before accepting it.
    Returns (is_valid, reason).
    """
    fill = reading.get("fillPercentage")
    dist = reading.get("distanceCm")

    if reading.get("sensorStatus") == "OFFLINE":
        return False, "OFFLINE"

    if fill is None or dist is None:
        return False, "MISSING_DATA"

    if not (0 <= fill <= 100):
        return False, "FILL_OUT_OF_RANGE"

    if not (MIN_VALID_DIST <= dist <= MAX_VALID_DIST):
        return False, "DISTANCE_OUT_OF_RANGE"

    # Suspicious sudden drop (more than 40% drop without collection)
    if previous_fill is not None and (previous_fill - fill) > 40:
        return False, "SUSPICIOUS_DROP"

    return True, "OK"


# ─── Firebase Writer ─────────────────────────────────────────────────────────
def write_to_firebase(bin_profile: BinProfile, reading: dict, alert_engine: AlertEngine):
    """Write bin state + historical reading to Firebase."""
    bin_id = reading["binId"]
    now_ms = int(time.time() * 1000)

    # Validate reading
    is_valid, reason = validate_reading(reading, bin_profile.last_valid_fill)
    reading["validationStatus"] = reason

    # ── Current bin state ───────────────────────────────────────────────────
    bin_ref = db.reference(f"smartwaste/bins/{bin_id}")
    bin_data = {
        "binId": bin_id,
        "ward": reading["ward"],
        "binType": reading["binType"],
        "capacity": reading["capacity"],
        "latitude": reading["latitude"],
        "longitude": reading["longitude"],
        "fillPercentage": reading["fillPercentage"],
        "distanceCm": reading["distanceCm"],
        "battery": reading["battery"],
        "sensorStatus": reading["sensorStatus"],
        "status": reading["status"],
        "lastUpdated": reading["lastUpdated"],
        "validationStatus": reason,
    }
    bin_ref.update(bin_data)

    # ── Historical sensor readings ──────────────────────────────────────────
    history_ref = db.reference(f"smartwaste/sensorReadings/{bin_id}")
    history_ref.push({
        "binId": bin_id,
        "distanceCm": reading["distanceCm"],
        "fillPercentage": reading["fillPercentage"],
        "battery": reading["battery"],
        "sensorStatus": reading["sensorStatus"],
        "status": reading["status"],
        "timestamp": reading["lastUpdated"],
        "timestampMs": now_ms,
        "isValid": is_valid,
        "validationStatus": reason,
    })

    # ── Process alerts ──────────────────────────────────────────────────────
    if is_valid:
        alert_engine.process(reading)


# ─── Collection Monitor ──────────────────────────────────────────────────────
class CollectionMonitor:
    """
    Monitors Firebase for collection events completed by employees.
    When a collection is recorded, reset the corresponding bin profile.
    """

    def __init__(self, bin_profiles: dict):
        self.bin_profiles = bin_profiles
        self.processed_collections = set()

    def check_collections(self):
        """Poll Firebase for new completed collections."""
        try:
            collections_ref = db.reference("smartwaste/collections")
            all_cols = collections_ref.get() or {}
            for col_id, col in all_cols.items():
                if col_id not in self.processed_collections and col.get("status") == "COMPLETED":
                    bin_id = col.get("binId")
                    after_fill = col.get("afterFill", 5)
                    if bin_id and bin_id in self.bin_profiles:
                        self.bin_profiles[bin_id].reset_after_collection(after_fill)
                    self.processed_collections.add(col_id)
        except Exception as e:
            logger.warning(f"Collection monitor error: {e}")


# ─── Seed Initial Data ────────────────────────────────────────────────────────
def seed_employees():
    """Seed demo employee accounts."""
    employees = [
        {"employeeId": "EMP-001", "name": "Rajesh Patil", "phone": "demo-9876543210", "ward": "Ward 1 - Panchavati", "status": "AVAILABLE", "email": "rajesh@smartwaste.demo", "latitude": 20.0115, "longitude": 73.7860},
        {"employeeId": "EMP-002", "name": "Sunil Shinde", "phone": "demo-9876543211", "ward": "Ward 2 - Shalimar", "status": "AVAILABLE", "email": "sunil@smartwaste.demo", "latitude": 19.9940, "longitude": 73.7955},
        {"employeeId": "EMP-003", "name": "Anil Deshpande", "phone": "demo-9876543212", "ward": "Ward 3 - Nashik Road", "status": "AVAILABLE", "email": "anil@smartwaste.demo", "latitude": 19.9655, "longitude": 73.8295},
        {"employeeId": "EMP-004", "name": "Priya Jadhav", "phone": "demo-9876543213", "ward": "Ward 4 - Cidco", "status": "OFFLINE", "email": "priya@smartwaste.demo", "latitude": 20.0060, "longitude": 73.7615},
        {"employeeId": "EMP-005", "name": "Deepak Nikam", "phone": "demo-9876543214", "ward": "Ward 5 - Satpur", "status": "AVAILABLE", "email": "deepak@smartwaste.demo", "latitude": 19.9895, "longitude": 73.7545},
        {"employeeId": "EMP-006", "name": "Shubham More", "phone": "demo-9876543215", "ward": "Ward 6 - Deolali", "status": "AVAILABLE", "email": "shubham@smartwaste.demo", "latitude": 19.9505, "longitude": 73.8405},
        {"employeeId": "EMP-007", "name": "Kavita Borse", "phone": "demo-9876543216", "ward": "Ward 7 - Gangapur", "status": "BUSY", "email": "kavita@smartwaste.demo", "latitude": 20.0205, "longitude": 73.7705},
        {"employeeId": "EMP-008", "name": "Mahesh Gaikwad", "phone": "demo-9876543217", "ward": "Ward 8 - Indira Nagar", "status": "AVAILABLE", "email": "mahesh@smartwaste.demo", "latitude": 19.9755, "longitude": 73.8055},
        {"employeeId": "EMP-009", "name": "Sneha Kulkarni", "phone": "demo-9876543218", "ward": "Ward 9 - Ashok Stambh", "status": "AVAILABLE", "email": "sneha@smartwaste.demo", "latitude": 19.9985, "longitude": 73.7905},
        {"employeeId": "EMP-010", "name": "Vinod Pawar", "phone": "demo-9876543219", "ward": "Ward 10 - Canada Corner", "status": "OFFLINE", "email": "vinod@smartwaste.demo", "latitude": 19.9825, "longitude": 73.7785},
    ]

    emp_ref = db.reference("smartwaste/employees")
    for emp in employees:
        emp["createdAt"] = datetime.now(timezone.utc).isoformat()
        emp_ref.child(emp["employeeId"]).set(emp)

    logger.info(f"Seeded {len(employees)} employees")


def seed_settings():
    """Seed system settings."""
    settings = {
        "municipality": MUNICIPALITY,
        "thresholds": THRESHOLDS,
        "sensor": SENSOR_CFG,
        "alertCooldownMinutes": CONFIG["alertCooldownMinutes"],
        "simulationActive": True,
        "numSimulatedBins": SIM_CFG["numBins"],
        "updateIntervalSeconds": SIM_CFG["updateIntervalSeconds"],
        "version": "1.0.0",
    }
    db.reference("smartwaste/settings").set(settings)
    logger.info("Settings seeded to Firebase")


def seed_wards():
    """Seed ward information."""
    wards_ref = db.reference("smartwaste/wards")
    for i, ward in enumerate(WARDS):
        ward_id = f"WARD-{i+1:02d}"
        wards_ref.child(ward_id).set({
            "wardId": ward_id,
            "name": ward,
            "totalBins": 0,  # Will be updated by simulator
            "municipality": MUNICIPALITY["name"],
        })
    logger.info(f"Seeded {len(WARDS)} wards")


# ─── Bin Initializer ─────────────────────────────────────────────────────────
def initialize_bins(num_bins: int) -> dict:
    """
    Create bin profiles and seed initial bin state to Firebase.
    Returns dict of {bin_id: BinProfile}.
    """
    profiles = {}
    patterns = ["normal", "rapid", "slow", "market", "hospital"]

    # Assign patterns with weights for a realistic distribution
    pattern_weights = [0.4, 0.2, 0.2, 0.15, 0.05]

    logger.info(f"Initializing {num_bins} bins...")

    all_bins_payload = {}
    for i in range(1, num_bins + 1):
        bin_id = f"BIN-{i:03d}"
        ward_index = (i - 1) % len(WARDS)
        ward = WARDS[ward_index]
        bin_index = i

        pattern = random.choices(patterns, weights=pattern_weights)[0]
        profile = BinProfile(bin_id, ward, ward_index, bin_index, pattern)
        profiles[bin_id] = profile

        # Collect initial state for batch update
        dist_cm = profile.calculate_distance(profile.fill_percentage)
        now = datetime.now(timezone.utc).isoformat()

        all_bins_payload[bin_id] = {
            "binId": bin_id,
            "ward": ward,
            "binType": profile.bin_type,
            "capacity": profile.capacity,
            "latitude": profile.latitude,
            "longitude": profile.longitude,
            "fillPercentage": round(profile.fill_percentage, 1),
            "distanceCm": round(dist_cm, 1),
            "battery": round(profile.battery, 1),
            "sensorStatus": "ONLINE",
            "status": profile.get_status(),
            "lastUpdated": now,
            "lastCollection": None,
            "validationStatus": "OK",
        }

    db.reference("smartwaste/bins").update(all_bins_payload)
    logger.info(f"Initialized {num_bins} bins in Firebase (batch)")
    return profiles


# ─── Scenario Commands ───────────────────────────────────────────────────────
def apply_scenario(bin_profiles: dict, scenario_name: str, target_bin: str = None):
    """Apply a named demo scenario to a bin."""
    if target_bin is None:
        target_bin = random.choice(list(bin_profiles.keys()))

    profile = bin_profiles.get(target_bin)
    if not profile:
        logger.warning(f"Scenario: bin {target_bin} not found")
        return

    if scenario_name == "critical":
        profile.fill_percentage = 94
        logger.info(f"SCENARIO: {target_bin} set to CRITICAL (94%)")
    elif scenario_name == "rapid_fill":
        profile.pattern = "rapid"
        logger.info(f"SCENARIO: {target_bin} set to RAPID FILL pattern")
    elif scenario_name == "sensor_offline":
        profile.is_online = False
        profile.offline_duration = 20
        profile.sensor_status = "OFFLINE"
        logger.info(f"SCENARIO: {target_bin} sensor set OFFLINE")
    elif scenario_name == "low_battery":
        profile.battery = 12
        profile.low_battery_flag = True
        profile.sensor_status = "LOW_BATTERY"
        logger.info(f"SCENARIO: {target_bin} set to LOW BATTERY (12%)")
    elif scenario_name == "collection":
        profile.reset_after_collection(5)
        logger.info(f"SCENARIO: {target_bin} simulated collection → 5%")


# ─── Main Simulation Loop ─────────────────────────────────────────────────────
def run_simulator():
    """Main entry point for the sensor simulator."""
    logger.info("=" * 60)
    logger.info("SmartWaste IoT Sensor Simulator")
    logger.info(f"Municipality: {MUNICIPALITY['name']}")
    logger.info(f"City: {MUNICIPALITY['city']}, {MUNICIPALITY['state']}")
    logger.info(f"Bins: {SIM_CFG['numBins']}")
    logger.info(f"Update interval: {SIM_CFG['updateIntervalSeconds']}s")
    logger.info("=" * 60)

    # Initialize Firebase
    init_firebase()

    # Seed static data
    seed_settings()
    seed_wards()
    seed_employees()

    # Initialize bins
    num_bins = SIM_CFG["numBins"]
    bin_profiles = initialize_bins(num_bins)

    # Initialize alert engine
    alert_engine = AlertEngine()

    # Initialize collection monitor
    collection_monitor = CollectionMonitor(bin_profiles)

    # Demo scenarios — apply some interesting states right away
    bin_ids = list(bin_profiles.keys())
    apply_scenario(bin_profiles, "critical", bin_ids[3])        # BIN-004 critical
    apply_scenario(bin_profiles, "sensor_offline", bin_ids[4])  # BIN-005 offline
    apply_scenario(bin_profiles, "low_battery", bin_ids[5])     # BIN-006 low battery
    apply_scenario(bin_profiles, "rapid_fill", bin_ids[6])      # BIN-007 rapid fill

    logger.info("Starting simulation loop... (Press Ctrl+C to stop)")

    iteration = 0
    while True:
        iteration += 1
        logger.info(f"\n── Iteration {iteration} ──")

        for bin_id, profile in bin_profiles.items():
            try:
                reading = profile.update()
                write_to_firebase(profile, reading, alert_engine)

                if reading.get("fillPercentage") is not None:
                    logger.debug(
                        f"{bin_id}: fill={reading['fillPercentage']:.1f}% "
                        f"dist={reading['distanceCm']}cm "
                        f"bat={reading['battery']:.1f}% "
                        f"status={reading['sensorStatus']}"
                    )
            except Exception as e:
                logger.error(f"Error processing {bin_id}: {e}")

        # Check for collections
        collection_monitor.check_collections()

        # Log summary every 5 iterations
        if iteration % 5 == 0:
            critical = sum(1 for p in bin_profiles.values() if p.get_status() == "CRITICAL")
            high = sum(1 for p in bin_profiles.values() if p.get_status() == "HIGH")
            offline = sum(1 for p in bin_profiles.values() if not p.is_online)
            logger.info(f"Summary: CRITICAL={critical} HIGH={high} OFFLINE={offline}")

        time.sleep(SIM_CFG["updateIntervalSeconds"])


if __name__ == "__main__":
    run_simulator()
