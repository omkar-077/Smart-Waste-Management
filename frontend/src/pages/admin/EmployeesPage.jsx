import { useEffect, useState } from "react";
import { subscribeToEmployees, updateEmployee, logAuditEvent } from "../../services/firebaseService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { timeAgo } from "../../config/appConfig";
import { EmployeeStatusBadge } from "../../components/common/StatusBadges";
import { Users, Search, Phone, MapPin, Edit2, X, Check } from "lucide-react";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState({});
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [editing, setEditing] = useState(null);
  const { user } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    return subscribeToEmployees(setEmployees);
  }, []);

  const empList = Object.values(employees);
  const filtered = empList.filter((e) => {
    const matchSearch = !search ||
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
      e.ward?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const available = empList.filter((e) => e.status === "AVAILABLE").length;
  const busy = empList.filter((e) => e.status === "BUSY").length;
  const offline = empList.filter((e) => e.status === "OFFLINE").length;

  const handleStatusChange = async (emp, newStatus) => {
    await updateEmployee(emp.employeeId, { status: newStatus });
    await logAuditEvent(user?.email, "EMPLOYEE_STATUS_UPDATED", emp.employeeId, { newStatus });
    addToast(`${emp.name} status updated to ${newStatus}`, "success");
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Employees</h1>
          <p className="text-dark-500 text-sm">{available} available · {busy} busy · {offline} offline</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Available", count: available, color: "text-green-400", bg: "bg-green-500/10" },
          { label: "Busy", count: busy, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Offline", count: offline, color: "text-dark-400", bg: "bg-dark-700/30" },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className="glass-card p-4 text-center">
            <div className={`text-2xl font-bold ${color}`}>{count}</div>
            <div className="text-xs text-dark-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
          <input
            type="text"
            placeholder="Search by name, ID, or ward..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field w-auto">
          <option value="ALL">All Status</option>
          <option value="AVAILABLE">Available</option>
          <option value="BUSY">Busy</option>
          <option value="OFFLINE">Offline</option>
        </select>
      </div>

      {/* Employee grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((emp) => (
          <div key={emp.employeeId} className="glass-card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-sm font-bold text-primary-400">
                  {emp.name?.[0]}
                </div>
                <div>
                  <div className="font-semibold text-dark-100">{emp.name}</div>
                  <div className="text-xs text-dark-500 font-mono">{emp.employeeId}</div>
                </div>
              </div>
              <EmployeeStatusBadge status={emp.status} />
            </div>

            <div className="space-y-1.5 text-xs text-dark-400">
              <div className="flex items-center gap-1.5">
                <MapPin size={11} /> {emp.ward}
              </div>
              <div className="flex items-center gap-1.5">
                <Phone size={11} /> {emp.phone}
              </div>
            </div>

            {/* Status change */}
            <div className="mt-4 flex gap-2">
              {["AVAILABLE", "BUSY", "OFFLINE"].map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(emp, s)}
                  disabled={emp.status === s}
                  className={`flex-1 py-1 text-xs rounded-lg border transition-all ${
                    emp.status === s
                      ? s === "AVAILABLE" ? "bg-green-500/20 border-green-500/40 text-green-400"
                        : s === "BUSY" ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                        : "bg-dark-700 border-dark-600 text-dark-400"
                      : "border-dark-700/50 text-dark-600 hover:border-dark-600 hover:text-dark-400"
                  }`}
                >
                  {s[0] + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-16 text-dark-500">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            No employees found
          </div>
        )}
      </div>
    </div>
  );
}
