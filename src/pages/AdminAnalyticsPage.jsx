// src/pages/AdminAnalyticsPage.jsx
import {
  Activity,
  BarChart3,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import axios from "../api/axios";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/admin/analytics/");
      setData(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load analytics");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const summary = data?.summary || {};
  const totals = useMemo(
    () => [
      {
        key: "deposits",
        name: "Deposits (30d)",
        value: Number(summary.total_deposits_last_30d || 0),
      },
      {
        key: "withdraws",
        name: "Withdrawals (30d)",
        value: Number(summary.total_withdraws_last_30d || 0),
      },
    ],
    [summary]
  );

  // Normalize trend if your API returns `monthly` or `trend`
  const trend = useMemo(() => {
    const raw = data?.monthly || data?.trend || [];
    return raw.map((r, i) => ({
      label: r.date || r.month || `#${i + 1}`,
      deposits: Number(r.deposits || 0),
      withdrawals: Number(r.withdrawals || 0),
    }));
  }, [data]);

  /* ------------------------------- UI ------------------------------- */

  if (loading)
    return (
      <div className="relative min-h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
        {/* top shimmer loader */}
        <div className="fixed left-0 top-0 z-40 h-[3px] w-full overflow-hidden">
          <div className="h-full w-1/2 animate-[loader_1.2s_ease-in-out_infinite] bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400" />
        </div>

        {/* ambient glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute right-[-60px] top-[40%] h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute -bottom-24 left-[30%] h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 py-24 text-center">
          <BarChart3 className="mx-auto mb-4 h-12 w-12 text-cyan-400 animate-pulse" />
          <p className="text-lg text-gray-300">Loading analytics…</p>
        </div>

        <style>{`
          @keyframes loader {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(10%); }
            100% { transform: translateX(120%); }
          }
          .animate-[loader_1.2s_ease-in-out_infinite] {
            animation: loader 1.2s ease-in-out infinite;
          }
        `}</style>
      </div>
    );

  if (!data)
    return (
      <div className="min-h-screen w-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6 lg:p-10 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
          <h2 className="text-2xl font-semibold">
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              No Analytics Available
            </span>
          </h2>
          <p className="mt-2 text-gray-400">
            The analytics endpoint didn’t return any data. Try again or check your backend.
          </p>
          <button
            onClick={loadData}
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-2.5 text-sm text-cyan-200 transition hover:bg-cyan-500/20"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );

  return (
    <div className="relative min-h-screen w-screen overflow-x-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* ambient lights */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-[-60px] top-[40%] h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-24 left-[30%] h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-black tracking-tight md:text-4xl">
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                Admin Analytics
              </span>
            </h2>
            <p className="mt-1 text-sm text-gray-400">Performance, usage and trends at a glance.</p>
          </div>

          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2.5 text-sm text-cyan-200 transition hover:bg-cyan-500/20"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Summary cards */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Total Users"
            value={summary.total_users ?? 0}
            icon={<Users className="h-5 w-5 text-cyan-300" />}
            gradient="from-cyan-500/10 to-indigo-500/10"
          />
          <SummaryCard
            title="Active Devices"
            value={summary.active_devices ?? 0}
            icon={<Smartphone className="h-5 w-5 text-emerald-300" />}
            gradient="from-emerald-500/10 to-cyan-500/10"
          />
          <SummaryCard
            title="Pending Devices"
            value={summary.pending_devices ?? 0}
            icon={<ShieldCheck className="h-5 w-5 text-yellow-300" />}
            gradient="from-yellow-500/10 to-rose-500/10"
          />
          <SummaryCard
            title="Tx (30d)"
            value={summary.tx_count_last_30d ?? 0}
            icon={<Activity className="h-5 w-5 text-indigo-300" />}
            gradient="from-indigo-500/10 to-cyan-500/10"
          />
        </div>

        {/* Totals bar (Deposits vs Withdrawals) */}
        <Card title="Totals (Last 30 Days)" subtitle="Aggregates across your system">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={totals} barSize={56}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={{ stroke: "#374151" }}
                />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#374151" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0b1220",
                    border: "1px solid rgba(148,163,184,0.2)",
                    borderRadius: 12,
                  }}
                  labelStyle={{ color: "#e5e7eb" }}
                  itemStyle={{ color: "#e5e7eb" }}
                  cursor={{ fill: "rgba(148,163,184,0.08)" }}
                />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#22d3ee">
                  <LabelList dataKey="value" position="top" fill="#e2e8f0" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Trend line (if available) */}
        {trend.length > 0 && (
          <Card title="Transactions Trend" subtitle="Deposits vs. Withdrawals over time">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={{ stroke: "#374151" }}
                  />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#374151" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0b1220",
                      border: "1px solid rgba(148,163,184,0.2)",
                      borderRadius: 12,
                    }}
                    labelStyle={{ color: "#e5e7eb" }}
                    itemStyle={{ color: "#e5e7eb" }}
                    cursor={{ stroke: "rgba(148,163,184,0.25)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="deposits"
                    stroke="#10b981"
                    strokeWidth={2.2}
                    dot={false}
                    name="Deposits"
                  />
                  <Line
                    type="monotone"
                    dataKey="withdrawals"
                    stroke="#f43f5e"
                    strokeWidth={2.2}
                    dot={false}
                    name="Withdrawals"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Top Users by Balance */}
        <Card title="Top Users by Balance" subtitle="Leaders with highest balances">
          {data.top_users_by_balance?.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10 bg-gray-900/70 backdrop-blur-md">
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {data.top_users_by_balance.map((u) => (
                    <tr key={u.id} className="transition hover:bg-white/5">
                      <td className="px-5 py-3 font-medium text-gray-100">{u.username}</td>
                      <td className="px-5 py-3 text-right text-cyan-300">
                        ${Number(u.balance || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyLine text="No users found." />
          )}
        </Card>

        {/* Low Balance Alerts */}
        <Card title="Recent Low Balance Alerts" subtitle="Triggered when users reach low threshold">
          {data.recent_low_balance_alerts?.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10 bg-gray-900/70 backdrop-blur-md">
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Message</th>
                    <th className="px-5 py-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {data.recent_low_balance_alerts.map((a) => (
                    <tr key={a.id} className="transition hover:bg-white/5">
                      <td className="px-5 py-3 text-gray-200">{a.user__username}</td>
                      <td className="px-5 py-3 text-gray-300">{a.message}</td>
                      <td className="px-5 py-3 text-right text-gray-400">
                        {new Date(a.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyLine text="No recent alerts." />
          )}
        </Card>
      </div>

      {/* tiny keyframes for the loader */}
      <style>{`
        @keyframes loader {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(10%); }
          100% { transform: translateX(120%); }
        }
        .animate-[loader_1.2s_ease-in-out_infinite] {
          animation: loader 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

/* ------------------------- small UI helpers ------------------------- */

function Card({ title, subtitle, children }) {
  return (
    <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-base font-semibold text-gray-100">{title}</div>
          {subtitle && <div className="text-xs text-gray-400">{subtitle}</div>}
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300">
          Live
        </div>
      </div>
      {children}
    </div>
  );
}

function SummaryCard({ title, value, icon, gradient }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${gradient} p-5 shadow-[0_10px_40px_-15px_rgba(16,185,129,0.25)]`}
    >
      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
      <div className="mb-3 flex items-center gap-2 text-sm text-gray-300">
        {icon}
        <span>{title}</span>
      </div>
      <div className="text-3xl font-bold text-white">{Number(value || 0).toLocaleString()}</div>
    </div>
  );
}

function EmptyLine({ text }) {
  return <p className="px-2 py-6 text-center text-sm text-gray-500">{text}</p>;
}
