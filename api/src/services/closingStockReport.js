import { Product } from '../models/Product.js';
import { isStoreGodown } from './productStock.js';

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseQty(qty) {
  const n = Number(String(qty ?? '0').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function parseRate(rate) {
  const n = Number(String(rate ?? '0').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function roundMoney(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function roundQty(n) {
  return Math.round((Number(n) + Number.EPSILON) * 1000) / 1000;
}

/** @param {string|Date|undefined} value */
export function parseBillDate(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return startOfDay(value);
  }
  const text = String(value).trim();
  if (!text) return null;

  const dmy = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]) - 1;
    const year = Number(dmy[3]);
    const d = new Date(year, month, day);
    return Number.isNaN(d.getTime()) ? null : startOfDay(d);
  }

  const iso = new Date(text);
  return Number.isNaN(iso.getTime()) ? null : startOfDay(iso);
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatReportDate(d) {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function defaultDateRange() {
  const today = startOfDay(new Date());
  const year = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  const from = new Date(year, 3, 1);
  return { from, to: today };
}

function getOrCreate(map, code, name) {
  const key = code.toUpperCase();
  if (!map.has(key)) {
    map.set(key, {
      code: key,
      name: name || key,
      opStock: 0,
      inward: 0,
      outward: 0,
      inwardValue: 0,
      inwardQtyForRate: 0
    });
  } else if (name) {
    const entry = map.get(key);
    if (!entry.name || entry.name === entry.code) entry.name = name;
  }
  return map.get(key);
}

function applyLine(entry, line, sign, trackValue) {
  const qty = parseQty(line.qty);
  if (qty <= 0) return;
  const delta = qty * sign;
  if (sign > 0) {
    entry.inward += delta;
    if (trackValue) {
      const rate = parseRate(line.rate);
      entry.inwardValue += delta * rate;
      entry.inwardQtyForRate += delta;
    }
  } else {
    entry.outward += Math.abs(delta);
  }
}

function matchesGodown(doc, godown) {
  if (!godown || /^all$/i.test(godown)) return true;
  const wh = String(doc.warehouse ?? doc.returnWarehouse ?? '').trim();
  if (!wh) return true;
  return new RegExp(`^${escapeRegex(godown)}$`, 'i').test(wh);
}

function matchesBatch(_line, _batchNo) {
  if (!_batchNo?.trim()) return true;
  return true;
}

function mapTransferLines(lines) {
  return (lines ?? []).map((line) => ({
    productRetailCode: line.productCode,
    itemDescription: line.productName,
    qty: line.qty,
    rate: line.rate
  }));
}

async function loadAllMovementDocs(models) {
  const docs = [];
  const { Grn, PurchaseInvoice, PurchaseReturn, DeliveryChallan, SalesInvoice, SalesReturn, StockTransfer } =
    models;

  if (Grn) {
    for (const d of await Grn.find({}).lean()) {
      docs.push({ billDate: d.billDate, lines: d.lines, type: 'in', warehouse: d.warehouse });
    }
  }
  if (PurchaseInvoice) {
    for (const d of await PurchaseInvoice.find({}).lean()) {
      docs.push({ billDate: d.billDate, lines: d.lines, type: 'in' });
    }
  }
  if (SalesReturn) {
    for (const d of await SalesReturn.find({}).lean()) {
      docs.push({ billDate: d.billDate, lines: d.lines, type: 'in' });
    }
  }
  if (PurchaseReturn) {
    for (const d of await PurchaseReturn.find({}).lean()) {
      docs.push({ billDate: d.billDate, lines: d.lines, type: 'out' });
    }
  }
  if (DeliveryChallan) {
    for (const d of await DeliveryChallan.find({}).lean()) {
      docs.push({ billDate: d.billDate, lines: d.lines, type: 'out' });
    }
  }
  if (SalesInvoice) {
    for (const d of await SalesInvoice.find({}).lean()) {
      docs.push({ billDate: d.billDate, lines: d.lines, type: 'out' });
    }
  }
  if (StockTransfer) {
    for (const d of await StockTransfer.find({}).lean()) {
      const billDate = d.transferDate || d.createdAt;
      const lines = mapTransferLines(d.lines);
      if (isStoreGodown(d.fromGodown)) {
        docs.push({
          billDate,
          lines,
          type: 'out',
          warehouse: d.fromGodown
        });
      }
      if (isStoreGodown(d.toGodown)) {
        docs.push({
          billDate,
          lines,
          type: 'in',
          warehouse: d.toGodown
        });
      }
    }
  }

  return docs;
}

/**
 * @param {object} models
 * @param {object} filters
 */
export async function computeClosingStockReport(models, filters = {}) {
  const {
    productCode = '',
    productName = '',
    itemDescription = '',
    mainName = '',
    productType = '',
    godown = '',
    batchNo = '',
    dateFrom,
    dateTo
  } = filters;

  const defaults = defaultDateRange();
  let from = parseBillDate(dateFrom) ?? defaults.from;
  let to = parseBillDate(dateTo) ?? defaults.to;
  if (from > to) {
    const swap = from;
    from = to;
    to = swap;
  }

  const movementByCode = new Map();
  const docs = await loadAllMovementDocs(models);

  for (const doc of docs) {
    const docDate = parseBillDate(doc.billDate);
    if (!docDate) continue;
    if (!matchesGodown(doc, godown)) continue;

    const inPeriod = docDate >= from && docDate <= to;
    const beforePeriod = docDate < from;
    if (!inPeriod && !beforePeriod) continue;

    const sign = doc.type === 'in' ? 1 : -1;

    for (const line of doc.lines || []) {
      if (!matchesBatch(line, batchNo)) continue;

      const code = String(line.productRetailCode ?? '').trim().toUpperCase();
      if (!code) continue;

      const name = String(line.itemDescription ?? '').trim();
      if (itemDescription) {
        const term = itemDescription.trim();
        const desc = name || '';
        if (!new RegExp(escapeRegex(term), 'i').test(desc) && !new RegExp(escapeRegex(term), 'i').test(code)) {
          continue;
        }
      }

      const entry = getOrCreate(movementByCode, code, name);

      if (beforePeriod) {
        if (sign > 0) entry.opStock += parseQty(line.qty);
        else entry.opStock -= parseQty(line.qty);
      } else if (inPeriod) {
        applyLine(entry, line, sign, sign > 0);
      }
    }
  }

  const productFilter = {};
  const hasProductFilter = Boolean(productCode || productName);
  if (!hasProductFilter) {
    productFilter.activeStatus = { $ne: false };
  }
  if (productCode) {
    productFilter.code = new RegExp(escapeRegex(productCode), 'i');
  }
  if (productName) {
    productFilter.name = new RegExp(escapeRegex(productName), 'i');
  }
  if (mainName && !/^all$/i.test(mainName)) {
    productFilter.productMainGroup = new RegExp(`^${escapeRegex(mainName)}$`, 'i');
  }
  if (productType && !/^all$/i.test(productType)) {
    productFilter.productType = new RegExp(`^${escapeRegex(productType)}$`, 'i');
  }

  const products = await Product.find(productFilter).sort({ code: 1 }).lean();
  const productByCode = new Map(products.map((p) => [String(p.code).toUpperCase(), p]));

  for (const [code, entry] of movementByCode) {
    if (!productByCode.has(code) && hasProductFilter) {
      movementByCode.delete(code);
    }
  }

  const rows = [];
  let totalOp = 0;
  let totalIn = 0;
  let totalOut = 0;
  let totalCl = 0;
  let totalValuation = 0;

  const codes = new Set([...productByCode.keys(), ...movementByCode.keys()]);
  const sortedCodes = [...codes].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  for (const code of sortedCodes) {
    const product = productByCode.get(code);
    const movement = movementByCode.get(code) ?? {
      code,
      name: product?.name ?? code,
      opStock: 0,
      inward: 0,
      outward: 0,
      inwardValue: 0,
      inwardQtyForRate: 0
    };

    const opStock = roundQty(Math.max(0, movement.opStock));
    const inward = roundQty(movement.inward);
    const outward = roundQty(movement.outward);
    const closingStock = roundQty(Math.max(0, opStock + inward - outward));

    const purchasePrice = Number(product?.purchasePrice) || 0;
    let avgRate = purchasePrice;
    if (inward > 0 && movement.inwardQtyForRate > 0) {
      const periodAvg = movement.inwardValue / movement.inwardQtyForRate;
      if (opStock > 0 && purchasePrice > 0) {
        avgRate = roundMoney((opStock * purchasePrice + movement.inwardValue) / (opStock + inward));
      } else {
        avgRate = roundMoney(periodAvg);
      }
    } else if (avgRate <= 0 && purchasePrice > 0) {
      avgRate = purchasePrice;
    }

    const valuation = roundMoney(closingStock * avgRate);
    const reorderLevel = Number(product?.reorderQty) || 0;

    if (!hasProductFilter && closingStock <= 0 && inward <= 0 && outward <= 0 && opStock <= 0) {
      continue;
    }

    rows.push({
      serialNo: rows.length + 1,
      productId: code,
      productName: product?.name ?? movement.name,
      unit: product?.unit?.trim() || 'EA',
      opStock,
      inward,
      outward,
      closingStock,
      avgRate,
      valuation,
      reorderLevel
    });

    totalOp += opStock;
    totalIn += inward;
    totalOut += outward;
    totalCl += closingStock;
    totalValuation += valuation;
  }

  return {
    dateFrom: from.toISOString(),
    dateTo: to.toISOString(),
    dateFromLabel: formatReportDate(from),
    dateToLabel: formatReportDate(to),
    rows,
    totals: {
      opStock: roundQty(totalOp),
      inward: roundQty(totalIn),
      outward: roundQty(totalOut),
      closingStock: roundQty(totalCl),
      valuation: roundMoney(totalValuation)
    },
    count: rows.length
  };
}
