// src/pages/TransactionAdminChangePage.jsx
import {
    ArrowLeft,
    CheckCircle,
    Clipboard,
    Code2,
    ExternalLink,
    Flag,
    RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "../api/axios";

/**
 * TransactionAdminChangePage
 * - Route: /admin/core/transaction/:id/change
 * - Attempts to fetch the transaction from a few common endpoints (AI proxy first).
 * - Shows details and quick admin actions (flag, refresh, open django admin, raw JSON).
 */

export default function TransactionAdminChangePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rawVisible, setRawVisible] = useState(true); // Auto-expanded by default
  const [actionLoading, setActionLoading] = useState(false);
  const [copying, setCopying] = useState(false);
  const [foundEndpoint, setFoundEndpoint] = useState(null);

  // possible endpoints to try (order matters) — AI proxy first (adjust if your axios baseURL differs)
  const endpoints = [
    `/ai/transaction/${id}/`,
    `/ai/transaction/${id}`,
    `/core/transaction/${id}/`,
    `/core/transaction/${id}`,
    `/savings/transactions/${id}/`,
    `/savings/transactions/${id}`,
    `/transactions/${id}/`,
    `/transactions/${id}`,
  ];

  useEffect(() => {
    let mounted = true;
    async function fetchTx() {
      setLoading(true);
      setFoundEndpoint(null);
      setTx(null);

      for (const ep of endpoints) {
        try {
          const res = await axios.get(ep);
          if (!mounted) return;
          setTx(res.data);
          setFoundEndpoint(ep);
          setLoading(false);
          return;
        } catch (err) {
          // try next
        }
      }

      if (!mounted) return;
      setLoading(false);
      setTx(null);
      setFoundEndpoint(null);
      toast.error("Transaction not found at expected endpoints.");
    }

    fetchTx();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function fmtMoney(n) {
    return Number(n || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  async function handleFlag() {
    if (!tx?.id) return;
    setActionLoading(true);
    try {
      await axios.post(`/ai/admin/transaction/${tx.id}/flag/`, {
        reason: "admin_manual",
        note: "Flagged from frontend admin page",
        metadata: { via: "frontend-admin" },
      });
      toast.success("Transaction flagged.");
    } catch (err) {
      console.error("flag error", err);
      toast.error("Failed to flag transaction.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRefresh() {
    setLoading(true);
    setFoundEndpoint(null);
    try {
      // try endpoints list again (AI first)
      for (const ep of endpoints) {
        try {
          const res = await axios.get(ep);
          setTx(res.data);
          setFoundEndpoint(ep);
          toast.info("Refreshed");
          setLoading(false);
          return;
        } catch (err) {
          // try next
        }
      }
      toast.error("Refresh failed: transaction not found");
      setTx(null);
      setFoundEndpoint(null);
    } catch (err) {
      console.error("refresh error", err);
      toast.error("Refresh failed");
    } finally {
      setLoading(false);
    }
  }

  // builds admin host from Vite env or axios baseURL as fallback
  function getAdminHost() {
    try {
      const viteHost =
        typeof import.meta !== "undefined" &&
        import.meta.env &&
        import.meta.env.VITE_DJANGO_HOST
          ? import.meta.env.VITE_DJANGO_HOST
          : null;
      if (viteHost) return viteHost.replace(/\/+$/, "");
      const base = axios?.defaults?.baseURL;
      if (base) {
        let u = base.replace(/\/+$/, "");
        u = u.replace(/\/api\/?$/i, "");
        if (u) return u;
      }
    } catch (e) {
      // noop
    }
    return "http://127.0.0.1:8000";
  }

  function openInDjangoAdmin() {
    const host = getAdminHost();
    const url = `${host.replace(/\/+$/, "")}/admin/core/transaction/${id}/change/`;
    window.open(url, "_blank");
  }

  async function copyJson() {
    if (!tx) return;
    setCopying(true);
    try {
      await navigator.clipboard.writeText(JSON.stringify(tx, null, 2));
      toast.success("JSON copied to clipboard");
    } catch (err) {
      console.error("copy failed", err);
      toast.error("Copy failed");
    } finally {
      setCopying(false);
    }
  }

  if (loading)
    return (
      <div className="min-h-screen w-screen bg-[#0a0e1a] overflow-hidden flex items-center justify-center pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0f1629] to-slate-950"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.1),transparent_50%)]"></div>
        <div className="relative z-10 text-center">
          <RefreshCw className="mx-auto mb-4 h-14 w-14 animate-spin text-cyan-500" />
          <div className="text-2xl font-semibold text-slate-200">Loading transaction…</div>
          <div className="mt-2 text-sm text-slate-500">Please wait</div>
        </div>
      </div>
    );

  if (!tx)
    return (
      <div className="min-h-screen w-screen bg-[#0a0e1a] overflow-hidden flex items-center justify-center pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0f1629] to-slate-950"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.1),transparent_50%)]"></div>
        <div className="relative z-10 max-w-2xl w-full px-6">
          <div className="rounded-3xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-950/90 p-10 backdrop-blur-xl shadow-2xl text-center">
            <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center">
              <ExternalLink className="w-10 h-10 text-slate-500" />
            </div>
            <h2 className="text-4xl font-bold mb-4 text-slate-200">Transaction not found</h2>
            <p className="text-base text-slate-400 leading-relaxed">
              Tried multiple endpoints. If your API path is different, update the{" "}
              <code className="px-2 py-1 rounded bg-slate-800/50 text-cyan-400 text-sm">endpoints</code> array in this page.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 text-slate-300 hover:text-slate-200 text-sm font-medium transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 text-sm font-semibold transition-all duration-300 shadow-lg shadow-cyan-500/30"
              >
                <RefreshCw className="w-4 h-4" /> Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  // helpers for visually styled badges
  function StatusBadge({ status }) {
    const s = (status || "").toString().toLowerCase();
    const classes =
      s === "completed"
        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10"
        : s === "pending"
        ? "bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-amber-500/10"
        : s === "failed" || s === "rejected"
        ? "bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-rose-500/10"
        : "bg-slate-700/30 text-slate-400 border-slate-600/30 shadow-slate-500/10";
    return (
      <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border ${classes} shadow-lg`}>
        {status ?? "—"}
      </span>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-[#0a0e1a] overflow-hidden pt-20">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-[#0f1629] to-slate-950 -z-10"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.1),transparent_50%)] -z-10"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.08),transparent_50%)] -z-10"></div>

      <div className="relative z-10 h-full w-full flex flex-col">
        {/* Page Header */}
        <div className="flex-none px-8 py-6 border-b border-slate-800/50 bg-slate-900/20 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate(-1)}
                className="group inline-flex items-center gap-2 rounded-xl px-4 py-2.5 border border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/60 hover:border-slate-600/50 text-slate-300 hover:text-slate-100 text-sm font-medium transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
              </button>

              <div className="h-8 w-px bg-slate-700/50"></div>

              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
                    Transaction #{tx.id}
                  </h1>
                  <StatusBadge status={tx.status ?? "—"} />
                  {foundEndpoint && (
                    <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs bg-slate-800/50 border border-slate-700/40 text-slate-400">
                      <span className="text-slate-500">Source:</span>
                      <span className="ml-2 font-mono text-cyan-400">{foundEndpoint}</span>
                    </div>
                  )}
                </div>
                <div className="text-sm text-slate-500 mt-1">
                  User: <span className="text-slate-400 font-medium">{tx.user?.username ?? tx.user_id ?? "—"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/60 text-slate-300 hover:text-slate-100 text-sm font-medium transition-all duration-300"
              >
                <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" /> Refresh
              </button>

              <button
                onClick={openInDjangoAdmin}
                className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/60 text-slate-300 hover:text-slate-100 text-sm font-medium transition-all duration-300"
                title="Open in Django admin (new tab)"
              >
                <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /> Django Admin
              </button>

              <button
                onClick={handleFlag}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-emerald-700 disabled:to-emerald-800 text-slate-950 text-sm font-semibold transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 disabled:opacity-50"
              >
                <Flag className="w-4 h-4" />
                {actionLoading ? "Flagging…" : "Flag"}
              </button>

              <button
                onClick={copyJson}
                disabled={copying}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/60 text-slate-300 hover:text-slate-100 text-sm font-medium transition-all duration-300 disabled:opacity-50"
              >
                <Clipboard className="w-4 h-4" />
                {copying ? "Copying…" : "Copy JSON"}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area - Two Column Layout */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex gap-8 p-8">
            {/* Left Column - Transaction Details (55%) */}
            <div className="flex-[0_0_55%] space-y-6 overflow-y-auto pr-4 custom-scrollbar">
              {/* Amount Highlight Card */}
              <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-slate-950/30 to-slate-950/50 p-8 backdrop-blur-xl shadow-2xl shadow-cyan-500/10 hover:shadow-cyan-500/20 transition-all duration-300">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-cyan-400/70 mb-2 font-semibold flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                      Transaction Amount
                    </div>
                    <div className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-400 bg-clip-text text-transparent">
                      ${fmtMoney(tx.amount)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-wider text-slate-500 mb-2 font-semibold">Balance After</div>
                    <div className="text-2xl font-bold text-slate-300">{tx.balance_after ?? "—"}</div>
                  </div>
                </div>
              </div>

              {/* Transaction Information Grid */}
              <div className="grid grid-cols-2 gap-5">
                {/* Type Card */}
                <div className="group rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/70 to-slate-950/70 p-6 backdrop-blur-xl hover:border-slate-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/50">
                  <div className="text-xs uppercase tracking-wider text-slate-500 mb-3 font-semibold">Transaction Type</div>
                  <div className="text-xl font-bold text-slate-200 group-hover:text-slate-100 transition-colors">{tx.tx_type ?? tx.type ?? "—"}</div>
                </div>

                {/* Reference Card */}
                <div className="group rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/70 to-slate-950/70 p-6 backdrop-blur-xl hover:border-slate-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/50">
                  <div className="text-xs uppercase tracking-wider text-slate-500 mb-3 font-semibold">Reference</div>
                  <div className="text-base font-mono text-slate-300 break-all group-hover:text-slate-200 transition-colors">{tx.reference || tx.tx_ref || "—"}</div>
                </div>

                {/* Date Card */}
                <div className="group rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/70 to-slate-950/70 p-6 backdrop-blur-xl hover:border-slate-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/50">
                  <div className="text-xs uppercase tracking-wider text-slate-500 mb-3 font-semibold">Created Date</div>
                  <div className="text-base font-semibold text-slate-300 group-hover:text-slate-200 transition-colors">
                    {new Date(tx.created_at || tx.date || Date.now()).toLocaleString()}
                  </div>
                </div>

                {/* User ID Card */}
                <div className="group rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/70 to-slate-950/70 p-6 backdrop-blur-xl hover:border-slate-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/50">
                  <div className="text-xs uppercase tracking-wider text-slate-500 mb-3 font-semibold">User ID</div>
                  <div className="text-base font-mono text-slate-300 group-hover:text-slate-200 transition-colors">{tx.user?.id ?? tx.user_id ?? "—"}</div>
                </div>
              </div>

              {/* Additional Details Card */}
              <div className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/70 to-slate-950/70 p-6 backdrop-blur-xl">
                <h3 className="text-sm uppercase tracking-wider text-slate-400 mb-4 font-semibold flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-cyan-500 to-emerald-500 rounded-full"></div>
                  Additional Details
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs text-slate-500 mb-1.5">Device</div>
                    <div className="text-base font-mono text-slate-300">{tx.device ?? tx.device_id ?? "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1.5">Transaction ID</div>
                    <div className="text-base font-mono text-slate-300">{tx.id}</div>
                  </div>
                </div>
              </div>

              {/* Info Note */}
              <div className="flex items-start gap-3 p-5 rounded-2xl border border-emerald-800/30 bg-emerald-950/10 backdrop-blur-sm">
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-slate-400 leading-relaxed">
                  If you see "Tried multiple endpoints" when loading, update the <code className="px-2 py-1 rounded bg-slate-800/50 text-cyan-400 text-xs font-mono">endpoints</code> array in the source file.
                </div>
              </div>
            </div>

            {/* Right Column - Raw JSON Data (45%) */}
            <div className="flex-[0_0_45%] flex flex-col overflow-hidden">
              <div className="rounded-3xl border border-slate-800/50 bg-gradient-to-br from-slate-900/70 to-slate-950/70 backdrop-blur-xl shadow-2xl flex flex-col h-full overflow-hidden">
                <div className="flex-none flex items-center justify-between p-6 border-b border-slate-800/50 bg-slate-900/30">
                  <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-cyan-400" />
                    Raw Transaction Data
                  </h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setRawVisible((s) => !s)}
                      className="px-4 py-2 rounded-xl border border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/60 text-slate-300 hover:text-slate-100 text-sm font-medium transition-all duration-300"
                    >
                      {rawVisible ? "Collapse" : "Expand"}
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(JSON.stringify(tx, null, 2));
                          toast.success("JSON copied to clipboard");
                        } catch {
                          toast.error("Copy failed");
                        }
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/60 text-slate-300 hover:text-slate-100 text-sm font-medium transition-all duration-300"
                    >
                      <Clipboard className="w-4 h-4" /> Copy
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden">
                  {rawVisible ? (
                    <div className="h-full overflow-auto custom-scrollbar bg-[#0d1117]">
                      <pre className="p-6 text-[13px] leading-relaxed">
                        <code className="json-code">{JSON.stringify(tx, null, 2)}</code>
                      </pre>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500">
                      <div className="text-center">
                        <Code2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <div className="text-sm text-slate-400">Click "Expand" to view JSON data</div>
                        <div className="text-xs text-slate-500 mt-1">Full transaction object with all properties</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.4);
          border-radius: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.6);
          border-radius: 5px;
          border: 2px solid rgba(15, 23, 42, 0.4);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 0.8);
        }

        /* Enhanced JSON Syntax Highlighting */
        .json-code {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
          color: #e2e8f0;
        }

        /* JSON string values (green) */
        pre code::before {
          content: '';
        }
        
        pre {
          tab-size: 2;
          -moz-tab-size: 2;
        }
      `}</style>
    </div>
  );
}