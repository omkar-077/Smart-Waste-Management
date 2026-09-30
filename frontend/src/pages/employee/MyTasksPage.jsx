import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { subscribeToEmployeeTasks } from "../../services/firebaseService";
import { useAuth } from "../../context/AuthContext";
import { timeAgo } from "../../config/appConfig";
import { TaskStatusBadge, PriorityBadge } from "../../components/common/StatusBadges";
import { FillGauge } from "../../components/common/FillBar";
import { ClipboardList, ChevronRight, Filter } from "lucide-react";

export default function MyTasksPage() {
  const { employeeData } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("ACTIVE");

  useEffect(() => {
    if (!employeeData?.employeeId) return;
    return subscribeToEmployeeTasks(employeeData.employeeId, setTasks);
  }, [employeeData?.employeeId]);

  const activeTasks = tasks.filter((t) => !["COMPLETED", "CANCELLED"].includes(t.status));
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED");
  const displayed = filter === "ACTIVE" ? activeTasks : completedTasks;

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <h1 className="text-xl font-bold text-dark-100 pt-2">My Tasks</h1>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key: "ACTIVE", label: `Active (${activeTasks.length})` },
          { key: "COMPLETED", label: `Completed (${completedTasks.length})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
              filter === key
                ? "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                : "text-dark-500 hover:text-dark-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {displayed.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <ClipboardList size={36} className="mx-auto mb-3 text-dark-600" />
            <div className="text-dark-400 text-sm">{filter === "ACTIVE" ? "No active tasks" : "No completed tasks"}</div>
          </div>
        ) : displayed.map((task) => (
          <div
            key={task.taskId}
            onClick={() => navigate(`/employee/tasks/${task.taskId}`)}
            className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:border-dark-600 active:scale-[0.99] transition-all"
          >
            <FillGauge percentage={task.fillPercentage} size={52} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-mono font-bold text-dark-100">{task.binId}</span>
                <PriorityBadge priority={task.priority} />
              </div>
              <div className="text-xs text-dark-400 truncate">{task.ward}</div>
              <div className="flex items-center gap-2 mt-1">
                <TaskStatusBadge status={task.status} />
                <span className="text-xs text-dark-600">{timeAgo(task.assignedAt)}</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-dark-600 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
