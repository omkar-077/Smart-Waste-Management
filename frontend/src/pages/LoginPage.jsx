import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Trash2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { APP_CONFIG } from "../config/appConfig";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@smartwaste.demo");
  const [password, setPassword] = useState("SmartWaste@2024");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");
  const { user, userRole, login, error: authError } = useAuth();
  const navigate = useNavigate();

  // Auto redirect if already signed in
  useEffect(() => {
    if (user && userRole) {
      navigate(userRole === "ADMIN" ? "/admin" : "/employee", { replace: true });
    }
  }, [user, userRole, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    if (!email || !password) {
      setLocalError("Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await login(email, password);
      const targetRole = res?.userRole || (email.toLowerCase().includes("employee") ? "EMPLOYEE" : "ADMIN");
      navigate(targetRole === "ADMIN" ? "/admin" : "/employee");
    } catch (err) {
      setLocalError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role) => {
    setLocalError("");
    const targetEmail = role === "admin" ? "admin@smartwaste.demo" : "employee@smartwaste.demo";
    const targetPass = "SmartWaste@2024";
    setEmail(targetEmail);
    setPassword(targetPass);
    setLoading(true);
    try {
      const res = await login(targetEmail, targetPass);
      const targetRole = res?.userRole || (role === "admin" ? "ADMIN" : "EMPLOYEE");
      navigate(targetRole === "ADMIN" ? "/admin" : "/employee");
    } catch (err) {
      setLocalError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500/20 rounded-2xl mb-4 border border-primary-500/30">
            <Trash2 size={28} className="text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-dark-100">SmartWaste</h1>
          <p className="text-dark-400 text-sm mt-1">{APP_CONFIG.municipalityName}</p>
          <p className="text-dark-600 text-xs mt-1">{APP_CONFIG.city}, {APP_CONFIG.state}</p>
        </div>

        {/* Database status pill */}
        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Firebase RTDB Connected: <strong>smartwaste-6ebf0</strong></span>
          </div>
          <span className="text-[11px] text-emerald-300/70 font-mono">Backend: :5000</span>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <h2 className="text-lg font-semibold text-dark-100 mb-1">Sign In</h2>
          <p className="text-dark-500 text-sm mb-6">IoT Waste Management Platform</p>

          {/* Quick 1-click Demo Login */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin("admin")}
              className="flex-1 py-2.5 text-xs font-semibold bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              ⚡ Demo Admin
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin("employee")}
              className="flex-1 py-2.5 text-xs font-semibold bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 border border-purple-500/30 rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              ⚡ Demo Employee
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-dark-400 mb-1.5">Email Address</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@smartwaste.demo"
                className="input-field"
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-dark-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="input-field pr-10"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {displayError && (
              <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-lg flex items-center gap-2 text-red-400 text-xs">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{displayError}</span>
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 justify-center mt-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing In...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Helper demo credentials note */}
          <div className="mt-6 pt-5 border-t border-dark-800 text-center text-xs text-dark-500">
            <div>Demo credentials: <span className="text-dark-300 font-mono">admin@smartwaste.demo</span></div>
            <div className="mt-0.5">Password: <span className="text-dark-300 font-mono">SmartWaste@2024</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
