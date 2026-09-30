const express = require("express");
const router = express.Router();
const { db } = require("../config/firebaseAdmin");
const logger = require("../utils/logger");

// GET /api/tasks
router.get("/", async (req, res) => {
  try {
    const { employeeId, status } = req.query;
    const snap = await db.ref("smartwaste/tasks").once("value");
    const tasksObj = snap.val() || {};
    let tasks = Object.values(tasksObj);

    if (employeeId) {
      tasks = tasks.filter((t) => t.employeeId === employeeId);
    }
    if (status) {
      tasks = tasks.filter((t) => t.status && t.status.toUpperCase() === status.toUpperCase());
    }

    return res.json({ success: true, count: tasks.length, data: tasks });
  } catch (err) {
    logger.error("Error fetching tasks:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tasks/assign
router.post("/assign", async (req, res) => {
  try {
    const { alertId, employeeId, adminEmail = "admin@smartwaste.demo", notes = "" } = req.body;

    if (!alertId || !employeeId) {
      return res.status(400).json({ success: false, error: "alertId and employeeId are required" });
    }

    // 1. Get alert
    const alertSnap = await db.ref(`smartwaste/alerts/${alertId}`).once("value");
    if (!alertSnap.exists()) {
      return res.status(404).json({ success: false, error: `Alert ${alertId} not found` });
    }
    const alert = alertSnap.val();

    // 2. Get employee
    const empSnap = await db.ref(`smartwaste/employees/${employeeId}`).once("value");
    if (!empSnap.exists()) {
      return res.status(404).json({ success: false, error: `Employee ${employeeId} not found` });
    }
    const employee = empSnap.val();

    // 3. Get bin details
    const binSnap = await db.ref(`smartwaste/bins/${alert.binId}`).once("value");
    const bin = binSnap.val() || {};

    const now = new Date().toISOString();
    const taskId = `TASK-${Date.now().toString().slice(-6)}`;

    const task = {
      taskId,
      alertId,
      binId: alert.binId,
      employeeId,
      employeeName: employee.name,
      ward: alert.ward || bin.ward || "Ward 1",
      fillPercentage: alert.fillPercentage || bin.fillPercentage || 0,
      priority: alert.priority || "HIGH",
      status: "ASSIGNED",
      notes,
      assignedBy: adminEmail,
      assignedAt: now,
      updatedAt: now,
      latitude: bin.latitude || 19.9975,
      longitude: bin.longitude || 73.7898
    };

    // Atomic / multi-path write
    const updates = {};
    updates[`smartwaste/tasks/${taskId}`] = task;
    updates[`smartwaste/alerts/${alertId}/status`] = "ASSIGNED";
    updates[`smartwaste/alerts/${alertId}/assignedEmployee`] = employeeId;
    updates[`smartwaste/alerts/${alertId}/assignedEmployeeName`] = employee.name;
    updates[`smartwaste/alerts/${alertId}/taskId`] = taskId;
    updates[`smartwaste/alerts/${alertId}/updatedAt`] = now;
    updates[`smartwaste/employees/${employeeId}/status`] = "BUSY";

    // Create Notification
    const notifId = `NOTIF-${Date.now().toString().slice(-6)}`;
    updates[`smartwaste/notifications/${employeeId}/${notifId}`] = {
      notificationId: notifId,
      employeeId,
      taskId,
      binId: alert.binId,
      title: "New Task Assigned",
      message: `Assigned to collect ${alert.binId} (${alert.priority} priority - ${alert.fillPercentage}%) in ${alert.ward}`,
      priority: alert.priority,
      read: false,
      createdAt: now
    };

    // Audit log
    const auditId = `AUD-${Date.now()}`;
    updates[`smartwaste/auditLog/${auditId}`] = {
      auditId,
      user: adminEmail,
      action: "TASK_ASSIGNED",
      entity: taskId,
      entityType: "TASK",
      details: { alertId, employeeId, employeeName: employee.name, binId: alert.binId },
      timestamp: now
    };

    await db.ref().update(updates);
    logger.info(`Task ${taskId} assigned to ${employee.name} (${employeeId}) for bin ${alert.binId}`);

    return res.json({ success: true, taskId, data: task });
  } catch (err) {
    logger.error("Error assigning task:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/tasks/:taskId/status
router.patch("/:taskId/status", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, employeeId, userEmail = "employee@smartwaste.demo" } = req.body;

    const validStatuses = ["ASSIGNED", "ACCEPTED", "IN_PROGRESS", "ARRIVED", "COMPLETED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: `Invalid status ${status}` });
    }

    const taskSnap = await db.ref(`smartwaste/tasks/${taskId}`).once("value");
    if (!taskSnap.exists()) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }

    const now = new Date().toISOString();
    const updates = {
      status,
      updatedAt: now
    };
    if (status === "ACCEPTED") updates.acceptedAt = now;
    if (status === "IN_PROGRESS") updates.startedAt = now;
    if (status === "ARRIVED") updates.arrivedAt = now;
    if (status === "COMPLETED") updates.completedAt = now;

    await db.ref(`smartwaste/tasks/${taskId}`).update(updates);

    // Audit log
    const auditId = `AUD-${Date.now()}`;
    await db.ref(`smartwaste/auditLog/${auditId}`).set({
      auditId,
      user: userEmail,
      action: `TASK_STATUS_${status}`,
      entity: taskId,
      entityType: "TASK",
      details: { status, employeeId },
      timestamp: now
    });

    return res.json({ success: true, taskId, status });
  } catch (err) {
    logger.error("Error updating task status:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
