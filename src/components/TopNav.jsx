// Local file path: src/components/TopNav.jsx
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  Bell,
  Bot,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  MessageSquare,
  Monitor,
  Send,
  ShieldCheck,
  Users
} from "lucide-react";
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const res = await axios.get("/notifications/");
      const list = res.data.results ?? res.data;
      setNotifications(list.slice(0, 6));
      setUnread(list.filter((n) => !n.read).length);
    } catch (err) {
      // keep quiet on 401 during initial load (handled by axios interceptor)
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

  const NavLink = ({ to, label, icon: Icon }) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        className={`group relative px-3 py-2 rounded-lg transition-all duration-200 ${
          active
            ? "text-emerald-400 bg-emerald-900/20"
            : "text-gray-300 hover:text-emerald-400 hover:bg-gray-800/40"
        }`}
        onClick={() => setMenuOpen(false)}
      >
        <Icon className="w-5 h-5" />
        {/* Tooltip */}
        <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-gray-700">
          {label}
        </span>
      </Link>
    );
  };

  // 🕐 Prevent reload loop while AuthContext restores session
  if (loading) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-[#0f172a] h-14 flex items-center justify-center text-gray-400 text-sm z-50">
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
          className="flex items-center gap-2.5 group transition-transform duration-300 hover:scale-105"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg blur-sm opacity-50 group-hover:opacity-75 transition-all duration-300"></div>
            <div className="relative p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg group-hover:shadow-emerald-500/50 transition-all duration-300">
              <svg
                className="w-5 h-5 text-white transform group-hover:rotate-12 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent group-hover:from-emerald-300 group-hover:via-cyan-300 group-hover:to-emerald-300 transition-all duration-300">
              Saving
            </span>
            <span className="text-xl font-bold text-white group-hover:text-gray-100 transition-colors duration-300">DM</span>
          </div>
        </Link>

        {/* 🌐 Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          {!user.is_staff ? (
            <>
              <NavLink to="/dashboard" label="Dashboard" icon={LayoutDashboard} />
              <NavLink to="/transactions" label="Transactions" icon={CreditCard} />
              <NavLink to="/deposit" label="Deposit" icon={ArrowDownCircle} />
              <NavLink to="/withdraw" label="Withdraw" icon={ArrowUpCircle} />
              <NavLink to="/peer/transfers" label="Peer Transfers" icon={Send} />
              <NavLink to="/ai" label="AI Assistant" icon={Bot} />
              <NavLink to="/chat" label="Chat" icon={MessageCircle} />
              <NavLink to="/feedback" label="Send Feedback" icon={MessageSquare} />
              <NavLink to="/my-feedback" label="My Feedback" icon={BarChart3} />
            </>
          ) : (
            <>
              <NavLink to="/admin" label="Admin Dashboard" icon={ShieldCheck} />
              <NavLink to="/admin/users" label="Users" icon={Users} />
              <NavLink to="/admin/devices" label="Devices" icon={Monitor} />
              <NavLink to="/admin/analytics" label="Analytics" icon={BarChart3} />
              <NavLink to="/admin/logins" label="Logins" icon={ShieldCheck} />
              <NavLink to="/admin/peer/transfers" label="Peer Transfers" icon={Send} />
              <NavLink to="/admin/ai" label="AI Assistant" icon={Bot} />
              <NavLink to="/admin/chat" label="Admin Chat" icon={MessageCircle} />
              <NavLink to="/admin/feedback" label="Feedback" icon={MessageSquare} />
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
                      <MobileNavLink to="/dashboard" label="Dashboard" icon={LayoutDashboard} />
                      <MobileNavLink to="/transactions" label="Transactions" icon={CreditCard} />
                      <MobileNavLink to="/deposit" label="Deposit" icon={ArrowDownCircle} />
                      <MobileNavLink to="/withdraw" label="Withdraw" icon={ArrowUpCircle} />
                      <MobileNavLink to="/peer/transfers" label="Peer Transfers" icon={Send} />
                      <MobileNavLink to="/ai" label="AI Assistant" icon={Bot} />
                      <MobileNavLink to="/chat" label="Chat" icon={MessageCircle} />
                      <MobileNavLink to="/feedback" label="Send Feedback" icon={MessageSquare} />
                      <MobileNavLink to="/my-feedback" label="My Feedback" icon={BarChart3} />
                    </>
                  ) : (
                    <>
                      <MobileNavLink to="/admin" label="Admin Dashboard" icon={ShieldCheck} />
                      <MobileNavLink to="/admin/users" label="Users" icon={Users} />
                      <MobileNavLink to="/admin/devices" label="Devices" icon={Monitor} />
                      <MobileNavLink to="/admin/analytics" label="Analytics" icon={BarChart3} />
                      <MobileNavLink to="/admin/logins" label="Logins" icon={ShieldCheck} />
                      <MobileNavLink to="/admin/peer/transfers" label="Peer Transfers" icon={Send} />
                      <MobileNavLink to="/admin/ai" label="AI Assistant" icon={Bot} />
                      <MobileNavLink to="/admin/chat" label="Admin Chat" icon={MessageCircle} />
                      <MobileNavLink to="/admin/feedback" label="Feedback" icon={MessageSquare} />
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

// Mobile navigation link component (shows text + icon)
function MobileNavLink({ to, label, icon: Icon }) {
  const location = useLocation();
  const active = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
        active
          ? "text-emerald-400 bg-emerald-900/20"
          : "text-gray-300 hover:text-emerald-400 hover:bg-gray-800/40"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </Link>
  );
}