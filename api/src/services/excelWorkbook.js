import * as XLSX from 'xlsx';

export function sheetToRows(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
  return rows.map(normalizeRowKeys);
}

export function buildTemplateWorkbook(headers, sampleRow, sheetName = 'Import') {
  const data = [headers, sampleRow];
  const sheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

function normalizeRowKeys(row) {
  const normalized = {};
  for (const [key, value] of Object.entries(row)) {
    const clean = String(key)
      .trim()
      .replace(/\s+/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();
    normalized[clean] = value;
  }
  return normalized;
}

export function cell(row, ...keys) {
  for (const key of keys) {
    const normalized = String(key)
      .trim()
      .replace(/\s+/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();
    if (row[normalized] !== undefined && row[normalized] !== '') {
      return String(row[normalized]).trim();
    }
  }
  return '';
}

export function parseNumber(value, fallback = 0) {
  const n = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : fallback;
}

export function parseBool(value, defaultValue = true) {
  const text = String(value ?? '').trim().toLowerCase();
  if (!text) return defaultValue;
  return ['y', 'yes', 'true', '1', 'active'].includes(text);
}
