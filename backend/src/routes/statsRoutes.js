const express = require("express");
const router = express.Router();
const { db } = require("../config/firebaseAdmin");
const logger = require("../utils/logger");

// GET /api/stats (Command center metrics from live Firebase RTDB)
router.get("/stats", async (req, res) => {
  try {
    const [binsSnap, alertsSnap, tasksSnap, collectionsSnap, employeesSnap] = await Promise.all([
      db.ref("smartwaste/bins").once("value"),
      db.ref("smartwaste/alerts").once("value"),
      db.ref("smartwaste/tasks").once("value"),
      db.ref("smartwaste/collections").once("value"),
      db.ref("smartwaste/employees").once("value")
    ]);

    const bins = Object.values(binsSnap.val() || {});
    const alerts = Object.values(alertsSnap.val() || {});
    const tasks = Object.values(tasksSnap.val() || {});
    const collections = Object.values(collectionsSnap.val() || {});
    const employees = Object.values(employeesSnap.val() || {});

    const normal = bins.filter((b) => (b.fillPercentage || 0) < 60).length;
    const medium = bins.filter((b) => (b.fillPercentage || 0) >= 60 && (b.fillPercentage || 0) < 80).length;
    const high = bins.filter((b) => (b.fillPercentage || 0) >= 80 && (b.fillPercentage || 0) < 90).length;
    const critical = bins.filter((b) => (b.fillPercentage || 0) >= 90).length;

    const activeAlerts = alerts.filter((a) => a.status === "OPEN" || a.status === "ASSIGNED").length;
    const pendingTasks = tasks.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED").length;
    const completedCollections = collections.filter((c) => c.status === "COMPLETED").length;
    const activeEmployees = employees.filter((e) => e.status === "AVAILABLE" || e.status === "BUSY").length;

    return res.json({
      success: true,
      stats: {
        totalBins: bins.length,
        normal,
        medium,
        high,
        critical,
        activeAlerts,
        pendingTasks,
        completedCollections,
        activeEmployees,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    logger.error("Error computing stats:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/audit-logs
router.get("/audit-logs", async (req, res) => {
  try {
    const snap = await db.ref("smartwaste/auditLog").limitToLast(50).once("value");
    const logs = Object.values(snap.val() || {}).reverse();
    return res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    logger.error("Error fetching audit logs:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
