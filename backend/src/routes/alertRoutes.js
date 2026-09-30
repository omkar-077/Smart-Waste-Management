const express = require("express");
const router = express.Router();
const { db } = require("../config/firebaseAdmin");
const logger = require("../utils/logger");

// GET /api/alerts
router.get("/", async (req, res) => {
  try {
    const { status, priority } = req.query;
    const snap = await db.ref("smartwaste/alerts").once("value");
    const alertsObj = snap.val() || {};
    let alerts = Object.values(alertsObj);

    if (status) {
      alerts = alerts.filter((a) => a.status && a.status.toUpperCase() === status.toUpperCase());
    }
    if (priority) {
      alerts = alerts.filter((a) => a.priority && a.priority.toUpperCase() === priority.toUpperCase());
    }

    return res.json({ success: true, count: alerts.length, data: alerts });
  } catch (err) {
    logger.error("Error fetching alerts:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/alerts/:alertId/dismiss
router.post("/:alertId/dismiss", async (req, res) => {
  try {
    const { alertId } = req.params;
    const alertRef = db.ref(`smartwaste/alerts/${alertId}`);
    const snap = await alertRef.once("value");
    if (!snap.exists()) {
      return res.status(404).json({ success: false, error: "Alert not found" });
    }

    const now = new Date().toISOString();
    await alertRef.update({
      status: "DISMISSED",
      dismissedAt: now,
      updatedAt: now
    });

    return res.json({ success: true, message: `Alert ${alertId} dismissed.` });
  } catch (err) {
    logger.error("Error dismissing alert:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
