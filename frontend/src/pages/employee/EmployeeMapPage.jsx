import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { subscribeToBins, subscribeToEmployeeTasks } from "../../services/firebaseService";
import { useAuth } from "../../context/AuthContext";
import { APP_CONFIG, getFillColor } from "../../config/appConfig";
import { FillBar } from "../../components/common/FillBar";
import { StatusBadge } from "../../components/common/StatusBadges";
import { Navigation } from "lucide-react";

function createBinIcon(status, isAssigned) {
  const colors = {
    NORMAL: "#22c55e", MEDIUM: "#f59e0b", HIGH: "#f97316", CRITICAL: "#ef4444", UNKNOWN: "#64748b",
  };
  const color = colors[status] || colors.UNKNOWN;
  const ring = isAssigned ? `<circle cx="16" cy="14" r="13" fill="none" stroke="#3b82f6" stroke-width="2.5"/>` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
    <circle cx="16" cy="14" r="11" fill="${color}" opacity="0.9"/>
    ${ring}
    <text x="16" y="18" font-size="11" fill="white" text-anchor="middle">🗑</text>
    <line x1="16" y1="25" x2="16" y2="38" stroke="${color}" stroke-width="2" opacity="0.7"/>
  </svg>`;
  return L.divIcon({ html: svg, className: "", iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -40] });
}

export default function EmployeeMapPage() {
  const { employeeData } = useAuth();
  const [bins, setBins] = useState({});
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const u1 = subscribeToBins(setBins);
    const u2 = employeeData?.employeeId
      ? subscribeToEmployeeTasks(employeeData.employeeId, setTasks)
      : () => {};
    return () => { u1(); u2(); };
  }, [employeeData?.employeeId]);

  const activeTasks = tasks.filter((t) => !["COMPLETED", "CANCELLED"].includes(t.status));
  const assignedBinIds = new Set(activeTasks.map((t) => t.binId));

  const binList = Object.values(bins).filter((b) => b.latitude && b.longitude);
  const criticalBins = binList.filter((b) => b.status === "CRITICAL" || b.status === "HIGH");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 pb-2">
        <h1 className="text-xl font-bold text-dark-100">Map</h1>
        <p className="text-dark-500 text-xs mt-0.5">{criticalBins.length} bins need attention · {assignedBinIds.size} assigned to you</p>
      </div>

      {/* Map */}
      <div className="flex-1 px-4 pb-4">
        <div className="rounded-2xl overflow-hidden border border-dark-700/50" style={{ height: "100%", minHeight: "400px" }}>
          <MapContainer
            center={APP_CONFIG.mapCenter}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {binList
              .filter((b) => b.status === "CRITICAL" || b.status === "HIGH" || assignedBinIds.has(b.binId))
              .map((bin) => (
                <Marker
                  key={bin.binId}
                  position={[bin.latitude, bin.longitude]}
                  icon={createBinIcon(bin.status, assignedBinIds.has(bin.binId))}
                >
                  <Popup>
                    <div className="min-w-[180px]">
                      <div className="font-bold text-dark-100 mb-1">{bin.binId}</div>
                      <div className="text-xs text-dark-400 mb-2">{bin.ward}</div>
                      <div className="mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Fill</span>
                          <span className="font-bold">{bin.fillPercentage?.toFixed(0)}%</span>
                        </div>
                        <FillBar percentage={bin.fillPercentage} />
                      </div>
                      {assignedBinIds.has(bin.binId) && (
                        <div className="text-xs text-blue-400 mb-2 font-medium">📌 Assigned to you</div>
                      )}
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${bin.latitude},${bin.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-primary-400 mt-1"
                      >
                        <Navigation size={10} /> Navigate
                      </a>
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
