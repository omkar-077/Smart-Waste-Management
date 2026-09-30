import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import {
  LayoutDashboard, Map, Trash2, Bell, Users, ClipboardList,
  Package, BarChart3, Activity, Settings, LogOut, ChevronLeft,
  ChevronRight, Wifi
} from "lucide-react";
import { APP_CONFIG } from "../config/appConfig";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/map", label: "Live Map", icon: Map },
  { to: "/admin/bins", label: "Bins", icon: Trash2 },
  { to: "/admin/alerts", label: "Alerts", icon: Bell },
  { to: "/admin/employees", label: "Employees", icon: Users },
  { to: "/admin/tasks", label: "Tasks", icon: ClipboardList },
  { to: "/admin/collections", label: "Collections", icon: Package },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/sensor-health", label: "Sensor Health", icon: Activity },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-dark-950">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-dark-900 border-r border-dark-700/50 transition-all duration-300 flex-shrink-0 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-dark-700/50">
          <div className="flex-shrink-0 w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
            <Trash2 size={16} className="text-primary-400" />
          </div>
          {!collapsed && (
            <div>
              <div className="text-sm font-bold text-dark-100">SmartWaste</div>
              <div className="text-xs text-dark-500 truncate">{APP_CONFIG.municipalityName}</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""} ${collapsed ? "justify-center px-2" : ""}`
              }
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-dark-700/50 p-3 space-y-2">
          {!collapsed && (
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="w-7 h-7 rounded-full bg-primary-500/20 flex items-center justify-center text-xs font-bold text-primary-400">
                {user?.email?.[0]?.toUpperCase() || "A"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-dark-200 truncate">Admin</div>
                <div className="text-xs text-dark-500 truncate">{user?.email}</div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`nav-item w-full text-red-400/70 hover:text-red-400 hover:bg-red-500/10 ${collapsed ? "justify-center px-2" : ""}`}
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut size={16} />
            {!collapsed && <span>Logout</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="nav-item w-full justify-center"
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-dark-900/80 backdrop-blur-sm border-b border-dark-700/50 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="live-dot" />
            <span className="text-xs text-dark-400 font-medium">Live Monitoring</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-dark-500">
            <span className="flex items-center gap-1.5">
              <Wifi size={12} className="text-primary-400" />
              Firebase Connected
            </span>
            <span>{APP_CONFIG.city}, {APP_CONFIG.state}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
