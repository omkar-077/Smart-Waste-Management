const express = require("express");
const router = express.Router();
const { db } = require("../config/firebaseAdmin");
const logger = require("../utils/logger");

// GET /api/employees
router.get("/", async (req, res) => {
  try {
    const { status, ward } = req.query;
    const snap = await db.ref("smartwaste/employees").once("value");
    const employeesObj = snap.val() || {};
    let employees = Object.values(employeesObj);

    if (status) {
      employees = employees.filter((e) => e.status && e.status.toUpperCase() === status.toUpperCase());
    }
    if (ward) {
      employees = employees.filter((e) => e.ward && e.ward.toLowerCase() === ward.toLowerCase());
    }

    return res.json({ success: true, count: employees.length, data: employees });
  } catch (err) {
    logger.error("Error fetching employees:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/employees/:employeeId/status
router.patch("/:employeeId/status", async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { status, userEmail = "admin@smartwaste.demo" } = req.body;

    const valid = ["AVAILABLE", "BUSY", "OFFLINE"];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, error: `Status must be one of: ${valid.join(", ")}` });
    }

    await db.ref(`smartwaste/employees/${employeeId}`).update({ status });

    const auditId = `AUD-${Date.now()}`;
    await db.ref(`smartwaste/auditLog/${auditId}`).set({
      auditId,
      user: userEmail,
      action: "EMPLOYEE_STATUS_CHANGED",
      entity: employeeId,
      entityType: "EMPLOYEE",
      details: { status },
      timestamp: new Date().toISOString()
    });

    return res.json({ success: true, employeeId, status });
  } catch (err) {
    logger.error("Error updating employee status:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
