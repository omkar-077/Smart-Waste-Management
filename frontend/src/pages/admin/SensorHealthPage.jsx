import { useEffect, useState } from "react";
import { subscribeToBins } from "../../services/firebaseService";
import { timeAgo } from "../../config/appConfig";
import { SensorStatusBadge } from "../../components/common/StatusBadges";
import { Activity, Wifi, WifiOff, Battery, AlertTriangle, Search } from "lucide-react";

export default function SensorHealthPage() {
  const [bins, setBins] = useState({});
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => {
    return subscribeToBins(setBins);
  }, []);

  const binList = Object.values(bins);
  const online = binList.filter((b) => b.sensorStatus === "ONLINE").length;
  const offline = binList.filter((b) => b.sensorStatus === "OFFLINE").length;
  const lowBat = binList.filter((b) => b.sensorStatus === "LOW_BATTERY").length;
  const invalid = binList.filter((b) => b.sensorStatus === "INVALID_READING").length;
  const uptime = binList.length > 0 ? ((online / binList.length) * 100).toFixed(1) : 0;

  const filtered = binList.filter((b) => {
    const matchSearch = !search || b.binId?.toLowerCase().includes(search.toLowerCase()) || b.ward?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || b.sensorStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Sensor Health</h1>
          <p className="text-dark-500 text-sm">Network uptime: {uptime}% · {binList.length} sensors monitored</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="live-dot" />
          <span className="text-xs text-dark-400">Live</span>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Online", count: online, icon: Wifi, color: "text-green-400", bg: "bg-green-500/10", key: "ONLINE" },
          { label: "Offline", count: offline, icon: WifiOff, color: "text-dark-400", bg: "bg-dark-700/30", key: "OFFLINE" },
          { label: "Low Battery", count: lowBat, icon: Battery, color: "text-amber-400", bg: "bg-amber-500/10", key: "LOW_BATTERY" },
          { label: "Invalid", count: invalid, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", key: "INVALID_READING" },
        ].map(({ label, count, icon: Icon, color, bg, key }) => (
          <div
            key={label}
            className={`glass-card p-5 cursor-pointer hover:border-dark-600 transition-all ${filterStatus === key ? "border-primary-500/40" : ""}`}
            onClick={() => setFilterStatus(filterStatus === key ? "ALL" : key)}
          >
            <div className={`inline-flex p-2 rounded-xl ${bg} mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <div className={`text-2xl font-bold ${color}`}>{count}</div>
            <div className="text-xs text-dark-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Uptime bar */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-dark-300">Network Uptime</span>
          <span className="text-lg font-bold text-primary-400">{uptime}%</span>
        </div>
        <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all duration-500"
            style={{ width: `${uptime}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-dark-600 mt-1">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Filter */}
      <div className="glass-card p-4 flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
          <input type="text" placeholder="Search sensors..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-9" />
        </div>
      </div>

      {/* Sensor table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bin ID</th>
                <th>Ward</th>
                <th>Sensor Status</th>
                <th>Battery</th>
                <th>Fill %</th>
                <th>Distance (cm)</th>
                <th>Validation</th>
                <th>Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((bin) => (
                <tr key={bin.binId} className={bin.sensorStatus === "OFFLINE" ? "opacity-60" : ""}>
                  <td><span className="font-mono text-sm font-semibold text-dark-200">{bin.binId}</span></td>
                  <td className="text-xs text-dark-400 max-w-28 truncate">{bin.ward}</td>
                  <td><SensorStatusBadge status={bin.sensorStatus} /></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${bin.battery || 0}%`,
                            backgroundColor: bin.battery < 20 ? "#ef4444" : bin.battery < 40 ? "#f59e0b" : "#22c55e",
                          }}
                        />
                      </div>
                      <span className={`text-xs font-mono ${bin.battery < 20 ? "text-red-400" : "text-dark-400"}`}>
                        {bin.battery?.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="text-sm font-mono text-dark-300">{bin.fillPercentage != null ? `${bin.fillPercentage.toFixed(0)}%` : "—"}</td>
                  <td className="text-sm font-mono text-dark-400">{bin.distanceCm != null ? `${bin.distanceCm} cm` : "—"}</td>
                  <td>
                    <span className={`text-xs font-medium ${bin.validationStatus === "OK" ? "text-green-400" : "text-amber-400"}`}>
                      {bin.validationStatus || "—"}
                    </span>
                  </td>
                  <td className="text-xs text-dark-500">{timeAgo(bin.lastUpdated)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
