import { useEffect, useState } from "react";
import {
  subscribeToAlerts,
  subscribeToEmployees,
  getBin,
  subscribeToBinHistory,
  assignTask,
  updateAlert,
  logAuditEvent,
} from "../../services/firebaseService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { timeAgo, formatTimestamp } from "../../config/appConfig";
import { AlertStatusBadge, PriorityBadge, EmployeeStatusBadge, StatusBadge, SensorStatusBadge } from "../../components/common/StatusBadges";
import { FillGauge } from "../../components/common/FillBar";
import {
  Bell, Search, Filter, X, MapPin, User, CheckCircle,
  AlertTriangle, Eye, UserCheck
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";

function AlertDetailModal({ alert, onClose, onAssign }) {
  const [bin, setBin] = useState(null);
  const [history, setHistory] = useState([]);
  const [employees, setEmployees] = useState({});
  const [selectedEmp, setSelectedEmp] = useState("");
  const [assigning, setAssigning] = useState(false);
  const { user } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    if (!alert?.binId) return;
    getBin(alert.binId).then(setBin);
    const unsub = subscribeToBinHistory(alert.binId, 15, (data) => {
      setHistory(data.map((r) => ({
        time: new Date(r.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        fill: r.fillPercentage,
      })).filter((r) => r.fill != null));
    });
    const empUnsub = subscribeToEmployees(setEmployees);
    return () => { unsub(); empUnsub(); };
  }, [alert?.binId]);

  const availableEmps = Object.values(employees).filter((e) => e.status === "AVAILABLE");

  const handleAssign = async () => {
    if (!selectedEmp) { addToast("Select an employee first.", "warning"); return; }
    const emp = employees[selectedEmp];
    setAssigning(true);
    try {
      await assignTask({
        alertId: alert.alertId,
        binId: alert.binId,
        employeeId: emp.employeeId,
        employeeName: emp.name,
        adminName: user?.email,
        binData: bin,
      });
      addToast(`Task assigned to ${emp.name}`, "success");
      onAssign?.();
      onClose();
    } catch (err) {
      addToast("Assignment failed: " + err.message, "error");
    } finally {
      setAssigning(false);
    }
  };

  const handleDismiss = async () => {
    await updateAlert(alert.alertId, { status: "DISMISSED" });
    await logAuditEvent(user?.email, "ALERT_DISMISSED", alert.binId, { alertId: alert.alertId });
    addToast("Alert dismissed", "info");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-dark-900 border border-dark-700/50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b border-dark-700/50 ${alert.priority === "CRITICAL" ? "bg-red-500/5" : "bg-orange-500/5"}`}>
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className={alert.priority === "CRITICAL" ? "text-red-400" : "text-orange-400"} />
            <div>
              <div className="font-bold text-dark-100">{alert.alertId}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <PriorityBadge priority={alert.priority} />
                <AlertStatusBadge status={alert.status} />
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-dark-500 hover:text-dark-200 hover:bg-dark-800 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Bin info */}
          {bin && (
            <div className="flex items-center gap-4 p-4 bg-dark-800/50 rounded-xl">
              <FillGauge percentage={bin.fillPercentage} size={64} />
              <div className="flex-1">
                <div className="font-bold text-dark-100 font-mono">{bin.binId}</div>
                <div className="text-sm text-dark-400">{bin.ward}</div>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={bin.status} />
                  <SensorStatusBadge status={bin.sensorStatus} />
                </div>
                <div className="text-xs text-dark-500 mt-1">Last updated {timeAgo(bin.lastUpdated)}</div>
              </div>
              <div className="text-right text-xs text-dark-400 space-y-1">
                <div>Type: {bin.binType}</div>
                <div>Battery: {bin.battery?.toFixed(0)}%</div>
                <div>Dist: {bin.distanceCm} cm</div>
              </div>
            </div>
          )}

          {/* Fill history mini chart */}
          {history.length > 1 && (
            <div>
              <h4 className="text-xs font-semibold text-dark-400 mb-2 uppercase tracking-wide">Recent Fill Trend</h4>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={history}>
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#475569" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#475569" }} width={25} />
                  <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", fontSize: "11px" }} />
                  <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="3 3" />
                  <ReferenceLine y={80} stroke="#f97316" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="fill" stroke={alert.priority === "CRITICAL" ? "#ef4444" : "#f97316"} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Alert details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-dark-800/30 rounded-xl p-3">
              <div className="text-xs text-dark-500 mb-1">Alert Created</div>
              <div className="text-dark-200">{formatTimestamp(alert.createdAt)}</div>
            </div>
            <div className="bg-dark-800/30 rounded-xl p-3">
              <div className="text-xs text-dark-500 mb-1">Fill at Alert</div>
              <div className="text-dark-200 font-bold">{alert.fillPercentage?.toFixed(1)}%</div>
            </div>
          </div>

          {/* Assignment */}
          {["OPEN"].includes(alert.status) && (
            <div className="border border-dark-700/50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-dark-200 mb-3 flex items-center gap-2">
                <UserCheck size={15} /> Assign to Employee
              </h4>
              {availableEmps.length === 0 ? (
                <p className="text-dark-500 text-sm">No available employees right now.</p>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                    {availableEmps.map((emp) => (
                      <label
                        key={emp.employeeId}
                        className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer border transition-all ${
                          selectedEmp === emp.employeeId
                            ? "border-primary-500/50 bg-primary-500/10"
                            : "border-dark-700/50 hover:border-dark-600"
                        }`}
                      >
                        <input
                          type="radio"
                          name="employee"
                          value={emp.employeeId}
                          checked={selectedEmp === emp.employeeId}
                          onChange={() => setSelectedEmp(emp.employeeId)}
                          className="accent-primary-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-dark-200">{emp.name}</div>
                          <div className="text-xs text-dark-500">{emp.ward}</div>
                        </div>
                        <EmployeeStatusBadge status={emp.status} />
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAssign}
                      disabled={!selectedEmp || assigning}
                      className="btn-primary flex-1 justify-center"
                    >
                      {assigning ? "Assigning..." : "Assign Task"}
                    </button>
                    <button onClick={handleDismiss} className="btn-secondary">
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {alert.status === "ASSIGNED" && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/25 rounded-xl text-sm text-blue-300 flex items-center gap-2">
              <User size={14} />
              Assigned to: {alert.assignedEmployeeName || alert.assignedEmployee}
            </div>
          )}

          {alert.status === "RESOLVED" && (
            <div className="p-3 bg-green-500/10 border border-green-500/25 rounded-xl text-sm text-green-300 flex items-center gap-2">
              <CheckCircle size={14} />
              Alert resolved — collection completed
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [selectedAlert, setSelectedAlert] = useState(null);

  useEffect(() => {
    return subscribeToAlerts(setAlerts);
  }, []);

  const filtered = alerts.filter((a) => {
    const matchSearch = !search || a.binId?.toLowerCase().includes(search.toLowerCase()) || a.alertId?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || a.status === filterStatus;
    const matchPriority = filterPriority === "ALL" || a.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });

  const openCount = alerts.filter((a) => a.status === "OPEN").length;
  const assignedCount = alerts.filter((a) => a.status === "ASSIGNED").length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Alerts</h1>
          <p className="text-dark-500 text-sm">{openCount} open · {assignedCount} assigned</p>
        </div>
        {openCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/25 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span className="text-sm text-red-400 font-medium">{openCount} unassigned alert{openCount !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
          <input
            type="text"
            placeholder="Search by bin or alert ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field w-auto">
          <option value="ALL">All Status</option>
          <option value="OPEN">Open</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="input-field w-auto">
          <option value="ALL">All Priority</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
        </select>
        <div className="text-xs text-dark-500 ml-auto">{filtered.length} alerts</div>
      </div>

      {/* Alerts table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Alert ID</th>
                <th>Bin ID</th>
                <th>Priority</th>
                <th>Fill %</th>
                <th>Ward</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-dark-500 py-12">
                    <Bell size={32} className="mx-auto mb-2 opacity-30" />
                    No alerts found
                  </td>
                </tr>
              ) : filtered.map((alert) => (
                <tr key={alert.alertId} className={alert.priority === "CRITICAL" && alert.status === "OPEN" ? "bg-red-500/3" : ""}>
                  <td>
                    <span className="font-mono text-xs text-dark-300">{alert.alertId}</span>
                  </td>
                  <td>
                    <span className="font-mono text-sm font-semibold text-dark-200">{alert.binId}</span>
                  </td>
                  <td><PriorityBadge priority={alert.priority} /></td>
                  <td>
                    <span className={`font-bold text-sm ${alert.priority === "CRITICAL" ? "text-red-400" : "text-orange-400"}`}>
                      {alert.fillPercentage?.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-xs text-dark-400 max-w-28 truncate">{alert.ward}</td>
                  <td><AlertStatusBadge status={alert.status} /></td>
                  <td className="text-xs text-dark-400">{alert.assignedEmployeeName || "—"}</td>
                  <td className="text-xs text-dark-500">{timeAgo(alert.createdAt)}</td>
                  <td>
                    <button
                      onClick={() => setSelectedAlert(alert)}
                      className="text-xs text-primary-400 hover:text-primary-300 px-2 py-1 hover:bg-primary-500/10 rounded transition-colors flex items-center gap-1"
                    >
                      <Eye size={12} />
                      {alert.status === "OPEN" ? "Review" : "View"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onAssign={() => setSelectedAlert(null)}
        />
      )}
    </div>
  );
}
