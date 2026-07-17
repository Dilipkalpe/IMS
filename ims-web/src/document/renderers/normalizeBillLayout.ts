import { getFallbackDefaultTemplate } from '../catalog/defaultBillLayouts';
import type { BillLayoutJson } from '../contracts/billLayout';
import type { DocumentTypeKey } from '../contracts/documentTypes';

const DEFAULT_MARGIN = { top: 12, right: 12, bottom: 12, left: 12 };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/** Reject report/canvas payloads that are not bill-layout v1. */
export function isRenderableBillLayout(layout: unknown): layout is Partial<BillLayoutJson> {
  if (!isPlainObject(layout)) return false;
  if ('elements' in layout || 'canvas' in layout || 'bands' in layout) return false;
  return true;
}

/** Merge API/designer layout with safe defaults (WPF SalesBillLayoutHelper parity). */
export function normalizeBillLayoutJson(
  layout: unknown,
  docType: DocumentTypeKey = 'sales_invoice',
): BillLayoutJson | null {
  if (!isRenderableBillLayout(layout)) return null;

  const fallback = getFallbackDefaultTemplate(docType).layoutJson;
  const raw = layout as Partial<BillLayoutJson>;

  const page = {
    ...fallback.page,
    ...(isPlainObject(raw.page) ? raw.page : {}),
    marginMm: {
      ...DEFAULT_MARGIN,
      ...(isPlainObject(raw.page?.marginMm) ? raw.page.marginMm : {}),
    },
  };

  const theme = {
    ...fallback.theme,
    ...(isPlainObject(raw.theme) ? raw.theme : {}),
  };

  const sections =
    Array.isArray(raw.sections) && raw.sections.length > 0 ? raw.sections : fallback.sections;

  const columns =
    Array.isArray(raw.itemTable?.columns) && raw.itemTable.columns.length > 0
      ? raw.itemTable.columns
      : fallback.itemTable.columns;

  const itemTable = {
    ...fallback.itemTable,
    ...(isPlainObject(raw.itemTable) ? raw.itemTable : {}),
    columns,
  };

  return {
    version: Number(raw.version) || fallback.version || 1,
    page,
    theme,
    sections,
    itemTable,
  };
}
