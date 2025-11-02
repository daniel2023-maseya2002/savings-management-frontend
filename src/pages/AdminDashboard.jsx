import { motion } from "framer-motion";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  CreditCard,
  RefreshCcw,
  Shield,
  Users, Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis, YAxis,
} from "recharts";
import api from "../api/axios";

/* ---------------------------
   Helpers
----------------------------*/
const PREVIEW_COUNT = 5;

const asArray = (data) =>
  Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];

async function fetchWithFallback(getFn, urls) {
  for (const url of urls) {
    try {
      const res = await getFn(url);
      return { data: res.data, url };
    } catch (e) {
      // try next
    }
  }
  return { data: null, url: null };
}

const normalizeSummary = (analytics) => {
  const s = analytics?.summary || analytics || {};
  return {
    total_deposits_last_30d: Number(s.total_deposits_last_30d ?? s.deposits_30d ?? 0),
    total_withdraws_last_30d: Number(s.total_withdraws_last_30d ?? s.withdrawals_30d ?? 0),
    tx_count_last_30d: Number(s.tx_count_last_30d ?? s.transactions_30d ?? 0),
    total_users: Number(s.total_users ?? s.users ?? 0),
  };
};

const normalizeTopUsers = (analytics) => {
  const arr = analytics?.top_users_by_balance || analytics?.top_users || [];
  return asArray(arr).map((u, i) => ({
    username: u.username ?? u.name ?? `user-${i + 1}`,
    balance: Number(u.balance ?? 0),
  }));
};

const normalizeNotifications = (data) =>
  asArray(data).map((n) => ({
    id: n.id ?? crypto.randomUUID(),
    title: n.title ?? n.subject ?? "Notification",
    message: n.message ?? n.body ?? "",
    created_at: n.created_at ?? n.timestamp ?? n.sent_at ?? null,
  }));

const normalizeTransactions = (data) =>
  asArray(data).map((t) => {
    const typeRaw = t.tx_type ?? t.type;
    const type = /deposit/i.test(typeRaw)
      ? "Deposit"
      : /withdraw/i.test(typeRaw)
      ? "Withdraw"
      : String(typeRaw || "—");
    return {
      id: t.id ?? crypto.randomUUID(),
      user: t.user?.username ?? t.username ?? t.user ?? "—",
      type,
      amount: Number(t.amount ?? 0),
      status: t.status ?? "Completed",
      date: t.created_at ?? t.date ?? null,
    };
  });

