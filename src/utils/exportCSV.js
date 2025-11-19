// src/utils/exportCSV.js
// Small helper to export a 2D array or list of objects to CSV and trigger download.

export function downloadCSVFromRows(rows, filename = "export.csv") {
  // rows: array of arrays (first row = headers) or array of objects (consistent keys)
  let csv = "";
  if (!rows || !rows.length) {
    csv = "";
  } else if (Array.isArray(rows[0])) {
    csv = rows.map((r) => r.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  } else {
    // objects
    const keys = Object.keys(rows[0]);
    csv += keys.join(",") + "\n";
    csv += rows.map((r) => keys.map((k) => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  }

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
