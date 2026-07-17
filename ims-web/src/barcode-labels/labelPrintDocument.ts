import { renderSymbologyDataUrl } from './renderSymbology';
import type { BarcodeLabelFormat, BarcodeLabelItem, BarcodeLabelPrintOptions } from './types';

const MM_TO_PX = 96 / 25.4;

function mmToPx(mm: number): number {
  return mm * MM_TO_PX;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function renderLabelHtml(
  item: BarcodeLabelItem,
  format: BarcodeLabelFormat,
  symbology: BarcodeLabelPrintOptions['symbology'],
): Promise<string> {
  const widthPx = mmToPx(format.widthMm);
  const heightPx = mmToPx(format.heightMm);
  const symbolHeight = symbology === 'qrcode' ? Math.min(72, heightPx * 0.45) : Math.min(48, heightPx * 0.35);
  const dataUrl = await renderSymbologyDataUrl(symbology, item.barcodeValue, widthPx - 12, symbolHeight);

  const symbolBlock = dataUrl
    ? `<img class="bl-label__symbol" src="${dataUrl}" alt="" />`
    : `<div class="bl-label__symbol-fallback">${escapeHtml(item.barcodeValue)}</div>`;

  const lines = [
    item.productName,
    `SKU: ${item.productCode}`,
    item.barcodeValue,
    item.batchNo ? `Batch: ${item.batchNo}` : '',
    item.mrp ? `MRP: ₹ ${item.mrp}` : '',
    item.salesRate ? `Sale: ₹ ${item.salesRate}` : '',
    item.manufacturingDate ? `Mfg: ${item.manufacturingDate}` : '',
    item.expiryDate ? `Exp: ${item.expiryDate}` : '',
    item.missingBarcode ? 'No barcode — code only' : '',
  ].filter(Boolean);

  return `
    <div class="bl-label" style="width:${widthPx}px;height:${heightPx}px">
      ${symbolBlock}
      ${lines
        .map((line, index) =>
          `<div class="bl-label__line${index === 0 ? ' bl-label__line--title' : ''}${line.startsWith('No barcode') ? ' bl-label__line--warn' : ''}">${escapeHtml(line)}</div>`,
        )
        .join('')}
    </div>
  `;
}

export async function buildBarcodeLabelsPrintHtml(
  labels: BarcodeLabelItem[],
  options: BarcodeLabelPrintOptions,
): Promise<string> {
  const { format } = options;
  const cols = Math.max(1, format.columnsPerPage);
  const rows = Math.max(1, format.rowsPerPage);
  const labelsPerPage = cols * rows;
  const gapPx = mmToPx(2);
  const pagePadding = mmToPx(8);

  const pages: string[] = [];
  for (let pageIndex = 0; pageIndex * labelsPerPage < labels.length; pageIndex += 1) {
    const slice = labels.slice(pageIndex * labelsPerPage, pageIndex * labelsPerPage + labelsPerPage);
    const labelHtml = await Promise.all(
      slice.map((item) => renderLabelHtml(item, format, options.symbology)),
    );
    pages.push(`
      <div class="bl-page" style="padding:${pagePadding}px">
        <div class="bl-grid" style="grid-template-columns:repeat(${cols}, 1fr);gap:${gapPx}px">
          ${labelHtml.join('')}
        </div>
      </div>
    `);
  }

  const symbologyTitle = options.symbology === 'qrcode' ? 'QR code labels' : 'Barcode labels';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(symbologyTitle)} — ${labels.length} label(s)</title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: "Segoe UI", Arial, sans-serif; background: #f4f6f8; color: #111; }
    .bl-page { width: 210mm; min-height: 297mm; margin: 0 auto 12px; background: #fff; page-break-after: always; }
    .bl-page:last-child { page-break-after: auto; margin-bottom: 0; }
    .bl-grid { display: grid; align-content: start; }
    .bl-label {
      border: 0.5px solid #111;
      padding: 3px 4px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      background: #fff;
    }
    .bl-label__symbol { max-width: 100%; height: auto; object-fit: contain; margin-bottom: 2px; }
    .bl-label__symbol-fallback { font-size: 10px; color: #666; margin-bottom: 4px; word-break: break-all; }
    .bl-label__line { font-size: 9px; line-height: 1.2; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bl-label__line--title { font-weight: 600; font-size: 10px; margin-bottom: 1px; }
    .bl-label__line--warn { color: #c05621; font-size: 8px; }
    @media print {
      body { background: #fff; }
      .bl-page { margin: 0; box-shadow: none; }
    }
  </style>
</head>
<body>
  ${pages.join('')}
</body>
</html>`;
}

export function openBarcodeLabelsPrintWindow(html: string, title: string): Window | null {
  const win = window.open('', '_blank', 'noopener,noreferrer,width=920,height=720');
  if (!win) return null;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.document.title = title;
  return win;
}
