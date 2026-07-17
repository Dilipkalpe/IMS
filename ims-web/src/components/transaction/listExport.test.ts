import { describe, expect, it } from 'vitest';
import { buildListCsv, escapeCsvCell, timestampedFileName } from './listExport';

describe('listExport', () => {
  it('escapes csv cells with commas and quotes', () => {
    expect(escapeCsvCell('plain')).toBe('plain');
    expect(escapeCsvCell('a,b')).toBe('"a,b"');
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
  });

  it('builds excel csv with utf-8 bom', () => {
    const csv = buildListCsv(
      [{ id: 'billNo', header: 'Bill No' }],
      [{ billNo: 'SI-1' }],
      { includeBom: true },
    );
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('Bill No');
    expect(csv).toContain('SI-1');
  });

  it('creates timestamped filenames', () => {
    expect(timestampedFileName('Sales Order Register', 'csv')).toMatch(
      /^Sales_Order_Register_\d{8}_\d{4}\.csv$/,
    );
  });
});
