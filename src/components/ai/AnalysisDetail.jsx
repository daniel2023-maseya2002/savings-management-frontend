// src/components/ai/AnalysisDetail.jsx
import { useEffect, useState } from "react";
import axios from "../../api/axios";
import FlagTransactionModal from "./FlagTransactionModal";

const ENDPOINT_REPORT = (id) => `/ai/admin/analysis/${id}/`;
const ENDPOINT_EXPORT = (id, part) => `/ai/admin/analysis/${id}/export/?part=${part}`;

export default function AnalysisDetail({ reportId, onClose, onReportUpdated }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [flagTx, setFlagTx] = useState(null);

  useEffect(() => {
    if (reportId) load();
    // eslint-disable-next-line
  }, [reportId]);

  async function load() {
    setLoading(true);
    try {
      const res = await axios.get(ENDPOINT_REPORT(reportId));
      setReport(res.data);
    } catch (err) {
      console.error("load report", err);
      alert("Failed to load report");
    } finally {
      setLoading(false);
    }
  }

  async function exportPart(part = "anomalies") {
    try {
      const res = await axios.get(ENDPOINT_EXPORT(reportId, part), { responseType: "blob" });
      const blob = new Blob([res.data], { type: res.headers["content-type"] || "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report_${reportId}_${part}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("export", err);
      alert("Export failed");
    }
  }

  if (!reportId) return null;

  return (
    <div className="bg-[#071829] p-4 rounded-xl border border-slate-800">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{report?.name || `Report #${reportId}`}</h2>
          <div className="text-sm text-slate-400">Created: {report?.created_at ? new Date(report.created_at).toLocaleString() : "—"}</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportPart("anomalies")} className="px-3 py-1 rounded bg-indigo-600 text-white">Export anomalies</button>
          <button onClick={() => exportPart("clusters")} className="px-3 py-1 rounded border">Export clusters</button>
          <button onClick={() => { if (onClose) onClose(); }} className="px-3 py-1 rounded border">Close</button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-2 bg-[#0c131d] rounded p-3 border border-slate-800">
          <h3 className="font-medium mb-2">Summary</h3>
          {loading ? (<div>Loading...</div>) : (
            <>
              <div className="text-sm text-slate-300">Transactions analyzed: <span className="font-medium">{report?.summary?.count ?? "-"}</span></div>
              <div className="text-sm text-slate-300">Total amount: <span className="font-medium">{report?.summary?.total_amount ?? "-"}</span></div>
              <div className="text-sm text-slate-300">Avg amount: <span className="font-medium">{report?.summary?.avg_amount ?? "-"}</span></div>
              <div className="text-sm text-slate-300">Top users by volume: <pre className="text-xs mt-2 whitespace-pre-wrap">{JSON.stringify(report?.summary?.top_users_by_volume, null, 2)}</pre></div>
            </>
          )}
        </div>

        <div className="bg-[#0c131d] rounded p-3 border border-slate-800">
          <h3 className="font-medium mb-2">Anomalies preview</h3>
          {report?.anomalies?.length ? (
            <div className="space-y-2 max-h-48 overflow-auto">
              {report.anomalies.slice(0, 8).map((a) => (
                <div key={a.id} className="p-2 bg-[#071829] rounded border border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">TX #{a.id} — {a.amount}</div>
                    <div className="text-xs text-slate-400">user: {a.user_id} — score: {a.score?.toFixed?.(4)}</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => setFlagTx(a)} className="px-2 py-1 text-xs rounded bg-emerald-600 text-slate-900">Flag</button>
                    <button onClick={() => { window.open(`/admin/transactions/${a.id}/change/`, "_blank"); }} className="px-2 py-1 text-xs rounded border">Open</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (<div className="text-sm text-slate-400">No anomalies found or report pending.</div>)}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="font-medium mb-2">Clusters (sample)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {report?.clusters ? Object.entries(report.clusters).slice(0,4).map(([k, v]) => (
            <div key={k} className="bg-[#0c131d] p-3 rounded border border-slate-800">
              <div className="text-sm">Cluster {k} — count: {v.count} — avg: {v.avg_amount}</div>
              <div className="text-xs text-slate-400 mt-1">sample ids: {v.sample_ids?.slice(0,6).join(", ")}</div>
            </div>
          )) : <div className="text-sm text-slate-400">No clusters available.</div>}
        </div>
      </div>

      {flagTx && <FlagTransactionModal tx={flagTx} onClose={() => { setFlagTx(null); if (onReportUpdated) onReportUpdated(); }} />}
    </div>
  );
}
