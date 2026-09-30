const express = require("express");
const router = express.Router();
const { db } = require("../config/firebaseAdmin");
const logger = require("../utils/logger");

// GET /api/collections
router.get("/", async (req, res) => {
  try {
    const { employeeId, binId, limit = 50 } = req.query;
    const snap = await db.ref("smartwaste/collections").limitToLast(Number(limit)).once("value");
    const colsObj = snap.val() || {};
    let collections = Object.values(colsObj).reverse();

    if (employeeId) {
      collections = collections.filter((c) => c.employeeId === employeeId);
    }
    if (binId) {
      collections = collections.filter((c) => c.binId === binId);
    }

    return res.json({ success: true, count: collections.length, data: collections });
  } catch (err) {
    logger.error("Error fetching collections:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/collections/complete
router.post("/complete", async (req, res) => {
  try {
    const {
      taskId,
      binId,
      alertId,
      employeeId,
      employeeName = "Employee",
      beforeFill = 90,
      afterFill = 5,
      photoUrl = null,
      notes = "",
      gpsVerified = true,
      userEmail = "employee@smartwaste.demo"
    } = req.body;

    if (!binId) {
      return res.status(400).json({ success: false, error: "binId is required" });
    }

    const now = new Date().toISOString();
    const collectionId = `COL-${Date.now().toString().slice(-6)}`;

    const collectionRecord = {
      collectionId,
      taskId: taskId || null,
      alertId: alertId || null,
      binId,
      employeeId: employeeId || "EMP-001",
      employeeName,
      beforeFill: Number(beforeFill),
      afterFill: Number(afterFill),
      status: "COMPLETED",
      gpsVerified: Boolean(gpsVerified),
      photoUrl,
      notes,
      timestamp: now
    };

    const updates = {};

    // 1. Record collection
    updates[`smartwaste/collections/${collectionId}`] = collectionRecord;

    // 2. Reset bin fill level & status
    updates[`smartwaste/bins/${binId}/fillPercentage`] = Number(afterFill);
    updates[`smartwaste/bins/${binId}/status`] = "NORMAL";
    updates[`smartwaste/bins/${binId}/distanceCm`] = 95.5; // ~5% fill
    updates[`smartwaste/bins/${binId}/lastCollection`] = now;
    updates[`smartwaste/bins/${binId}/lastUpdated`] = now;

    // 3. Resolve alert if provided
    if (alertId) {
      updates[`smartwaste/alerts/${alertId}/status`] = "RESOLVED";
      updates[`smartwaste/alerts/${alertId}/resolvedAt`] = now;
      updates[`smartwaste/alerts/${alertId}/updatedAt`] = now;
    }

    // 4. Complete task if provided
    if (taskId) {
      updates[`smartwaste/tasks/${taskId}/status`] = "COMPLETED";
      updates[`smartwaste/tasks/${taskId}/completedAt`] = now;
      updates[`smartwaste/tasks/${taskId}/updatedAt`] = now;
    }

    // 5. Free up employee
    if (employeeId) {
      updates[`smartwaste/employees/${employeeId}/status`] = "AVAILABLE";
    }

    // 6. Audit log
    const auditId = `AUD-${Date.now()}`;
    updates[`smartwaste/auditLog/${auditId}`] = {
      auditId,
      user: userEmail,
      action: "COLLECTION_COMPLETED",
      entity: collectionId,
      entityType: "COLLECTION",
      details: { binId, employeeId, beforeFill, afterFill },
      timestamp: now
    };

    await db.ref().update(updates);
    logger.info(`Collection ${collectionId} completed for ${binId}: ${beforeFill}% -> ${afterFill}%`);

    return res.json({ success: true, collectionId, data: collectionRecord });
  } catch (err) {
    logger.error("Error completing collection:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
