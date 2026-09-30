import { useEffect, useState } from "react";
import { subscribeToCollections } from "../../services/firebaseService";
import { useAuth } from "../../context/AuthContext";
import { formatTimestamp } from "../../config/appConfig";
import { Package, ArrowDown } from "lucide-react";

export default function CollectionHistoryPage() {
  const { employeeData } = useAuth();
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    return subscribeToCollections((all) => {
      setCollections(all.filter((c) => c.employeeId === employeeData?.employeeId));
    });
  }, [employeeData?.employeeId]);

  const todayCount = collections.filter(
    (c) => new Date(c.timestamp).toDateString() === new Date().toDateString()
  ).length;
  const totalReduction = collections.reduce((s, c) => s + ((c.beforeFill || 0) - (c.afterFill || 0)), 0);

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <h1 className="text-xl font-bold text-dark-100 pt-2">Collection History</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-primary-400">{collections.length}</div>
          <div className="text-xs text-dark-500 mt-0.5">Total</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{todayCount}</div>
          <div className="text-xs text-dark-500 mt-0.5">Today</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{totalReduction.toFixed(0)}%</div>
          <div className="text-xs text-dark-500 mt-0.5">Total Reduction</div>
        </div>
      </div>

      {/* History list */}
      <div className="space-y-3">
        {collections.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <Package size={36} className="mx-auto mb-3 text-dark-600" />
            <div className="text-dark-400 text-sm">No collections yet</div>
          </div>
        ) : collections.map((col) => (
          <div key={col.collectionId} className="glass-card p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-mono font-bold text-dark-100">{col.binId}</div>
                <div className="text-xs text-dark-500 font-mono">{col.collectionId}</div>
              </div>
              <span className="text-xs text-green-400 font-medium">COMPLETED</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="text-lg font-bold text-orange-400">{col.beforeFill?.toFixed(0)}%</div>
                <div className="text-xs text-dark-500">Before</div>
              </div>
              <div className="flex-1 flex items-center gap-1 text-dark-600">
                <div className="flex-1 h-px bg-dark-700" />
                <ArrowDown size={14} className="text-green-400" />
                <div className="flex-1 h-px bg-dark-700" />
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-400">{col.afterFill?.toFixed(0)}%</div>
                <div className="text-xs text-dark-500">After</div>
              </div>
              <div className="text-center ml-2">
                <div className="text-sm font-bold text-primary-400">
                  -{((col.beforeFill || 0) - (col.afterFill || 0)).toFixed(0)}%
                </div>
                <div className="text-xs text-dark-500">Reduction</div>
              </div>
            </div>
            <div className="text-xs text-dark-600 mt-2">{formatTimestamp(col.timestamp)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
