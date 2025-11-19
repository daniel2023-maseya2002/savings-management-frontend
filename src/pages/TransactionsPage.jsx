// src/pages/TransactionsPage.jsx
import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  FileInput,
  Grid,
  List,
  Plus,
  RefreshCcw,
  TrendingDown,
  TrendingUp,
  Wifi,
  WifiOff
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import axios from "../api/axios";

/* ---------------- helpers ---------------- */
const fmtMoney = (n) =>
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const normalizeTx = (raw) =>
  raw.map((t) => {
    const tx_type =
      (t.tx_type || t.type || "").toString().toUpperCase() === "DEPOSIT"
        ? "Deposit"
        : "Withdraw";
    return {
      id: t.id,
      tx_type,
      amount: Number(t.amount || 0),
      created_at: t.created_at || t.date || null,
      date: t.created_at
        ? new Date(t.created_at).toLocaleString()
        : t.date
        ? new Date(t.date).toLocaleString()
        : "—",
      status: t.status
        ? t.status.charAt(0).toUpperCase() + t.status.slice(1)
        : "Completed",
      raw: t,
    };
  });

/** group by YYYY-MM-DD for a small per-day trend */
function buildDailyTrend(transactions) {
  const byDay = new Map();
  transactions.forEach((t) => {
    if (!t.created_at) return;
    const d = new Date(t.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
    if (!byDay.has(key))
      byDay.set(key, { date: key, deposits: 0, withdrawals: 0 });
    const row = byDay.get(key);
    if (t.tx_type === "Deposit") row.deposits += Number(t.amount || 0);
    else row.withdrawals += Number(t.amount || 0);
  });

  const arr = Array.from(byDay.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  return arr.map((r) => ({ ...r, net: r.deposits - r.withdrawals }));
}

/* sparkline */
function SparkMini({ data, dataKey, stroke }) {
  if (!data?.length) return null;
  return (
    <ResponsiveContainer width="100%" height={64}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`g-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={stroke} stopOpacity={0.45} />
            <stop offset="95%" stopColor={stroke} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={stroke}
          strokeWidth={2}
          fillOpacity={1}
          fill={`url(#g-${dataKey})`}
          dot={false}
        />
        <XAxis dataKey="date" hide />
        <YAxis hide />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* Enhanced transaction card */
function TxCard({ t, compact = false }) {
  const isDep = t.tx_type === "Deposit";
  
  if (compact) {
    return (
      <div className="group rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/60 to-slate-950/60 p-5 backdrop-blur-xl hover:border-slate-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/50">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="text-sm font-semibold text-slate-200 group-hover:text-slate-100 transition-colors">{t.tx_type}</div>
            <div className="text-xs text-slate-500 mt-1">{t.date}</div>
          </div>
          <div className={`p-2 rounded-xl ${isDep ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-rose-500/10 border border-rose-500/30"}`}>
            {isDep ? (
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-rose-400" />
            )}
          </div>
        </div>
        <div className="text-2xl font-bold text-cyan-300">${fmtMoney(t.amount)}</div>
        <div className={`text-xs mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
          ${t.status.toLowerCase() === "completed" ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" :
            t.status.toLowerCase() === "pending" ? "bg-amber-500/15 text-amber-300 border border-amber-500/30" :
            "bg-rose-500/15 text-rose-300 border border-rose-500/30"}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${t.status.toLowerCase() === "completed" ? "bg-emerald-400" : t.status.toLowerCase() === "pending" ? "bg-amber-400" : "bg-rose-400"}`}></div>
          {t.status}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-w-[280px] max-w-[280px] rounded-2xl border backdrop-blur-xl px-5 py-4 mr-4 transition-all duration-300 hover:shadow-xl
      ${isDep ? "bg-gradient-to-br from-emerald-950/40 to-slate-950/40 border-emerald-500/30 hover:shadow-emerald-500/20" : "bg-gradient-to-br from-rose-950/40 to-slate-950/40 border-rose-500/30 hover:shadow-rose-500/20"}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
          {t.tx_type}
        </span>
        <span className="text-[11px] text-slate-500">{t.date}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${isDep ? "bg-emerald-500/20 border border-emerald-500/40" : "bg-rose-500/20 border border-rose-500/40"}`}>
          {isDep ? (
            <ArrowUpRight className="w-5 h-5 text-emerald-400" />
          ) : (
            <ArrowDownRight className="w-5 h-5 text-rose-400" />
          )}
        </div>
        <div className="flex flex-col">
          <div className="text-xl font-bold text-slate-100">
            ${fmtMoney(t.amount)}
          </div>
          <div className={`text-[11px] mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit
            ${t.status.toLowerCase() === "completed" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" :
              t.status.toLowerCase() === "pending" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
              "bg-rose-500/20 text-rose-300 border border-rose-500/40"}`}>
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${t.status.toLowerCase() === "completed" ? "bg-emerald-400" : t.status.toLowerCase() === "pending" ? "bg-amber-400" : "bg-rose-400"}`}></div>
            {t.status}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------- Component ------------------- */
export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [depExpanded, setDepExpanded] = useState(false);
  const [witExpanded, setWitExpanded] = useState(false);

  const [realtimeEnabled, setRealtimeEnabled] = useState(false);
  const wsRef = useRef(null);
  const pollRef = useRef(null);

  const [compactView, setCompactView] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createType, setCreateType] = useState("deposit");
  const [createAmount, setCreateAmount] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const [exportingPdf, setExportingPdf] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const tryList = ["/savings/transactions/", "/transactions/"];
      let res = null;
      for (const ep of tryList) {
        try {
          res = await axios.get(ep);
          if (res && res.data) break;
        } catch (e) {}
      }
      if (!res) throw new Error("No transactions endpoint responded");
      const raw = Array.isArray(res.data?.results) ? res.data.results : res.data;
      setTransactions(normalizeTx(raw || []));
    } catch (err) {
      console.error("Transaction fetch failed:", err);
      setTransactions([]);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

    pollRef.current = setInterval(() => {
      if (!realtimeEnabled) refreshHead();
    }, 25000);

    return () => {
      clearInterval(pollRef.current);
      closeWs();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getWsUrl() {
    try {
      const base = axios?.defaults?.baseURL || window.location.origin;
      let u = base.replace(/\/+$/, "");
      u = u.replace(/\/api\/?$/i, "");
      const loc = new URL(u);
      const protocol = loc.protocol === "https:" ? "wss:" : "ws:";
      return `${protocol}//${loc.host}/ws/transactions/`;
    } catch (e) {
      return `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws/transactions/`;
    }
  }

  function openWs() {
    try {
      const url = getWsUrl();
      wsRef.current = new WebSocket(url);
      wsRef.current.onopen = () => {
        console.debug("WS open", url);
        toast.success("Real-time updates connected");
      };
      wsRef.current.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          if (payload?.type === "new_transaction" && payload.data) {
            const newTx = normalizeTx([payload.data])[0];
            setTransactions((prev) => [newTx, ...prev]);
            toast.info("New transaction received");
          } else if (payload?.type === "refresh") {
            load();
          }
        } catch (err) {
          console.debug("WS message parse error", err);
        }
      };
      wsRef.current.onclose = () => {
        wsRef.current = null;
        console.debug("WS closed");
        toast.info("Real-time updates disconnected");
      };
      wsRef.current.onerror = (err) => {
        console.error("WS error", err);
      };
      setRealtimeEnabled(true);
    } catch (err) {
      console.error("openWs failed", err);
      toast.error("Failed to open realtime connection");
    }
  }

  function closeWs() {
    try {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    } catch (e) {}
    setRealtimeEnabled(false);
  }

  async function refreshHead() {
    try {
      const tryList = ["/savings/transactions/?page=1&page_size=1", "/transactions/?page=1&page_size=1"];
      for (const ep of tryList) {
        try {
          const res = await axios.get(ep);
          if (!res?.data) continue;
          const payload = res.data;
          const latest = Array.isArray(payload) ? payload[0] : (payload.results ? payload.results[0] : null);
          if (!latest) continue;
          const localLatest = transactions[0]?.id;
          if (localLatest && latest.id && Number(latest.id) !== Number(localLatest)) {
            toast.info("New transactions available — refreshing");
            load();
          }
          return;
        } catch (e) {}
      }
    } catch (err) {
      console.debug("refreshHead failed", err);
    }
  }

  async function handleCreateSubmit(e) {
    e?.preventDefault();
    if (!createAmount || Number(createAmount) <= 0) return toast.error("Enter a valid amount");
    setCreateSubmitting(true);
    try {
      const payload = {
        amount: Number(createAmount),
        tx_type: createType === "deposit" ? "deposit" : "withdraw",
      };
      const tryList = ["/savings/transactions/", "/transactions/"];
      let res = null;
      for (const ep of tryList) {
        try {
          res = await axios.post(ep, payload);
          if (res && res.data) break;
        } catch (err) {}
      }
      if (!res) throw new Error("Create failed");
      const newTx = normalizeTx([res.data])[0];
      setTransactions((s) => [newTx, ...s]);
      toast.success("Transaction created successfully");
      setCreateOpen(false);
      setCreateAmount("");
    } catch (err) {
      console.error("Create tx failed", err);
      toast.error("Create transaction failed");
    } finally {
      setCreateSubmitting(false);
    }
  }

  async function handleFileUpload(file) {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const tryList = ["/transactions/import/", "/transactions/upload/", "/savings/transactions/import/"];
      let res = null;
      for (const ep of tryList) {
        try {
          res = await axios.post(ep, form, { headers: { "Content-Type": "multipart/form-data" } });
          if (res) break;
        } catch (err) {}
      }
      if (!res) throw new Error("Upload failed");
      toast.success("File uploaded successfully");
      load();
    } catch (err) {
      console.error("Upload failed", err);
      toast.error("Upload failed. Make sure your backend supports CSV/Excel import.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = (e) => reject(e);
      document.head.appendChild(s);
    });
  }

  function buildPrintableHtml(txs, summary) {
    const now = new Date().toLocaleString();
    const rows = (txs || []).map(
      (t) =>
        `<tr class="row">
          <td class="cell id">#${t.id}</td>
          <td class="cell type">
            <div class="type-badge ${t.tx_type === 'Deposit' ? 'deposit' : 'withdraw'}">
              <span class="icon">${t.tx_type === 'Deposit' ? '↑' : '↓'}</span>
              ${escapeHtml(t.tx_type)}
            </div>
          </td>
          <td class="cell amount">$${fmtMoney(t.amount)}</td>
          <td class="cell status">
            <span class="status-badge ${t.status.toLowerCase()}">${escapeHtml(t.status)}</span>
          </td>
          <td class="cell date">${escapeHtml(t.date)}</td>
        </tr>`
    ).join("");

    return `
      <!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Transaction Report - SavingDM</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; }
        body { background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 40px 20px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        
        .container { max-width: 1000px; margin: 0 auto; background: white; border-radius: 24px; box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12); overflow: hidden; }
        
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 48px 40px; position: relative; overflow: hidden; }
        .header::before { content: ''; position: absolute; top: -50%; right: -20%; width: 500px; height: 500px; background: radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%); border-radius: 50%; }
        .header::after { content: ''; position: absolute; bottom: -30%; left: -10%; width: 400px; height: 400px; background: radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%); border-radius: 50%; }
        
        .brand { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; position: relative; z-index: 1; }
        .logo { width: 56px; height: 56px; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800; color: white; box-shadow: 0 8px 24px rgba(6, 182, 212, 0.4); }
        .brand-info h1 { font-size: 32px; font-weight: 800; margin-bottom: 4px; letter-spacing: -0.02em; }
        .brand-info p { font-size: 14px; opacity: 0.8; }
        
        .report-meta { display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 1; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
        .report-meta .left { font-size: 15px; opacity: 0.9; }
        .report-meta .right { text-align: right; }
        .report-meta .right .count { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
        .report-meta .right .label { font-size: 13px; opacity: 0.7; }
        
        .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; padding: 40px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); }
        .summary-card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06); border: 1px solid #e2e8f0; }
        .summary-card .label { font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
        .summary-card .value { font-size: 32px; font-weight: 800; color: #0f172a; }
        .summary-card.deposits .value { color: #059669; }
        .summary-card.withdrawals .value { color: #dc2626; }
        .summary-card.net .value { color: ${summary.net >= 0 ? '#059669' : '#dc2626'}; }
        
        .content { padding: 40px; }
        
        table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 24px; }
        thead { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); }
        thead th { padding: 16px 20px; text-align: left; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e2e8f0; }
        thead th:first-child { border-top-left-radius: 12px; }
        thead th:last-child { border-top-right-radius: 12px; }
        
        tbody .row { transition: all 0.2s; }
        tbody .row:hover { background: #f8fafc; }
        tbody .row:not(:last-child) { border-bottom: 1px solid #f1f5f9; }
        tbody .cell { padding: 18px 20px; font-size: 14px; color: #334155; vertical-align: middle; }
        
        .cell.id { font-weight: 700; color: #64748b; width: 8%; }
        .cell.type { width: 20%; }
        .type-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; font-size: 13px; font-weight: 600; }
        .type-badge.deposit { background: #d1fae5; color: #065f46; }
        .type-badge.withdraw { background: #fee2e2; color: #991b1b; }
        .type-badge .icon { font-size: 16px; }
        
        .cell.amount { width: 20%; text-align: right; font-weight: 700; font-size: 15px; color: #0f172a; }
        .cell.status { width: 18%; }
        .status-badge { display: inline-block; padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; }
        .status-badge.completed { background: #d1fae5; color: #065f46; }
        .status-badge.pending { background: #fef3c7; color: #92400e; }
        .status-badge.failed, .status-badge.rejected { background: #fee2e2; color: #991b1b; }
        
        .cell.date { width: 34%; text-align: right; color: #64748b; font-size: 13px; }
        
        .footer { margin-top: 40px; padding: 32px 40px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
        .footer-left { display: flex; align-items: center; gap: 16px; }
        .footer-logo { width: 44px; height: 44px; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; color: white; }
        .footer-info h3 { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
        .footer-info p { font-size: 12px; color: #64748b; }
        .footer-right { text-align: right; font-size: 12px; color: #64748b; }
        
        @media print {
          body { padding: 0; background: white; }
          .container { box-shadow: none; border-radius: 0; }
          .summary { page-break-inside: avoid; }
          tbody .row { page-break-inside: avoid; }
          .footer { position: fixed; bottom: 0; left: 0; right: 0; }
        }
      </style></head><body>
      <div class="container">
        <div class="header">
          <div class="brand">
            <div class="logo">S</div>
            <div class="brand-info">
              <h1>SavingDM</h1>
              <p>Secure Micro-Savings Platform • Transaction Report</p>
            </div>
          </div>
          <div class="report-meta">
            <div class="left">Generated on ${now}</div>
            <div class="right">
              <div class="count">${summary.count}</div>
              <div class="label">Total Transactions</div>
            </div>
          </div>
        </div>
        
        <div class="summary">
          <div class="summary-card deposits">
            <div class="label">Total Deposits</div>
            <div class="value">$${fmtMoney(summary.deposits)}</div>
          </div>
          <div class="summary-card withdrawals">
            <div class="label">Total Withdrawals</div>
            <div class="value">$${fmtMoney(summary.withdrawals)}</div>
          </div>
          <div class="summary-card net">
            <div class="label">Net Flow</div>
            <div class="value">$${fmtMoney(summary.net)}</div>
          </div>
        </div>
        
        <div class="content">
          <h2 style="font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Transaction History</h2>
          <p style="font-size: 14px; color: #64748b; margin-bottom: 16px;">Complete record of all financial activities</p>
          
          <table>
            <thead><tr>
              <th>ID</th>
              <th>Type</th>
              <th style="text-align:right">Amount</th>
              <th>Status</th>
              <th style="text-align:right">Date</th>
            </tr></thead>
            <tbody>${rows || `<tr><td class="cell" colspan="5" style="text-align:center; padding:40px; color:#94a3b8">No transactions available</td></tr>`}</tbody>
          </table>
        </div>
        
        <div class="footer">
          <div class="footer-left">
            <div class="footer-logo">S</div>
            <div class="footer-info">
              <h3>SavingDM</h3>
              <p>contact@savingdm.com • +250 7XX XXX XXX</p>
            </div>
          </div>
          <div class="footer-right">
            <div>© ${new Date().getFullYear()} SavingDM. All rights reserved.</div>
            <div style="margin-top: 4px;">Confidential Document</div>
          </div>
        </div>
      </div>
      </body></html>
    `;
  }

  function escapeHtml(text) {
    if (text === null || text === undefined) return "";
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function totalsSummary(txs) {
    const list = txs || [];
    const dep = list.filter((t) => t.tx_type === "Deposit").reduce((a, t) => a + (t.amount || 0), 0);
    const wit = list.filter((t) => t.tx_type === "Withdraw").reduce((a, t) => a + (t.amount || 0), 0);
    return { deposits: dep, withdrawals: wit, net: dep - wit, count: list.length };
  }

  async function exportPdf() {
    setExportingPdf(true);
    toast.info("Generating PDF... Please wait");
    
    try {
      // Try backend first
      const tryBackends = [
        "/transactions/export/?format=pdf",
        "/savings/transactions/export/?format=pdf",
        "/transactions/?format=pdf",
      ];
      
      for (const ep of tryBackends) {
        try {
          const res = await axios.get(ep, { responseType: "blob" });
          if (res?.data) {
            const blob = new Blob([res.data], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `SavingDM_Transactions_${new Date().toISOString().slice(0, 10)}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toast.success("PDF downloaded successfully");
            setExportingPdf(false);
            return;
          }
        } catch (e) {}
      }

      // Fallback: client-side generation
      const HTML2CANVAS = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
      const JSPDF = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";

      await loadScript(HTML2CANVAS);
      await loadScript(JSPDF);

      const summary = totalsSummary(transactions);
      const html = buildPrintableHtml(transactions, summary);

      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.width = "1200px";
      container.style.padding = "0";
      container.style.background = "#fff";
      container.innerHTML = html;
      document.body.appendChild(container);

      await new Promise((res) => setTimeout(res, 400));

      if (!window.html2canvas) throw new Error("html2canvas not available");
      
      const canvas = await window.html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const { jsPDF } = window.jspdf || {};
      if (!jsPDF) throw new Error("jsPDF not available");

      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const pdfWidth = pageWidth - margin * 2;

      const imgData = canvas.toDataURL("image/png", 1.0);
      const imgWidthPx = canvas.width;
      const imgHeightPx = canvas.height;
      const pxPerMm = imgWidthPx / pdfWidth;
      const imgHeightMm = imgHeightPx / pxPerMm;

      const mmToPx = (mm) => Math.round((mm * imgWidthPx) / pdfWidth);

      let yPxStart = 0;
      let remainingHeight = imgHeightMm;
      const chunkHeightMm = pageHeight - margin * 2;

      while (remainingHeight > 0) {
        const sliceHeightMm = Math.min(chunkHeightMm, remainingHeight);
        const sliceHeightPx = mmToPx(sliceHeightMm);

        const tmp = document.createElement("canvas");
        tmp.width = imgWidthPx;
        tmp.height = sliceHeightPx;
        const tctx = tmp.getContext("2d");
        tctx.fillStyle = "#ffffff";
        tctx.fillRect(0, 0, tmp.width, tmp.height);
        tctx.drawImage(canvas, 0, yPxStart, imgWidthPx, sliceHeightPx, 0, 0, imgWidthPx, sliceHeightPx);
        const tmpData = tmp.toDataURL("image/png", 1.0);

        pdf.addImage(tmpData, "PNG", margin, margin, pdfWidth, sliceHeightMm, undefined, "FAST");

        remainingHeight -= sliceHeightMm;
        yPxStart += sliceHeightPx;

        if (remainingHeight > 0) {
          pdf.addPage();
        }
      }

      const filename = `SavingDM_Transactions_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(filename);

      container.remove();
      toast.success("PDF generated & downloaded successfully");
      setExportingPdf(false);
    } catch (err) {
      console.error("Export PDF error", err);
      toast.error("Export PDF failed: " + (err.message || "Unknown error"));
      setExportingPdf(false);
    }
  }

  const deposits = useMemo(
    () => transactions.filter((t) => t.tx_type === "Deposit"),
    [transactions]
  );
  const withdrawals = useMemo(
    () => transactions.filter((t) => t.tx_type === "Withdraw"),
    [transactions]
  );

  const totals = useMemo(() => {
    const dep = deposits.reduce((a, t) => a + (t.amount || 0), 0);
    const wit = withdrawals.reduce((a, t) => a + (t.amount || 0), 0);
    return { deposits: dep, withdrawals: wit, net: dep - wit };
  }, [deposits, withdrawals]);

  const trend = useMemo(() => buildDailyTrend(transactions), [transactions]);

  const fadeIn = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      className="min-h-screen w-screen bg-[#0a0e1a] text-white flex flex-col px-6 lg:px-16 py-10 gap-8 pt-24 relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-[#0f1629] to-slate-950 -z-10"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(6,182,212,0.08),transparent_50%)] -z-10"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(16,185,129,0.06),transparent_50%)] -z-10"></div>

      {/* HEADER */}
      <motion.div
        className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
        variants={fadeIn}
        initial="hidden"
        animate="show"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-300 bg-clip-text text-transparent">
            Transaction History
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Monitor and manage all your financial activities
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              if (realtimeEnabled) closeWs();
              else openWs();
            }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-300 ${
              realtimeEnabled
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                : "border-slate-700/50 bg-slate-800/30 text-slate-400 hover:bg-slate-800/50"
            }`}
          >
            {realtimeEnabled ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {realtimeEnabled ? "Live" : "Connect"}
          </button>

          <button
            onClick={() => setCompactView((s) => !s)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 text-sm font-medium text-slate-300 transition-all duration-300"
          >
            {compactView ? <Grid className="w-4 h-4" /> : <List className="w-4 h-4" />}
            {compactView ? "Grid" : "List"}
          </button>

          <button
            onClick={() => { setCreateOpen(true); setCreateType("deposit"); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 text-sm font-semibold shadow-lg shadow-emerald-500/30 transition-all duration-300"
          >
            <Plus className="w-4 h-4" /> Create
          </button>

          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 text-sm font-medium text-slate-300 cursor-pointer transition-all duration-300">
            <FileInput className="w-4 h-4" />
            <input
              ref={fileRef}
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={(e) => handleFileUpload(e.target.files?.[0])}
              className="hidden"
            />
            {uploading ? "Uploading..." : "Import"}
          </label>

          <button
            onClick={exportPdf}
            disabled={exportingPdf}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 text-sm font-medium text-slate-300 transition-all duration-300 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exportingPdf ? "Exporting..." : "Export PDF"}
          </button>

          <button
            onClick={load}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600/20 to-cyan-500/20 border border-cyan-500/30 hover:from-cyan-600/30 hover:to-cyan-500/30 text-cyan-300 text-sm font-medium transition-all duration-300"
          >
            <RefreshCcw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </motion.div>

      {/* SUMMARY */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        variants={fadeIn}
        initial="hidden"
        animate="show"
      >
        <div className="group rounded-3xl bg-gradient-to-br from-emerald-950/40 to-slate-950/40 border border-emerald-500/30 backdrop-blur-xl p-6 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-slate-300">Total Deposits</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 group-hover:bg-emerald-500/20 transition-colors">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-300 mb-3">
            ${fmtMoney(totals.deposits)}
          </div>
          <div className="h-16">
            <SparkMini data={trend} dataKey="deposits" stroke="#10b981" />
          </div>
        </div>

        <div className="group rounded-3xl bg-gradient-to-br from-rose-950/40 to-slate-950/40 border border-rose-500/30 backdrop-blur-xl p-6 shadow-xl hover:shadow-2xl hover:shadow-rose-500/10 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-slate-300">Total Withdrawals</span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 group-hover:bg-rose-500/20 transition-colors">
              <TrendingDown className="w-5 h-5 text-rose-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-rose-300 mb-3">
            ${fmtMoney(totals.withdrawals)}
          </div>
          <div className="h-16">
            <SparkMini data={trend} dataKey="withdrawals" stroke="#f43f5e" />
          </div>
        </div>

        <div className="group rounded-3xl bg-gradient-to-br from-cyan-950/40 to-slate-950/40 border border-cyan-500/30 backdrop-blur-xl p-6 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-slate-300">Net Flow</span>
            <div className={`p-2.5 rounded-xl border ${totals.net >= 0 ? "bg-emerald-500/10 border-emerald-500/30 group-hover:bg-emerald-500/20" : "bg-rose-500/10 border-rose-500/30 group-hover:bg-rose-500/20"} transition-colors`}>
              {totals.net >= 0 ? <TrendingUp className="w-5 h-5 text-emerald-400" /> : <TrendingDown className="w-5 h-5 text-rose-400" />}
            </div>
          </div>
          <div className={`text-3xl font-bold mb-3 ${totals.net >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            ${fmtMoney(totals.net)}
          </div>
          <div className="h-16">
            <SparkMini data={trend} dataKey="net" stroke={totals.net >= 0 ? "#10b981" : "#f43f5e"} />
          </div>
        </div>
      </motion.div>

      {/* DEPOSITS */}
      <motion.div
        className="rounded-3xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-xl shadow-2xl overflow-hidden"
        variants={fadeIn}
        initial="hidden"
        animate="show"
      >
        <div className="px-8 py-6 border-b border-slate-800/50 bg-slate-900/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <ArrowUpRight className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-100">Deposits</h3>
              <p className="text-xs text-slate-500 mt-0.5">{deposits.length} transactions</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-sm text-slate-400">Total: <span className="font-semibold text-emerald-300">${fmtMoney(totals.deposits)}</span></div>
            {deposits.length > 10 && (
              <button onClick={() => setDepExpanded((s) => !s)} className="text-sm text-cyan-400 hover:text-cyan-300 transition font-medium">
                {depExpanded ? "Show less" : `View all ${deposits.length}`}
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className={compactView ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" : "flex gap-4"}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`${compactView ? "" : "min-w-[280px]"} h-32 rounded-2xl bg-slate-800/30 border border-slate-700/30 animate-pulse`} />
              ))}
            </div>
          ) : deposits.length ? (
            compactView ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(depExpanded ? deposits : deposits.slice(0, 9)).map((t) => (
                  <TxCard key={t.id} t={t} compact />
                ))}
              </div>
            ) : (
              <div className="flex overflow-x-auto no-scrollbar pb-2">
                {(depExpanded ? deposits : deposits.slice(0, 10)).map((t) => (
                  <TxCard key={t.id} t={t} />
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex p-4 rounded-full bg-slate-800/50 border border-slate-700/50 mb-4">
                <ArrowUpRight className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-500">No deposits found</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* WITHDRAWALS */}
      <motion.div
        className="rounded-3xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-xl shadow-2xl overflow-hidden"
        variants={fadeIn}
        initial="hidden"
        animate="show"
      >
        <div className="px-8 py-6 border-b border-slate-800/50 bg-slate-900/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30">
              <ArrowDownRight className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-100">Withdrawals</h3>
              <p className="text-xs text-slate-500 mt-0.5">{withdrawals.length} transactions</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-sm text-slate-400">Total: <span className="font-semibold text-rose-300">${fmtMoney(totals.withdrawals)}</span></div>
            {withdrawals.length > 10 && (
              <button onClick={() => setWitExpanded((s) => !s)} className="text-sm text-cyan-400 hover:text-cyan-300 transition font-medium">
                {witExpanded ? "Show less" : `View all ${withdrawals.length}`}
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className={compactView ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" : "flex gap-4"}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`${compactView ? "" : "min-w-[280px]"} h-32 rounded-2xl bg-slate-800/30 border border-slate-700/30 animate-pulse`} />
              ))}
            </div>
          ) : withdrawals.length ? (
            compactView ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(witExpanded ? withdrawals : withdrawals.slice(0, 9)).map((t) => (
                  <TxCard key={t.id} t={t} compact />
                ))}
              </div>
            ) : (
              <div className="flex overflow-x-auto no-scrollbar pb-2">
                {(witExpanded ? withdrawals : withdrawals.slice(0, 10)).map((t) => (
                  <TxCard key={t.id} t={t} />
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex p-4 rounded-full bg-slate-800/50 border border-slate-700/50 mb-4">
                <ArrowDownRight className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-500">No withdrawals found</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* DAILY TREND */}
      <motion.div
        className="rounded-3xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-xl p-6 shadow-2xl"
        variants={fadeIn}
        initial="hidden"
        animate="show"
      >
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-slate-100 mb-2">Daily Transaction Trend</h3>
          <p className="text-sm text-slate-400">Overview of deposits and withdrawals over time</p>
        </div>

        {trend.length ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="g-dep" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="g-wit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" style={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  border: "1px solid rgba(71, 85, 105, 0.3)",
                  borderRadius: "12px",
                  backdropFilter: "blur(12px)",
                }}
                labelStyle={{ color: "#cbd5e1" }}
                itemStyle={{ color: "#e2e8f0" }}
              />
              <Area
                type="monotone"
                dataKey="deposits"
                stroke="#10b981"
                fill="url(#g-dep)"
                strokeWidth={2.5}
                dot={false}
                name="Deposits"
              />
              <Area
                type="monotone"
                dataKey="withdrawals"
                stroke="#f43f5e"
                fill="url(#g-wit)"
                strokeWidth={2.5}
                dot={false}
                name="Withdrawals"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center py-20">
            <p className="text-slate-500">No trend data available</p>
          </div>
        )}
      </motion.div>

      {/* Create Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl border border-slate-800/50 p-8 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-slate-100">Create Transaction</h3>
              <button onClick={() => setCreateOpen(false)} className="p-2 rounded-xl hover:bg-slate-800/50 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Transaction Type</label>
                <select 
                  value={createType} 
                  onChange={(e) => setCreateType(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-200 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                >
                  <option value="deposit">Deposit</option>
                  <option value="withdraw">Withdraw</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Amount ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={createAmount} 
                  onChange={(e) => setCreateAmount(e.target.value)} 
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setCreateOpen(false)} 
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 text-slate-300 font-medium transition-all duration-300"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={createSubmitting} 
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-semibold shadow-lg shadow-emerald-500/30 transition-all duration-300 disabled:opacity-50"
                >
                  {createSubmitting ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </motion.div>
  );
}