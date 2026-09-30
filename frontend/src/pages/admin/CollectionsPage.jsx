import { useEffect, useState } from "react";
import { subscribeToCollections } from "../../services/firebaseService";
import { timeAgo, formatTimestamp } from "../../config/appConfig";
import { Package, Search, CheckCircle, ArrowDown } from "lucide-react";

export default function CollectionsPage() {
  const [collections, setCollections] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    return subscribeToCollections(setCollections);
  }, []);

  const today = new Date().toDateString();
  const todayCount = collections.filter((c) => new Date(c.timestamp).toDateString() === today).length;
  const avgBefore = collections.length
    ? (collections.reduce((s, c) => s + (c.beforeFill || 0), 0) / collections.length).toFixed(1)
    : 0;
  const avgAfter = collections.length
    ? (collections.reduce((s, c) => s + (c.afterFill || 0), 0) / collections.length).toFixed(1)
    : 0;

  const filtered = collections.filter((c) =>
    !search ||
    c.binId?.toLowerCase().includes(search.toLowerCase()) ||
    c.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
    c.collectionId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Collections</h1>
          <p className="text-dark-500 text-sm">{collections.length} total · {todayCount} today</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-primary-400">{todayCount}</div>
          <div className="text-xs text-dark-500 mt-0.5">Today</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-orange-400">{avgBefore}%</div>
          <div className="text-xs text-dark-500 mt-0.5">Avg Fill Before</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{avgAfter}%</div>
          <div className="text-xs text-dark-500 mt-0.5">Avg Fill After</div>
        </div>
      </div>

      {/* Search */}
      <div className="glass-card p-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
          <input type="text" placeholder="Search collections..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-9" />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Collection ID</th>
                <th>Bin ID</th>
                <th>Employee</th>
                <th>Before</th>
                <th>After</th>
                <th>Reduction</th>
                <th>GPS Verified</th>
                <th>Status</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-dark-500">
                    <Package size={32} className="mx-auto mb-2 opacity-30" />
                    No collections yet
                  </td>
                </tr>
              ) : filtered.map((col) => (
                <tr key={col.collectionId}>
                  <td><span className="font-mono text-xs text-dark-300">{col.collectionId}</span></td>
                  <td><span className="font-mono text-sm font-semibold text-dark-200">{col.binId}</span></td>
                  <td className="text-sm text-dark-300">{col.employeeName}</td>
                  <td>
                    <span className="font-bold text-orange-400">{col.beforeFill?.toFixed(0)}%</span>
                  </td>
                  <td>
                    <span className="font-bold text-green-400">{col.afterFill?.toFixed(0)}%</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1 text-primary-400">
                      <ArrowDown size={12} />
                      <span className="text-sm font-bold">
                        {((col.beforeFill || 0) - (col.afterFill || 0)).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`text-xs font-medium ${col.gpsVerified ? "text-green-400" : "text-dark-500"}`}>
                      {col.gpsVerified ? "✓ Yes" : "No"}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs font-medium text-green-400">{col.status}</span>
                  </td>
                  <td className="text-xs text-dark-500">{formatTimestamp(col.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
