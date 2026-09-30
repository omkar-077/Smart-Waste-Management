# SmartWaste — IoT Municipal Waste Management Platform

> **Demo City:** Nashik, Maharashtra | **Demo Municipality:** Nashik Municipal Corporation

A complete, production-structured IoT-based municipal waste management system with real-time sensor simulation, Node.js Express backend, admin command center, and employee mobile workflow.

---

## Architecture

```
Python IoT Simulator (50 bins)
      │
      ▼ Firebase Admin SDK
Firebase Realtime Database (smartwaste-6ebf0)
      │
      ├─── Node.js Express Backend (:5000)
      │    ├── Trusted Server-side Task Assignment
      │    ├── Collection Completion & Verification
      │    ├── REST APIs (/api/stats, /api/bins, /api/alerts, /api/tasks)
      │    └── Audit Logging
      │
      ├─── Admin Dashboard (React + Vite, :5173)
      │    ├── Live Map (Leaflet + OpenStreetMap)
      │    ├── Real-Time Alert Engine
      │    ├── Employee Assignment & Workload
      │    └── Analytics (Recharts)
      │
      └─── Employee App (Mobile-first React)
           ├── Task Lifecycle (Assigned → Arrived → Completed)
           ├── GPS Navigation
           └── Collection Verification (Before/After Fill Reset)
```

---

## Features

| Module | Features |
|--------|----------|
| **IoT Sensor Simulator** | 50 bins, realistic fill curves, battery drain, sensor failures, abnormal readings |
| **Node.js Express Backend** | REST API, trusted Firebase Admin operations, task assignment, collection verification |
| **Admin Dashboard** | Live stats, map, alerts, employee management, task assignment, analytics |
| **Employee App** | Task lifecycle, GPS navigation, collection with before/after verification |
| **Analytics** | 8 real-data charts — ward fill, daily collections, alerts trend, employee performance |
| **Real-time** | Firebase listeners — no page refresh needed for any updates |
| **Auth** | Role-based login (ADMIN / EMPLOYEE) with seamless demo quick-login |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express.js, Firebase Admin SDK |
| Maps | Leaflet, React-Leaflet, OpenStreetMap |
| Charts | Recharts |
| Icons | Lucide React |
| Database | Firebase Realtime Database (`smartwaste-6ebf0`) |
| Auth | Firebase Authentication + Local Demo Session Fallback |
| Simulator | Python 3, firebase-admin |

---

## Setup Guide

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" → name it (e.g., `smartwaste-nashik`)
3. Disable Google Analytics (optional)

### Step 2: Enable Services

In your Firebase project:

**Authentication:**
- Authentication → Sign-in method → Enable **Email/Password**

**Realtime Database:**
- Build → Realtime Database → Create Database
- Choose `Asia South 1 (Mumbai)` region
- Start in **test mode** initially

### Step 3: Get Frontend Config

- Project Settings (⚙) → General → Your apps → Add app → Web
- Copy the `firebaseConfig` values

### Step 4: Configure Frontend

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=smartwaste-nashik.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://smartwaste-nashik-default-rtdb.asia-southeast1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=smartwaste-nashik
VITE_FIREBASE_STORAGE_BUCKET=smartwaste-nashik.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### Step 5: Create Demo Accounts

In Firebase Console → Authentication → Users → Add user:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@smartwaste.demo` | `SmartWaste@2024` |
| Employee | `employee@smartwaste.demo` | `SmartWaste@2024` |

For the employee to be recognized, also add them in Firebase:
- `smartwaste/employees/EMP-CUSTOM/email = employee@smartwaste.demo`
- `smartwaste/employees/EMP-CUSTOM/name = Demo Employee`
- `smartwaste/employees/EMP-CUSTOM/ward = Ward 1 - Panchavati`
- `smartwaste/employees/EMP-CUSTOM/status = AVAILABLE`

> **Note:** When you run the simulator, it seeds 10 employees automatically. Create Firebase Auth accounts matching those employee emails to log in as an employee.

### Step 6: Apply Database Security Rules

In Firebase Console → Realtime Database → Rules → paste from `firebase/database.rules.json` → Publish.

### Step 7: Configure Simulator

```bash
cd simulator
```

1. Download service account key:
   - Firebase Console → Project Settings → Service Accounts → Generate New Private Key
   - Save as `simulator/serviceAccount.json`

2. Edit `simulator/config.json`:
   ```json
   {
     "firebase": {
       "databaseURL": "https://YOUR_PROJECT_ID-default-rtdb.asia-southeast1.firebasedatabase.app"
     }
   }
   ```

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

---

## Running the Application

### 1. Start Backend (Node.js Express API)

```bash
cd backend
npm install
npm run dev
```
API running on: http://localhost:5000 (Health check: http://localhost:5000/api/health)

### 2. Start Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```
Dashboard running on: http://localhost:5173

