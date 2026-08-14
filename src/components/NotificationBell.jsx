import { useEffect, useRef, useState } from "react";
import { Bell, BellRing, Check, CheckCheck, X } from "lucide-react";
import api from "../services/api";
import { pushSupported, isSubscribed, subscribeToPush } from "../services/push";

const TYPE_STYLES = {
  NEW_REGISTRATION:      { dot: "bg-blue-500",    badge: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" },
  SUBSCRIPTION:          { dot: "bg-emerald-500",  badge: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" },
  SUBSCRIPTION_CANCELLED:{ dot: "bg-rose-500",     badge: "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300" },
  EXPIRY_WARNING:        { dot: "bg-amber-500",    badge: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" },
};

const dotFor  = (type) => (TYPE_STYLES[type] ?? TYPE_STYLES.NEW_REGISTRATION).dot;

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell({ align = "right" }) {
  const [open, setOpen]                 = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]             = useState(0);
  const [loading, setLoading]           = useState(false);
  const [pushEnabled, setPushEnabled]   = useState(isSubscribed());
  const [enablingPush, setEnablingPush] = useState(false);
  const dropdownRef                     = useRef(null);

  const canOfferPush = pushSupported() && !pushEnabled && Notification.permission !== "denied";

  const handleEnablePush = async () => {
    try {
      setEnablingPush(true);
      await subscribeToPush();
      setPushEnabled(true);
    } catch (err) {
      console.warn("Push subscribe failed:", err.message);
    } finally {
      setEnablingPush(false);
    }
  };

  // Fetch unread count — poll every 30s
  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    return () => clearInterval(id);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchCount = async () => {
    try {
      const res = await api.get("/api/notifications/unread-count");
      setUnread(res.data.count ?? 0);
    } catch { /* silent */ }
  };

  const fetchAll = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/notifications");
      setNotifications(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleOpen = () => {
    setOpen(o => {
      if (!o) fetchAll();
      return !o;
    });
  };

  const markOne = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnread(prev => {
        const next = Math.max(0, prev - 1);
        if (next === 0) navigator.clearAppBadge?.();
        return next;
      });
    } catch { /* silent */ }
  };

  const markAll = async () => {
    try {
      await api.post("/api/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnread(0);
      navigator.clearAppBadge?.();
    } catch { /* silent */ }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition"
        title="Notifications"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold leading-none">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className={`absolute mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden ${align === "left" ? "left-0" : "right-0"}`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-slate-500 dark:text-slate-400" />
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</span>
              {unread > 0 && (
                <span className="px-1.5 py-0.5 text-xs font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-full">
                  {unread} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={markAll}
                  className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                >
                  <CheckCheck size={13} />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Enable push notifications prompt */}
          {canOfferPush && (
            <button
              onClick={handleEnablePush}
              disabled={enablingPush}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 border-b border-slate-100 dark:border-slate-700 bg-indigo-50/60 dark:bg-indigo-900/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition text-left disabled:opacity-60"
            >
              <BellRing size={15} className="text-indigo-500 flex-shrink-0" />
              <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300 flex-1">
                {enablingPush ? "Enabling…" : "Enable notifications for new transactions"}
              </span>
            </button>
          )}

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-700/50">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3">
                  <Bell size={18} className="text-slate-400" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => !n.read && markOne(n.id)}
                  className={`flex items-start gap-3 px-4 py-3 transition cursor-pointer ${
                    n.read
                      ? "opacity-60 hover:opacity-80 hover:bg-slate-50 dark:hover:bg-slate-700/30"
                      : "bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  }`}
                >
                  {/* Dot */}
                  <div className="mt-1.5 flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${n.read ? "bg-slate-300 dark:bg-slate-600" : dotFor(n.type)}`} />
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-snug ${n.read ? "text-slate-500 dark:text-slate-400" : "text-slate-900 dark:text-white"}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {n.message}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {/* Mark read icon */}
                  {!n.read && (
                    <div className="mt-1 flex-shrink-0">
                      <Check size={14} className="text-blue-400" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-700 text-center">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Showing last {notifications.length} notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
