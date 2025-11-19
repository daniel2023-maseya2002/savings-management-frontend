// src/components/ai/api.js
// Small AI-focused API wrapper: centralizes AI endpoints and consistent error handling.
// Relies on your existing axios instance that attaches Authorization header.

import axios from "../../api/axios";

/**
 * Run an analysis (admin) - returns task id or created report id depending on backend.
 * params: { start, end, method, contamination, n_clusters, name }
 */
export async function runAnalysis(params) {
  const res = await axios.post("/ai/admin/analysis/run/", params);
  return res.data;
}

/**
 * List analysis reports (paginated).
 * query: { page, page_size }
 */
export async function listAnalyses(query = {}) {
  const res = await axios.get("/ai/admin/analysis/", { params: query });
  return res.data;
}

/**
 * Get single report
 */
export async function getAnalysis(reportId) {
  const res = await axios.get(`/ai/admin/analysis/${reportId}/`);
  return res.data;
}

/**
 * Export (server returns CSV blob). frontend consumer will set responseType "blob".
 */
export async function exportAnalysis(reportId, part = "anomalies") {
  const res = await axios.get(`/ai/admin/analysis/${reportId}/export/`, {
    params: { part },
    responseType: "blob",
  });
  return res;
}

/**
 * Flag a transaction (admin)
 * body: { reason, note, metadata, analysis_report_id }
 */
export async function flagTransaction(txId, body) {
  const res = await axios.post(`/ai/admin/transaction/${txId}/flag/`, body);
  return res.data;
}

/**
 * List transaction flags (admin)
 * query: { page, page_size, transaction, flagged_by, start_date, end_date }
 */
export async function listTransactionFlags(query = {}) {
  const res = await axios.get("/ai/admin/transaction/flags/", { params: query });
  return res.data;
}

/**
 * Resolve a flag by id (admin)
 */
export async function resolveFlag(flagId, body = { resolved: true, note: "" }) {
  const res = await axios.post(`/ai/admin/transaction/flag/${flagId}/resolve/`, body);
  return res.data;
}
