#!/usr/bin/env python3
"""
SmartWaste — Seed Data Script
Seeds initial data to Firebase for demo/presentation purposes.
Run this ONCE before starting the simulator.
"""

import firebase_admin
from firebase_admin import credentials, db
import json
import os
import random
from datetime import datetime, timezone, timedelta

# Load config
with open(os.path.join(os.path.dirname(__file__), "config.json")) as f:
    CONFIG = json.load(f)

MUNICIPALITY = CONFIG["municipality"]
WARDS = MUNICIPALITY["wards"]

def init_firebase():
    service_account_path = CONFIG["firebase"]["serviceAccountPath"]
    if not os.path.isabs(service_account_path):
        service_account_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), service_account_path)
    database_url = CONFIG["firebase"]["databaseURL"]
    if not os.path.exists(service_account_path):
        raise FileNotFoundError(f"serviceAccount.json not found at {service_account_path}. See README.md.")
    cred = credentials.Certificate(service_account_path)
    firebase_admin.initialize_app(cred, {"databaseURL": database_url})
    print(f"Firebase connected: {database_url}")

def seed_historical_readings(num_bins=20, readings_per_bin=48):
    """Seed realistic historical readings for charts/analytics."""
    print(f"Seeding historical readings for {num_bins} bins...")
    now = datetime.now(timezone.utc)
    all_readings = {}

    for i in range(1, num_bins + 1):
        bin_id = f"BIN-{i:03d}"
        fill = random.uniform(10, 40)
        bin_data = {}

        for j in range(readings_per_bin):
            ts = now - timedelta(hours=(readings_per_bin - j) * 0.5)
            fill += random.uniform(0.3, 1.5)
            if fill > 92:  # Simulate a collection
                fill = random.uniform(5, 10)
            fill = min(100, fill)

            key = f"read_{j:04d}"
            bin_data[key] = {
                "binId": bin_id,
                "distanceCm": round(100 - (fill / 100) * 90, 1),
                "fillPercentage": round(fill, 1),
                "battery": round(random.uniform(65, 95), 1),
                "sensorStatus": "ONLINE",
                "status": "CRITICAL" if fill >= 90 else "HIGH" if fill >= 80 else "MEDIUM" if fill >= 60 else "NORMAL",
                "timestamp": ts.isoformat(),
                "timestampMs": int(ts.timestamp() * 1000),
                "isValid": True,
                "validationStatus": "OK",
            }
        all_readings[bin_id] = bin_data

    # Write in one update call
    db.reference("smartwaste/sensorReadings").update(all_readings)
    print("Historical readings seeded.")

def seed_demo_collections():
    """Seed some demo collection records."""
    print("Seeding demo collections...")
    employees = [
        ("EMP-001", "Rajesh Patil"), ("EMP-002", "Sunil Shinde"),
        ("EMP-005", "Deepak Nikam"), ("EMP-008", "Mahesh Gaikwad"),
    ]
    now = datetime.now(timezone.utc)
    collections_data = {}

    for i in range(1, 12):
        emp_id, emp_name = random.choice(employees)
        bin_id = f"BIN-{random.randint(1, 50):03d}"
        before = random.uniform(80, 97)
        after = random.uniform(3, 8)
        ts = now - timedelta(hours=random.randint(1, 72))

        col_id = f"COL-SEED-{i:04d}"
        collections_data[col_id] = {
            "collectionId": col_id,
            "taskId": f"TASK-SEED-{i:04d}",
            "alertId": f"ALT-SEED-{i:04d}",
            "binId": bin_id,
            "employeeId": emp_id,
            "employeeName": emp_name,
            "beforeFill": round(before, 1),
            "afterFill": round(after, 1),
            "status": "COMPLETED",
            "gpsVerified": True,
            "timestamp": ts.isoformat(),
        }

    db.reference("smartwaste/collections").update(collections_data)
    print("Demo collections seeded.")

def seed_demo_alerts():
    """Seed a few existing alerts for demo."""
    print("Seeding demo alerts...")
    now = datetime.now(timezone.utc)
    alerts_data = {}

    for i in range(1, 6):
        bin_id = f"BIN-{random.randint(20, 50):03d}"
        fill = random.uniform(88, 98)
        priority = "CRITICAL" if fill >= 90 else "HIGH"
        ts = now - timedelta(hours=random.randint(1, 6))
        alert_id = f"ALT-SEED-{i:04d}"

        alerts_data[alert_id] = {
            "alertId": alert_id,
            "binId": bin_id,
            "ward": WARDS[i % len(WARDS)],
            "fillPercentage": round(fill, 1),
            "priority": priority,
            "status": "OPEN",
            "createdAt": ts.isoformat(),
            "updatedAt": ts.isoformat(),
            "assignedEmployee": None,
            "resolvedAt": None,
        }

    db.reference("smartwaste/alerts").update(alerts_data)
    print("Demo alerts seeded.")

if __name__ == "__main__":
    print("=" * 50)
    print("SmartWaste — Seed Data Script")
    print("=" * 50)
    init_firebase()
    seed_historical_readings(num_bins=20, readings_per_bin=48)
    seed_demo_collections()
    seed_demo_alerts()
    print("\nAll seed data loaded. You can now start the simulator.")
