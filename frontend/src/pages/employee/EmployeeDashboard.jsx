import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { subscribeToEmployeeTasks, subscribeToNotifications, subscribeToBins } from "../../services/firebaseService";
import { useAuth } from "../../context/AuthContext";
import { timeAgo, getFillStatus } from "../../config/appConfig";
import { StatusBadge, TaskStatusBadge, PriorityBadge } from "../../components/common/StatusBadges";
import { FillGauge } from "../../components/common/FillBar";
import { ClipboardList, Bell, CheckCircle, AlertTriangle, ChevronRight } from "lucide-react";

export default function EmployeeDashboard() {
  const { employeeData } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [bins, setBins] = useState({});

  useEffect(() => {
    if (!employeeData?.employeeId) return;
    const u1 = subscribeToEmployeeTasks(employeeData.employeeId, setTasks);
    const u2 = subscribeToNotifications(employeeData.employeeId, setNotifications);
    const u3 = subscribeToBins(setBins);
    return () => { u1(); u2(); u3(); };
  }, [employeeData?.employeeId]);

  const pending = tasks.filter((t) => !["COMPLETED", "CANCELLED"].includes(t.status));
  const completed = tasks.filter((t) => t.status === "COMPLETED");
  const todayCompleted = completed.filter((t) => new Date(t.completedAt || 0).toDateString() === new Date().toDateString());
  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const currentTask = pending.find((t) => t.status === "IN_PROGRESS" || t.status === "ARRIVED") || pending[0];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-4 space-y-5 animate-fade-in">
      {/* Greeting */}
      <div className="pt-2">
        <h1 className="text-xl font-bold text-dark-100">{greeting}, {employeeData?.name?.split(" ")[0]}! 👋</h1>
        <p className="text-dark-500 text-sm mt-0.5">{employeeData?.ward}</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Assigned", value: tasks.length, color: "text-blue-400" },
          { label: "Pending", value: pending.length, color: "text-amber-400" },
          { label: "Today", value: todayCompleted.length, color: "text-green-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card p-4 text-center">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-dark-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Notifications */}
      {unreadNotifs > 0 && (
        <button
          onClick={() => navigate("/employee/notifications")}
          className="w-full glass-card p-4 flex items-center gap-3 bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10 transition-colors"
        >
          <div className="relative">
            <Bell size={20} className="text-blue-400" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
              {unreadNotifs}
            </span>
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-blue-300">
              {unreadNotifs} new notification{unreadNotifs !== 1 ? "s" : ""}
            </div>
          </div>
          <ChevronRight size={16} className="text-dark-500" />
        </button>
      )}

      {/* Current Task */}
      {currentTask && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-dark-400 uppercase tracking-wide">Current Task</span>
            <PriorityBadge priority={currentTask.priority} />
          </div>
          <div className="flex items-center gap-4">
            <FillGauge percentage={bins[currentTask.binId]?.fillPercentage || currentTask.fillPercentage} size={64} />
            <div className="flex-1">
              <div className="font-bold text-dark-100 font-mono text-lg">{currentTask.binId}</div>
              <div className="text-sm text-dark-400">{currentTask.ward}</div>
              <div className="flex items-center gap-2 mt-1">
                <TaskStatusBadge status={currentTask.status} />
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate(`/employee/tasks/${currentTask.taskId}`)}
            className="btn-primary w-full justify-center mt-4"
          >
            View Task Details
          </button>
        </div>
      )}

      {/* Pending tasks */}
      {pending.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-dark-200">
              <AlertTriangle size={14} className="inline mr-1 text-amber-400" />
              Pending Tasks ({pending.length})
            </h2>
            <button onClick={() => navigate("/employee/tasks")} className="text-xs text-primary-400">View all</button>
          </div>
          <div className="space-y-2">
            {pending.slice(0, 3).map((task) => (
              <div
                key={task.taskId}
                onClick={() => navigate(`/employee/tasks/${task.taskId}`)}
                className="glass-card p-4 flex items-center gap-3 cursor-pointer hover:border-dark-600 transition-all"
              >
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${task.priority === "CRITICAL" ? "bg-red-400" : "bg-orange-400"}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm font-semibold text-dark-200">{task.binId}</div>
                  <div className="text-xs text-dark-500 truncate">{task.ward}</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${task.priority === "CRITICAL" ? "text-red-400" : "text-orange-400"}`}>
                    {task.fillPercentage?.toFixed(0)}%
                  </div>
                  <div className="text-xs text-dark-600">{timeAgo(task.assignedAt)}</div>
                </div>
                <ChevronRight size={16} className="text-dark-600" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {pending.length === 0 && (
        <div className="glass-card p-8 text-center">
          <CheckCircle size={40} className="mx-auto mb-3 text-green-400 opacity-60" />
          <div className="text-dark-300 font-medium">All caught up!</div>
          <div className="text-dark-600 text-sm mt-1">No pending tasks at the moment</div>
        </div>
      )}
    </div>
  );
}
