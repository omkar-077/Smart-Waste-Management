import { useEffect, useState } from "react";
import { subscribeToTasks, updateTask, logAuditEvent } from "../../services/firebaseService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { timeAgo } from "../../config/appConfig";
import { TaskStatusBadge, PriorityBadge } from "../../components/common/StatusBadges";
import { ClipboardList, Search, Eye } from "lucide-react";

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const { user } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    return subscribeToTasks(setTasks);
  }, []);

  const filtered = tasks.filter((t) => {
    const matchSearch = !search ||
      t.taskId?.toLowerCase().includes(search.toLowerCase()) ||
      t.binId?.toLowerCase().includes(search.toLowerCase()) ||
      t.employeeName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const pending = tasks.filter((t) => !["COMPLETED", "CANCELLED"].includes(t.status)).length;
  const completed = tasks.filter((t) => t.status === "COMPLETED").length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title">Tasks</h1>
          <p className="text-dark-500 text-sm">{pending} pending · {completed} completed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
          <input type="text" placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-9" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field w-auto">
          <option value="ALL">All Status</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="ARRIVED">Arrived</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Bin ID</th>
                <th>Employee</th>
                <th>Priority</th>
                <th>Ward</th>
                <th>Fill at Assignment</th>
                <th>Status</th>
                <th>Assigned</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-dark-500">
                    <ClipboardList size={32} className="mx-auto mb-2 opacity-30" />
                    No tasks found
                  </td>
                </tr>
              ) : filtered.map((task) => (
                <tr key={task.taskId}>
                  <td><span className="font-mono text-xs text-dark-300">{task.taskId}</span></td>
                  <td><span className="font-mono text-sm font-semibold text-dark-200">{task.binId}</span></td>
                  <td className="text-sm text-dark-300">{task.employeeName}</td>
                  <td><PriorityBadge priority={task.priority} /></td>
                  <td className="text-xs text-dark-400 max-w-28 truncate">{task.ward}</td>
                  <td>
                    <span className={`font-bold text-sm ${task.priority === "CRITICAL" ? "text-red-400" : "text-orange-400"}`}>
                      {task.fillPercentage?.toFixed(0)}%
                    </span>
                  </td>
                  <td><TaskStatusBadge status={task.status} /></td>
                  <td className="text-xs text-dark-500">{timeAgo(task.assignedAt)}</td>
                  <td className="text-xs text-dark-500">{task.completedAt ? timeAgo(task.completedAt) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
