import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { database } from "../../config/firebase";
import { ref, onValue } from "firebase/database";
import {
  getBin,
  updateTask,
  completeCollection,
  logAuditEvent,
  subscribeToBinHistory,
} from "../../services/firebaseService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getFillColor, timeAgo, formatTimestamp } from "../../config/appConfig";
import { StatusBadge, TaskStatusBadge, PriorityBadge, SensorStatusBadge } from "../../components/common/StatusBadges";
import { FillGauge, FillBar } from "../../components/common/FillBar";
import {
  ArrowLeft, MapPin, CheckCircle, Play, Navigation, Clock,
  AlertTriangle, Battery, Trash2, ChevronRight
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";


const TASK_STEPS = [
  { status: "ASSIGNED", label: "Assigned", icon: Clock },
  { status: "ACCEPTED", label: "Accepted", icon: CheckCircle },
  { status: "IN_PROGRESS", label: "Navigating", icon: Navigation },
  { status: "ARRIVED", label: "Arrived", icon: MapPin },
  { status: "COMPLETED", label: "Completed", icon: CheckCircle },
];

function TaskProgressBar({ currentStatus }) {
  const idx = TASK_STEPS.findIndex((s) => s.status === currentStatus);
  return (
    <div className="flex items-center">
      {TASK_STEPS.map((step, i) => {
        const Icon = step.icon;
        const isActive = i === idx;
        const isDone = i < idx;
        return (
          <div key={step.status} className="flex items-center flex-1 last:flex-none">
            <div className={`flex flex-col items-center gap-1 ${isActive ? "scale-110" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isDone ? "bg-green-500 text-white" : isActive ? "bg-primary-500 text-white" : "bg-dark-700 text-dark-500"
              }`}>
                <Icon size={14} />
              </div>
              <span className={`text-[10px] font-medium ${isActive ? "text-primary-400" : isDone ? "text-green-400" : "text-dark-600"}`}>
                {step.label}
              </span>
            </div>
            {i < TASK_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < idx ? "bg-green-500" : "bg-dark-700"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function TaskDetailPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { employeeData, user } = useAuth();
  const { addToast } = useToast();
  const [task, setTask] = useState(null);
  const [bin, setBin] = useState(null);
  const [binHistory, setBinHistory] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [afterFill, setAfterFill] = useState(5);

  // Subscribe to task
  useEffect(() => {
    const r = ref(database, `smartwaste/tasks/${taskId}`);
    const unsub = onValue(r, (snap) => setTask(snap.val()));
    return () => unsub();
  }, [taskId]);

  // Load bin + history
  useEffect(() => {
    if (!task?.binId) return;
    getBin(task.binId).then(setBin);
    const unsub = subscribeToBinHistory(task.binId, 15, (data) => {
      setBinHistory(data.map((r) => ({
        time: new Date(r.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        fill: r.fillPercentage,
      })).filter((r) => r.fill != null));
    });
    return unsub;
  }, [task?.binId]);

  const advanceStatus = async (newStatus) => {
    setActionLoading(true);
    try {
      await updateTask(taskId, { status: newStatus });
      await logAuditEvent(user?.email, `TASK_${newStatus}`, task.binId, { taskId });
      addToast(`Task status: ${newStatus}`, "success");
    } catch (err) {
      addToast("Error: " + err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteCollection = async () => {
    setActionLoading(true);
    try {
      await completeCollection({
        taskId,
        alertId: task.alertId,
        binId: task.binId,
        employeeId: employeeData.employeeId,
        employeeName: employeeData.name,
        beforeFill: bin?.fillPercentage || task.fillPercentage,
        afterFill: Number(afterFill),
      });
      addToast("Collection completed! Bin reset to " + afterFill + "%", "success");
      navigate("/employee/tasks");
    } catch (err) {
      addToast("Collection failed: " + err.message, "error");
    } finally {
      setActionLoading(false);
      setShowCompleteModal(false);
    }
  };

  if (!task) return (
    <div className="p-4 text-center text-dark-500 mt-20">Loading task...</div>
  );

  const currentBinFill = bin?.fillPercentage || task.fillPercentage;

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      {/* Back button */}
      <button onClick={() => navigate("/employee/tasks")} className="flex items-center gap-1 text-dark-400 hover:text-dark-200 text-sm">
        <ArrowLeft size={16} /> Back to Tasks
      </button>

      {/* Task header */}
      <div className="glass-card p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="font-mono text-xs text-dark-500">{task.taskId}</div>
            <div className="flex items-center gap-2 mt-1">
              <PriorityBadge priority={task.priority} />
              <TaskStatusBadge status={task.status} />
            </div>
          </div>
          <FillGauge percentage={currentBinFill} size={64} />
        </div>
        <div className="font-bold text-2xl font-mono text-dark-100">{task.binId}</div>
        <div className="text-sm text-dark-400 mt-0.5">{task.ward}</div>

        <div className="mt-4">
          <TaskProgressBar currentStatus={task.status} />
        </div>
      </div>

      {/* Bin details */}
      {bin && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-dark-300 mb-3">Bin Information</h3>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <DetailItem label="Bin Type" value={bin.binType} />
            <DetailItem label="Capacity" value={`${bin.capacity}L`} />
            <DetailItem label="Sensor" value={<SensorStatusBadge status={bin.sensorStatus} />} />
            <DetailItem label="Battery" value={`${bin.battery?.toFixed(0)}%`} />
            <DetailItem label="Fill Level" value={<span className="font-bold" style={{ color: getFillColor(currentBinFill) }}>{currentBinFill?.toFixed(1)}%</span>} />
            <DetailItem label="Distance" value={`${bin.distanceCm} cm`} />
            <DetailItem label="GPS" value={`${bin.latitude?.toFixed(4)}, ${bin.longitude?.toFixed(4)}`} />
            <DetailItem label="Last Updated" value={timeAgo(bin.lastUpdated)} />
          </div>

          {/* Navigate button */}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${bin.latitude},${bin.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary w-full justify-center mt-4"
          >
            <Navigation size={14} /> Navigate to Bin
          </a>
        </div>
      )}

      {/* Fill history */}
      {binHistory.length > 1 && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-dark-300 mb-3">Fill Level History</h3>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={binHistory}>
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#64748b" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#64748b" }} width={25} />
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", fontSize: "11px" }} />
              <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="fill" stroke={getFillColor(currentBinFill)} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Action buttons */}
      {task.status !== "COMPLETED" && task.status !== "CANCELLED" && (
        <div className="glass-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-dark-300">Actions</h3>
          <div className="space-y-2">
            {task.status === "ASSIGNED" && (
              <button onClick={() => advanceStatus("ACCEPTED")} disabled={actionLoading} className="btn-primary w-full justify-center">
                <CheckCircle size={16} /> Accept Task
              </button>
            )}
            {task.status === "ACCEPTED" && (
              <button onClick={() => advanceStatus("IN_PROGRESS")} disabled={actionLoading} className="btn-primary w-full justify-center">
                <Navigation size={16} /> Start Navigation
              </button>
            )}
            {task.status === "IN_PROGRESS" && (
              <button onClick={() => advanceStatus("ARRIVED")} disabled={actionLoading} className="btn-primary w-full justify-center">
                <MapPin size={16} /> Mark Arrived
              </button>
            )}
            {task.status === "ARRIVED" && (
              <button
                onClick={() => setShowCompleteModal(true)}
                disabled={actionLoading}
                className="btn-primary w-full justify-center bg-green-600 hover:bg-green-500"
              >
                <Trash2 size={16} /> Complete Collection
              </button>
            )}
          </div>
        </div>
      )}

      {task.status === "COMPLETED" && (
        <div className="glass-card p-4 bg-green-500/5 border-green-500/20 text-center">
          <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
          <div className="text-green-300 font-semibold">Collection Completed!</div>
          <div className="text-dark-500 text-sm mt-1">
            {task.beforeFill?.toFixed(0)}% → {task.afterFill?.toFixed(0)}%
          </div>
        </div>
      )}

      {/* Complete Collection Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-dark-900 border border-dark-700/50 rounded-t-2xl w-full max-w-lg p-6 animate-slide-in">
            <h3 className="text-lg font-bold text-dark-100 mb-1">Complete Collection</h3>
            <p className="text-dark-400 text-sm mb-4">Confirm collection and enter the post-collection fill level.</p>

            <div className="flex items-center gap-4 p-3 bg-dark-800/50 rounded-xl mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">{currentBinFill?.toFixed(0)}%</div>
                <div className="text-xs text-dark-500">Before</div>
              </div>
              <div className="flex-1 text-center text-dark-600">→</div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{afterFill}%</div>
                <div className="text-xs text-dark-500">After</div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs text-dark-400 mb-1">After-collection fill level (%)</label>
              <input
                type="number"
                min="0"
                max="20"
                value={afterFill}
                onChange={(e) => setAfterFill(Math.max(0, Math.min(20, +e.target.value)))}
                className="input-field"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowCompleteModal(false)} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
              <button
                onClick={handleCompleteCollection}
                disabled={actionLoading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-all"
              >
                <CheckCircle size={16} />
                {actionLoading ? "Saving..." : "Confirm Complete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <>
      <span className="text-dark-500 text-xs">{label}</span>
      <span className="text-dark-200 text-xs font-medium">{value}</span>
    </>
  );
}
