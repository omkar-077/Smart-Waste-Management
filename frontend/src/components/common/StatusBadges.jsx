import { STATUS_COLORS, SENSOR_STATUS_COLORS, ALERT_STATUS_COLORS, TASK_STATUSES } from "../../config/appConfig";

export function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.UNKNOWN;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text} border ${c.border}`}>
      {status}
    </span>
  );
}

export function SensorStatusBadge({ status }) {
  const c = SENSOR_STATUS_COLORS[status] || { text: "text-dark-400", bg: "bg-dark-700/50" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "ONLINE" ? "bg-green-400" : status === "LOW_BATTERY" ? "bg-amber-400" : "bg-dark-400"}`} />
      {status?.replace("_", " ")}
    </span>
  );
}

export function AlertStatusBadge({ status }) {
  const c = ALERT_STATUS_COLORS[status] || { color: "text-dark-400", bg: "bg-dark-700/50" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.color}`}>
      {status}
    </span>
  );
}

export function TaskStatusBadge({ status }) {
  const c = TASK_STATUSES[status] || { color: "text-dark-400", bg: "bg-dark-700/50" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.color}`}>
      {status?.replace("_", " ")}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const colors = {
    CRITICAL: "bg-red-500/15 text-red-400 border border-red-500/25",
    HIGH: "bg-orange-500/15 text-orange-400 border border-orange-500/25",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${colors[priority] || "bg-dark-700 text-dark-400"}`}>
      {priority}
    </span>
  );
}

export function EmployeeStatusBadge({ status }) {
  const colors = {
    AVAILABLE: "bg-green-500/15 text-green-400",
    BUSY: "bg-amber-500/15 text-amber-400",
    OFFLINE: "bg-dark-700 text-dark-400",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || "bg-dark-700 text-dark-400"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "AVAILABLE" ? "bg-green-400" : status === "BUSY" ? "bg-amber-400" : "bg-dark-500"}`} />
      {status}
    </span>
  );
}
