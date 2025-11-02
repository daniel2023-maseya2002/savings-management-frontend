// src/pages/AdminLoginActivityPage.jsx
import dayjs from "dayjs";
import {
  Activity,
  ArrowRightLeft,
  AtSign,
  BarChart3,
  Calendar,
  CheckCircle2,
  Download,
  Globe,
  MonitorSmartphone,
  RefreshCw,
  Search,
  Smartphone,
  User,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import axios from "../api/axios";

/* ----------------------------- helpers ----------------------------- */
const cls = (...x) => x.filter(Boolean).join(" ");

function toIsoOrEmpty(v) {
  try {
    return v ? new Date(v).toISOString() : "";
  } catch {
    return "";
  }
}

function downloadCsv(rows) {
  if (!rows?.length) return;
  const headers = [
    "time",
    "username",
    "email",
    "device_id",
    "ip_address",
    "user_agent",
    "success",
    "message",
  ];
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        dayjs(r.created_at).format("YYYY-MM-DD HH:mm:ss"),
        r.username ?? "",
        r.email ?? "",
        r.device_id ?? "",
        r.ip_address ?? "",
        (r.user_agent ?? "").replace(/,/g, " "),
        r.success ? "true" : "false",
        (r.message ?? "").replace(/,/g, " "),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `login_activity_${dayjs().format("YYYYMMDD_HHmmss")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------- page ------------------------------- */
export default function AdminLoginActivityPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // filters
  const [q, setQ] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fromDt, setFromDt] = useState("");
  const [toDt, setToDt] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (q) params.q = q;
      if (username) params.user = username;
      if (email) params.email = email;
      if (fromDt) params.from = toIsoOrEmpty(fromDt);
      if (toDt) params.to = toIsoOrEmpty(toDt);

      const res = await axios.get("/admin/login-activity/", { params });
      const data = res.data?.results ?? res.data;
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      alert("Failed to load login activity.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // quick presets
  const applyPreset = (range) => {
    const now = dayjs();
    if (range === "24h") {
      setFromDt(now.subtract(24, "hour").format("YYYY-MM-DDTHH:mm"));
      setToDt(now.format("YYYY-MM-DDTHH:mm"));
    } else if (range === "7d") {
      setFromDt(now.subtract(7, "day").startOf("day").format("YYYY-MM-DDTHH:mm"));
      setToDt(now.format("YYYY-MM-DDTHH:mm"));
    } else if (range === "30d") {
      setFromDt(now.subtract(30, "day").startOf("day").format("YYYY-MM-DDTHH:mm"));
      setToDt(now.format("YYYY-MM-DDTHH:mm"));
    } else {
      setFromDt("");
      setToDt("");
    }
  };

  /* ----------------------------- aggregates ----------------------------- */
  const stats = useMemo(() => {
    if (!rows?.length) {
      return {
        total: 0,
        success: 0,
        successRate: 0,
        uniqueUsers: 0,
        failed24h: 0,
        topDevice: "-",
        topIp: "-",
      };
    }
    const total = rows.length;
    const success = rows.filter((r) => r.success).length;
    const successRate = total ? Math.round((success / total) * 100) : 0;

    const byUser = new Set(rows.map((r) => r.username || r.email || "").filter(Boolean));
    const uniqueUsers = byUser.size;

    const failed24h = rows.filter(
      (r) => !r.success && dayjs(r.created_at).isAfter(dayjs().subtract(24, "hour"))
    ).length;

    // top device id (or UA family fallback)
    const deviceCounts = {};
    const ipCounts = {};
    rows.forEach((r) => {
      const d = r.device_id || (r.user_agent || "").slice(0, 16);
      deviceCounts[d] = (deviceCounts[d] || 0) + 1;
      const ip = r.ip_address || "-";
      ipCounts[ip] = (ipCounts[ip] || 0) + 1;
    });

    const topDevice =
      Object.entries(deviceCounts).sort((a, b) => b[1] - a[1])?.[0]?.[0] || "-";
    const topIp = Object.entries(ipCounts).sort((a, b) => b[1] - a[1])?.[0]?.[0] || "-";

    return { total, success, successRate, uniqueUsers, failed24h, topDevice, topIp };
  }, [rows]);

  const topWidth = useMemo(() => (loading ? 68 : 0), [loading]);

  return (
    <div className="relative min-h-screen w-screen overflow-x-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* animated top loader */}
      <div className="fixed left-0 top-0 z-40 h-[3px] w-full overflow-hidden">
        {topWidth ? (
          <div className="h-full w-1/2 animate-[loader_1.2s_ease-in-out_infinite] bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400" />
        ) : null}
      </div>

      {/* ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-[-60px] top-[40%] h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-24 left-[30%] h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-10">
        {/* Header */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-emerald-900/30 to-cyan-900/20 p-3 backdrop-blur">
              <BarChart3 className="h-7 w-7 text-cyan-300" />
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-3xl font-black tracking-tight text-transparent md:text-4xl">
                Login Activity
              </h1>
              <p className="text-sm text-gray-400">
                Monitor sign-ins, devices, IPs and security signals.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadCsv(rows)}
              disabled={!rows.length}
              className={cls(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm",
                "border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 transition",
                !rows.length && "opacity-50 cursor-not-allowed"
              )}
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2.5 text-sm text-cyan-200 transition hover:bg-cyan-500/20"
            >
              <RefreshCw className={cls("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Logins"
            value={stats.total}
            icon={<Activity className="h-5 w-5 text-emerald-300" />}
            chip={`${rows.length ? dayjs(rows[0].created_at).format("MMM YYYY") : "—"}`}
            gradient="from-emerald-500/10 to-cyan-500/10"
          />
          <StatCard
            title="Success Rate"
            value={`${stats.successRate}%`}
            icon={<CheckCircle2 className="h-5 w-5 text-cyan-300" />}
            chip={`${stats.success}/${stats.total} ok`}
            gradient="from-cyan-500/10 to-indigo-500/10"
          />
          <StatCard
            title="Unique Users"
            value={stats.uniqueUsers}
            icon={<User className="h-5 w-5 text-indigo-300" />}
            chip="distinct accounts"
            gradient="from-indigo-500/10 to-cyan-500/10"
          />
          <StatCard
            title="Failed (24h)"
            value={stats.failed24h}
            icon={<XCircle className="h-5 w-5 text-rose-300" />}
            chip="security watch"
            gradient="from-rose-500/10 to-amber-500/10"
          />
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
            <Field
              icon={<Search className="h-4 w-4 text-cyan-300/80" />}
              placeholder="Search (device/ip/ua)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Field
              icon={<User className="h-4 w-4 text-emerald-300/80" />}
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Field
              icon={<AtSign className="h-4 w-4 text-indigo-300/80" />}
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Field
              type="datetime-local"
              icon={<Calendar className="h-4 w-4 text-gray-300/70" />}
              value={fromDt}
              onChange={(e) => setFromDt(e.target.value)}
            />
            <Field
              type="datetime-local"
              icon={<Calendar className="h-4 w-4 text-gray-300/70" />}
              value={toDt}
              onChange={(e) => setToDt(e.target.value)}
            />
            <button
              onClick={fetchData}
              disabled={loading}
              className={cls(
                "rounded-xl px-4 py-2.5 text-sm transition",
                "border border-cyan-400/20 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20",
                loading && "opacity-60 cursor-wait"
              )}
            >
              {loading ? "Filtering…" : "Apply Filters"}
            </button>
          </div>

          {/* quick ranges */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-400">
            Quick range:
            {["24h", "7d", "30d", "clear"].map((k) => (
              <button
                key={k}
                onClick={() => applyPreset(k)}
                className={cls(
                  "rounded-full px-3 py-1 transition",
                  "border border-white/10 bg-white/5 hover:bg-white/10"
                )}
              >
                {k.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Mini facts (from top device / ip) */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <MiniFact
            icon={<Smartphone className="h-4 w-4 text-cyan-300" />}
            title="Top Device"
            value={stats.topDevice}
            pill="most seen"
          />
          <MiniFact
            icon={<Globe className="h-4 w-4 text-emerald-300" />}
            title="Top IP"
            value={stats.topIp}
            pill="most requests"
          />
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-cyan-300" />
              <h3 className="text-sm font-semibold text-gray-100">
                Recent Login Attempts
              </h3>
            </div>
            <div className="text-xs text-gray-400">{rows.length} records</div>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-xl border border-white/10 bg-white/5"
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10 bg-gray-900/70 backdrop-blur-md">
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                    <th className="px-5 py-3">Time</th>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Device</th>
                    <th className="px-5 py-3">IP</th>
                    <th className="px-5 py-3">User Agent</th>
                    <th className="px-5 py-3">Success</th>
                    <th className="px-5 py-3">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      className={cls(
                        "transition",
                        r.success ? "hover:bg-emerald-500/5" : "hover:bg-rose-500/5"
                      )}
                    >
                      <td className="px-5 py-3 text-gray-300">
                        {dayjs(r.created_at).format("YYYY-MM-DD HH:mm:ss")}
                      </td>
                      <td className="px-5 py-3 text-gray-100">{r.username || "—"}</td>
                      <td className="px-5 py-3 text-gray-300">{r.email || "—"}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-2 text-gray-200">
                          <MonitorSmartphone className="h-4 w-4 text-cyan-300" />
                          {r.device_id || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-300">{r.ip_address || "—"}</td>
                      <td className="px-5 py-3 text-gray-400 max-w-[32ch]">
                        <span title={r.user_agent}>{r.user_agent || "—"}</span>
                      </td>
                      <td className="px-5 py-3">
                        {r.success ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/20 bg-rose-500/10 px-2 py-0.5 text-xs text-rose-300">
                            <XCircle className="h-3.5 w-3.5" />
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-300">{r.message || "—"}</td>
                    </tr>
                  ))}

                  {!rows.length && !loading && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-5 py-12 text-center text-sm text-gray-500"
                      >
                        No data found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* keyframes for top loader */}
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

/* ----------------------------- tiny bits ----------------------------- */
function Field({ icon, className = "", ...props }) {
  return (
    <div className={cls("relative", className)}>
      {icon && (
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          {icon}
        </div>
      )}
      <input
        {...props}
        className={cls(
          "w-full rounded-xl border border-white/10 bg-white/5 px-10 py-2.5 text-sm text-gray-100",
          "placeholder-gray-400 outline-none focus:ring-2 focus:ring-cyan-500/30"
        )}
      />
    </div>
  );
}

function StatCard({ title, value, icon, chip, gradient }) {
  return (
    <div
      className={cls(
        "relative overflow-hidden rounded-2xl border border-white/10 p-5 backdrop-blur-xl",
        "bg-gradient-to-br",
        gradient || "from-white/5 to-white/10"
      )}
    >
      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
      <div className="mb-2 flex items-center gap-2 text-xs text-gray-300">
        {icon}
        <span>{title}</span>
      </div>
      <div className="text-3xl font-bold text-white">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {chip && (
        <div className="mt-3 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-gray-300">
          {chip}
        </div>
      )}
    </div>
  );
}

function MiniFact({ icon, title, value, pill }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-2">{icon}</div>
        <div>
          <div className="text-xs text-gray-400">{title}</div>
          <div className="text-sm font-medium text-gray-100">{value}</div>
        </div>
      </div>
      {pill && (
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-gray-300">
          {pill}
        </span>
      )}
    </div>
  );
}
