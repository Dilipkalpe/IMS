import { parseBillDate } from './closingStockReport.js';

function roundQty(n) {
  return Math.round((Number(n) + Number.EPSILON) * 1000) / 1000;
}

function parseQty(value) {
  const n = Number(String(value ?? '0').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function defaultFinancialYearRange() {
  const today = new Date();
  const year = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  return {
    from: new Date(year, 3, 1),
    to: today
  };
}

function formatDate(value) {
  const d = value instanceof Date && !Number.isNaN(value.getTime()) ? value : new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

function includesText(source, search) {
  if (!search) return true;
  return String(source ?? '').toLowerCase().includes(search.toLowerCase());
}

function normalizeMovementType(rowType) {
  const t = String(rowType || '').trim().toLowerCase();
  if (!t || t === 'all') return '';
  return t;
}

function rowMatchesFilters(row, filters) {
  if (row.docDate < filters.fromDate || row.docDate > filters.toDate) return false;
  if (filters.productCode && !includesText(row.productCode, filters.productCode)) return false;
  if (filters.godown) {
    const matchGodown = includesText(row.fromGodown, filters.godown) || includesText(row.toGodown, filters.godown);
    if (!matchGodown) return false;
  }
  if (filters.movementType) {
    const want = filters.movementType.toLowerCase();
    const got = row.movementType.toLowerCase();
    const matches =
      got === want ||
      (want === 'issue' && got.includes('issue')) ||
      (want === 'receipt' && got.includes('receipt')) ||
      (want === 'transfer' && got === 'transfer');
    if (!matches) return false;
  }
  return true;
}

function addRow(rows, payload) {
  rows.push({
    serialNo: rows.length + 1,
    date: formatDate(payload.docDate),
    entryNo: payload.entryNo,
    movementType: payload.movementType,
    fromGodown: payload.fromGodown,
    toGodown: payload.toGodown,
    productCode: payload.productCode,
    productName: payload.productName,
    batchNo: payload.batchNo,
    inQty: roundQty(payload.inQty),
    outQty: roundQty(payload.outQty),
    unit: payload.unit
  });
}

export async function computeStockMovementReport(models, filters = {}) {
  const {
    Grn,
    PurchaseInvoice,
    PurchaseReturn,
    DeliveryChallan,
    SalesInvoice,
    SalesReturn,
    StockTransfer
  } = models;

  const fy = defaultFinancialYearRange();
  const fromDate = parseBillDate(filters.dateFrom) ?? parseBillDate(fy.from);
  const toDate = parseBillDate(filters.dateTo) ?? parseBillDate(fy.to);
  if (!fromDate || !toDate) {
    throw new Error('Invalid date range');
  }
  if (fromDate > toDate) {
    throw new Error('From date cannot be after to date');
  }

  const normalizedFilters = {
    fromDate,
    toDate,
    productCode: String(filters.productCode || '').trim(),
    godown: String(filters.godown || '').trim(),
    movementType: normalizeMovementType(filters.movementType)
  };

  const rows = [];

  const emitInventoryDocRows = async (docsPromise, config) => {
    for (const doc of await docsPromise) {
      const docDate = parseBillDate(doc.billDate || doc.invoiceDate || doc.returnDate || doc.grnDate || doc.createdAt);
      if (!docDate) continue;

      for (const line of doc.lines || []) {
        const qty = parseQty(line.qty);
        if (qty <= 0) continue;
        const movementType = config.type;
        const row = {
          docDate,
          entryNo: doc.formattedDocNo || String(doc.docNo ?? ''),
          movementType,
          fromGodown: config.fromGodown(doc),
          toGodown: config.toGodown(doc),
          productCode: String(line.productRetailCode || line.productCode || '').trim(),
          productName: String(line.itemDescription || line.productName || '').trim(),
          batchNo: String(line.batchNo || '').trim(),
          inQty: movementType === 'Receipt' ? qty : 0,
          outQty: movementType === 'Issue' ? qty : 0,
          unit: String(line.unit || 'EA').trim()
        };
        if (!rowMatchesFilters(row, normalizedFilters)) continue;
        addRow(rows, row);
      }
    }
  };

  await emitInventoryDocRows(Grn.find({}).lean(), {
    type: 'Receipt',
    fromGodown: () => 'Supplier',
    toGodown: (doc) => String(doc.warehouse || 'Store')
  });

  await emitInventoryDocRows(PurchaseInvoice.find({}).lean(), {
    type: 'Receipt',
    fromGodown: () => 'Supplier',
    toGodown: () => 'Store'
  });

  await emitInventoryDocRows(SalesReturn.find({}).lean(), {
    type: 'Receipt',
    fromGodown: () => 'Customer',
    toGodown: (doc) => String(doc.returnWarehouse || 'Store')
  });

  await emitInventoryDocRows(SalesInvoice.find({}).lean(), {
    type: 'Issue',
    fromGodown: () => 'Store',
    toGodown: () => 'Customer'
  });

  await emitInventoryDocRows(DeliveryChallan.find({}).lean(), {
    type: 'Issue',
    fromGodown: () => 'Store',
    toGodown: () => 'Customer'
  });

  await emitInventoryDocRows(PurchaseReturn.find({}).lean(), {
    type: 'Issue',
    fromGodown: (doc) => String(doc.returnWarehouse || 'Store'),
    toGodown: () => 'Supplier'
  });

  for (const doc of await StockTransfer.find({}).lean()) {
    const docDate = parseBillDate(doc.transferDate || doc.createdAt);
    if (!docDate) continue;
    for (const line of doc.lines || []) {
      const qty = parseQty(line.qty);
      if (qty <= 0) continue;
      const fromGodown = String(doc.fromGodown || '').trim();
      const toGodown = String(doc.toGodown || '').trim();
      const isToProduction = toGodown.toLowerCase() === 'production';
      const isFromProduction = fromGodown.toLowerCase() === 'production';
      const movementType = isToProduction
        ? 'Production Issue'
        : isFromProduction
          ? 'Production Receipt'
          : 'Transfer';
      const inQty =
        movementType === 'Production Receipt' || movementType === 'Receipt' ? qty : 0;
      const outQty =
        movementType === 'Production Issue' || movementType === 'Issue' ? qty : 0;
      const row = {
        docDate,
        entryNo: String(doc.entryNo || ''),
        movementType,
        fromGodown,
        toGodown,
        productCode: String(line.productCode || '').trim(),
        productName: String(line.productName || '').trim(),
        batchNo: String(line.batchNo || '').trim(),
        inQty,
        outQty,
        unit: String(line.unit || 'EA').trim()
      };
      if (!rowMatchesFilters(row, normalizedFilters)) continue;
      addRow(rows, row);
    }
  }

  rows.sort((a, b) => {
    const ad = parseBillDate(a.date);
    const bd = parseBillDate(b.date);
    if (ad && bd && ad.getTime() !== bd.getTime()) return ad - bd;
    return String(a.entryNo || '').localeCompare(String(b.entryNo || ''));
  });
  rows.forEach((r, idx) => { r.serialNo = idx + 1; });

  const totalInQty = roundQty(rows.reduce((s, r) => s + Number(r.inQty || 0), 0));
  const totalOutQty = roundQty(rows.reduce((s, r) => s + Number(r.outQty || 0), 0));

  return {
    dateFromLabel: formatDate(fromDate),
    dateToLabel: formatDate(toDate),
    rows,
    totalInQty,
    totalOutQty,
    count: rows.length
  };
}
