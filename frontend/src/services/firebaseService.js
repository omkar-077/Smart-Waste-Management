import { database } from "../config/firebase";
import {
  ref,
  onValue,
  get,
  set,
  update,
  push,
  query,
  orderByChild,
  limitToLast,
  off,
} from "firebase/database";

const BASE = "smartwaste";

// ─── Bins ────────────────────────────────────────────────────────────────────
export function subscribeToBins(callback) {
  const r = ref(database, `${BASE}/bins`);
  onValue(r, (snap) => callback(snap.val() || {}));
  return () => off(r);
}

export async function getBin(binId) {
  const snap = await get(ref(database, `${BASE}/bins/${binId}`));
  return snap.val();
}

export async function updateBin(binId, data) {
  await update(ref(database, `${BASE}/bins/${binId}`), data);
}

// ─── Sensor Readings ─────────────────────────────────────────────────────────
export function subscribeToBinHistory(binId, limit, callback) {
  const r = query(
    ref(database, `${BASE}/sensorReadings/${binId}`),
    orderByChild("timestampMs"),
    limitToLast(limit)
  );
  onValue(r, (snap) => {
    const data = snap.val() || {};
    const arr = Object.values(data).sort((a, b) => a.timestampMs - b.timestampMs);
    callback(arr);
  });
  return () => off(r);
}

// ─── Alerts ──────────────────────────────────────────────────────────────────
export function subscribeToAlerts(callback) {
  const r = ref(database, `${BASE}/alerts`);
  onValue(r, (snap) => {
    const data = snap.val() || {};
    const arr = Object.values(data).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    callback(arr);
  });
  return () => off(r);
}

export async function updateAlert(alertId, data) {
  await update(ref(database, `${BASE}/alerts/${alertId}`), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function createAlert(alertData) {
  const alertId = `ALT-${Date.now() % 100000}`;
  const now = new Date().toISOString();
  const alert = { ...alertData, alertId, createdAt: now, updatedAt: now };
  await set(ref(database, `${BASE}/alerts/${alertId}`), alert);
  return alertId;
}

// ─── Employees ───────────────────────────────────────────────────────────────
export function subscribeToEmployees(callback) {
  const r = ref(database, `${BASE}/employees`);
  onValue(r, (snap) => callback(snap.val() || {}));
  return () => off(r);
}

export async function updateEmployee(employeeId, data) {
  await update(ref(database, `${BASE}/employees/${employeeId}`), data);
}

// ─── Tasks ───────────────────────────────────────────────────────────────────
export function subscribeToTasks(callback) {
  const r = ref(database, `${BASE}/tasks`);
  onValue(r, (snap) => {
    const data = snap.val() || {};
    const arr = Object.values(data).sort(
      (a, b) => new Date(b.assignedAt) - new Date(a.assignedAt)
    );
    callback(arr);
  });
  return () => off(r);
}

export function subscribeToEmployeeTasks(employeeId, callback) {
  const r = ref(database, `${BASE}/tasks`);
  onValue(r, (snap) => {
    const data = snap.val() || {};
    const arr = Object.values(data)
      .filter((t) => t.employeeId === employeeId)
      .sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt));
    callback(arr);
  });
  return () => off(r);
}

export async function createTask(taskData) {
  const taskId = `TASK-${Date.now() % 100000}`;
  const now = new Date().toISOString();
  const task = { ...taskData, taskId, assignedAt: now, updatedAt: now };
  await set(ref(database, `${BASE}/tasks/${taskId}`), task);
  return taskId;
}

