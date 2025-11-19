// src/components/ai/AnalysisRunForm.jsx
import { useState } from "react";
import axios from "../../api/axios";

const ENDPOINT_RUN = "/ai/admin/analysis/run/";

export default function AnalysisRunForm({ onRan }) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [method, setMethod] = useState("isolation_forest");
  const [contamination, setContamination] = useState(0.01);
  const [n_clusters, setNClusters] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRun(e) {
    e?.preventDefault();
    setError("");
    if (!start || !end) return setError("Start and end dates required.");
    setLoading(true);
    try {
      const res = await axios.post(ENDPOINT_RUN, {
        start,
        end,
        method,
        contamination: parseFloat(contamination),
        n_clusters: parseInt(n_clusters, 10),
        name: `Admin run ${new Date().toISOString()}`,
      });
      // res should contain created report id/data
      if (onRan) onRan();
      alert("Analysis started — refresh list to see result (or wait for completion).");
      setStart(""); setEnd("");
    } catch (err) {
      console.error("run analysis", err);
      setError(err?.response?.data?.detail || "Failed to start analysis.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleRun} className="space-y-3">
      <div>
        <label className="block text-xs text-slate-300">Start date</label>
        <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-full mt-1 p-2 rounded bg-[#071829] border border-slate-700 text-sm" />
      </div>
      <div>
        <label className="block text-xs text-slate-300">End date</label>
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
          <label className="block text-xs text-slate-300">Clusters (k)</label>
          <input type="number" min="1" value={n_clusters} onChange={(e) => setNClusters(e.target.value)} className="w-full mt-1 p-2 rounded bg-[#071829] border border-slate-700 text-sm" />
        </div>
      </div>

      {error && <div className="text-sm text-red-500">{error}</div>}

      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-900">
          {loading ? "Starting…" : "Run analysis"}
        </button>
        <button type="button" onClick={() => { setStart(""); setEnd(""); setContamination(0.01); setNClusters(4); }} className="px-3 py-2 rounded border border-slate-700 text-sm">Reset</button>
      </div>
    </form>
  );
}
