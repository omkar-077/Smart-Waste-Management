import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { subscribeToBins, subscribeToEmployees } from "../../services/firebaseService";
import { APP_CONFIG, getFillColor, STATUS_COLORS, timeAgo } from "../../config/appConfig";
import { StatusBadge, SensorStatusBadge } from "../../components/common/StatusBadges";
import { FillBar } from "../../components/common/FillBar";
import { MapPin, Users, Trash2, Filter } from "lucide-react";

// Custom bin icon
function createBinIcon(status) {
  const colors = {
    NORMAL: "#22c55e",
    MEDIUM: "#f59e0b",
    HIGH: "#f97316",
    CRITICAL: "#ef4444",
    UNKNOWN: "#64748b",
  };
  const color = colors[status] || colors.UNKNOWN;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
      <circle cx="16" cy="14" r="12" fill="${color}" opacity="0.9" />
      <circle cx="16" cy="14" r="8" fill="white" opacity="0.3" />
      <path d="M16 26 L8 38" stroke="${color}" stroke-width="2" opacity="0.6"/>
      <path d="M16 26 L24 38" stroke="${color}" stroke-width="2" opacity="0.6"/>
      <text x="16" y="18" font-size="10" font-weight="bold" fill="white" text-anchor="middle">🗑</text>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });
}

function createEmployeeIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="13" fill="#3b82f6" opacity="0.9" />
      <text x="14" y="19" font-size="12" fill="white" text-anchor="middle">👷</text>
    </svg>
  `;
  return L.divIcon({ html: svg, className: "", iconSize: [28, 28], iconAnchor: [14, 14] });
}

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom()); }, [center]);
  return null;
}

export default function LiveMap() {
  const [bins, setBins] = useState({});
  const [employees, setEmployees] = useState({});
  const [showEmployees, setShowEmployees] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedBin, setSelectedBin] = useState(null);

  useEffect(() => {
    const u1 = subscribeToBins(setBins);
    const u2 = subscribeToEmployees(setEmployees);
    return () => { u1(); u2(); };
  }, []);

  const binList = Object.values(bins).filter((b) => b.latitude && b.longitude);
  const filteredBins = filterStatus === "ALL"
    ? binList
    : binList.filter((b) => b.status === filterStatus);

  const stats = {
    total: binList.length,
    critical: binList.filter((b) => b.status === "CRITICAL").length,
    high: binList.filter((b) => b.status === "HIGH").length,
    online: binList.filter((b) => b.sensorStatus === "ONLINE").length,
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Live Map</h1>
          <p className="text-dark-500 text-sm">{APP_CONFIG.city}, {APP_CONFIG.state} — Real-time bin monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="live-dot" />
          <span className="text-xs text-dark-400">Live</span>
        </div>
      </div>

      {/* Stats strip */}
      <div className="flex gap-4 flex-wrap">
        {[
          { label: "Total", value: stats.total, color: "text-dark-300" },
          { label: "Critical", value: stats.critical, color: "text-red-400" },
          { label: "High", value: stats.high, color: "text-orange-400" },
          { label: "Online", value: stats.online, color: "text-green-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card px-4 py-2 flex items-center gap-2">
            <span className={`text-lg font-bold ${color}`}>{value}</span>
            <span className="text-xs text-dark-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex items-center gap-1 text-xs text-dark-500">
          <Filter size={12} />
          <span>Filter:</span>
        </div>
        {["ALL", "CRITICAL", "HIGH", "MEDIUM", "NORMAL"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              filterStatus === s
                ? "bg-primary-500/20 border-primary-500/40 text-primary-400"
                : "border-dark-700/50 text-dark-500 hover:text-dark-300"
            }`}
          >
            {s}
          </button>
        ))}
        <button
          onClick={() => setShowEmployees(!showEmployees)}
          className={`px-3 py-1 text-xs rounded-full border transition-colors ml-auto ${
            showEmployees
              ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
              : "border-dark-700/50 text-dark-500"
          }`}
        >
          <Users size={10} className="inline mr-1" />
          Employees
        </button>
      </div>

      {/* Map */}
      <div className="glass-card overflow-hidden" style={{ height: "calc(100vh - 300px)", minHeight: "400px" }}>
        <MapContainer
          center={APP_CONFIG.mapCenter}
          zoom={APP_CONFIG.mapZoom}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* Bin markers */}
          {filteredBins.map((bin) => (
            <Marker
              key={bin.binId}
              position={[bin.latitude, bin.longitude]}
              icon={createBinIcon(bin.status)}
              eventHandlers={{ click: () => setSelectedBin(bin) }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-dark-100">{bin.binId}</span>
                    <StatusBadge status={bin.status} />
                  </div>
                  <div className="space-y-1 text-xs text-dark-300">
                    <div className="flex items-center gap-1"><MapPin size={10} /> {bin.ward}</div>
                    <div>Type: {bin.binType}</div>
                    <div className="mt-2">
                      <div className="flex justify-between mb-1">
                        <span>Fill Level</span>
                        <span className="font-bold">{bin.fillPercentage?.toFixed(0)}%</span>
                      </div>
                      <FillBar percentage={bin.fillPercentage} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>Battery</span>
                      <span>{bin.battery?.toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sensor</span>
                      <span className={bin.sensorStatus === "ONLINE" ? "text-green-400" : "text-amber-400"}>
                        {bin.sensorStatus}
                      </span>
                    </div>
                    <div className="text-dark-500 mt-1">Updated: {timeAgo(bin.lastUpdated)}</div>
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${bin.latitude},${bin.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300"
                  >
                    <MapPin size={10} /> Navigate
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Employee markers */}
          {showEmployees && Object.values(employees)
            .filter((e) => e.latitude && e.longitude && e.status !== "OFFLINE")
            .map((emp) => (
              <Marker
                key={emp.employeeId}
                position={[emp.latitude, emp.longitude]}
                icon={createEmployeeIcon()}
              >
                <Popup>
                  <div className="text-xs text-dark-200">
                    <div className="font-bold">{emp.name}</div>
                    <div className="text-dark-400">{emp.ward}</div>
                    <div className={`mt-1 ${emp.status === "AVAILABLE" ? "text-green-400" : "text-amber-400"}`}>
                      {emp.status}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="glass-card p-4 flex flex-wrap gap-4 text-xs text-dark-400">
        {[["NORMAL", "#22c55e"], ["MEDIUM", "#f59e0b"], ["HIGH", "#f97316"], ["CRITICAL", "#ef4444"]].map(([s, c]) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
            {s}
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          Employee
        </div>
      </div>
    </div>
  );
}