### 3. Seed Demo Data (one-time)

```bash
cd simulator
python seed_data.py
```

### 4. Start IoT Simulator

```bash
cd simulator
python simulator.py
```

The simulator will:
1. Seed 10 employees and ward data
2. Initialize 50 bins in Firebase
3. Begin pushing realistic sensor readings every 10 seconds
4. Automatically generate alerts when fill ≥ 80%

---

## Complete Demo Workflow

1. **Start simulator** → bins appear on dashboard with realistic fill levels
2. **Open admin app** → log in as admin@smartwaste.demo
3. **Watch dashboard** → stats update in real-time as simulator runs
4. **Simulator pushes bin to 90%+** → Alert appears automatically
5. **Admin opens Alerts** → Reviews bin fill trend chart
6. **Admin assigns task** → Selects available employee → click Assign
7. **Employee logs in** → employee@smartwaste.demo → sees task notification
8. **Employee accepts task** → Navigate → Arrived → Complete Collection
9. **Employee enters after-fill = 5%** → Confirms
10. **Firebase updates** → Bin resets to 5%, alert resolves, collection recorded
11. **Simulator resumes** filling that bin from 5%
12. **Analytics page** → Shows collection history, ward fill levels

---

## Project Structure

```
smartwaste/
│
├── frontend/                  # React + Vite frontend (:5173)
│   ├── src/
│   │   ├── components/        # BinDetailModal, StatusBadges, FillBar
│   │   ├── config/            # appConfig.js, firebase.js
│   │   ├── context/           # AuthContext.jsx, ToastContext.jsx
│   │   ├── layouts/           # AdminLayout.jsx, EmployeeLayout.jsx
│   │   ├── pages/             # 10 Admin pages + 7 Employee pages + LoginPage
│   │   └── services/          # firebaseService.js
│   └── .env
│
├── backend/                   # Node.js Express server (:5000)
│   ├── src/
│   │   ├── server.js          # Express app
│   │   ├── config/            # firebaseAdmin.js
│   │   ├── routes/            # binRoutes, alertRoutes, taskRoutes, collectionRoutes
│   │   └── utils/             # logger.js
│   └── package.json
│
├── simulator/                 # Python IoT sensor simulator
│   ├── simulator.py           # Main simulation loop
│   ├── seed_data.py           # One-time data seeding
│   ├── config.json            # All configurable settings
│   ├── serviceAccount.json    # Firebase admin key
│   └── requirements.txt
│
├── firebase/
│   └── database.rules.json    # Firebase security rules
│
├── .gitignore
└── README.md
```

---

## Configurable Settings

All thresholds and settings are centralized in:
- **Frontend**: `frontend/src/config/appConfig.js`
- **Simulator**: `simulator/config.json`
- **Live**: `smartwaste/settings` in Firebase (editable via Settings page)

| Parameter | Default | Location |
|-----------|---------|----------|
| MEDIUM threshold | 60% | appConfig.js |
| HIGH threshold | 80% | appConfig.js |
| CRITICAL threshold | 90% | appConfig.js |
| Empty distance | 100 cm | config.json |
| Full distance | 10 cm | config.json |
| Update interval | 10 sec | config.json |
| Number of bins | 50 | config.json |
| Demo city | Nashik | appConfig.js |

---

## Demo Accounts

| Account | Email | Password | Access |
|---------|-------|----------|--------|
| Admin | `admin@smartwaste.demo` | `SmartWaste@2024` | Full admin dashboard |
| Employee | `employee@smartwaste.demo` | `SmartWaste@2024` | Employee app only |

> These must be created manually in Firebase Authentication console.

---

## Future Scope

- 🤖 AI fill-level prediction using historical patterns
- 🗺️ Dynamic route optimization for collection vehicles
- 📷 Camera-based waste classification
- 🔋 Solar-powered bin monitoring
- 📊 Predictive sensor maintenance
- 📱 Citizen waste reporting portal
- 🚛 GPS vehicle tracking
- 🌐 Integration with municipal ERP systems

---

## Screenshots

> Add screenshots after running the application

1. `screenshots/login.png`
2. `screenshots/admin-dashboard.png`
3. `screenshots/live-map.png`
4. `screenshots/alerts-page.png`
5. `screenshots/analytics.png`
6. `screenshots/employee-task.png`

---

*SmartWaste v1.0 — Built for Nashik Municipal Corporation*  
*Technology: React · Firebase · Python · Leaflet · Recharts*
