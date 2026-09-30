const express = require("express");
const router = express.Router();
const { db } = require("../config/firebaseAdmin");
const logger = require("../utils/logger");

// GET /api/bins
router.get("/", async (req, res) => {
  try {
    const { ward, status } = req.query;
    const snapshot = await db.ref("smartwaste/bins").once("value");
    const binsObj = snapshot.val() || {};
    let bins = Object.values(binsObj);

    if (ward) {
      bins = bins.filter((b) => b.ward && b.ward.toLowerCase() === ward.toLowerCase());
    }
    if (status) {
      bins = bins.filter((b) => b.status && b.status.toUpperCase() === status.toUpperCase());
    }

    return res.json({ success: true, count: bins.length, data: bins });
  } catch (err) {
    logger.error("Error fetching bins:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/bins/:binId
router.get("/:binId", async (req, res) => {
  try {
    const { binId } = req.params;
    const binSnap = await db.ref(`smartwaste/bins/${binId}`).once("value");
    if (!binSnap.exists()) {
      return res.status(404).json({ success: false, error: `Bin ${binId} not found` });
    }

    const readingsSnap = await db
      .ref(`smartwaste/sensorReadings/${binId}`)
      .limitToLast(20)
      .once("value");
    const readings = readingsSnap.val() ? Object.values(readingsSnap.val()) : [];

    return res.json({
      success: true,
      data: {
        ...binSnap.val(),
        recentReadings: readings
      }
    });
  } catch (err) {
    logger.error(`Error fetching bin ${req.params.binId}:`, err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
