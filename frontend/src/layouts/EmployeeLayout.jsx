import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { subscribeToNotifications } from "../services/firebaseService";
import { useEffect, useState } from "react";
import {
  Home, ClipboardList, Map, History, Bell, User, LogOut, Trash2
} from "lucide-react";

const navItems = [
  { to: "/employee", label: "Home", icon: Home, end: true },
  { to: "/employee/tasks", label: "My Tasks", icon: ClipboardList },
  { to: "/employee/map", label: "Map", icon: Map },
  { to: "/employee/history", label: "History", icon: History },
  { to: "/employee/notifications", label: "Notifications", icon: Bell },
  { to: "/employee/profile", label: "Profile", icon: User },
];

export default function EmployeeLayout() {
  const { user, employeeData, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!employeeData?.employeeId) return;
    const unsub = subscribeToNotifications(employeeData.employeeId, (notifs) => {
      setUnreadCount(notifs.filter((n) => !n.read).length);
    });
    return unsub;
  }, [employeeData?.employeeId]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex flex-col h-screen bg-dark-950">
      {/* Top header */}
      <header className="bg-dark-900 border-b border-dark-700/50 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary-500/20 rounded-lg flex items-center justify-center">
            <Trash2 size={14} className="text-primary-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-dark-100">SmartWaste</div>
            <div className="text-xs text-dark-500">Employee App</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium text-dark-200">{employeeData?.name || "Employee"}</div>
            <div className="text-xs text-dark-500">{employeeData?.ward}</div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="bg-dark-900 border-t border-dark-700/50 flex-shrink-0">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                  isActive
                    ? "text-primary-400"
                    : "text-dark-500 hover:text-dark-300"
                }`
              }
            >
              <div className="relative">
                <Icon size={20} />
                {label === "Notifications" && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
