import { parseQty } from './salesOrderFulfillment.js';

/**
 * Build a map of upstream line key -> summed downstream qty from document lines.
 * @param {Array<{ lines?: Array<Record<string, unknown>> }>} documents
 * @param {{ prefixField: string, docNoField: string, lineSrField: string, qtyField?: string, defaultPrefix: string }} config
 */
export function buildLineQtyIndex(documents, config) {
  const {
    prefixField,
    docNoField,
    lineSrField,
    qtyField = 'qty',
    defaultPrefix
  } = config;

  const index = new Map();

  for (const doc of documents) {
    for (const line of doc.lines ?? []) {
      const docNo = line[docNoField];
      const lineSr = line[lineSrField];
      if (docNo == null || lineSr == null) continue;

      const prefix = String(line[prefixField] || defaultPrefix).toUpperCase();
      const key = `${prefix}|${Number(docNo)}|${Number(lineSr)}`;
      index.set(key, (index.get(key) ?? 0) + parseQty(line[qtyField]));
    }
  }

  return index;
}

export function sumQtyFromIndex(index, prefix, docNo, lineSr, defaultPrefix) {
  const key = `${String(prefix || defaultPrefix).toUpperCase()}|${Number(docNo)}|${Number(lineSr)}`;
  return index.get(key) ?? 0;
}
