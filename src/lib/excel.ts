"use client";

import * as XLSX from "xlsx";

/**
 * Export an array of flat objects to a real Excel (.xlsx) file.
 * Keys become column headers (camelCase converted to Title Case by default).
 */
export function exportToExcel(
  filename: string,
  sheetName: string,
  rows: Record<string, unknown>[],
  options?: { rawHeaders?: string[] }
) {
  if (!rows || rows.length === 0) {
    alert("Nothing to export — no records available.");
    return;
  }

  const headers = options?.rawHeaders ?? Object.keys(rows[0]);

  const worksheetData = rows.map((row) => {
    const cleanRow: Record<string, unknown> = {};
    headers.forEach((header) => {
      cleanRow[header] = row[header] ?? "";
    });
    return cleanRow;
  });

  const ws = XLSX.utils.json_to_sheet(worksheetData, { header: headers });
  ws["!cols"] = headers.map((h) => ({
    wch: Math.max(12, Math.min(40, String(h).length + 6)),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.replace(/[\\/?*[\]:]/g, " ").slice(0, 31));

  const safeName = filename.replace(/[\\/?*[\]:]/g, "_");
  XLSX.writeFile(wb, safeName.endsWith(".xlsx") ? safeName : `${safeName}.xlsx`);
}
