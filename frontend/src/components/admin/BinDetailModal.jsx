import { useEffect, useState } from "react";
import {
  subscribeToBinHistory,
  getBin,
} from "../../services/firebaseService";
import { getFillColor, timeAgo, formatTimestamp } from "../../config/appConfig";
import { StatusBadge, SensorStatusBadge } from "../common/StatusBadges";
import { FillBar, FillGauge } from "../common/FillBar";
import { X, MapPin, Battery, Wifi, Clock, AlertTriangle } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";

export default function BinDetailModal({ bin, onClose }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!bin?.binId) return;
    const unsub = subscribeToBinHistory(bin.binId, 20, (data) => {
      setHistory(data.map((r) => ({
        time: new Date(r.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        fill: r.fillPercentage,
        battery: r.battery,
      })).filter((r) => r.fill != null));
    });
    return unsub;
  }, [bin?.binId]);

  if (!bin) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-dark-900 border border-dark-700/50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700/50">
          <div className="flex items-center gap-3">
            <FillGauge percentage={bin.fillPercentage} size={60} />
            <div>
              <div className="text-xl font-bold text-dark-100 font-mono">{bin.binId}</div>
              <div className="text-sm text-dark-400">{bin.ward}</div>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={bin.status} />
                <SensorStatusBadge status={bin.sensorStatus} />
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-dark-500 hover:text-dark-200 hover:bg-dark-800 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Fill Level", value: `${bin.fillPercentage?.toFixed(1)}%`, icon: AlertTriangle },
              { label: "Distance", value: `${bin.distanceCm} cm`, icon: AlertTriangle },
              { label: "Battery", value: `${bin.battery?.toFixed(0)}%`, icon: Battery },
              { label: "Capacity", value: `${bin.capacity}L`, icon: AlertTriangle },
            ].map(({ label, value }) => (
              <div key={label} className="bg-dark-800/50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-dark-100">{value}</div>
                <div className="text-xs text-dark-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <DetailRow label="Bin Type" value={bin.binType} />
              <DetailRow label="Ward" value={bin.ward} />
              <DetailRow label="Validation" value={bin.validationStatus || "—"} />
              <DetailRow label="Last Updated" value={timeAgo(bin.lastUpdated)} />
              <DetailRow label="Last Collection" value={bin.lastCollection ? formatTimestamp(bin.lastCollection) : "No record"} />
            </div>
            <div className="space-y-2">
              <DetailRow label="Latitude" value={bin.latitude?.toFixed(6)} />
              <DetailRow label="Longitude" value={bin.longitude?.toFixed(6)} />
              <DetailRow label="Sensor" value={bin.sensorStatus} />
              <div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${bin.latitude},${bin.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300"
                >
                  <MapPin size={12} />
                  Open in Google Maps
                </a>
              </div>
            </div>
          </div>

          {/* Fill level history chart */}
          <div>
            <h4 className="text-sm font-semibold text-dark-300 mb-3">Fill Level History (Last 20 readings)</h4>
            {history.length > 1 ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={history}>
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#e2e8f0", fontSize: "11px" }}
                    formatter={(v) => [`${v?.toFixed(1)}%`, "Fill"]}
                  />
                  <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Critical", fill: "#ef4444", fontSize: 10 }} />
                  <ReferenceLine y={80} stroke="#f97316" strokeDasharray="3 3" label={{ value: "High", fill: "#f97316", fontSize: 10 }} />
                  <Line
                    type="monotone"
                    dataKey="fill"
                    stroke={getFillColor(bin.fillPercentage)}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: getFillColor(bin.fillPercentage) }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-dark-500 text-sm py-8 bg-dark-800/30 rounded-xl">
                Waiting for sensor readings...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-dark-500 text-xs">{label}</span>
      <span className="text-dark-200 text-xs font-medium">{value}</span>
    </div>
  );
}
