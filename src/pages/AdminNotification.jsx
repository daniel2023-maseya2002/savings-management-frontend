import { motion } from "framer-motion";
import {
    Ban,
    Bell,
    CheckCircle,
    Filter,
    KeyRound,
    RefreshCcw,
    ShieldAlert,
    UserPlus,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

export default function AdminNotification() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("ALL");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/notifications/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setNotifications(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setError("Could not load notifications.");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/admin/notifications/${id}/mark_read/`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
  try {
    await api.post("/admin/notifications/mark_all_read/");
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  } catch (err) {
    console.error("Failed to mark all as read:", err);
  }
};

  const fadeIn = {
    hidden: { opacity: 0, y: 25 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const filtered = useMemo(() => {
    if (filter === "ALL") return notifications;
    return notifications.filter((n) => n.notif_type === filter);
  }, [filter, notifications]);

  const getIcon = (type, className = "w-5 h-5") => {
    switch (type) {
      case "NEW_USER":
        return <UserPlus className={`text-cyan-400 ${className}`} />;
      case "USER_APPROVAL_REQUIRED":
        return <ShieldAlert className={`text-yellow-400 ${className}`} />;
      case "USER_BLOCKED":
        return <Ban className={`text-rose-400 ${className}`} />;
      case "PASSWORD_RESET":
        return <KeyRound className={`text-indigo-400 ${className}`} />;
      default:
        return <Bell className={`text-emerald-400 ${className}`} />;
    }
  };

  const counts = useMemo(() => {
    const base = {
      NEW_USER: 0,
      USER_APPROVAL_REQUIRED: 0,
      USER_BLOCKED: 0,
      PASSWORD_RESET: 0,
    };
    for (const n of notifications) {
      if (n.notif_type in base) base[n.notif_type]++;
    }
    return base;
  }, [notifications]);

  const cards = [
    {
      label: "New Users",
      type: "NEW_USER",
      color: "from-cyan-500/40 to-cyan-800/20",
      icon: getIcon("NEW_USER", "w-6 h-6"),
      count: counts.NEW_USER,
    },
    {
      label: "Approval Requests",
      type: "USER_APPROVAL_REQUIRED",
      color: "from-yellow-500/40 to-yellow-800/20",
      icon: getIcon("USER_APPROVAL_REQUIRED", "w-6 h-6"),
      count: counts.USER_APPROVAL_REQUIRED,
    },
    {
      label: "Blocked Users",
      type: "USER_BLOCKED",
      color: "from-rose-500/40 to-rose-800/20",
      icon: getIcon("USER_BLOCKED", "w-6 h-6"),
      count: counts.USER_BLOCKED,
    },
    {
      label: "Password Resets",
      type: "PASSWORD_RESET",
      color: "from-indigo-500/40 to-indigo-800/20",
      icon: getIcon("PASSWORD_RESET", "w-6 h-6"),
      count: counts.PASSWORD_RESET,
    },
  ];

  return (
    <motion.div
      className="h-screen w-screen flex flex-col items-center justify-start bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <motion.div
        className="flex flex-wrap items-center justify-between w-full max-w-7xl p-6 lg:p-10"
        variants={fadeIn}
        initial="hidden"
        animate="show"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Admin Notifications
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Monitor user events, system alerts, and security actions.
          </p>
        </div>

        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <button
            onClick={fetchNotifications}
            className="flex items-center gap-2 bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 transition px-3 py-2 rounded-lg text-sm text-emerald-300"
          >
            <RefreshCcw className="w-4 h-4" /> Refresh
          </button>

          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 bg-cyan-600/20 border border-cyan-500/30 hover:bg-cyan-600/30 transition px-3 py-2 rounded-lg text-sm text-cyan-300"
          >
            <CheckCircle className="w-4 h-4" /> Mark All as Read
          </button>
        </div>
      </motion.div>

      {/* Cards */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl px-6"
        variants={fadeIn}
        initial="hidden"
        animate="show"
      >
        {cards.map((card) => (
          <motion.div
            key={card.label}
            whileHover={{ scale: 1.05 }}
            onClick={() => setFilter(card.type)}
            className={`cursor-pointer rounded-2xl p-6 bg-gradient-to-br ${card.color} border border-white/10 backdrop-blur-2xl shadow-lg transition ${
              filter === card.type ? "ring-2 ring-emerald-400/50" : ""
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              {card.icon}
              <h3 className="text-gray-200 font-medium text-sm">{card.label}</h3>
            </div>
            <p className="text-3xl font-semibold text-white tracking-wide">
              {card.count}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Filter + List */}
      <motion.div
        className="w-full max-w-7xl flex flex-col gap-6 mt-8 px-6 pb-10"
        variants={fadeIn}
        initial="hidden"
        animate="show"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300 text-sm">
              Filter:{" "}
              <strong className="text-emerald-400">
                {filter === "ALL" ? "All" : filter.replace(/_/g, " ")}
              </strong>
            </span>
          </div>
          {filter !== "ALL" && (
            <button
              onClick={() => setFilter("ALL")}
              className="text-sm text-cyan-300 hover:text-cyan-200 underline underline-offset-4"
            >
              Clear Filter
            </button>
          )}
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-lg p-6 flex-1 overflow-y-auto max-h-[60vh]">
          {loading && (
            <p className="text-gray-400 text-sm">Loading notifications…</p>
          )}

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="divide-y divide-gray-800/50">
              {filtered.map((n) => (
                <motion.div
                  key={n.id || crypto.randomUUID()}
                  className={`flex items-start justify-between py-4 hover:bg-white/5 transition rounded-xl px-3 ${
                    n.is_read ? "opacity-60" : ""
                  }`}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-xl bg-gray-800/50 border border-white/10">
                      {getIcon(n.notif_type)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-100">{n.title}</h4>
                      <p className="text-gray-400 text-sm">{n.message}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {n.created_at
                          ? new Date(n.created_at).toLocaleString()
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="text-xs bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 text-emerald-300 px-3 py-1 rounded-lg"
                    >
                      Mark as Read
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <p className="text-gray-500 text-center mt-12 text-sm">
              No notifications found.
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
