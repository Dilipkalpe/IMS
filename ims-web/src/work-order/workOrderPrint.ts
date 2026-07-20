import type {
  ProductionOrderConsumableLine,
  ProductionOrderRawLine,
} from '../api/productionOrders';
import { openHtmlPrintPreview } from '../utils/printPreview';

export interface WorkOrderPrintData {
  productionNo: string;
  productionDate: string;
  status: string;
  bomRevision: string;
  manufacturingItemId: string;
  manufacturingItemName: string;
  machineCode: string;
  machineName: string;
  operatorId: string;
  operatorName: string;
  startTimeText: string;
  endTimeText: string;
  totalDurationMinutes: string;
  produceQty: string;
  rejectedQty: string;
  finalQty: string;
  fromGodown: string;
  rawMaterialAmount: string;
  consumableAmount: string;
  productionAmount: string;
  rawMaterials: ProductionOrderRawLine[];
  consumables: ProductionOrderConsumableLine[];
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildLineTable(
  title: string,
  headers: string[],
  rows: string[][],
  emptyText: string,
): string {
  if (rows.length === 0) {
    return `<h2>${escapeHtml(title)}</h2><p class="empty">${escapeHtml(emptyText)}</p>`;
  }
  const head = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
  const body = rows
    .map((cells, idx) => {
      const tds = [`<td class="num">${idx + 1}</td>`]
        .concat(cells.map((c) => `<td>${escapeHtml(c)}</td>`))
        .join('');
      return `<tr>${tds}</tr>`;
    })
    .join('');
  return `<h2>${escapeHtml(title)}</h2>
  <table>
    <thead><tr><th>Sr.</th>${head}</tr></thead>
    <tbody>${body}</tbody>
  </table>`;
}

export function buildWorkOrderPrintHtml(data: WorkOrderPrintData): string {
  const itemLabel = data.manufacturingItemName
    ? `${data.manufacturingItemId} — ${data.manufacturingItemName}`
    : data.manufacturingItemId;
  const machineLabel = data.machineName
    ? `${data.machineCode} — ${data.machineName}`
    : data.machineCode;
  const operatorLabel = data.operatorName
    ? `${data.operatorId} — ${data.operatorName}`
    : data.operatorId;

  const rawRows = data.rawMaterials.map((line) => [
    line.itemId,
    line.itemName,
    String(line.reqQty),
    String(line.availableQty),
    line.unit ?? '',
    String(line.rate),
    String(line.amount),
  ]);

  const consumableRows = data.consumables.map((line) => [
    line.material,
    String(line.qty),
    String(line.rate),
    String(line.amount),
  ]);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Job Work #${escapeHtml(data.productionNo)}</title>
  <style>
    body { font-family: Segoe UI, system-ui, sans-serif; font-size: 11px; margin: 16px; color: #1a2b3c; }
    h1 { font-size: 16px; margin: 0 0 4px; }
    h2 { font-size: 12px; margin: 14px 0 6px; color: #006b9e; }
    .meta { color: #5a6b7d; margin-bottom: 12px; font-size: 10px; }
    .summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin: 10px 0 4px; }
    .summary dt { font-size: 9px; text-transform: uppercase; color: #5a6b7d; margin: 0; }
    .summary dd { margin: 2px 0 0; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    th, td { border: 1px solid #333; padding: 4px 6px; text-align: left; }
    th { background: #f2f2f2; }
    td.num { text-align: center; width: 36px; }
    .totals { margin-top: 10px; display: flex; gap: 16px; flex-wrap: wrap; }
    .totals span { font-weight: 600; }
    .empty { color: #5a6b7d; font-style: italic; }
    @media print { body { margin: 10mm; } }
  </style>
</head>
<body>
  <h1>Job Work #${escapeHtml(data.productionNo)}</h1>
  <div class="meta">${escapeHtml(data.productionDate)} · ${escapeHtml(data.status)} · BOM ${escapeHtml(data.bomRevision)} · From ${escapeHtml(data.fromGodown)}</div>
  <dl class="summary">
    <div><dt>Manufacturing item</dt><dd>${escapeHtml(itemLabel || '—')}</dd></div>
    <div><dt>Machine</dt><dd>${escapeHtml(machineLabel || '—')}</dd></div>
    <div><dt>Operator</dt><dd>${escapeHtml(operatorLabel || '—')}</dd></div>
    <div><dt>Start / End</dt><dd>${escapeHtml(data.startTimeText || '—')} / ${escapeHtml(data.endTimeText || '—')}</dd></div>
    <div><dt>Duration (min)</dt><dd>${escapeHtml(data.totalDurationMinutes)}</dd></div>
    <div><dt>Produce / Rejected / Final</dt><dd>${escapeHtml(data.produceQty)} / ${escapeHtml(data.rejectedQty)} / ${escapeHtml(data.finalQty)}</dd></div>
  </dl>
  ${buildLineTable(
    'Raw materials',
    ['Item', 'Name', 'Req', 'Avail', 'Unit', 'Rate', 'Amount'],
    rawRows,
    'No raw material lines.',
  )}
  ${buildLineTable(
    'Consumables',
    ['Material', 'Qty', 'Rate', 'Amount'],
    consumableRows,
    'No consumable lines.',
  )}
  <div class="totals">
    <div>Raw materials: <span>${escapeHtml(data.rawMaterialAmount)}</span></div>
    <div>Consumables: <span>${escapeHtml(data.consumableAmount)}</span></div>
    <div>Production total: <span>${escapeHtml(data.productionAmount)}</span></div>
  </div>
  <p class="meta" style="margin-top:12px">Printed ${escapeHtml(new Date().toLocaleString())}</p>
</body>
</html>`;
}

export function printWorkOrder(data: WorkOrderPrintData): { ok: boolean; message: string } {
  const html = buildWorkOrderPrintHtml(data);
  const outcome = openHtmlPrintPreview(html, {
    title: `Job Work #${data.productionNo}`,
  });
  if (!outcome.ok) {
    return outcome;
  }
  return { ok: true, message: 'Print preview opened — use Ctrl+P to print.' };
}
