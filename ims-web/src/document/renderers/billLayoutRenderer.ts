import type { BillFormatDefinition } from '../contracts/billFormat';
import type { BillFormatVisibilityRules, BillLayoutItemColumn, BillLayoutJson, BillLayoutSection } from '../contracts/billLayout';
import type { PrintableDocumentV1 } from '../contracts/printableDocument';
import { hasCompanyLogoReference } from '../../api/companies';
import { normalizeBillLayoutJson } from './normalizeBillLayout';
import { buildBillPrintContext, lineColumnValue, replaceBillTokens } from './billLayoutTokens';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function applyVisibilityToColumns(
  columns: BillLayoutItemColumn[],
  visibility: BillFormatVisibilityRules,
): BillLayoutItemColumn[] {
  return columns.map((col) => {
    const key = col.key.toLowerCase();
    if ((key === 'discount' || key === 'discountamount') && visibility.showDiscount === false) {
      return { ...col, visible: false };
    }
    if (key === 'rate' && visibility.showRate === false) {
      return { ...col, visible: false };
    }
    if (key === 'gstpercent' && visibility.showGst === false) {
      return { ...col, visible: false };
    }
    return col;
  });
}

function shouldRenderSection(section: BillLayoutSection, visibility: BillFormatVisibilityRules): boolean {
  if (!section.visible) return false;
  switch (section.type) {
    case 'companyLogo':
      return visibility.showLogo !== false;
    case 'customerDetails':
      return visibility.showCustomerInfo !== false;
    case 'supplierDetails':
      return visibility.showSupplierInfo !== false;
    case 'taxDetails':
      return visibility.showTaxBreakup !== false;
    default:
      return true;
  }
}

function pageCss(layout: BillLayoutJson): string {
  const page = layout.page;
  const margin = page.marginMm ?? { top: 12, right: 12, bottom: 12, left: 12 };
  const size =
    page.sizeKey === 'Thermal80' || page.sizeKey === 'Thermal58'
      ? `${page.widthMm ?? 80}mm auto`
      : `${page.widthMm ?? 210}mm ${page.heightMm ?? 297}mm`;
  return `size: ${size}; margin: ${margin.top}mm ${margin.right}mm ${margin.bottom}mm ${margin.left}mm;`;
}

function renderHeader(section: BillLayoutSection, ctx: ReturnType<typeof buildBillPrintContext>): string {
  const text = replaceBillTokens(section.text ?? '{{documentTitle}}', ctx);
  return `<h1 class="bill-header" style="text-align:${section.align ?? 'center'};font-size:${section.fontSizePt ?? 16}pt;color:${section.color ?? 'inherit'}">${escapeHtml(text)}</h1>`;
}

function renderCompanyDetails(
  section: BillLayoutSection,
  document: PrintableDocumentV1,
  theme: { primaryColor: string },
): string {
  const border = section.showBorder ? 'bill-box' : '';
  const seller = document.seller;
  const lines = [
    `<strong style="font-size:14pt;color:${theme.primaryColor}">${escapeHtml(seller.name)}</strong>`,
    section.showAddress !== false && seller.address ? escapeHtml(seller.address) : '',
    section.showGstin !== false && seller.gstin ? `GSTIN: ${escapeHtml(seller.gstin)}` : '',
  ].filter(Boolean);
  return `<div class="bill-section ${border}"><div class="bill-section__label">${escapeHtml(section.label)}</div>${lines.map((l) => `<div>${l}</div>`).join('')}</div>`;
}

function renderCustomerDetails(
  section: BillLayoutSection,
  document: PrintableDocumentV1,
  ctx: ReturnType<typeof buildBillPrintContext>,
): string {
  const border = section.showBorder ? 'bill-box' : '';
  const meta = [
    `<div><strong>${escapeHtml(ctx.customerName)}</strong></div>`,
    ctx.customerGstin ? `<div>GSTIN: ${escapeHtml(ctx.customerGstin)}</div>` : '',
    ctx.formattedDocNo ? `<div>Doc No: ${escapeHtml(ctx.formattedDocNo)}</div>` : '',
    ctx.documentDate ? `<div>Date: ${escapeHtml(ctx.documentDate)}</div>` : '',
    ctx.dueDate ? `<div>Due: ${escapeHtml(ctx.dueDate)}</div>` : '',
    ctx.placeOfSupply ? `<div>Place of supply: ${escapeHtml(ctx.placeOfSupply)}</div>` : '',
    ctx.reference ? `<div>Ref: ${escapeHtml(ctx.reference)}</div>` : '',
    ctx.paymentType ? `<div>Payment: ${escapeHtml(ctx.paymentType)}${ctx.paymentMode ? ` / ${escapeHtml(ctx.paymentMode)}` : ''}</div>` : '',
  ].filter(Boolean);
  return `<div class="bill-section ${border}"><div class="bill-section__label">${escapeHtml(section.label)}</div>${meta.join('')}</div>`;
}

