import { useEffect, useState } from "react";
import {
  subscribeToBins,
  subscribeToAlerts,
  subscribeToCollections,
} from "../../services/firebaseService";
import { WARDS, STATUS_COLORS } from "../../config/appConfig";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid
} from "recharts";
import { BarChart3 } from "lucide-react";

const CHART_STYLE = {
  contentStyle: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "#e2e8f0",
    fontSize: "11px",
  },
};

const STATUS_FILL_COLORS = {
  Normal: "#22c55e",
  Medium: "#f59e0b",
  High: "#f97316",
  Critical: "#ef4444",
};

export default function AnalyticsPage() {
  const [bins, setBins] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    const u1 = subscribeToBins(setBins);
    const u2 = subscribeToAlerts(setAlerts);
    const u3 = subscribeToCollections(setCollections);
    return () => { u1(); u2(); u3(); };
  }, []);

  const binList = Object.values(bins);

  // Status distribution
  const statusDist = [
    { name: "Normal", value: binList.filter((b) => b.status === "NORMAL").length },
    { name: "Medium", value: binList.filter((b) => b.status === "MEDIUM").length },
    { name: "High", value: binList.filter((b) => b.status === "HIGH").length },
    { name: "Critical", value: binList.filter((b) => b.status === "CRITICAL").length },
  ];

  // Ward fill levels
  const wardData = WARDS.map((ward) => {
    const wardBins = binList.filter((b) => b.ward === ward);
    const avg = wardBins.length
      ? wardBins.reduce((s, b) => s + (b.fillPercentage || 0), 0) / wardBins.length
      : 0;
    const critical = wardBins.filter((b) => b.status === "CRITICAL").length;
    return { ward: ward.split(" - ")[0], avg: Math.round(avg), critical, total: wardBins.length };
  }).filter((w) => w.total > 0);

  // Collections by day (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      dateStr: d.toDateString(),
    };
  });
  const collectionsByDay = last7Days.map(({ date, dateStr }) => ({
    date,
    count: collections.filter((c) => new Date(c.timestamp).toDateString() === dateStr).length,
  }));

  // Alerts by day
  const alertsByDay = last7Days.map(({ date, dateStr }) => ({
    date,
    count: alerts.filter((a) => new Date(a.createdAt).toDateString() === dateStr).length,
  }));

  // Employee performance
  const empPerf = {};
  collections.forEach((c) => {
    if (!c.employeeName) return;
    if (!empPerf[c.employeeName]) empPerf[c.employeeName] = { name: c.employeeName.split(" ")[0], count: 0, avgReduction: 0, total: 0 };
    empPerf[c.employeeName].count++;
    empPerf[c.employeeName].total += (c.beforeFill || 0) - (c.afterFill || 0);
  });
  const empData = Object.values(empPerf).map((e) => ({
    ...e,
    avgReduction: e.count > 0 ? Math.round(e.total / e.count) : 0,
  })).sort((a, b) => b.count - a.count).slice(0, 8);

  // Sensor health
  const sensorHealth = {
    online: binList.filter((b) => b.sensorStatus === "ONLINE").length,
    offline: binList.filter((b) => b.sensorStatus === "OFFLINE").length,
    lowBattery: binList.filter((b) => b.sensorStatus === "LOW_BATTERY").length,
    invalid: binList.filter((b) => b.sensorStatus === "INVALID_READING").length,
  };

  const ChartCard = ({ title, children, span = 1 }) => (
    <div className={`glass-card p-5 ${span === 2 ? "lg:col-span-2" : ""}`}>
      <h3 className="text-sm font-semibold text-dark-200 mb-4">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Analytics</h1>
          <p className="text-dark-500 text-sm">Real-time data from Firebase — {binList.length} bins · {collections.length} collections</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Status Distribution */}
        <ChartCard title="Bin Status Distribution">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.2)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip {...CHART_STYLE} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {statusDist.map((e, i) => (
                  <Cell key={i} fill={Object.values(STATUS_FILL_COLORS)[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Ward Average Fill */}
        <ChartCard title="Average Fill Level by Ward">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={wardData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis type="category" dataKey="ward" width={60} tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip {...CHART_STYLE} formatter={(v) => [`${v}%`, "Avg Fill"]} />
              <Bar dataKey="avg" fill="#22c55e" radius={[0, 4, 4, 0]}>
                {wardData.map((w, i) => (
                  <Cell key={i} fill={w.avg >= 90 ? "#ef4444" : w.avg >= 80 ? "#f97316" : w.avg >= 60 ? "#f59e0b" : "#22c55e"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Collections per day */}
        <ChartCard title="Collections — Last 7 Days">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={collectionsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.2)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
              <Tooltip {...CHART_STYLE} />
              <Area type="monotone" dataKey="count" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Alerts per day */}
        <ChartCard title="Alerts Generated — Last 7 Days">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={alertsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.2)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
              <Tooltip {...CHART_STYLE} />
              <Area type="monotone" dataKey="count" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Employee performance */}
        <ChartCard title="Employee Collection Performance" span={2}>
          {empData.length === 0 ? (
            <div className="text-center text-dark-500 py-12">No collection data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={empData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.2)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip {...CHART_STYLE} />
                <Bar dataKey="count" name="Collections" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgReduction" name="Avg Reduction %" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: "11px", color: "#64748b" }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Sensor health */}
        <ChartCard title="Sensor Health Overview">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Online", value: sensorHealth.online, color: "text-green-400", bg: "bg-green-500/10" },
              { label: "Offline", value: sensorHealth.offline, color: "text-dark-400", bg: "bg-dark-700/30" },
              { label: "Low Battery", value: sensorHealth.lowBattery, color: "text-amber-400", bg: "bg-amber-500/10" },
              { label: "Invalid", value: sensorHealth.invalid, color: "text-red-400", bg: "bg-red-500/10" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`${bg} rounded-xl p-4 text-center`}>
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-dark-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-dark-500">
            Uptime: {binList.length > 0 ? ((sensorHealth.online / binList.length) * 100).toFixed(1) : 0}%
          </div>
        </ChartCard>

        {/* Ward critical bins */}
        <ChartCard title="Critical Bins by Ward">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={wardData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.2)" />
              <XAxis dataKey="ward" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
              <Tooltip {...CHART_STYLE} />
              <Bar dataKey="critical" name="Critical Bins" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
