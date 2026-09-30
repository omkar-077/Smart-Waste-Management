const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

let db = null;
let auth = null;
let initialized = false;

function initFirebaseAdmin() {
  if (initialized) return { admin, db, auth };

  const possiblePaths = [
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    path.resolve(__dirname, "../../serviceAccount.json"),
    path.resolve(__dirname, "../../../simulator/serviceAccount.json"),
    path.resolve(__dirname, "../serviceAccount.json")
  ].filter(Boolean);

  let serviceAccountPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      serviceAccountPath = p;
      break;
    }
  }

  const databaseURL =
    process.env.FIREBASE_DATABASE_URL ||
    "https://smartwaste-6ebf0-default-rtdb.firebaseio.com";

  if (serviceAccountPath) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: databaseURL
    });
    console.log(`[Backend] Firebase Admin initialized with service account at ${serviceAccountPath}`);
    console.log(`[Backend] Database URL: ${databaseURL}`);
  } else {
    console.warn("[Backend] No serviceAccount.json found. Initializing with default credentials.");
    admin.initializeApp({
      databaseURL: databaseURL
    });
  }

  db = admin.database();
  auth = admin.auth();
  initialized = true;

  return { admin, db, auth };
}

const { db: database, auth: authInstance } = initFirebaseAdmin();

module.exports = {
  admin,
  db: database,
  auth: authInstance
};
