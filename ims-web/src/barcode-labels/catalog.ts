import type { BarcodeLabelFormat } from './types';

export const CUSTOM_FORMAT_ID = 'custom';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PAGE_MARGIN_MM = 8;
const LABEL_GAP_MM = 2;

/** Standard A4 label sheet presets */
export const BARCODE_LABEL_FORMATS: BarcodeLabelFormat[] = [
  {
    id: 'sheet_65',
    displayName: '65-Per-Sheet',
    description: '65 labels per A4 sheet',
    widthMm: 38,
    heightMm: 21,
    columnsPerPage: 5,
    rowsPerPage: 13,
    labelsPerSheet: 65,
    suggestedUse: 'Small products, jewelry, cosmetics',
  },
  {
    id: 'sheet_44',
    displayName: '44-Per-Sheet',
    description: '44 labels per A4 sheet',
    widthMm: 48.5,
    heightMm: 25.4,
    columnsPerPage: 4,
    rowsPerPage: 11,
    labelsPerSheet: 44,
    suggestedUse: 'General retail products, online sellers',
  },
  {
    id: 'sheet_40',
    displayName: '40-Per-Sheet',
    description: '40 labels per A4 sheet',
    widthMm: 52.5,
    heightMm: 29.7,
    columnsPerPage: 4,
    rowsPerPage: 10,
    labelsPerSheet: 40,
    suggestedUse: 'Product barcode labels, inventory',
  },
  {
    id: 'sheet_30',
    displayName: '30-Per-Sheet',
    description: '30 labels per A4 sheet',
    widthMm: 70,
    heightMm: 29.7,
    columnsPerPage: 3,
    rowsPerPage: 10,
    labelsPerSheet: 30,
    suggestedUse: 'Products with SKU + Barcode + Price',
    recommended: true,
  },
  {
    id: 'sheet_24',
    displayName: '24-Per-Sheet',
    description: '24 labels per A4 sheet',
    widthMm: 64,
    heightMm: 34,
    columnsPerPage: 3,
    rowsPerPage: 8,
    labelsPerSheet: 24,
    suggestedUse: 'Address labels, folders, medium packages',
  },
  {
    id: 'sheet_21',
    displayName: '21-Per-Sheet',
    description: '21 labels per A4 sheet',
    widthMm: 63.5,
    heightMm: 38.1,
    columnsPerPage: 3,
    rowsPerPage: 7,
    labelsPerSheet: 21,
    suggestedUse: 'Warehouse and inventory labels',
    recommended: true,
  },
  {
    id: 'sheet_16',
    displayName: '16-Per-Sheet',
    description: '16 labels per A4 sheet',
    widthMm: 99,
    heightMm: 34,
    columnsPerPage: 2,
    rowsPerPage: 8,
    labelsPerSheet: 16,
    suggestedUse: 'Asset tracking, shelf labels',
  },
  {
    id: 'sheet_14',
    displayName: '14-Per-Sheet',
    description: '14 labels per A4 sheet',
    widthMm: 99,
    heightMm: 38,
    columnsPerPage: 2,
    rowsPerPage: 7,
    labelsPerSheet: 14,
    suggestedUse: 'Large product labels',
    recommended: true,
  },
  {
    id: 'sheet_10',
    displayName: '10-Per-Sheet',
    description: '10 labels per A4 sheet',
    widthMm: 99,
    heightMm: 57,
    columnsPerPage: 2,
    rowsPerPage: 5,
    labelsPerSheet: 10,
    suggestedUse: 'Shipping boxes, bulk packaging',
  },
  {
    id: 'sheet_8',
    displayName: '8-Per-Sheet',
    description: '8 labels per A4 sheet',
    widthMm: 105,
    heightMm: 74,
    columnsPerPage: 2,
    rowsPerPage: 4,
    labelsPerSheet: 8,
    suggestedUse: 'Cartons and warehouse labels',
    recommended: true,
  },
  {
    id: 'sheet_4',
    displayName: '4-Per-Sheet',
    description: '4 labels per A4 sheet',
    widthMm: 105,
    heightMm: 148,
    columnsPerPage: 2,
    rowsPerPage: 2,
    labelsPerSheet: 4,
    suggestedUse: 'Large shipping labels and notices',
    recommended: true,
  },
  {
    id: 'sheet_2',
    displayName: '2-Per-Sheet',
    description: '2 labels per A4 sheet',
    widthMm: 210,
    heightMm: 148,
    columnsPerPage: 1,
    rowsPerPage: 2,
    labelsPerSheet: 2,
    suggestedUse: 'Half-page labels',
    recommended: true,
  },
  {
    id: 'sheet_1',
    displayName: '1-Per-Sheet',
    description: '1 label per A4 sheet',
    widthMm: 210,
    heightMm: 297,
    columnsPerPage: 1,
    rowsPerPage: 1,
    labelsPerSheet: 1,
    suggestedUse: 'Full-page custom labels',
  },
  {
    id: CUSTOM_FORMAT_ID,
    displayName: 'Custom size',
    description: 'Enter label width and height in millimetres below',
    widthMm: 50,
    heightMm: 25,
    columnsPerPage: 2,
    rowsPerPage: 10,
    suggestedUse: 'User-defined label dimensions',
  },
];

export function formatSizeLabel(widthMm: number, heightMm: number): string {
  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
  return `${fmt(widthMm)} × ${fmt(heightMm)} mm`;
}

export function computeA4Layout(widthMm: number, heightMm: number): {
  columnsPerPage: number;
  rowsPerPage: number;
} {
  const usableW = A4_WIDTH_MM - PAGE_MARGIN_MM * 2;
  const usableH = A4_HEIGHT_MM - PAGE_MARGIN_MM * 2;
  const columnsPerPage = Math.max(1, Math.floor((usableW + LABEL_GAP_MM) / (widthMm + LABEL_GAP_MM)));
  const rowsPerPage = Math.max(1, Math.floor((usableH + LABEL_GAP_MM) / (heightMm + LABEL_GAP_MM)));
  return { columnsPerPage, rowsPerPage };
}

export function findBarcodeLabelFormat(id: string): BarcodeLabelFormat | undefined {
  return BARCODE_LABEL_FORMATS.find((f) => f.id === id);
}

export function buildCustomFormat(widthMm: number, heightMm: number): BarcodeLabelFormat {
  const layout = computeA4Layout(widthMm, heightMm);
  return {
    id: CUSTOM_FORMAT_ID,
    displayName: 'Custom size',
    description: `Custom — ${formatSizeLabel(widthMm, heightMm)} (${layout.columnsPerPage}×${layout.rowsPerPage} per sheet)`,
    widthMm,
    heightMm,
    columnsPerPage: layout.columnsPerPage,
    rowsPerPage: layout.rowsPerPage,
    labelsPerSheet: layout.columnsPerPage * layout.rowsPerPage,
    suggestedUse: 'User-defined label dimensions',
  };
}

export function resolveSelectedFormat(
  formatId: string,
  customWidthMm: number,
  customHeightMm: number,
): BarcodeLabelFormat | null {
  if (formatId === CUSTOM_FORMAT_ID) {
    if (!Number.isFinite(customWidthMm) || customWidthMm <= 0) return null;
    if (!Number.isFinite(customHeightMm) || customHeightMm <= 0) return null;
    return buildCustomFormat(customWidthMm, customHeightMm);
  }
  return findBarcodeLabelFormat(formatId) ?? null;
}
