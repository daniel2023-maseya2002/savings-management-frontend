// src/pages/AdminAnalyticsPage.jsx
import {
  Activity,
  BarChart3,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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

/**
 * AdminAnalyticsPage (merged + polling + date-filter + filename parsing)
 *
 * New features:
 *  - Polls /ai/admin/analysis/ every 20s and notifies admins when new reports appear.
 *  - Reports list supports start/end date filters (sent to backend).
 *  - Export CSV uses Content-Disposition filename when available.
 *
 * Endpoints used:
 * - POST  /ai/admin/analysis/run/
 * - GET   /ai/admin/analysis/?page=...&page_size=...&start=...&end=...
 * - GET   /ai/admin/analysis/:id/
 * - GET   /ai/admin/analysis/:id/export/?part=anomalies|clusters
 * - POST  /ai/admin/transaction/:id/flag/
 */

export default function AdminAnalyticsPage() {
  const navigate = useNavigate();

  /* ------------------------------- core analytics ------------------------------- */
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

  const trend = useMemo(() => {
    const raw = data?.monthly || data?.trend || [];
    return raw.map((r, i) => ({
      label: r.date || r.month || `#${i + 1}`,
      deposits: Number(r.deposits || 0),
      withdrawals: Number(r.withdrawals || 0),
    }));
  }, [data]);

  /* ------------------------------- AI Analyst state ------------------------------- */
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsPageSize] = useState(20);
  const [reportsList, setReportsList] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsCount, setReportsCount] = useState(0);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [flagTx, setFlagTx] = useState(null);

  // date filters for reports listing (feature 3)
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");

  const AI_BASE = "/ai/admin/analysis/";
  const AI_RUN = "/ai/admin/analysis/run/";

  const pollIntervalMs = 20000; // 20s
  const prevCountRef = useRef(null);
  const pollRef = useRef(null);

  async function loadReports(page = 1, opts = {}) {
    // opts may include start/end to pass filters
    setReportsLoading(true);
    try {
      const params = {
        page,
        page_size: reportsPageSize,
      };
      if (opts.start) params.start = opts.start;
      if (opts.end) params.end = opts.end;
      const res = await axios.get("/ai/admin/analysis/", { params });
      const payload = res.data;
      const list = payload.results ?? payload;
      setReportsList(list);
      setReportsCount(payload.count ?? list.length);
      setReportsPage(payload.page ?? page);
    } catch (err) {
      console.error("Failed to load AI reports", err);
      toast.error("Failed to load AI reports");
      setReportsList([]);
      setReportsCount(0);
    } finally {
      setReportsLoading(false);
    }
  }

  async function loadReportDetail(id) {
    setReportLoading(true);
    try {
      const res = await axios.get(`${AI_BASE}${id}/`);
      setSelectedReport(res.data);
      setSelectedReportId(id);
    } catch (err) {
      console.error("Failed to load report", err);
      toast.error("Failed to load report");
      setSelectedReport(null);
      setSelectedReportId(null);
    } finally {
      setReportLoading(false);
    }
  }

  useEffect(() => {
    // initial load of reports (no filters)
    loadReports(1);
    // eslint-disable-next-line
  }, []);

  /* ------------------------------- Polling (feature 2) ------------------------------- */
  useEffect(() => {
    // start polling after initial load; polling will compare `count` and notify if new reports exist
    async function pollOnce() {
      try {
        const res = await axios.get("/ai/admin/analysis/", { params: { page: 1, page_size: 1 } });
        const payload = res.data;
        const count = payload.count ?? (Array.isArray(payload) ? payload.length : 0);
        const prev = prevCountRef.current;
        // initialize prevCountRef if null
        if (prev === null) {
          prevCountRef.current = count;
          return;
        }
        if (count > prev) {
          toast.info(`New analysis report(s) available (${count - prev}) — reloading list`);
          // reload current page (apply same filters)
          const opts = {};
          if (filterStart) opts.start = filterStart;
          if (filterEnd) opts.end = filterEnd;
          loadReports(reportsPage, opts);
          prevCountRef.current = count;
        } else {
          // update previous count in case it changed independently (e.g., pruning)
          prevCountRef.current = count;
        }
      } catch (err) {
        // don't spam toasts for transient poll errors
        console.debug("AI poll failed", err && err.message);
      }
    }

    // set interval
    pollRef.current = setInterval(pollOnce, pollIntervalMs);
    // run one immediately
    pollOnce();

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // include filterStart/filterEnd so polling reload respects the filter context logic for notifications
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStart, filterEnd, reportsPage]);

  /* ------------------------------- helpers for admin URL (fix Open button) ------------------------------- */

  /**
   * getAdminHost:
   * - prefer VITE_DJANGO_HOST (client env var)
   * - fallback to axios.defaults.baseURL with /api stripped
   * - fallback to http://127.0.0.1:8000
   */
  function getAdminHost() {
    try {
      // Vite exposes env vars on import.meta.env
      const viteHost = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_DJANGO_HOST) || null;
      if (viteHost) return viteHost.replace(/\/+$/, "");

      // fallback: axios baseURL (strip trailing slash and /api path)
      const base = axios?.defaults?.baseURL;
      if (base) {
        let u = base.replace(/\/+$/, "");
        u = u.replace(/\/api\/?$/i, "");
        if (u) return u;
      }
    } catch (e) {
      // no-op
    }
    return "http://127.0.0.1:8000";
  }

  /**
   * getAdminChangeUrl:
   * - constructs a Django admin change URL for a given model instance id
   * - default appLabel is set to 'core' and modelName 'transaction'
   *
   * NOTE: We still keep this helper in case you'd like to open the real Django admin in a new tab.
   */
  function getAdminChangeUrl({ id, appLabel = "core", modelName = "transaction" }) {
    const host = getAdminHost();
    return `${host.replace(/\/+$/, "")}/admin/${appLabel}/${modelName}/${id}/change/`;
  }

  /* ------------------------------- UI ------------------------------- */

  if (loading)
    return (
      <div className="relative min-h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
        <div className="fixed left-0 top-0 z-40 h-[3px] w-full overflow-hidden">
          <div className="h-full w-1/2 animate-[loader_1.2s_ease-in-out_infinite] bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400" />
        </div>

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
            onClick={() => { loadData(); loadReports(1, { start: filterStart, end: filterEnd }); }}
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

        {/* Totals bar */}
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

        {/* Trend line */}
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

        {/* ------------------------------- AI Analyst Section ------------------------------- */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* left: run form + list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-semibold text-gray-100">AI Analyst</div>
                  <div className="text-xs text-gray-400">Run transaction analysis and review generated reports</div>
                </div>
                <div className="text-xs text-slate-400">Admin tools</div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnalysisRunForm onRan={() => { loadReports(1, { start: filterStart, end: filterEnd }); }} />
                <div>
                  <div className="text-sm text-gray-300 mb-2">Quick stats</div>
                  <div className="grid grid-cols-3 gap-2">
                    <StatBox label="Reports" value={reportsCount} />
                    <StatBox label="Anomalies (last)" value={selectedReport?.anomalies?.length ?? "—"} />
                    <StatBox label="Clusters (last)" value={selectedReport ? Object.keys(selectedReport.clusters || {}).length : "—"} />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-gray-100">Recent Analyses</div>
                <div className="flex gap-2 items-center">
                  <button onClick={() => loadReports(1, { start: filterStart, end: filterEnd })} className="px-3 py-1 rounded border text-xs">Reload</button>
                  <div className="text-xs text-gray-400">page {reportsPage}</div>
                </div>
              </div>

              {/* Date filter UI (feature 3) */}
              <div className="mb-3 flex gap-2 items-end">
                <div>
                  <label className="block text-xs text-slate-300">Start</label>
                  <input type="date" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} className="mt-1 p-2 rounded bg-[#071829] border border-slate-700 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-300">End</label>
                  <input type="date" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} className="mt-1 p-2 rounded bg-[#071829] border border-slate-700 text-sm" />
                </div>
                <div>
                  <button onClick={() => { setReportsPage(1); loadReports(1, { start: filterStart, end: filterEnd }); }} className="px-3 py-2 rounded bg-emerald-600 text-slate-900">Apply filter</button>
                </div>
                <div>
                  <button onClick={() => { setFilterStart(""); setFilterEnd(""); setReportsPage(1); loadReports(1); }} className="px-3 py-2 rounded border">Clear</button>
                </div>
              </div>

              <AnalysisList
                reports={reportsList}
                loading={reportsLoading}
                page={reportsPage}
                pageSize={reportsPageSize}
                onPageChange={(p) => {
                  // prevent requesting negative pages and disable next when at last page
                  const maxPage = Math.ceil((reportsCount || 0) / reportsPageSize) || (p > 1 ? p : 1);
                  const newPage = Math.max(1, Math.min(p, maxPage));
                  setReportsPage(newPage);
                  loadReports(newPage, { start: filterStart, end: filterEnd });
                }}
                onOpen={(id) => loadReportDetail(id)}
                onExport={(id, part) => exportReport(id, part)}
              />
            </div>
          </div>

          {/* right: selected report detail */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-gray-100">Report details</div>
                <div className="text-xs text-gray-400">Actions</div>
              </div>

              <div className="flex-1 overflow-auto">
                <AnalysisDetail
                  report={selectedReport}
                  loading={reportLoading}
                  onRefresh={() => { if (selectedReportId) loadReportDetail(selectedReportId); loadReports(reportsPage, { start: filterStart, end: filterEnd }); }}
                  onFlag={(tx) => setFlagTx(tx)}
                  onExport={(id, part) => exportReport(id, part)}
                />
              </div>
            </div>
          </div>
        </div>
        {/* end AI Analyst section */}
      </div>

      {flagTx && (
        <FlagTransactionModal
          tx={flagTx}
          onClose={() => {
            setFlagTx(null);
            loadReports(reportsPage, { start: filterStart, end: filterEnd });
          }}
        />
      )}

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

  /* ------------------------------- helpers / inner components ------------------------------- */

  // Improved export: reads Content-Disposition filename if provided by backend (feature 4)
  async function exportReport(id, part = "anomalies") {
    try {
      const res = await axios.get(`/ai/admin/analysis/${id}/export/`, { params: { part }, responseType: "blob" });
      const blob = new Blob([res.data], { type: res.headers["content-type"] || "text/csv" });

      // Try to parse filename from Content-Disposition header
      const disposition = res.headers["content-disposition"] || res.headers["Content-Disposition"];
      const filename = getFilenameFromDisposition(disposition) || `analysis_${id}_${part}.csv`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch (err) {
      console.error("Export failed", err);
      toast.error("Export failed");
    }
  }

  // parse filename; handles common formats:
  // Content-Disposition: attachment; filename="report.csv"
  // or: attachment; filename*=UTF-8''report%20name.csv
  function getFilenameFromDisposition(disposition) {
    if (!disposition || typeof disposition !== "string") return null;
    // filename*=UTF-8''...
    const fnStar = /filename\*\s*=\s*([^;]+)/i.exec(disposition);
    if (fnStar) {
      try {
        const val = fnStar[1].trim();
        // val might be: UTF-8''encoded%20name.csv
        const parts = val.split("''");
        const encName = parts.length === 2 ? decodeURIComponent(parts[1]) : decodeURIComponent(val);
        return encName.replace(/(^"|"$)/g, "");
      } catch (e) {
        // ignore decode failures
      }
    }
    // filename="..."
    const fn = /filename\s*=\s*("([^"]+)"|([^;]+))/i.exec(disposition);
    if (fn) {
      return (fn[2] || fn[3] || "").trim().replace(/(^"|"$)/g, "");
    }
    return null;
  }

  function StatBox({ label, value }) {
    return (
      <div className="rounded-xl border border-slate-700 bg-[#071829] p-3 text-center">
        <div className="text-xs text-gray-400">{label}</div>
        <div className="text-lg font-semibold mt-1">{value ?? "—"}</div>
      </div>
    );
  }

  /* ------------------------------- AnalysisRunForm ------------------------------- */

  function AnalysisRunForm({ onRan }) {
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");
    const [method, setMethod] = useState("isolation_forest");
    const [contamination, setContamination] = useState(0.01);
    const [n_clusters, setNClusters] = useState(4);
    const [running, setRunning] = useState(false);

    async function handleRun(e) {
      e?.preventDefault();
      if (!start || !end) return toast.error("Start and end dates are required");
      setRunning(true);
      try {
        await axios.post(AI_RUN, {
          start,
          end,
          method,
          contamination: parseFloat(contamination),
          n_clusters: parseInt(n_clusters, 10),
          name: `Admin run ${new Date().toISOString()}`,
        });
        toast.success("Analysis started");
        setStart(""); setEnd("");
        if (onRan) onRan();
      } catch (err) {
        console.error("run analysis", err);
        toast.error("Failed to start analysis");
      } finally {
        setRunning(false);
      }
    }

    return (
      <form onSubmit={handleRun} className="space-y-3">
        <div>
          <label className="block text-xs text-slate-300">Start</label>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-full mt-1 p-2 rounded bg-[#071829] border border-slate-700 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-300">End</label>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-full mt-1 p-2 rounded bg-[#071829] border border-slate-700 text-sm" />
        </div>

        <div>
          <label className="block text-xs text-slate-300">Method</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full mt-1 p-2 rounded bg-[#071829] border border-slate-700 text-sm">
            <option value="isolation_forest">Isolation Forest</option>
            <option value="local_outlier_factor">Local Outlier Factor</option>
            <option value="dbscan">DBSCAN</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-slate-300">Contamination</label>
            <input type="number" step="0.001" min="0" max="0.5" value={contamination} onChange={(e) => setContamination(e.target.value)} className="w-full mt-1 p-2 rounded bg-[#071829] border border-slate-700 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-300">Clusters</label>
            <input type="number" min="1" value={n_clusters} onChange={(e) => setNClusters(e.target.value)} className="w-full mt-1 p-2 rounded bg-[#071829] border border-slate-700 text-sm" />
          </div>
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={running} className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-900">
            {running ? "Starting…" : "Start analysis"}
          </button>
          <button type="button" onClick={() => { setStart(""); setEnd(""); setContamination(0.01); setNClusters(4); }} className="px-3 py-2 rounded border border-slate-700">Reset</button>
        </div>
      </form>
    );
  }

  /* ------------------------------- AnalysisList ------------------------------- */

  function AnalysisList({ reports, loading, page, pageSize, onPageChange, onOpen, onExport }) {
    const totalPages = Math.max(1, Math.ceil((reportsCount || 0) / pageSize));
    return (
      <div>
        {loading ? (
          <div className="py-6 text-center text-slate-400">Loading…</div>
        ) : reports.length === 0 ? (
          <div className="text-slate-400 py-6">No analyses yet.</div>
        ) : (
          <div className="space-y-2">
            {reports.map((r) => (
              <div key={r.id} className="bg-[#071829] p-3 rounded border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{r.name || `Report #${r.id}`}</div>
                  <div className="text-xs text-slate-400">Created: {new Date(r.created_at).toLocaleString()}</div>
                  <div className="text-xs text-slate-400 mt-1">Summary: {r.summary ? `${r.summary.count} tx — ${r.summary.total_amount}` : "processing / pending"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => onOpen(r.id)} className="px-3 py-1 rounded bg-indigo-600 text-white text-sm">View</button>
                  <button onClick={() => onExport(r.id, "anomalies")} className="px-3 py-1 rounded border text-sm">Export anomalies</button>
                  <button onClick={() => onExport(r.id, "clusters")} className="px-3 py-1 rounded border text-sm">Export clusters</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex gap-2 justify-end">
          <button onClick={() => onPageChange(Math.max(1, page - 1))} className="px-3 py-1 rounded border" disabled={page === 1}>Prev</button>
          <div className="px-4 py-1.5 text-sm text-slate-300 bg-[#131c26] rounded-md border border-slate-700">{page}</div>
          <button onClick={() => onPageChange(page + 1)} className="px-3 py-1 rounded border" disabled={page >= totalPages}>Next</button>
        </div>
      </div>
    );
  }

  /* ------------------------------- AnalysisDetail ------------------------------- */

  function AnalysisDetail({ report, loading, onRefresh, onFlag, onExport }) {
    if (loading) return <div className="text-slate-400">Loading...</div>;
    if (!report) return <div className="text-slate-400">No report selected.</div>;

    return (
      <div className="space-y-3">
        <div className="text-sm text-slate-300 font-medium">{report.name || `Report #${report.id}`}</div>
        <div className="text-xs text-slate-400">Created: {report.created_at ? new Date(report.created_at).toLocaleString() : "—"}</div>

        <div className="bg-[#071829] p-3 rounded border border-slate-700">
          <div className="text-xs text-slate-400">Transactions analyzed</div>
          <div className="font-semibold">{report.summary?.count ?? "—"}</div>
          <div className="text-xs text-slate-400 mt-2">Total amount</div>
          <div className="font-semibold">{report.summary?.total_amount ?? "—"}</div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">Anomalies (preview)</div>
            <div className="flex gap-2">
              <button onClick={() => onExport(report.id, "anomalies")} className="px-2 py-1 rounded border text-xs">Export</button>
              <button onClick={() => onRefresh()} className="px-2 py-1 rounded border text-xs">Refresh</button>
            </div>
          </div>

          {Array.isArray(report.anomalies) && report.anomalies.length > 0 ? (
            <div className="space-y-2 max-h-56 overflow-auto">
              {report.anomalies.slice(0, 8).map((a) => (
                <div key={a.id} className="p-2 bg-[#0c131d] rounded border border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">TX #{a.id} — {a.amount}</div>
                    <div className="text-xs text-slate-400">user: {a.user_id} — score: {typeof a.score === "number" ? a.score.toFixed(4) : a.score}</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => onFlag(a)} className="px-2 py-1 text-xs rounded bg-emerald-600 text-slate-900">Flag</button>
                    <button
                      onClick={() => {
                        // prefer SPA navigation to /admin/core/transaction/:id/change
                        navigate(`/admin/core/transaction/${a.id}/change`);
                      }}
                      className="px-2 py-1 text-xs rounded border"
                    >
                      Open
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400">No anomalies or report incomplete.</div>
          )}
        </div>

        <div>
          <div className="text-sm font-medium mb-2">Clusters (sample)</div>
          {report.clusters ? (
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(report.clusters).slice(0, 4).map(([k, v]) => (
                <div key={k} className="bg-[#0c131d] p-2 rounded border border-slate-700 text-xs">
                  <div>Cluster {k} — count: {v.count} — avg: {v.avg_amount}</div>
                  <div className="text-slate-400 mt-1">sample ids: {(v.sample_ids || []).slice(0, 8).join(", ")}</div>
                </div>
              ))}
            </div>
          ) : <div className="text-xs text-slate-400">No clusters.</div>}
        </div>
      </div>
    );
  }

  /* ------------------------------- FlagTransactionModal ------------------------------- */

  function FlagTransactionModal({ tx, onClose }) {
    const [reason, setReason] = useState("anomaly");
    const [note, setNote] = useState("");
    const [metadata, setMetadata] = useState(JSON.stringify({ detector: tx?.detector ?? "isolation_forest", score: tx?.score ?? null }, null, 2));
    const [submitting, setSubmitting] = useState(false);

    async function handleFlag() {
      setSubmitting(true);
      let parsed = {};
      try {
        parsed = JSON.parse(metadata || "{}");
      } catch (err) {
        toast.error("Invalid metadata JSON");
        setSubmitting(false);
        return;
      }

      try {
        await axios.post(`/ai/admin/transaction/${tx.id}/flag/`, {
          reason,
          note,
          metadata: parsed,
        });
        toast.success("Transaction flagged");
        if (onClose) onClose();
      } catch (err) {
        console.error("flag tx", err);
        toast.error("Failed to flag transaction");
      } finally {
        setSubmitting(false);
      }
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4">
        <div className="w-full max-w-2xl bg-[#0c131d] rounded-xl border border-slate-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-semibold">Flag transaction #{tx.id}</div>
              <div className="text-xs text-slate-400">amount: {tx.amount} — user: {tx.user_id}</div>
            </div>
            <button onClick={() => onClose()} className="px-2 py-1 rounded border">Close</button>
          </div>

          <div className="space-y-2">
            <div>
              <label className="block text-xs text-slate-300">Reason</label>
              <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full mt-1 p-2 rounded bg-[#071829] border border-slate-700 text-sm">
                <option value="anomaly">Anomaly</option>
                <option value="manual_review">Manual review</option>
                <option value="suspected_fraud">Suspected fraud</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-300">Note</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} className="w-full mt-1 p-2 rounded bg-[#071829] border border-slate-700 text-sm" rows={3} />
            </div>

            <div>
              <label className="block text-xs text-slate-300">Metadata (JSON)</label>
              <textarea value={metadata} onChange={(e) => setMetadata(e.target.value)} className="w-full mt-1 p-2 rounded bg-[#071829] border border-slate-700 text-sm" rows={4} />
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => onClose()} className="px-3 py-2 rounded border">Cancel</button>
              <button onClick={handleFlag} disabled={submitting} className="px-3 py-2 rounded bg-emerald-600 text-slate-900">{submitting ? "Flagging…" : "Flag transaction"}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
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