export async function updateTask(taskId, data) {
  await update(ref(database, `${BASE}/tasks/${taskId}`), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

// ─── Collections ─────────────────────────────────────────────────────────────
export function subscribeToCollections(callback) {
  const r = ref(database, `${BASE}/collections`);
  onValue(r, (snap) => {
    const data = snap.val() || {};
    const arr = Object.values(data).sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    callback(arr);
  });
  return () => off(r);
}

export async function createCollection(collectionData) {
  const colId = `COL-${Date.now() % 100000}`;
  const now = new Date().toISOString();
  const col = { ...collectionData, collectionId: colId, timestamp: now };
  await set(ref(database, `${BASE}/collections/${colId}`), col);
  return colId;
}

// ─── Notifications ───────────────────────────────────────────────────────────
export function subscribeToNotifications(employeeId, callback) {
  const r = ref(database, `${BASE}/notifications/${employeeId}`);
  onValue(r, (snap) => {
    const data = snap.val() || {};
    const arr = Object.values(data).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    callback(arr);
  });
  return () => off(r);
}

export async function createNotification(employeeId, notifData) {
  const r = ref(database, `${BASE}/notifications/${employeeId}`);
  const now = new Date().toISOString();
  await push(r, { ...notifData, createdAt: now, read: false });
}

export async function markNotificationRead(employeeId, notifKey) {
  await update(ref(database, `${BASE}/notifications/${employeeId}/${notifKey}`), {
    read: true,
  });
}

// ─── Audit Log ───────────────────────────────────────────────────────────────
export async function logAuditEvent(user, action, entity, details = {}) {
  const r = ref(database, `${BASE}/auditLog`);
  await push(r, {
    user,
    action,
    entity,
    details,
    timestamp: new Date().toISOString(),
  });
}

export function subscribeToAuditLog(limit, callback) {
  const r = query(
    ref(database, `${BASE}/auditLog`),
    limitToLast(limit)
  );
  onValue(r, (snap) => {
    const data = snap.val() || {};
    const arr = Object.values(data).sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    callback(arr);
  });
  return () => off(r);
}

// ─── Settings ────────────────────────────────────────────────────────────────
export function subscribeToSettings(callback) {
  const r = ref(database, `${BASE}/settings`);
  onValue(r, (snap) => callback(snap.val() || {}));
  return () => off(r);
}

export async function updateSettings(data) {
  await update(ref(database, `${BASE}/settings`), data);
}

// ─── Task Assignment Workflow ─────────────────────────────────────────────────
export async function assignTask({ alertId, binId, employeeId, employeeName, adminName, binData }) {
  const now = new Date().toISOString();

  // Create task
  const taskId = await createTask({
    binId,
    alertId,
    employeeId,
    employeeName,
    ward: binData?.ward || "",
    binType: binData?.binType || "",
    fillPercentage: binData?.fillPercentage || 0,
    latitude: binData?.latitude || 0,
    longitude: binData?.longitude || 0,
    priority: binData?.fillPercentage >= 90 ? "CRITICAL" : "HIGH",
    status: "ASSIGNED",
    notes: "",
  });

  // Update alert
  await updateAlert(alertId, {
    status: "ASSIGNED",
    assignedEmployee: employeeId,
    assignedEmployeeName: employeeName,
    taskId,
  });

  // Update employee status
  await updateEmployee(employeeId, { status: "BUSY", currentTaskId: taskId });

  // Create notification for employee
  await createNotification(employeeId, {
    type: "TASK_ASSIGNED",
    taskId,
    binId,
    alertId,
    title: "New Collection Task",
    message: `Bin ${binId} at ${binData?.ward || ""} needs collection. Fill: ${binData?.fillPercentage || 0}%`,
    priority: binData?.fillPercentage >= 90 ? "CRITICAL" : "HIGH",
    assignedBy: adminName,
  });

  // Audit log
  await logAuditEvent(adminName, "TASK_ASSIGNED", binId, {
    taskId,
    alertId,
    employeeId,
    employeeName,
  });

  return taskId;
}

export async function completeCollection({ taskId, alertId, binId, employeeId, employeeName, beforeFill, afterFill }) {
  const now = new Date().toISOString();

  // Create collection record
  const collectionId = await createCollection({
    taskId,
    alertId,
    binId,
    employeeId,
    employeeName,
    beforeFill,
    afterFill,
    status: "COMPLETED",
    gpsVerified: true,
  });

  // Update bin
  await updateBin(binId, {
    fillPercentage: afterFill,
    status: afterFill >= 90 ? "CRITICAL" : afterFill >= 80 ? "HIGH" : afterFill >= 60 ? "MEDIUM" : "NORMAL",
    lastCollection: now,
  });

  // Update task
  await updateTask(taskId, {
    status: "COMPLETED",
    completedAt: now,
    collectionId,
    beforeFill,
    afterFill,
  });

  // Resolve alert
  if (alertId) {
    await updateAlert(alertId, {
      status: "RESOLVED",
      resolvedAt: now,
      resolvedBy: employeeId,
    });
  }

  // Update employee
  await updateEmployee(employeeId, { status: "AVAILABLE", currentTaskId: null });

  // Audit log
  await logAuditEvent(employeeName, "COLLECTION_COMPLETED", binId, {
    taskId,
    collectionId,
    beforeFill,
    afterFill,
  });

  return collectionId;
}
