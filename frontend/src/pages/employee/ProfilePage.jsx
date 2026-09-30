import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { User, MapPin, Phone, Shield, LogOut } from "lucide-react";

export default function ProfilePage() {
  const { employeeData, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <h1 className="text-xl font-bold text-dark-100 pt-2">Profile</h1>

      {/* Avatar */}
      <div className="glass-card p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-primary-500/20 flex items-center justify-center text-3xl font-bold text-primary-400 mx-auto mb-4">
          {employeeData?.name?.[0] || "E"}
        </div>
        <div className="text-xl font-bold text-dark-100">{employeeData?.name}</div>
        <div className="text-sm text-dark-400 mt-0.5">{employeeData?.employeeId}</div>
        <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-medium bg-primary-500/10 text-primary-400 border border-primary-500/25">
          <Shield size={11} /> Field Employee
        </div>
      </div>

      {/* Details */}
      <div className="glass-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-dark-300">Account Details</h3>
        {[
          { icon: User, label: "Email", value: user?.email },
          { icon: MapPin, label: "Ward", value: employeeData?.ward },
          { icon: Phone, label: "Phone", value: employeeData?.phone },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 py-2 border-b border-dark-800/50 last:border-0">
            <Icon size={16} className="text-dark-500 flex-shrink-0" />
            <div>
              <div className="text-xs text-dark-500">{label}</div>
              <div className="text-sm text-dark-200">{value || "—"}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-4 bg-amber-500/5 border-amber-500/20">
        <p className="text-xs text-amber-300">
          This is a demo account. Contact your municipal administrator to update your profile information.
        </p>
      </div>

      <button onClick={handleLogout} className="btn-danger w-full justify-center">
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  );
}
