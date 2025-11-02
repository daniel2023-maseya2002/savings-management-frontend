import React, { useState, useEffect, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axios from "../api/axios";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Bell, LogOut } from "lucide-react";

export default function TopNav() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  // Load notifications
  const loadNotifications = async () => {
    try {
      const res = await axios.get("/notifications/");
      const list = res.data.results ?? res.data;
      setNotifications(list.slice(0, 6));
      setUnread(list.filter((n) => !n.read).length);
    } catch (err) {
      console.error("Error loading notifications:", err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const iv = setInterval(loadNotifications, 30000);
    return () => clearInterval(iv);
  }, []);

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
        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
          active
            ? "text-emerald-500 font-semibold"
            : "text-gray-300 hover:text-emerald-400"
        }`}
        onClick={() => setMenuOpen(false)}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-[#0f172a]/95 backdrop-blur-md border-b border-gray-800 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* --- Brand --- */}
        <Link to="/" className="text-lg font-semibold text-emerald-400">
          Credit<span className="text-white">Jambo</span>
        </Link>

        {/* --- Desktop Links --- */}
        <div className="hidden md:flex items-center space-x-2">
          {/* 🧭 USER MENU (non-admin) */}
          {!user?.is_staff && (
            <>
              <NavLink to="/" label="Dashboard" />
              <NavLink to="/transactions" label="Transactions" />
              <NavLink to="/deposit" label="Deposit" />
              <NavLink to="/withdraw" label="Withdraw" />
            </>
          )}

          {/* 🧭 ADMIN MENU */}
          {user?.is_staff && (
            <>
              <NavLink to="/admin" label="Dashboard" />
              <NavLink to="/admin/users" label="Users" />
              <NavLink to="/admin/devices" label="Devices" />
              <NavLink to="/admin/analytics" label="Analytics" />
              <NavLink to="/admin/logins" label="Logins" />
            </>
          )}
        </div>

        {/* --- Right side actions --- */}
        <div className="flex items-center gap-3 relative">
          {/* 🔔 Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-full hover:bg-gray-800 transition"
            >
              <Bell className="w-5 h-5 text-gray-300" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-emerald-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {unread}
                </span>
              )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-80 bg-white shadow-xl rounded-xl overflow-hidden z-50"
                >
                  <div className="bg-gray-50 border-b px-4 py-2 font-semibold text-gray-700">
                    Notifications
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No notifications yet 🎉
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 border-b hover:bg-gray-50 transition ${
                            n.read ? "bg-white" : "bg-emerald-50"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <p className="font-medium text-gray-800">
                              {n.title}
                            </p>
                            <span className="text-xs text-gray-400">
                              {new Date(n.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{n.body}</p>
                          {!n.read && (
                            <button
                              onClick={() => markAsRead(n.id)}
                              className="text-xs text-emerald-600 font-semibold mt-2 hover:text-emerald-700"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="px-4 py-2 bg-gray-50 text-center text-sm">
                    <Link
                      to="/notifications"
                      onClick={() => setNotifOpen(false)}
                      className="text-emerald-600 hover:underline font-medium"
                    >
                      View all →
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 👤 User Info */}
          {user && (
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
                className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-1.5 rounded-md transition"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          )}

          {/* --- Mobile Menu Button --- */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-800 text-gray-300"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* --- Mobile Menu Drawer --- */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="md:hidden bg-[#0f172a] border-t border-gray-800"
          >
            <div className="px-4 py-4 flex flex-col space-y-2">
              {/* USER MENU */}
              {!user?.is_staff && (
                <>
                  <NavLink to="/" label="Dashboard" />
                  <NavLink to="/transactions" label="Transactions" />
                  <NavLink to="/deposit" label="Deposit" />
                  <NavLink to="/withdraw" label="Withdraw" />
                </>
              )}

              {/* ADMIN MENU */}
              {user?.is_staff && (
                <>
                  <NavLink to="/admin" label="Dashboard" />
                  <NavLink to="/admin/users" label="Users" />
                  <NavLink to="/admin/devices" label="Devices" />
                  <NavLink to="/admin/analytics" label="Analytics" />
                  <NavLink to="/admin/logins" label="Logins" />
                </>
              )}

              {user && (
                <button
                  onClick={logout}
                  className="mt-3 bg-red-600 text-white py-2 rounded-md text-sm font-medium hover:bg-red-700"
                >
                  Logout
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
