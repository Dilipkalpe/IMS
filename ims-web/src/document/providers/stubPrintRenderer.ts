import { DOCUMENT_TYPE_LABELS } from '../contracts/documentTypes';
import type { BillFormatDefinition } from '../contracts/billFormat';
import type { PrintableDocumentV1 } from '../contracts/printableDocument';
import { renderBillLayoutHtml } from '../renderers/billLayoutRenderer';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** HTML for browser print — uses API bill layout when available. */
export function renderPrintableDocumentHtml(
  document: PrintableDocumentV1,
  format: BillFormatDefinition,
): string {
  if (format.layoutJson) {
    try {
      const layoutHtml = renderBillLayoutHtml(document, format);
      if (layoutHtml) return layoutHtml;
    } catch {
      /* fall through to basic preview */
    }
  }

  const title = DOCUMENT_TYPE_LABELS[document.documentType] ?? document.documentType;
  const h = document.header;
  const rows = document.lines
    .map(
      (l) =>
        `<tr>
          <td>${l.lineNo}</td>
          <td>${escapeHtml(l.productCode)}</td>
          <td>${escapeHtml(l.description)}</td>
          <td class="num">${l.qty}</td>
          <td class="num">${l.rate.toFixed(2)}</td>
          <td class="num">${l.lineTotal.toFixed(2)}</td>
        </tr>`,
    )
    .join('');
  const t = document.totals;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(h.formattedDocNo || title)}</title>
  <style>
    body { font-family: Segoe UI, system-ui, sans-serif; font-size: 12px; margin: 24px; color: #1a2b3c; }
    h1 { font-size: 16px; margin: 0 0 8px; }
    .meta { color: #5a6b7d; margin-bottom: 16px; }
    .format { font-size: 11px; color: #006b9e; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #000; padding: 4px 6px; }
    th { background: #f2f2f2; text-align: left; }
    td.num { text-align: right; }
    .totals { margin-top: 12px; width: 240px; margin-left: auto; }
    .totals td { border: 0; padding: 2px 4px; }
    .totals .label { font-weight: 600; }
    @media print { body { margin: 12mm; } }
  </style>
</head>
<body>
  <div class="format">${escapeHtml(format.name)} · ${escapeHtml(format.templateKey)} · layout v${format.layoutVersion}</div>
  <h1>${escapeHtml(title)} — ${escapeHtml(h.formattedDocNo)}</h1>
  <div class="meta">
    Date: ${escapeHtml(h.documentDate)} · Customer: ${escapeHtml(document.buyer.name)}<br/>
    Place of supply: ${escapeHtml(document.placeOfSupply)} · Seller GSTIN: ${escapeHtml(document.seller.gstin ?? '')}
  </div>
  <table>
    <thead>
      <tr><th>Sr</th><th>Code</th><th>Description</th><th>Qty</th><th>Rate</th><th>Total</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <table class="totals">
    <tr><td class="label">Taxable</td><td>${t.totalTaxable.toFixed(2)}</td></tr>
    <tr><td class="label">CGST</td><td>${t.totalCgst.toFixed(2)}</td></tr>
    <tr><td class="label">SGST</td><td>${t.totalSgst.toFixed(2)}</td></tr>
    <tr><td class="label">IGST</td><td>${t.totalIgst.toFixed(2)}</td></tr>
    <tr><td class="label">Invoice Total</td><td><strong>${t.invoiceTotal.toFixed(2)}</strong></td></tr>
    <tr><td class="label">Balance</td><td>${t.balanceDue.toFixed(2)}</td></tr>
  </table>
  <p class="meta" style="margin-top:16px">Basic preview — no bill template layout loaded.</p>
</body>
</html>`;
}
