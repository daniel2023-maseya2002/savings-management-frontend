// src/components/ai/FlagTransactionModal.jsx
// Controlled modal for flagging transactions from admin UI.
// Props: { tx, onClose, onFlagged } where tx is { id, amount, user_id, score, detector }.

import { useState } from "react";
import { toast } from "react-toastify";
import { flagTransaction } from "./api";

export default function FlagTransactionModal({ tx, onClose = () => {}, onFlagged = () => {} }) {
  const [reason, setReason] = useState("anomaly");
  const [note, setNote] = useState("");
  const [metadata, setMetadata] = useState(JSON.stringify({ detector: tx?.detector ?? "isolation_forest", score: tx?.score ?? null }, null, 2));
  const [submitting, setSubmitting] = useState(false);

  async function handleFlag() {
    setSubmitting(true);
    try {
      const body = { reason, note, metadata: JSON.parse(metadata || "{}"), analysis_report_id: tx.analysis_report_id };
      const res = await flagTransaction(tx.id, body);
      toast.success("Transaction flagged");
      onFlagged(res);
      onClose();
    } catch (err) {
      console.error("flag tx", err);
      toast.error("Failed to flag transaction");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl bg-[#0c131d] rounded-xl border border-slate-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-semibold">Flag transaction #{tx?.id}</div>
            <div className="text-xs text-slate-400">amount: {tx?.amount} — user: {tx?.user_id}</div>
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
