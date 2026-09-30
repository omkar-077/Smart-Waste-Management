# SmartWaste Sensor Simulator

Simulates 50–1000 smart waste bins sending realistic IoT sensor data to Firebase Realtime Database.

## Prerequisites

- Python 3.9+
- Firebase project with Realtime Database enabled
- Firebase service account credentials

## Setup

### 1. Get Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → Project Settings → Service Accounts
3. Click "Generate New Private Key"
4. Save the downloaded JSON as `serviceAccount.json` in this directory

⚠️ **NEVER commit `serviceAccount.json` to Git!**

### 2. Update config.json

Edit `config.json` and update:
```json
{
  "firebase": {
    "databaseURL": "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com"
  }
}
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the simulator

```bash
python simulator.py
```

## Configuration

Edit `config.json` to change:

| Setting | Description |
|---------|-------------|
| `numBins` | Number of bins to simulate (50–1000) |
| `updateIntervalSeconds` | How often to push readings |
| `thresholds.medium` | Fill % to trigger MEDIUM status |
| `thresholds.high` | Fill % to trigger HIGH status |
| `thresholds.critical` | Fill % to trigger CRITICAL + ALERT |
| `municipality.city` | Demo municipality city |

## Sensor Data Format

Each reading pushed to Firebase:

```json
{
  "binId": "BIN-024",
  "ward": "Ward 9 - Ashok Stambh",
  "binType": "Dry Waste",
  "fillPercentage": 92.3,
  "distanceCm": 8.5,
  "battery": 87.2,
  "sensorStatus": "ONLINE",
  "status": "CRITICAL",
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```

## HC-SR04 Sensor Formula

```
fillPercentage = ((emptyDistance - measuredDistance) / (emptyDistance - fullDistance)) × 100
```

Where:
- `emptyDistance` = 100 cm (bin is empty)
- `fullDistance` = 10 cm (bin is full)

## Replacing with Real Hardware

When you have an ESP32 + HC-SR04:

1. Flash the ESP32 with Arduino code that:
   - Reads distance via HC-SR04
   - Calculates fill percentage using the same formula
   - Sends JSON to Firebase via HTTP/MQTT
   
2. The JSON payload should match this simulator's format exactly

3. The frontend requires **no changes** — it reads from Firebase regardless of source

## Scenarios

The simulator automatically applies demo scenarios on startup:
- BIN-004: CRITICAL
- BIN-005: OFFLINE
- BIN-006: LOW_BATTERY
- BIN-007: RAPID FILL rate

## Environment Variables (Alternative)

Instead of modifying config.json, you can use a `.env` file:

```
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccount.json
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
```