function renderItemTable(
  columns: BillLayoutItemColumn[],
  document: PrintableDocumentV1,
  section?: BillLayoutSection,
  theme?: { borderColor: string; primaryColor: string },
): string {
  const visibleCols = columns.filter((c) => c.visible);
  const headerBg = section?.headerBackground ?? theme?.primaryColor ?? '#5c4033';
  const headerColor = section?.headerTextColor ?? '#ffffff';
  const head = visibleCols
    .map(
      (c) =>
        `<th style="text-align:${c.align};width:${c.width}px;background:${headerBg};color:${headerColor}">${escapeHtml(c.header)}</th>`,
    )
    .join('');
  const rows = document.lines
    .map((line) => {
      const cells = visibleCols
        .map(
          (c) =>
            `<td class="${c.align === 'right' ? 'num' : ''}" style="text-align:${c.align}">${escapeHtml(lineColumnValue(c.key, line))}</td>`,
        )
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');
  return `<table class="bill-items"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
}

function renderTaxDetails(
  section: BillLayoutSection,
  document: PrintableDocumentV1,
): string {
  const t = document.totals;
  const rows: string[] = [
    `<tr><td class="label">Taxable</td><td class="num">${t.totalTaxable.toFixed(2)}</td></tr>`,
  ];
  if (section.showCgst !== false) {
    rows.push(`<tr><td class="label">CGST</td><td class="num">${t.totalCgst.toFixed(2)}</td></tr>`);
  }
  if (section.showSgst !== false) {
    rows.push(`<tr><td class="label">SGST</td><td class="num">${t.totalSgst.toFixed(2)}</td></tr>`);
  }
  if (section.showIgst !== false) {
    rows.push(`<tr><td class="label">IGST</td><td class="num">${t.totalIgst.toFixed(2)}</td></tr>`);
  }
  if (section.showRoundOff !== false && t.roundOff !== 0) {
    rows.push(`<tr><td class="label">Round off</td><td class="num">${t.roundOff.toFixed(2)}</td></tr>`);
  }
  rows.push(
    `<tr><td class="label"><strong>Total</strong></td><td class="num"><strong>${t.invoiceTotal.toFixed(2)}</strong></td></tr>`,
  );
  if (t.paidAmount > 0) {
    rows.push(`<tr><td class="label">Paid</td><td class="num">${t.paidAmount.toFixed(2)}</td></tr>`);
  }
  if (t.balanceDue > 0) {
    rows.push(`<tr><td class="label">Balance due</td><td class="num">${t.balanceDue.toFixed(2)}</td></tr>`);
  }
  const border = section.showBorder ? 'bill-box' : '';
  return `<div class="bill-section bill-tax ${border}"><table class="bill-totals">${rows.join('')}</table></div>`;
}

function renderTextSection(section: BillLayoutSection, ctx: ReturnType<typeof buildBillPrintContext>): string {
  const text = replaceBillTokens(section.text ?? section.label, ctx);
  return `<p class="bill-text" style="text-align:${section.align ?? 'left'};font-size:${section.fontSizePt ?? 9}pt">${escapeHtml(text)}</p>`;
}

function renderSection(
  section: BillLayoutSection,
  format: BillFormatDefinition,
  document: PrintableDocumentV1,
  ctx: ReturnType<typeof buildBillPrintContext>,
  columns: BillLayoutItemColumn[],
): string {
  const theme = format.layoutJson?.theme;
  switch (section.type) {
    case 'header':
      return renderHeader(section, ctx);
    case 'companyLogo': {
      const logoImage = document.seller.logoImage?.trim();
      if (hasCompanyLogoReference(logoImage)) {
        return `<div class="bill-logo bill-logo--image"><img src="${escapeHtml(logoImage!)}" alt="Company logo" /></div>`;
      }
      const fallback = document.seller.logoText?.trim() || 'LOGO';
      return `<div class="bill-logo" style="background:${theme?.primaryColor ?? '#5c4033'}">${escapeHtml(fallback)}</div>`;
    }
    case 'companyDetails':
      return renderCompanyDetails(section, document, { primaryColor: theme?.primaryColor ?? '#5c4033' });
    case 'customerDetails':
    case 'supplierDetails':
      return renderCustomerDetails(section, document, ctx);
    case 'itemTable':
      return renderItemTable(columns, document, section, theme);
    case 'taxDetails':
      return renderTaxDetails(section, document);
    case 'termsAndConditions':
    case 'footer':
    case 'field':
      return renderTextSection(section, ctx);
    default:
      return '';
  }
}

/** Layout-aware HTML renderer (WPF SalesBillFlowDocumentRenderer parity). */
export function renderBillLayoutHtml(document: PrintableDocumentV1, format: BillFormatDefinition): string {
  const layout = normalizeBillLayoutJson(format.layoutJson, document.documentType);
  if (!layout) {
    return '';
  }

  const ctx = buildBillPrintContext(document);
  const visibility = format.visibilityRules ?? {};
  const columns = applyVisibilityToColumns(layout.itemTable.columns, visibility);
  const sections = [...layout.sections]
    .filter((s) => shouldRenderSection(s, visibility))
    .sort((a, b) => a.order - b.order || a.y - b.y);

  const body = sections
    .map((section) => renderSection(section, format, document, ctx, columns))
    .filter(Boolean)
    .join('\n');

  const hasItemTableSection = sections.some((s) => s.type === 'itemTable');
  const itemTableFallback =
    layout.itemTable.visible && !hasItemTableSection ? renderItemTable(columns, document, undefined, layout.theme) : '';

  const theme = layout.theme;
  const title = escapeHtml(ctx.formattedDocNo || ctx.documentTitle);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body {
      font-family: ${theme.fontFamily}, system-ui, sans-serif;
      font-size: ${theme.baseFontSizePt}pt;
      color: ${theme.textColor};
      margin: 0;
      padding: 0;
    }
    .bill-page { max-width: ${layout.page.widthMm}mm; margin: 0 auto; }
    .bill-format-tag { font-size: 9pt; color: #006b9e; margin-bottom: 8px; }
    .bill-header { margin: 0 0 12px; }
    .bill-section { margin-bottom: 12px; font-size: ${theme.baseFontSizePt}pt; }
    .bill-section__label { font-weight: 600; margin-bottom: 4px; color: ${theme.primaryColor}; }
    .bill-box { border: 1px solid ${theme.borderColor}; padding: 8px; border-radius: 2px; }
    .bill-logo { color: #fff; text-align: center; font-weight: bold; font-size: 18pt; padding: 16px; margin-bottom: 8px; }
    .bill-logo--image { background: transparent; padding: 0; }
    .bill-logo--image img { max-width: 180px; max-height: 72px; object-fit: contain; display: block; margin: 0 auto 8px; }
    .bill-items { width: 100%; border-collapse: collapse; margin: 12px 0; }
    .bill-items th, .bill-items td { border: ${theme.showBorders ? `1px solid ${theme.borderColor}` : 'none'}; padding: 4px 6px; }
    .bill-items th { font-weight: 600; }
    .bill-items td.num { text-align: right; }
    .bill-tax { margin-left: auto; width: 45%; }
    .bill-totals { width: 100%; border-collapse: collapse; }
    .bill-totals td { padding: 2px 4px; border: 0; }
    .bill-totals .label { font-weight: 600; }
    .bill-totals .num { text-align: right; }
    .bill-text { margin: 8px 0; color: #444; }
    @media print {
      @page { ${pageCss(layout)} }
      body { margin: 0; }
    }
  </style>
</head>
<body>
  <div class="bill-page">
    <div class="bill-format-tag">${escapeHtml(format.name)} · ${escapeHtml(format.templateKey)} · layout v${format.layoutVersion}${format.source === 'fallback' ? ' (offline)' : ''}</div>
    ${body}
    ${itemTableFallback}
  </div>
</body>
</html>`;
}
