import { useEffect, useState } from "react";
import { ref, update, onValue } from "firebase/database";
import { subscribeToNotifications } from "../../services/firebaseService";
import { useAuth } from "../../context/AuthContext";
import { database } from "../../config/firebase";
import { timeAgo } from "../../config/appConfig";
import { Bell, CheckCheck, Trash2 } from "lucide-react";

export default function NotificationsPage() {
  const { employeeData } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [notifKeys, setNotifKeys] = useState({});

  useEffect(() => {
    if (!employeeData?.employeeId) return;
    const r = ref(database, `smartwaste/notifications/${employeeData.employeeId}`);
    const unsub = onValue(r, (snap) => {
      const data = snap.val() || {};
      const keys = {};
      const arr = Object.entries(data).map(([key, val]) => {
        keys[key] = val;
        return { _key: key, ...val };
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(arr);
      setNotifKeys(keys);
    });
    return () => unsub();
  }, [employeeData?.employeeId]);

  const markRead = async (key) => {
    await update(ref(database, `smartwaste/notifications/${employeeData.employeeId}/${key}`), { read: true });
  };

  const markAllRead = async () => {
    const updates = {};
    notifications.filter((n) => !n.read).forEach((n) => {
      updates[`smartwaste/notifications/${employeeData.employeeId}/${n._key}/read`] = true;
    });
    if (Object.keys(updates).length) await update(ref(database), updates);
  };

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-dark-100">Notifications</h1>
        {unread > 0 && (
          <button onClick={markAllRead} className="text-xs text-primary-400 flex items-center gap-1">
            <CheckCheck size={12} /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="glass-card p-10 text-center mt-8">
          <Bell size={36} className="mx-auto mb-3 text-dark-600" />
          <div className="text-dark-400 text-sm">No notifications</div>
        </div>
      ) : notifications.map((notif) => (
        <div
          key={notif._key}
          onClick={() => !notif.read && markRead(notif._key)}
          className={`glass-card p-4 cursor-pointer transition-all ${
            !notif.read ? "border-blue-500/30 bg-blue-500/5" : ""
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${!notif.read ? "bg-blue-400" : "bg-dark-700"}`} />
            <div className="flex-1">
              <div className={`text-sm font-semibold ${!notif.read ? "text-dark-100" : "text-dark-300"}`}>
                {notif.title}
              </div>
              <div className="text-xs text-dark-400 mt-0.5 leading-relaxed">{notif.message}</div>
              <div className="flex items-center gap-3 mt-2">
                {notif.priority && (
                  <span className={`text-xs font-semibold ${notif.priority === "CRITICAL" ? "text-red-400" : "text-orange-400"}`}>
                    {notif.priority}
                  </span>
                )}
                <span className="text-xs text-dark-600">{timeAgo(notif.createdAt)}</span>
                {notif.assignedBy && (
                  <span className="text-xs text-dark-600">by {notif.assignedBy}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
