import { motion } from "framer-motion";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  CreditCard,
  RefreshCcw,
  Wallet,
} from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function UserDashboard() {
  const { user, refreshUser } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showAllTx, setShowAllTx] = useState(false);
  const [showAllNotif, setShowAllNotif] = useState(false);
  const LOW_BALANCE_THRESHOLD = 100.0;

  // Fetch transactions
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("/savings/transactions/");
        const results = res.data.results || res.data;
        setTransactions(results);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  // Low balance warning
  useEffect(() => {
    if (user && Number(user.balance) < LOW_BALANCE_THRESHOLD) {
      toast.warn(`Low balance: ${user.balance}. Consider depositing.`);
    }
  }, [user]);

  // Fetch notifications
  useEffect(() => {
    let mounted = true;
    const checkAlerts = async () => {
      try {
        const res = await axios.get("/notifications/");
        const list = res.data.results ?? res.data;
        if (mounted) setNotifications(list);
        const low = list.find(
          (n) =>
            n.title?.toLowerCase().includes("low balance") ||
            (n.data && n.data.type === "low_balance")
        );
        if (low) toast.warn(low.body, { autoClose: 10000 });
      } catch {
        /* ignore */
      }
    };
    checkAlerts();
    return () => {
      mounted = false;
    };
  }, []);

  const handleManualRefresh = async () => {
    await refreshUser();
    toast.success("Balance refreshed");
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 25 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const visibleTransactions = showAllTx ? transactions : transactions.slice(0, 5);
  const visibleNotifications = showAllNotif ? notifications : notifications.slice(0, 5);

  return (
    <motion.div
      className="w-screen h-screen overflow-y-auto bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white flex flex-col gap-8 p-6 lg:p-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* HEADER */}
      <motion.div
        className="flex flex-col md:flex-row justify-between items-start md:items-center w-full"
        variants={fadeIn}
        initial="hidden"
        animate="show"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Welcome, {user?.username || "User"}
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Manage your savings and transactions in one place.
          </p>
        </div>

        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <button
            onClick={handleManualRefresh}
            className="flex items-center gap-2 bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 transition px-4 py-2 rounded-xl text-sm text-emerald-300"
          >
            <RefreshCcw className="w-4 h-4" /> Refresh
          </button>
          <div className="relative">
            <Bell className="w-7 h-7 text-gray-300" />
            {notifications.length > 0 && (
              <div className="absolute -top-1 -right-1 h-2 w-2 bg-emerald-400 rounded-full animate-ping" />
            )}
          </div>
        </div>
      </motion.div>

      {/* STATS GRID */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full"
        variants={fadeIn}
        initial="hidden"
        animate="show"
      >
        {/* Balance */}
        <div className="rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-xl shadow-lg flex flex-col">
          <div className="flex items-center gap-3 mb-3">
            <Wallet className="w-6 h-6 text-emerald-400" />
            <h3 className="text-gray-300 font-medium">Account Balance</h3>
          </div>
          <p className="text-4xl font-semibold text-white tracking-wide">
            ${user?.balance?.toLocaleString() || "0.00"}
          </p>
          <p className="text-gray-400 text-sm mt-2">{user?.email}</p>
        </div>

        {/* Account Type */}
        <div className="rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-xl shadow-lg flex flex-col">
          <div className="flex items-center gap-3 mb-3">
            <CreditCard className="w-6 h-6 text-cyan-400" />
            <h3 className="text-gray-300 font-medium">Account Type</h3>
          </div>
          <p className="text-3xl font-semibold text-white">
            {user?.account_type || "Savings"}
          </p>
          <p className="text-gray-400 text-sm mt-2">Secure & insured</p>
        </div>

        {/* Activity */}
        <div className="rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-xl shadow-lg flex flex-col">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="w-6 h-6 text-indigo-400" />
            <h3 className="text-gray-300 font-medium">Recent Activity</h3>
          </div>
          <p className="text-3xl font-semibold text-white">
            {transactions.length} transactions
          </p>
          <Link
            to="/transactions"
            className="text-cyan-400 text-sm mt-2 hover:underline"
          >
            View all transactions
          </Link>
        </div>
      </motion.div>

      {/* TRANSACTIONS + NOTIFICATIONS GRID */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full flex-1"
        variants={fadeIn}
        initial="hidden"
        animate="show"
      >
        {/* Recent Transactions */}
        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 shadow-lg flex flex-col w-full h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" /> Recent Transactions
            </h3>
            {transactions.length > 5 && (
              <button
                onClick={() => setShowAllTx(!showAllTx)}
                className="text-sm text-cyan-400 hover:underline"
              >
                {showAllTx ? "View Less" : "View All"}
              </button>
            )}
          </div>

          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-300">
                <thead className="text-gray-400 uppercase tracking-wider text-xs border-b border-gray-700/40">
                  <tr>
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Amount</th>
                    <th className="text-left py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTransactions.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-gray-800/30 hover:bg-white/5 transition"
                    >
                      <td className="py-3 flex items-center gap-2">
                        {t.tx_type?.toLowerCase().includes("deposit") ? (
                          <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-rose-400" />
                        )}
                        {t.tx_type}
                      </td>
                      <td className="py-3">
                        ${Number(t.amount).toLocaleString()}
                      </td>
                      <td className="py-3 text-gray-400">
                        {new Date(t.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center mt-4">
              No recent transactions.
            </p>
          )}
        </div>

        {/* Alerts & Notifications */}
        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 shadow-lg flex flex-col w-full h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-400" /> Alerts & Notifications
            </h3>
            {notifications.length > 5 && (
              <button
                onClick={() => setShowAllNotif(!showAllNotif)}
                className="text-sm text-cyan-400 hover:underline"
              >
                {showAllNotif ? "View Less" : "View All"}
              </button>
            )}
          </div>

          {notifications.length > 0 ? (
            <div className="divide-y divide-gray-700/40 overflow-y-auto">
              {visibleNotifications.map((n) => (
                <div key={n.id} className="py-3">
                  <p className="text-gray-100 font-medium">{n.title}</p>
                  <p className="text-gray-400 text-sm">{n.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center mt-4">
              No notifications at the moment.
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
