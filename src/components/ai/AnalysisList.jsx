// src/components/ai/AnalysisList.jsx
import { useEffect, useState } from "react";
import axios from "../../api/axios";

const ENDPOINT_LIST = "/ai/admin/analysis/";
const ENDPOINT_EXPORT = (id, part) => `/ai/admin/analysis/${id}/export/?part=${part}`;

export default function AnalysisList({ onOpenReport }) {
  const [list, setList] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, [page]);

  async function load() {
    setLoading(true); setError("");
    try {
      const res = await axios.get(ENDPOINT_LIST, { params: { page, page_size: pageSize } });
      setList(res.data.results || res.data || []);
    } catch (err) {
      console.error("load analyses", err);
      setError(err?.response?.data?.detail || "Failed to load analyses");
    } finally { setLoading(false); }
  }

  function exportCsv(id, part = "anomalies") {
    // open signed export link in new tab. axios attaches auth; it's fine to open direct URL because cookies or token header won't be sent by window.open.
    // Build URL relative to base, instruct user to use browser with authorization. We will attempt to get a temporary export URL from backend using axios first.
    axios.get(`/ai/admin/analysis/${id}/export/`, { params: { part } , responseType: "blob" })
      .then((res) => {
        const blob = new Blob([res.data], { type: res.headers["content-type"] || "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `analysis_${id}_${part}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      })
      .catch((err) => {
        console.error("export failed", err);
        alert("Export failed. Check console.");
      });
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm text-slate-300">Recent analyses</div>
        <div className="text-xs text-slate-400">Page {page}</div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="py-6 text-center text-slate-400">Loading…</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : list.length === 0 ? (
          <div className="text-slate-400 py-6">No analyses yet.</div>
        ) : (
          list.map((r) => (
            <div key={r.id} className="bg-[#071829] p-3 rounded border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{r.name || `Report #${r.id}`}</div>
                <div className="text-xs text-slate-400">Created: {new Date(r.created_at).toLocaleString()}</div>
                <div className="text-xs text-slate-400 mt-1">Summary: {r.summary ? `${r.summary.count} tx — ${r.summary.total_amount}` : "pending / processing"}</div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => onOpenReport(r.id)} className="px-3 py-1 rounded bg-indigo-600 text-white text-sm">View</button>
                <button onClick={() => exportCsv(r.id, "anomalies")} className="px-3 py-1 rounded border text-sm">Export anomalies</button>
                <button onClick={() => exportCsv(r.id, "clusters")} className="px-3 py-1 rounded border text-sm">Export clusters</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex gap-2 justify-end">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 rounded border">Prev</button>
        <button onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded border">Next</button>
      </div>
    </div>
  );
}
