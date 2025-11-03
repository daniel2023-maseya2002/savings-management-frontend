import { AnimatePresence, motion } from "framer-motion";
import { Bell, LogOut, Menu } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function TopNav() {
  const { user, logout, loading } = useContext(AuthContext);
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  // 🧠 Load notifications only when AuthContext finished & user is available
  useEffect(() => {
    if (!loading && user) loadNotifications();
    const iv = user ? setInterval(loadNotifications, 30000) : null;
    return () => iv && clearInterval(iv);
  }, [user, loading]);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const res = await axios.get("/notifications/");
      const list = res.data.results ?? res.data;
      setNotifications(list.slice(0, 6));
      setUnread(list.filter((n) => !n.read).length);
    } catch (err) {
      console.error("Error loading notifications:", err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.post(`/notifications/${id}/mark-read/`);
      loadNotifications();
    } catch {
      console.warn("Could not mark as read");
    }
  };

  const NavLink = ({ to, label }) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
          active
            ? "text-emerald-400 bg-emerald-900/20"
            : "text-gray-300 hover:text-emerald-400 hover:bg-gray-800/40"
        }`}
        onClick={() => setMenuOpen(false)}
      >
        {label}
      </Link>
    );
  };

  // 🕐 Prevent reload loop while AuthContext restores session
  if (loading) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-[#0f172a] h-14 flex items-center justify-center text-gray-400 text-sm">
        Loading...
      </div>
    );
  }

  if (!user) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-[#0f172a]/90 backdrop-blur-xl border-b border-gray-800 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* 🪙 Logo */}
        <Link
          to={user.is_staff ? "/admin" : "/dashboard"}
          className="text-lg font-semibold text-emerald-400 hover:text-emerald-300 transition"
        >
          Credit<span className="text-white">Jambo</span>
        </Link>

        {/* 🌐 Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-2">
          {!user.is_staff ? (
            <>
              <NavLink to="/dashboard" label="Dashboard" />
              <NavLink to="/transactions" label="Transactions" />
              <NavLink to="/deposit" label="Deposit" />
              <NavLink to="/withdraw" label="Withdraw" />
            </>
          ) : (
            <>
              <NavLink to="/admin" label="admin" />
              <NavLink to="/admin/users" label="Users" />
              <NavLink to="/admin/devices" label="Devices" />
              <NavLink to="/admin/analytics" label="Analytics" />
              <NavLink to="/admin/logins" label="Logins" />
            </>
          )}
        </div>

        {/* 🔔 Notifications + Profile */}
        <div className="flex items-center gap-3 relative">
          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-full hover:bg-gray-800 transition-colors duration-200"
            >
              <Bell className="w-5 h-5 text-gray-300" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-emerald-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {unread}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-80 bg-gray-900 text-gray-100 shadow-2xl rounded-xl overflow-hidden border border-gray-800"
                >
                  <div className="bg-gray-800/70 border-b border-gray-700 px-4 py-2 font-semibold">
                    Notifications
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No notifications yet 🎉
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-800">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 transition ${
                            n.read
                              ? "hover:bg-gray-800/40"
                              : "bg-emerald-950/40 hover:bg-emerald-900/60"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <p className="font-medium text-emerald-300">
                              {n.title}
                            </p>
                            <span className="text-xs text-gray-500">
                              {new Date(n.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mt-1">
                            {n.body}
                          </p>
                          {!n.read && (
                            <button
                              onClick={() => markAsRead(n.id)}
                              className="text-xs text-emerald-400 font-semibold mt-2 hover:text-emerald-300"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <Link
                    to={user.is_staff ? "/admin/notifications" : "/notifications"}
                    onClick={() => setNotifOpen(false)}
                    className="block text-center py-2 text-sm text-emerald-400 hover:text-emerald-300 border-t border-gray-800 transition"
                  >
                    View all →
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Username + Logout */}
          <div className="hidden md:flex items-center gap-3">
            <span className="text-sm text-gray-300">
              {user.username}{" "}
              {user.is_staff && (
                <span className="text-emerald-400 text-xs font-semibold">
                  (admin)
                </span>
              )}
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>

          {/* 📱 Mobile Menu Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-gray-300 hover:text-emerald-400"
          >
            <Menu size={20} />
          </button>

          {/* 📱 Mobile Dropdown */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-14 right-0 w-48 bg-gray-900 text-gray-200 shadow-xl rounded-lg border border-gray-800 overflow-hidden"
              >
                <div className="flex flex-col p-2">
                  {!user.is_staff ? (
                    <>
                      <NavLink to="/dashboard" label="Dashboard" />
                      <NavLink to="/transactions" label="Transactions" />
                      <NavLink to="/deposit" label="Deposit" />
                      <NavLink to="/withdraw" label="Withdraw" />
                    </>
                  ) : (
                    <>
                      <NavLink to="/admin" label="admin" />
                      <NavLink to="/admin/users" label="Users" />
                      <NavLink to="/admin/devices" label="Devices" />
                      <NavLink to="/admin/analytics" label="Analytics" />
                    </>
                  )}
                  <button
                    onClick={logout}
                    className="mt-2 flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-1.5 rounded-md transition"
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
}
