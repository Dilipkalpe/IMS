/** Client-side list/register export (WPF StandardListExportService parity). */

import { openHtmlPrintPreview, type OpenPrintPreviewOptions } from '../../utils/printPreview';

export interface ListExportColumn {
  id: string;
  header: string;
}

export type ListExportFormat = 'excel' | 'csv' | 'pdf' | 'print';

const UTF8_BOM = '\uFEFF';

export function escapeCsvCell(value: string | number | null | undefined): string {
  const s = String(value ?? '');
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildListCsv(
  columns: ListExportColumn[],
  rows: Record<string, string | number>[],
  options?: { includeBom?: boolean },
): string {
  const headerLine = columns.map((c) => escapeCsvCell(c.header)).join(',');
  const dataLines = rows.map((row) =>
    columns.map((c) => escapeCsvCell(row[c.id])).join(','),
  );
  const body = [headerLine, ...dataLines].join('\r\n');
  return options?.includeBom === true ? `${UTF8_BOM}${body}` : body;
}

export function timestampedFileName(prefix: string, ext: string): string {
  const stamp = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const ts = `${stamp.getFullYear()}${pad(stamp.getMonth() + 1)}${pad(stamp.getDate())}_${pad(stamp.getHours())}${pad(stamp.getMinutes())}`;
  const safe = prefix.replace(/[^\w-]+/g, '_').replace(/_+/g, '_');
  return `${safe}_${ts}.${ext}`;
}

export function downloadTextFile(content: string, fileName: string, mimeType: string): string {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return url;
}

export function exportListToExcelCsv(
  title: string,
  columns: ListExportColumn[],
  rows: Record<string, string | number>[],
): { fileName: string; downloadUrl: string } {
  const csv = buildListCsv(columns, rows, { includeBom: true });
  const fileName = timestampedFileName(title, 'csv');
  const downloadUrl = downloadTextFile(csv, fileName, 'text/csv;charset=utf-8');
  return { fileName, downloadUrl };
}

export function exportListToCsv(
  title: string,
  columns: ListExportColumn[],
  rows: Record<string, string | number>[],
): { fileName: string; downloadUrl: string } {
  const csv = buildListCsv(columns, rows);
  const fileName = timestampedFileName(title, 'csv');
  const downloadUrl = downloadTextFile(csv, fileName, 'text/csv;charset=utf-8');
  return { fileName, downloadUrl };
}

export function buildListPrintHtml(
  title: string,
  subtitle: string,
  columns: ListExportColumn[],
  rows: Record<string, string | number>[],
): string {
  const head = columns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('');
  const body = rows
    .map((row, idx) => {
      const cells = [`<td class="num">${idx + 1}</td>`]
        .concat(columns.map((c) => `<td>${escapeHtml(String(row[c.id] ?? ''))}</td>`))
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Segoe UI, system-ui, sans-serif; font-size: 11px; margin: 16px; color: #1a2b3c; }
    h1 { font-size: 16px; margin: 0 0 4px; }
    .meta { color: #5a6b7d; margin-bottom: 12px; font-size: 10px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #333; padding: 4px 6px; text-align: left; }
    th { background: #f2f2f2; }
    td.num { text-align: center; width: 36px; }
    @media print { body { margin: 10mm; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <div class="meta">${escapeHtml(subtitle)}</div>
  <table>
    <thead><tr><th>Sr.</th>${head}</tr></thead>
    <tbody>${body}</tbody>
  </table>
  <p class="meta" style="margin-top:12px">Printed ${escapeHtml(new Date().toLocaleString())}</p>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function openListPrintPreview(
  title: string,
  subtitle: string,
  columns: ListExportColumn[],
  rows: Record<string, string | number>[],
  options?: { autoPrint?: boolean; targetWindow?: Window | null },
): { ok: boolean; message: string } {
  const html = buildListPrintHtml(title, subtitle, columns, rows);
  const previewOptions: OpenPrintPreviewOptions = {
    autoPrint: options?.autoPrint,
    title,
    targetWindow: options?.targetWindow,
  };
  const outcome = openHtmlPrintPreview(html, previewOptions);
  if (!outcome.ok) {
    return outcome;
  }
  if (options?.autoPrint) {
    return { ok: true, message: `Sent ${rows.length} row(s) to printer.` };
  }
  return { ok: true, message: `Preview opened (${rows.length} row(s)). Use Ctrl+P to print.` };
}
