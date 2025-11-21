// src/pages/AdminLoginActivityPage.jsx
import dayjs from "dayjs";
import {
  Activity,
  AlertTriangle,
  AtSign,
  BarChart3,
  Calendar,
  CheckCircle2,
  Download,
  FileText,
  Globe,
  MonitorSmartphone,
  RefreshCw,
  Search,
  Shield,
  Smartphone,
  User,
  XCircle
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
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

/* ----------------------------- CSV Export ----------------------------- */
function downloadCsv(rows) {
  if (!rows?.length) {
    toast.error("No data to export");
    return;
  }
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
  toast.success("CSV exported successfully");
}

/* ----------------------------- PDF Export ----------------------------- */
function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildPdfHtml(rows, stats, filters) {
  const now = dayjs().format("MMMM DD, YYYY HH:mm:ss");
  
  const tableRows = rows.map(r => `
    <tr class="row ${r.success ? 'success' : 'failed'}">
      <td class="cell">${dayjs(r.created_at).format("YYYY-MM-DD HH:mm:ss")}</td>
      <td class="cell">${escapeHtml(r.username || "—")}</td>
      <td class="cell">${escapeHtml(r.email || "—")}</td>
      <td class="cell">${escapeHtml(r.device_id || "—")}</td>
      <td class="cell">${escapeHtml(r.ip_address || "—")}</td>
      <td class="cell" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(r.user_agent || "—")}</td>
      <td class="cell">
        <span class="status-badge ${r.success ? 'success' : 'failed'}">
          ${r.success ? '✓ Success' : '✗ Failed'}
        </span>
      </td>
      <td class="cell">${escapeHtml(r.message || "—")}</td>
    </tr>
  `).join("");

  return `
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Login Activity Report - SavingDM</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; }
        body { background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 40px 20px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 24px; box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12); overflow: hidden; }
        
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
        
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; padding: 40px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); }
        .summary-card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06); border: 1px solid #e2e8f0; }
        .summary-card .label { font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
        .summary-card .value { font-size: 32px; font-weight: 800; color: #0f172a; }
        .summary-card.success .value { color: #059669; }
        .summary-card.failed .value { color: #dc2626; }
        .summary-card.users .value { color: #6366f1; }
        
        .filters-section { padding: 32px 40px; background: #fafbfc; border-bottom: 1px solid #e2e8f0; }
        .filters-section h3 { font-size: 16px; font-weight: 700; color: #334155; margin-bottom: 16px; }
        .filters-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .filter-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b; }
        .filter-item strong { color: #0f172a; }
        
        .content { padding: 40px; }
        
        table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 24px; }
        thead { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); }
        thead th { padding: 16px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e2e8f0; }
        thead th:first-child { border-top-left-radius: 12px; }
        thead th:last-child { border-top-right-radius: 12px; }
        
        tbody .row { transition: all 0.2s; }
        tbody .row.success:hover { background: #f0fdf4; }
        tbody .row.failed:hover { background: #fef2f2; }
        tbody .row:not(:last-child) { border-bottom: 1px solid #f1f5f9; }
        tbody .cell { padding: 14px 12px; font-size: 12px; color: #334155; vertical-align: middle; }
        
        .status-badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; }
        .status-badge.success { background: #d1fae5; color: #065f46; }
        .status-badge.failed { background: #fee2e2; color: #991b1b; }
        
        .footer { margin-top: 40px; padding: 32px 40px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
        .footer-left { display: flex; align-items: center; gap: 16px; }
        .footer-logo { width: 44px; height: 44px; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; color: white; }
        .footer-info h3 { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
        .footer-info p { font-size: 12px; color: #64748b; }
        .footer-right { text-align: right; font-size: 12px; color: #64748b; }
        
        @media print {
          body { padding: 0; background: white; }
          .container { box-shadow: none; border-radius: 0; }
          .summary, .filters-section { page-break-inside: avoid; }
          tbody .row { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">
            <div class="logo">S</div>
            <div class="brand-info">
              <h1>SavingDM</h1>
              <p>Security & Authentication Platform • Login Activity Report</p>
            </div>
          </div>
          <div class="report-meta">
            <div class="left">Generated on ${now}</div>
            <div class="right">
              <div class="count">${rows.length}</div>
              <div class="label">Login Attempts</div>
            </div>
          </div>
        </div>
        
        <div class="summary">
          <div class="summary-card">
            <div class="label">Total Logins</div>
            <div class="value">${stats.total}</div>
          </div>
          <div class="summary-card success">
            <div class="label">Success Rate</div>
            <div class="value">${stats.successRate}%</div>
          </div>
          <div class="summary-card users">
            <div class="label">Unique Users</div>
            <div class="value">${stats.uniqueUsers}</div>
          </div>
          <div class="summary-card failed">
            <div class="label">Failed (24h)</div>
            <div class="value">${stats.failed24h}</div>
          </div>
        </div>
        
        ${filters.hasFilters ? `
        <div class="filters-section">
          <h3>Applied Filters</h3>
          <div class="filters-grid">
            ${filters.username ? `<div class="filter-item"><strong>Username:</strong> ${escapeHtml(filters.username)}</div>` : ''}
            ${filters.email ? `<div class="filter-item"><strong>Email:</strong> ${escapeHtml(filters.email)}</div>` : ''}
            ${filters.fromDt ? `<div class="filter-item"><strong>From:</strong> ${dayjs(filters.fromDt).format("YYYY-MM-DD HH:mm")}</div>` : ''}
            ${filters.toDt ? `<div class="filter-item"><strong>To:</strong> ${dayjs(filters.toDt).format("YYYY-MM-DD HH:mm")}</div>` : ''}
            ${filters.q ? `<div class="filter-item"><strong>Search:</strong> ${escapeHtml(filters.q)}</div>` : ''}
          </div>
        </div>
        ` : ''}
        
        <div class="content">
          <h2 style="font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Login Activity Log</h2>
          <p style="font-size: 14px; color: #64748b; margin-bottom: 16px;">Detailed record of all authentication attempts</p>
          
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Username</th>
                <th>Email</th>
                <th>Device</th>
                <th>IP Address</th>
                <th>User Agent</th>
                <th>Status</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="8" style="text-align:center; padding:40px; color:#94a3b8">No data available</td></tr>'}
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <div class="footer-left">
            <div class="footer-logo">S</div>
            <div class="footer-info">
              <h3>SavingDM</h3>
              <p>security@savingdm.com • +250 7XX XXX XXX</p>
            </div>
          </div>
          <div class="footer-right">
            <div>© ${new Date().getFullYear()} SavingDM. All rights reserved.</div>
            <div style="margin-top: 4px;">Confidential Security Report</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function exportPdf(rows, stats, filters) {
  if (!rows?.length) {
    toast.error("No data to export");
    return;
  }

  toast.info("Generating PDF... Please wait");

  try {
    // Load libraries
    const HTML2CANVAS = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
    const JSPDF = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";

    await loadScript(HTML2CANVAS);
    await loadScript(JSPDF);

    const html = buildPdfHtml(rows, stats, filters);

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

    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
    const pageWidth = 297;
    const pageHeight = 210;
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

    const filename = `Login_Activity_${dayjs().format("YYYYMMDD_HHmmss")}.pdf`;
    pdf.save(filename);

    container.remove();
    toast.success("PDF generated & downloaded successfully");
  } catch (err) {
    console.error("PDF export error:", err);
    toast.error("PDF export failed: " + (err.message || "Unknown error"));
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

/* ------------------------------- page ------------------------------- */
export default function AdminLoginActivityPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

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
      toast.success("Data loaded successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to load login activity.");
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

  const filters = useMemo(() => ({
    hasFilters: !!(q || username || email || fromDt || toDt),
    q, username, email, fromDt, toDt
  }), [q, username, email, fromDt, toDt]);

  return (
    <div className="min-h-screen w-screen bg-[#0a0e1a] text-white pt-24 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-[#0f1629] to-slate-950 -z-10"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(6,182,212,0.08),transparent_50%)] -z-10"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(16,185,129,0.06),transparent_50%)] -z-10"></div>

      <div className="px-8 py-8 flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-400/30 shadow-lg shadow-cyan-500/10">
              <Shield className="w-8 h-8 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-300 bg-clip-text text-transparent">
                Login Activity Monitor
              </h1>
              <p className="text-slate-400 text-sm mt-1">Track authentication attempts, devices, and security signals</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowExportMenu(!showExportMenu);
                }}
                disabled={!rows.length}
                className={cls(
                  "inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                  rows.length
                    ? "bg-gradient-to-r from-purple-600/20 to-purple-500/20 border border-purple-500/30 hover:from-purple-600/30 hover:to-purple-500/30 text-purple-300 shadow-lg shadow-purple-500/10"
                    : "bg-slate-800/30 border border-slate-700/30 text-slate-500 cursor-not-allowed"
                )}
              >
                <Download className="w-4 h-4" />
                Export
              </button>

              {showExportMenu && rows.length > 0 && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl overflow-hidden z-50">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowExportMenu(false);
                      downloadCsv(rows);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-800/50 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-emerald-400" />
                    Export as CSV
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowExportMenu(false);
                      exportPdf(rows, stats, filters);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-800/50 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-rose-400" />
                    Export as PDF
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600/20 to-emerald-500/20 border border-emerald-500/30 hover:from-emerald-600/30 hover:to-emerald-500/30 text-emerald-300 text-sm font-medium transition-all duration-300 shadow-lg shadow-emerald-500/10 disabled:opacity-50"
            >
              <RefreshCw className={cls("w-4 h-4", loading && "animate-spin")} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Total Logins"
            value={stats.total}
            icon={<Activity className="w-5 h-5 text-cyan-400" />}
            subtitle={`${rows.length ? dayjs(rows[0].created_at).format("MMM YYYY") : "—"}`}
            gradient="from-cyan-950/40 to-slate-950/40"
            border="border-cyan-500/30"
          />
          <StatCard
            title="Success Rate"
            value={`${stats.successRate}%`}
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            subtitle={`${stats.success}/${stats.total} successful`}
            gradient="from-emerald-950/40 to-slate-950/40"
            border="border-emerald-500/30"
          />
          <StatCard
            title="Unique Users"
            value={stats.uniqueUsers}
            icon={<User className="w-5 h-5 text-purple-400" />}
            subtitle="distinct accounts"
            gradient="from-purple-950/40 to-slate-950/40"
            border="border-purple-500/30"
          />
          <StatCard
            title="Failed (24h)"
            value={stats.failed24h}
            icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
            subtitle="security watch"
            gradient="from-amber-950/40 to-slate-950/40"
            border="border-amber-500/30"
          />
        </div>

        {/* Filters */}
        <div className="rounded-3xl border border-slate-800/50 bg-gradient-to-br from-slate-900/60 to-slate-950/60 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-800/50 bg-slate-900/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                <Search className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-100">Filters</h2>
                <p className="text-xs text-slate-500 mt-0.5">Refine your search results</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <Field
                icon={<Search className="h-4 w-4 text-cyan-300/80" />}
                placeholder="Search device/IP/UA"
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
                icon={<AtSign className="h-4 w-4 text-purple-300/80" />}
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Field
                type="datetime-local"
                icon={<Calendar className="h-4 w-4 text-slate-300/70" />}
                value={fromDt}
                onChange={(e) => setFromDt(e.target.value)}
              />
              <Field
                type="datetime-local"
                icon={<Calendar className="h-4 w-4 text-slate-300/70" />}
                value={toDt}
                onChange={(e) => setToDt(e.target.value)}
              />
              <button
                onClick={fetchData}
                disabled={loading}
                className="rounded-xl px-4 py-2.5 text-sm font-medium transition bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/30 disabled:opacity-50"
              >
                {loading ? "Filtering…" : "Apply"}
              </button>
            </div>

            {/* Quick presets */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">Quick range:</span>
              {["24h", "7d", "30d", "clear"].map((k) => (
                <button
                  key={k}
                  onClick={() => applyPreset(k)}
                  className="rounded-full px-3 py-1 text-xs transition border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 text-slate-300"
                >
                  {k.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Device & IP Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MiniFact
            icon={<Smartphone className="w-5 h-5 text-cyan-400" />}
            title="Most Active Device"
            value={stats.topDevice}
            badge="highest usage"
            gradient="from-cyan-950/40 to-slate-950/40"
            border="border-cyan-500/30"
          />
          <MiniFact
            icon={<Globe className="w-5 h-5 text-emerald-400" />}
            title="Most Active IP"
            value={stats.topIp}
            badge="most requests"
            gradient="from-emerald-950/40 to-slate-950/40"
            border="border-emerald-500/30"
          />
        </div>

        {/* Table */}
        <div className="rounded-3xl border border-slate-800/50 bg-gradient-to-br from-slate-900/60 to-slate-950/60 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-800/50 bg-slate-900/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-100">Activity Log</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{rows.length} records found</p>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-2xl bg-slate-800/30 border border-slate-700/30 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-900/50 backdrop-blur-md">
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Device</th>
                    <th className="px-6 py-4">IP Address</th>
                    <th className="px-6 py-4">User Agent</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      className={cls(
                        "transition-colors",
                        r.success ? "hover:bg-emerald-500/5" : "hover:bg-rose-500/5"
                      )}
                    >
                      <td className="px-6 py-4 text-slate-300">
                        {dayjs(r.created_at).format("YYYY-MM-DD HH:mm:ss")}
                      </td>
                      <td className="px-6 py-4 text-slate-100 font-medium">{r.username || "—"}</td>
                      <td className="px-6 py-4 text-slate-300">{r.email || "—"}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-2 text-slate-200">
                          <MonitorSmartphone className="h-4 w-4 text-cyan-300" />
                          {r.device_id || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{r.ip_address || "—"}</td>
                      <td className="px-6 py-4 text-slate-400 max-w-[32ch] truncate" title={r.user_agent}>
                        {r.user_agent || "—"}
                      </td>
                      <td className="px-6 py-4">
                        {r.success ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-300">
                            <XCircle className="h-3.5 w-3.5" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-300">{r.message || "—"}</td>
                    </tr>
                  ))}

                  {!rows.length && !loading && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-20 text-center text-sm text-slate-500"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <Activity className="w-12 h-12 text-slate-600" />
                          <p>No login activity found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close export menu */}
      {showExportMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowExportMenu(false)}
        />
      )}
    </div>
  );
}

/* ----------------------------- Components ----------------------------- */
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
        className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 px-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all"
      />
    </div>
  );
}

function StatCard({ title, value, icon, subtitle, gradient, border }) {
  return (
    <div className={cls(
      "rounded-2xl backdrop-blur-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300",
      "bg-gradient-to-br border",
      gradient,
      border
    )}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-300">{title}</span>
        <div className="p-2 rounded-xl bg-white/5 border border-white/10">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-slate-100">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {subtitle && (
        <div className="mt-3 text-xs text-slate-500">{subtitle}</div>
      )}
    </div>
  );
}

function MiniFact({ icon, title, value, badge, gradient, border }) {
  return (
    <div className={cls(
      "flex items-center justify-between rounded-2xl backdrop-blur-xl p-6 shadow-xl",
      "bg-gradient-to-br border",
      gradient,
      border
    )}>
      <div className="flex items-center gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          {icon}
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">{title}</div>
          <div className="text-base font-semibold text-slate-100">{value}</div>
        </div>
      </div>
      {badge && (
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
          {badge}
        </span>
      )}
    </div>
  );
}