import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { subscribeToBins } from "../../services/firebaseService";
import { WARDS, timeAgo, getFillStatus } from "../../config/appConfig";
import { StatusBadge, SensorStatusBadge } from "../../components/common/StatusBadges";
import { FillBar } from "../../components/common/FillBar";
import BinDetailModal from "../../components/admin/BinDetailModal";
import { Search, Filter, SortAsc, Trash2 } from "lucide-react";

export default function BinsPage() {
  const [bins, setBins] = useState({});
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterWard, setFilterWard] = useState("ALL");
  const [sortBy, setSortBy] = useState("fillPercentage");
  const [sortDir, setSortDir] = useState("desc");
  const [selectedBin, setSelectedBin] = useState(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const unsub = subscribeToBins(setBins);
    return unsub;
  }, []);

  useEffect(() => {
    const s = searchParams.get("search") || "";
    const st = searchParams.get("status") || "ALL";
    setSearch(s);
    setFilterStatus(st);
  }, [searchParams]);

  const binList = Object.values(bins);
  const filtered = binList
    .filter((b) => {
      const matchSearch = !search ||
        b.binId?.toLowerCase().includes(search.toLowerCase()) ||
        b.ward?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "ALL" || b.status === filterStatus;
      const matchWard = filterWard === "ALL" || b.ward === filterWard;
      return matchSearch && matchStatus && matchWard;
    })
    .sort((a, b) => {
      const aVal = a[sortBy] ?? 0;
      const bVal = b[sortBy] ?? 0;
      return sortDir === "desc"
        ? (bVal > aVal ? 1 : -1)
        : (aVal > bVal ? 1 : -1);
    });

  const toggleSort = (field) => {
    if (sortBy === field) setSortDir((d) => d === "desc" ? "asc" : "desc");
    else { setSortBy(field); setSortDir("desc"); }
  };

  const criticalCount = binList.filter((b) => b.status === "CRITICAL").length;
  const offlineCount = binList.filter((b) => b.sensorStatus === "OFFLINE").length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Live Bin Monitoring</h1>
          <p className="text-dark-500 text-sm">{binList.length} bins tracked · {criticalCount} critical · {offlineCount} offline</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="live-dot" />
          <span className="text-xs text-dark-400">Real-time</span>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
          <input
            id="bins-search"
            type="text"
            placeholder="Search bin ID or ward..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input-field w-auto"
        >
          <option value="ALL">All Status</option>
          <option value="NORMAL">Normal</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <select
          value={filterWard}
          onChange={(e) => setFilterWard(e.target.value)}
          className="input-field w-auto"
        >
          <option value="ALL">All Wards</option>
          {WARDS.map((w) => <option key={w} value={w}>{w}</option>)}
        </select>
        <div className="text-xs text-dark-500 ml-auto">
          {filtered.length} of {binList.length}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bin ID</th>
                <th>Ward</th>
                <th>Type</th>
                <th
                  className="cursor-pointer hover:text-dark-200"
                  onClick={() => toggleSort("fillPercentage")}
                >
                  Fill % {sortBy === "fillPercentage" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                </th>
                <th>Status</th>
                <th
                  className="cursor-pointer hover:text-dark-200"
                  onClick={() => toggleSort("battery")}
                >
                  Battery {sortBy === "battery" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                </th>
                <th>Sensor</th>
                <th>Last Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-dark-500 py-12">
                    <Trash2 size={32} className="mx-auto mb-2 opacity-30" />
                    No bins found
                  </td>
                </tr>
              ) : filtered.map((bin) => (
                <tr key={bin.binId}>
                  <td>
                    <span className="font-mono text-sm font-semibold text-dark-200">{bin.binId}</span>
                  </td>
                  <td className="text-xs text-dark-400 max-w-28 truncate">{bin.ward}</td>
                  <td className="text-xs text-dark-400">{bin.binType}</td>
                  <td>
                    <div className="flex items-center gap-2 min-w-32">
                      <FillBar percentage={bin.fillPercentage} />
                      <span className="text-xs font-mono font-semibold text-dark-300 w-9 flex-shrink-0">
                        {bin.fillPercentage?.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td><StatusBadge status={bin.status} /></td>
                  <td>
                    <div className="flex items-center gap-2 min-w-24">
                      <div className="flex-1 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${bin.battery || 0}%`,
                            backgroundColor: bin.battery < 20 ? "#ef4444" : bin.battery < 40 ? "#f59e0b" : "#22c55e",
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono text-dark-400 w-8">{bin.battery?.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td><SensorStatusBadge status={bin.sensorStatus} /></td>
                  <td className="text-xs text-dark-500">{timeAgo(bin.lastUpdated)}</td>
                  <td>
                    <button
                      onClick={() => setSelectedBin(bin)}
                      className="text-xs text-primary-400 hover:text-primary-300 px-2 py-1 hover:bg-primary-500/10 rounded transition-colors"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {selectedBin && (
        <BinDetailModal bin={selectedBin} onClose={() => setSelectedBin(null)} />
      )}
    </div>
  );
}
