import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import AdminLayout from "./layouts/AdminLayout";
import EmployeeLayout from "./layouts/EmployeeLayout";
import LoginPage from "./pages/LoginPage";
import LoadingScreen from "./components/common/LoadingScreen";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import LiveMap from "./pages/admin/LiveMap";
import BinsPage from "./pages/admin/BinsPage";
import AlertsPage from "./pages/admin/AlertsPage";
import EmployeesPage from "./pages/admin/EmployeesPage";
import TasksPage from "./pages/admin/TasksPage";
import CollectionsPage from "./pages/admin/CollectionsPage";
import AnalyticsPage from "./pages/admin/AnalyticsPage";
import SensorHealthPage from "./pages/admin/SensorHealthPage";
import SettingsPage from "./pages/admin/SettingsPage";

// Employee Pages
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import MyTasksPage from "./pages/employee/MyTasksPage";
import TaskDetailPage from "./pages/employee/TaskDetailPage";
import EmployeeMapPage from "./pages/employee/EmployeeMapPage";
import CollectionHistoryPage from "./pages/employee/CollectionHistoryPage";
import NotificationsPage from "./pages/employee/NotificationsPage";
import ProfilePage from "./pages/employee/ProfilePage";

function ProtectedRoute({ children, requiredRole }) {
  const { user, userRole, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to={userRole === "ADMIN" ? "/admin" : "/employee"} replace />;
  }
  return children;
}

function RootRedirect() {
  const { user, userRole, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={userRole === "ADMIN" ? "/admin" : "/employee"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="map" element={<LiveMap />} />
              <Route path="bins" element={<BinsPage />} />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="employees" element={<EmployeesPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="collections" element={<CollectionsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="sensor-health" element={<SensorHealthPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Employee Routes */}
            <Route
              path="/employee"
              element={
                <ProtectedRoute requiredRole="EMPLOYEE">
                  <EmployeeLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<EmployeeDashboard />} />
              <Route path="tasks" element={<MyTasksPage />} />
              <Route path="tasks/:taskId" element={<TaskDetailPage />} />
              <Route path="map" element={<EmployeeMapPage />} />
              <Route path="history" element={<CollectionHistoryPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
