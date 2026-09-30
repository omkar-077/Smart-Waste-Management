// SmartWaste Application Configuration
// Nashik, Maharashtra — Demo Municipality

export const APP_CONFIG = {
  municipalityName: "Nashik Municipal Corporation",
  city: "Nashik",
  state: "Maharashtra",
  country: "India",
  mapCenter: [19.9975, 73.7898],
  mapZoom: 13,
};

export const THRESHOLDS = {
  normal: 0,
  medium: 60,
  high: 80,
  critical: 90,
};

export const STATUS_COLORS = {
  NORMAL: {
    bg: "bg-green-500/15",
    text: "text-green-400",
    border: "border-green-500/25",
    hex: "#22c55e",
    fill: "#22c55e",
  },
  MEDIUM: {
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/25",
    hex: "#f59e0b",
    fill: "#f59e0b",
  },
  HIGH: {
    bg: "bg-orange-500/15",
    text: "text-orange-400",
    border: "border-orange-500/25",
    hex: "#f97316",
    fill: "#f97316",
  },
  CRITICAL: {
    bg: "bg-red-500/15",
    text: "text-red-400",
    border: "border-red-500/25",
    hex: "#ef4444",
    fill: "#ef4444",
  },
  UNKNOWN: {
    bg: "bg-dark-700",
    text: "text-dark-400",
    border: "border-dark-600",
    hex: "#64748b",
    fill: "#64748b",
  },
};

export const SENSOR_STATUS_COLORS = {
  ONLINE: { text: "text-green-400", bg: "bg-green-500/10" },
  OFFLINE: { text: "text-dark-400", bg: "bg-dark-700/50" },
  LOW_BATTERY: { text: "text-amber-400", bg: "bg-amber-500/10" },
  INVALID_READING: { text: "text-red-400", bg: "bg-red-500/10" },
};

export const TASK_STATUSES = {
  ASSIGNED: { color: "text-blue-400", bg: "bg-blue-500/10" },
  ACCEPTED: { color: "text-purple-400", bg: "bg-purple-500/10" },
  IN_PROGRESS: { color: "text-amber-400", bg: "bg-amber-500/10" },
  ARRIVED: { color: "text-orange-400", bg: "bg-orange-500/10" },
  COMPLETED: { color: "text-green-400", bg: "bg-green-500/10" },
  CANCELLED: { color: "text-dark-400", bg: "bg-dark-700/50" },
};

export const ALERT_PRIORITY_COLORS = {
  CRITICAL: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/25" },
  HIGH: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/25" },
};

export const ALERT_STATUS_COLORS = {
  OPEN: { color: "text-red-400", bg: "bg-red-500/10" },
  ASSIGNED: { color: "text-blue-400", bg: "bg-blue-500/10" },
  IN_PROGRESS: { color: "text-amber-400", bg: "bg-amber-500/10" },
  RESOLVED: { color: "text-green-400", bg: "bg-green-500/10" },
  DISMISSED: { color: "text-dark-400", bg: "bg-dark-700/50" },
};

export const WARDS = [
  "Ward 1 - Panchavati",
  "Ward 2 - Shalimar",
  "Ward 3 - Nashik Road",
  "Ward 4 - Cidco",
  "Ward 5 - Satpur",
  "Ward 6 - Deolali",
  "Ward 7 - Gangapur",
  "Ward 8 - Indira Nagar",
  "Ward 9 - Ashok Stambh",
  "Ward 10 - Canada Corner",
];

export function getFillColor(pct) {
  if (pct >= THRESHOLDS.critical) return STATUS_COLORS.CRITICAL.hex;
  if (pct >= THRESHOLDS.high) return STATUS_COLORS.HIGH.hex;
  if (pct >= THRESHOLDS.medium) return STATUS_COLORS.MEDIUM.hex;
  return STATUS_COLORS.NORMAL.hex;
}

export function getFillStatus(pct) {
  if (pct == null) return "UNKNOWN";
  if (pct >= THRESHOLDS.critical) return "CRITICAL";
  if (pct >= THRESHOLDS.high) return "HIGH";
  if (pct >= THRESHOLDS.medium) return "MEDIUM";
  return "NORMAL";
}

export function formatTimestamp(ts) {
  if (!ts) return "Never";
  const d = new Date(ts);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(ts) {
  if (!ts) return "Never";
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
