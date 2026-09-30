import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  subscribeToBins,
  subscribeToAlerts,
  subscribeToTasks,
  subscribeToCollections,
  subscribeToEmployees,
} from "../../services/firebaseService";
import { APP_CONFIG, THRESHOLDS, timeAgo, getFillStatus } from "../../config/appConfig";
import { StatusBadge } from "../../components/common/StatusBadges";
import { FillBar } from "../../components/common/FillBar";
import {
  Trash2, Bell, Users, ClipboardList, Package, TrendingUp,
  AlertTriangle, CheckCircle, Activity, RefreshCw, ArrowRight
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

function MetricCard({ icon: Icon, label, value, sub, color = "primary", onClick }) {
  const colors = {
    primary: "text-primary-400 bg-primary-500/10",
    green: "text-green-400 bg-green-500/10",
    yellow: "text-amber-400 bg-amber-500/10",
    orange: "text-orange-400 bg-orange-500/10",
    red: "text-red-400 bg-red-500/10",
    blue: "text-blue-400 bg-blue-500/10",
    purple: "text-purple-400 bg-purple-500/10",
  };

  return (
    <div
      className={`glass-card p-5 flex items-start gap-4 ${onClick ? "cursor-pointer hover:border-dark-600 transition-all" : ""}`}
      onClick={onClick}
    >
      <div className={`flex-shrink-0 p-2.5 rounded-xl ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-2xl font-bold text-dark-100">{value}</div>
        <div className="text-sm text-dark-400 font-medium mt-0.5">{label}</div>
        {sub && <div className="text-xs text-dark-600 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

const PIE_COLORS = ["#22c55e", "#f59e0b", "#f97316", "#ef4444"];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [bins, setBins] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [collections, setCollections] = useState([]);
  const [employees, setEmployees] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const subs = [
      subscribeToBins((data) => { setBins(data); setLastUpdate(new Date()); }),
      subscribeToAlerts(setAlerts),
      subscribeToTasks(setTasks),
      subscribeToCollections(setCollections),
      subscribeToEmployees(setEmployees),
    ];
    return () => subs.forEach((fn) => fn && fn());
  }, []);

  // Compute stats from live Firebase data
  const binList = Object.values(bins);
  const normal = binList.filter((b) => b.status === "NORMAL").length;
  const medium = binList.filter((b) => b.status === "MEDIUM").length;
  const high = binList.filter((b) => b.status === "HIGH").length;
  const critical = binList.filter((b) => b.status === "CRITICAL").length;
  const openAlerts = alerts.filter((a) => ["OPEN", "ASSIGNED", "IN_PROGRESS"].includes(a.status)).length;
  const pendingTasks = tasks.filter((t) => ["ASSIGNED", "ACCEPTED", "IN_PROGRESS"].includes(t.status)).length;
  const completedToday = collections.filter((c) => {
    const today = new Date().toDateString();
    return c.status === "COMPLETED" && new Date(c.timestamp).toDateString() === today;
  }).length;
  const activeEmployees = Object.values(employees).filter((e) => e.status === "AVAILABLE" || e.status === "BUSY").length;

  // Pie chart data
  const pieData = [
    { name: "Normal", value: normal },
    { name: "Medium", value: medium },
    { name: "High", value: high },
    { name: "Critical", value: critical },
  ].filter((d) => d.value > 0);

  // Recent critical bins
  const criticalBins = binList
    .filter((b) => b.status === "CRITICAL" || b.status === "HIGH")
    .sort((a, b) => (b.fillPercentage || 0) - (a.fillPercentage || 0))
    .slice(0, 5);

  // Recent alerts
  const recentAlerts = alerts.slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="section-title">Command Center</h1>
          <p className="text-dark-500 text-sm mt-0.5">
            {APP_CONFIG.municipalityName} — {APP_CONFIG.city}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-dark-500">
            <RefreshCw size={12} className="text-primary-400" />
            {lastUpdate ? `Updated ${timeAgo(lastUpdate)}` : "Connecting..."}
          </div>
          <button
            onClick={() => navigate("/admin/alerts")}
            className="btn-primary text-xs px-3 py-1.5"
          >
            <Bell size={14} />
            {openAlerts > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                {openAlerts}
              </span>
            )}
            Alerts
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
        <MetricCard icon={Trash2} label="Total Bins" value={binList.length} color="primary" onClick={() => navigate("/admin/bins")} />
        <MetricCard icon={CheckCircle} label="Normal" value={normal} sub={`${((normal / Math.max(binList.length, 1)) * 100).toFixed(0)}%`} color="green" onClick={() => navigate("/admin/bins?status=NORMAL")} />
        <MetricCard icon={TrendingUp} label="Medium" value={medium} color="yellow" onClick={() => navigate("/admin/bins?status=MEDIUM")} />
        <MetricCard icon={AlertTriangle} label="High" value={high} color="orange" onClick={() => navigate("/admin/bins?status=HIGH")} />
        <MetricCard icon={AlertTriangle} label="Critical" value={critical} color="red" onClick={() => navigate("/admin/bins?status=CRITICAL")} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={Bell} label="Active Alerts" value={openAlerts} color="red" onClick={() => navigate("/admin/alerts")} />
        <MetricCard icon={ClipboardList} label="Pending Tasks" value={pendingTasks} color="orange" onClick={() => navigate("/admin/tasks")} />
        <MetricCard icon={Package} label="Completed Today" value={completedToday} color="green" onClick={() => navigate("/admin/collections")} />
        <MetricCard icon={Users} label="Active Employees" value={activeEmployees} color="blue" onClick={() => navigate("/admin/employees")} />
      </div>

      {/* Charts + Live data row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status distribution pie */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-dark-200 mb-4">Bin Status Distribution</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[["Normal","Medium","High","Critical"].indexOf(_.name)]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#e2e8f0", fontSize: "12px" }}
                    formatter={(v, n) => [v + " bins", n]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 justify-center">
                {[["Normal", "#22c55e"], ["Medium", "#f59e0b"], ["High", "#f97316"], ["Critical", "#ef4444"]].map(([name, color]) => (
                  <div key={name} className="flex items-center gap-1.5 text-xs text-dark-400">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    {name}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-dark-500 text-sm">
              No bin data yet
            </div>
          )}
        </div>

        {/* Critical bins */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-dark-200">Priority Bins</h3>
            <button onClick={() => navigate("/admin/bins?status=CRITICAL")} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {criticalBins.length === 0 ? (
              <div className="text-dark-500 text-sm text-center py-8">All bins normal ✓</div>
            ) : criticalBins.map((bin) => (
              <div
                key={bin.binId}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-dark-800/50 hover:bg-dark-800 transition-colors cursor-pointer"
                onClick={() => navigate(`/admin/bins?search=${bin.binId}`)}
              >
                <div className="flex-shrink-0">
                  <StatusBadge status={bin.status} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-dark-200 truncate">{bin.binId}</div>
                  <div className="text-xs text-dark-500 truncate">{bin.ward}</div>
                </div>
                <div className="text-sm font-bold text-right" style={{ color: bin.status === "CRITICAL" ? "#ef4444" : "#f97316" }}>
                  {bin.fillPercentage?.toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent alerts */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-dark-200">Recent Alerts</h3>
            <button onClick={() => navigate("/admin/alerts")} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {recentAlerts.length === 0 ? (
              <div className="text-dark-500 text-sm text-center py-8">No alerts</div>
            ) : recentAlerts.map((alert) => (
              <div
                key={alert.alertId}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-dark-800/50 hover:bg-dark-800 transition-colors cursor-pointer"
                onClick={() => navigate("/admin/alerts")}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${alert.priority === "CRITICAL" ? "bg-red-400" : "bg-orange-400"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-dark-200 truncate">{alert.binId}</div>
                  <div className="text-xs text-dark-500 truncate">{timeAgo(alert.createdAt)}</div>
                </div>
                <span className={`text-xs font-semibold ${alert.status === "OPEN" ? "text-red-400" : alert.status === "RESOLVED" ? "text-green-400" : "text-amber-400"}`}>
                  {alert.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-dark-200 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate("/admin/map")} className="btn-secondary text-xs">
            <Activity size={14} /> Live Map
          </button>
          <button onClick={() => navigate("/admin/alerts")} className="btn-secondary text-xs">
            <Bell size={14} /> Review Alerts ({openAlerts})
          </button>
          <button onClick={() => navigate("/admin/employees")} className="btn-secondary text-xs">
            <Users size={14} /> Manage Employees
          </button>
          <button onClick={() => navigate("/admin/analytics")} className="btn-secondary text-xs">
            <TrendingUp size={14} /> Analytics
          </button>
          <button onClick={() => navigate("/admin/sensor-health")} className="btn-secondary text-xs">
            <Activity size={14} /> Sensor Health
          </button>
        </div>
      </div>
    </div>
  );
}