/** Build last-30-days series from transactions (UTC by date) */
function buildTrendFromTransactions(transactions) {
  const days = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    d.setUTCDate(d.getUTCDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const agg = Object.fromEntries(days.map((d) => [d, { deposits: 0, withdrawals: 0 }]));

  for (const t of transactions) {
    if (!t.date) continue;
    const d = new Date(t.date);
    const key = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
      .toISOString()
      .slice(0, 10);
    if (!(key in agg)) continue;
    const amt = Math.abs(Number(t.amount || 0));
    if (t.type === "Deposit") agg[key].deposits += amt;
    else if (t.type === "Withdraw") agg[key].withdrawals += amt;
  }

  return days.map((d) => ({ date: d, ...agg[d] }));
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    summary: {
      total_deposits_last_30d: 0,
      total_withdraws_last_30d: 0,
      tx_count_last_30d: 0,
      total_users: 0,
    },
    trend: [],
    top_users_by_balance: [],
  });
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [analyticsErr, setAnalyticsErr] = useState(null);
  const [notifErr, setNotifErr] = useState(null);
  const [txErr, setTxErr] = useState(null);

  // Toggle states (must be declared before return; never conditionally)
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);

      // 1) Analytics — try known working paths first; avoid /admin/* that 404s
      const analyticsTry = await fetchWithFallback(api.get, ["/analytics/", "/admin/analytics/"]);
      if (analyticsTry.data) {
        const a = analyticsTry.data;
        const summary = normalizeSummary(a);
        const trendData = a.monthly || a.trend || [];
        const trend = asArray(trendData).map((item, i) => ({
          date: item.date || item.day || item.month || `#${i + 1}`,
          deposits: Number(item.deposits ?? item.deposit ?? 0),
          withdrawals: Number(item.withdrawals ?? item.withdraws ?? item.withdraw ?? 0),
        }));
        const topUsers = normalizeTopUsers(a);
        setStats({ summary, trend, top_users_by_balance: topUsers });
        setAnalyticsErr(null);
      } else {
        setAnalyticsErr("Analytics endpoint not available.");
        setStats((s) => ({ ...s, trend: [] }));
      }

      // 2) Notifications — call the existing one first
      const notifTry = await fetchWithFallback(api.get, [
        "/notifications/?limit=10",
        "/admin/notifications/?limit=10",
        "/alerts/?limit=10",
      ]);
      if (notifTry.data) {
        setNotifications(normalizeNotifications(notifTry.data));
        setNotifErr(null);
      } else {
        setNotifications([]);
        setNotifErr("No notifications endpoint responded.");
      }

      // 3) Transactions — use your real backend route first
      const txTry = await fetchWithFallback(api.get, [
        "/savings/transactions/?limit=500",
        "/transactions/?limit=500",
        "/admin/transactions/?limit=500",
      ]);
      if (txTry.data) {
        const tx = normalizeTransactions(txTry.data);
        setTransactions(tx);
        setTxErr(null);

        // If analytics didn’t provide series, derive it from tx
        if (!Array.isArray(stats.trend) || stats.trend.length === 0) {
          const built = buildTrendFromTransactions(tx);
          setStats((s) => ({ ...s, trend: built }));
        }
      } else {
        setTransactions([]);
        setTxErr("No transactions endpoint responded.");
      }
    } catch (e) {
      console.error("Dashboard load failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ⚠️ Hooks must not be conditional — keep these above the return.
  const notificationsList = useMemo(
    () => (showAllNotifications ? notifications : notifications.slice(0, PREVIEW_COUNT)),
    [notifications, showAllNotifications]
  );
  const transactionsList = useMemo(
    () => (showAllTransactions ? transactions : transactions.slice(0, PREVIEW_COUNT)),
    [transactions, showAllTransactions]
  );

  const fadeIn = {
    hidden: { opacity: 0, y: 25 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const cards = [
    {
      title: "Total Deposits (30d)",
      icon: <Wallet className="w-6 h-6 text-emerald-400" />,
      value: stats.summary.total_deposits_last_30d?.toLocaleString() || "—",
      color: "from-emerald-500/40 to-emerald-800/20",
    },
    {
      title: "Total Withdraws (30d)",
      icon: <CreditCard className="w-6 h-6 text-rose-400" />,
      value: stats.summary.total_withdraws_last_30d?.toLocaleString() || "—",
      color: "from-rose-500/40 to-rose-800/20",
    },
    {
      title: "Transactions (30d)",
      icon: <Activity className="w-6 h-6 text-indigo-400" />,
      value: stats.summary.tx_count_last_30d || "—",
      color: "from-indigo-500/40 to-indigo-800/20",
    },
    {
      title: "Total Users",
      icon: <Users className="w-6 h-6 text-cyan-400" />,
      value: stats.summary.total_users || "—",
      color: "from-cyan-500/40 to-cyan-800/20",
    },
  ];

  return (
    <motion.div
      className="min-h-screen w-screen overflow-y-auto bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white flex flex-col gap-8 p-6 lg:p-10"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <motion.div className="flex justify-between items-center" variants={fadeIn} initial="hidden" animate="show">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Monitor bank performance, transactions & users.</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={loadData}
            className="flex items-center gap-2 bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 transition px-3 py-2 rounded-lg text-sm text-emerald-300"
          >
            <RefreshCcw className="w-4 h-4" /> Refresh
          </button>
          <div className="relative">
            <Bell className="w-7 h-7 text-gray-300" />
            {notifications.length > 0 && <div className="absolute -top-1 -right-1 h-2 w-2 bg-emerald-400 rounded-full animate-ping" />}
          </div>
        </div>
      </motion.div>

      {/* Optional small error banners */}
      {analyticsErr && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-200 px-4 py-3 text-sm">
          Analytics: {analyticsErr}
        </div>
      )}
      {notifErr && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-200 px-4 py-3 text-sm">
          Notifications: {notifErr}
        </div>
      )}
      {txErr && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-200 px-4 py-3 text-sm">
          Transactions: {txErr}
        </div>
      )}

      {/* Loading bar (no early return, keeps hooks stable) */}
      {loading && (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
          Loading dashboard…
        </div>
      )}

      {/* Stat Cards */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" variants={fadeIn} initial="hidden" animate="show">
        {cards.map((c, i) => (
          <motion.div key={i} variants={fadeIn} whileHover={{ scale: 1.03 }} className={`relative rounded-2xl p-6 bg-gradient-to-br ${c.color} border border-white/10 backdrop-blur-2xl shadow-lg`}>
            <div className="flex items-center gap-3 mb-3">{c.icon}<h3 className="text-gray-200 font-medium text-sm">{c.title}</h3></div>
            <motion.p className="text-3xl font-semibold text-white tracking-wide" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
              {c.value}
            </motion.p>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts */}
      <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1" variants={fadeIn} initial="hidden" animate="show">
        {/* Transactions (Last 30 Days) */}
        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-5 shadow-lg flex flex-col">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Transactions (Last 30 Days)</h3>
          {stats.trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={stats.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "10px" }} />
                <Line type="monotone" dataKey="deposits" stroke="#10b981" strokeWidth={2.2} dot={false} />
                <Line type="monotone" dataKey="withdrawals" stroke="#f43f5e" strokeWidth={2.2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center mt-10">No transaction data available.</p>
          )}
        </div>

        {/* Top Users by Balance */}
        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-5 shadow-lg flex flex-col">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Top Users by Balance</h3>
          {stats.top_users_by_balance.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={stats.top_users_by_balance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="username" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "10px" }} />
                <Bar dataKey="balance" fill="#06b6d4" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="balance" position="top" fill="#e2e8f0" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center mt-10">No user balance data.</p>
          )}
        </div>
      </motion.div>

      {/* Alerts & Notifications (preview with inline expand) */}
      <motion.div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 shadow-lg mt-4" variants={fadeIn} initial="hidden" animate="show">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            Alerts & Notifications History
          </h3>
          {notifications.length > PREVIEW_COUNT && (
            <button
              onClick={() => setShowAllNotifications((v) => !v)}
              className="text-sm text-emerald-300 hover:text-emerald-200 underline underline-offset-4"
            >
              {showAllNotifications ? "Show less" : `View all (${notifications.length})`}
            </button>
          )}
        </div>

        {notificationsList.length > 0 ? (
          <div className="divide-y divide-gray-700/40">
            {notificationsList.map((n) => (
              <div key={n.id} className="flex items-start gap-4 py-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-100">{n.title}</h4>
                  <p className="text-gray-400 text-sm">{n.message}</p>
                </div>
                <span className="text-gray-500 text-xs whitespace-nowrap">
                  {n.created_at ? new Date(n.created_at).toLocaleString() : "—"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center mt-4">No notifications available.</p>
        )}
      </motion.div>

      {/* Recent Transactions (preview with inline expand) */}
      <motion.div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 shadow-lg" variants={fadeIn} initial="hidden" animate="show">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" /> Recent Transactions
          </h3>
          {transactions.length > PREVIEW_COUNT && (
            <button
              onClick={() => setShowAllTransactions((v) => !v)}
              className="text-sm text-cyan-300 hover:text-cyan-200 underline underline-offset-4"
            >
              {showAllTransactions ? "Show less" : `View all (${transactions.length})`}
            </button>
          )}
        </div>

        {transactionsList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-300">
              <thead className="text-gray-400 uppercase tracking-wider text-xs border-b border-gray-700/40">
                <tr>
                  <th className="text-left py-2">User</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-left py-2">Amount</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactionsList.map((t) => (
                  <tr key={t.id} className="border-b border-gray-800/30 hover:bg-white/5 transition">
                    <td className="py-3">{t.user}</td>
                    <td className="py-3 flex items-center gap-2">
                      {t.type === "Deposit"
                        ? <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                        : <ArrowDownRight className="w-4 h-4 text-rose-400" />}
                      {t.type}
                    </td>
                    <td className="py-3">${t.amount?.toLocaleString()}</td>
                    <td className="py-3">
                      <span className={`px-3 py-1 rounded-full text-xs ${t.status === "Completed" ? "bg-emerald-500/20 text-emerald-300" : "bg-yellow-500/20 text-yellow-300"}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400">{t.date ? new Date(t.date).toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center mt-4">No recent transactions available.</p>
        )}
      </motion.div>
    </motion.div>
  );
}
