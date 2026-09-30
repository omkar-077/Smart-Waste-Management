const express = require("express");
const cors = require("cors");
require("dotenv").config();

const logger = require("./utils/logger");
const binRoutes = require("./routes/binRoutes");
const alertRoutes = require("./routes/alertRoutes");
const taskRoutes = require("./routes/taskRoutes");
const collectionRoutes = require("./routes/collectionRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const statsRoutes = require("./routes/statsRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Root & Health check
app.get("/", (req, res) => {
  res.json({
    service: "SmartWaste IoT Municipal Backend",
    version: "1.0.0",
    status: "HEALTHY",
    city: "Nashik, Maharashtra",
    endpoints: [
      "/api/health",
      "/api/stats",
      "/api/bins",
      "/api/alerts",
      "/api/tasks",
      "/api/collections",
      "/api/employees",
      "/api/audit-logs"
    ]
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/bins", binRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api", statsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error("Unhandled Error:", err);
  res.status(500).json({ success: false, error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  logger.info(`====================================================`);
  logger.info(`SmartWaste Backend Server running on http://localhost:${PORT}`);
  logger.info(`Connected to Firebase Realtime Database`);
  logger.info(`====================================================`);
});

module.exports = app;
