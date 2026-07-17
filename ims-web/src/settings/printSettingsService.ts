export type PrintPaperFormat = 'A4' | 'A5' | 'A3' | 'Custom';

export interface SalesOrderPrintSettings {
  paperFormat: PrintPaperFormat;
  customWidthMm: number;
  customHeightMm: number;
  marginMm: number;
}

const STORAGE_KEY = 'ims.salesOrderPrint';

export const DEFAULT_PRINT_SETTINGS: SalesOrderPrintSettings = {
  paperFormat: 'A4',
  customWidthMm: 210,
  customHeightMm: 148,
  marginMm: 10,
};

function clampMm(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function normalize(raw: Partial<SalesOrderPrintSettings> | null | undefined): SalesOrderPrintSettings {
  const base = DEFAULT_PRINT_SETTINGS;
  const format = raw?.paperFormat;
  const paperFormat: PrintPaperFormat =
    format === 'A5' || format === 'A3' || format === 'Custom' ? format : 'A4';

  return {
    paperFormat,
    customWidthMm: clampMm(Number(raw?.customWidthMm ?? base.customWidthMm), 50, 1200),
    customHeightMm: clampMm(Number(raw?.customHeightMm ?? base.customHeightMm), 50, 1200),
    marginMm: clampMm(Number(raw?.marginMm ?? base.marginMm), 0, 50),
  };
}

export function getPageSizeMm(settings: SalesOrderPrintSettings): { widthMm: number; heightMm: number } {
  switch (settings.paperFormat) {
    case 'A5':
      return { widthMm: 148, heightMm: 210 };
    case 'A3':
      return { widthMm: 297, heightMm: 420 };
    case 'Custom':
      return { widthMm: settings.customWidthMm, heightMm: settings.customHeightMm };
    case 'A4':
    default:
      return { widthMm: 210, heightMm: 297 };
  }
}

export function formatPrintSummary(settings: SalesOrderPrintSettings): string {
  const { widthMm, heightMm } = getPageSizeMm(settings);
  const name = settings.paperFormat === 'Custom' ? 'Custom' : settings.paperFormat;
  return `${name} — ${widthMm.toFixed(1)} × ${heightMm.toFixed(1)} mm (portrait)`;
}

export function loadPrintSettings(): SalesOrderPrintSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PRINT_SETTINGS };
    return normalize(JSON.parse(raw) as Partial<SalesOrderPrintSettings>);
  } catch {
    return { ...DEFAULT_PRINT_SETTINGS };
  }
}

export function savePrintSettings(settings: SalesOrderPrintSettings): SalesOrderPrintSettings {
  const normalized = normalize(settings);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // ignore
  }
  return normalized;
}
