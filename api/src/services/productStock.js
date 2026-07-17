import { getContextYearModel } from '../db/yearModels.js';
import { Product } from '../models/Product.js';

function productModel() {
  return getContextYearModel(Product);
}

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

/**
 * @param {'in' | 'out' | 'none'} direction — 'in' increases stock, 'out' decreases
 */
export async function applyDocumentStock(lines, direction) {
  if (!lines?.length || !direction || direction === 'none') return;

  const sign = direction === 'out' ? -1 : 1;

  for (const line of lines) {
    const delta = parseQty(line.qty) * sign;
    if (delta === 0) continue;

    const product = await resolveProductForLine(line);
    if (!product) continue;

    const current = Number(product.stockQty) || 0;
    product.stockQty = Math.max(0, current + delta);

    const lineRate = parseRate(line.rate);
    if (lineRate > 0 && (!(Number(product.purchasePrice) > 0))) {
      product.purchasePrice = lineRate;
    }
    if (!product.unit?.trim()) {
      product.unit = 'EA';
    }
    if (product.activeStatus === false && direction === 'in') {
      product.activeStatus = true;
    }

    await product.save();
  }
}

/** Godowns that hold on-hand qty reflected in Product.stockQty */
export function isStoreGodown(godown) {
  const name = String(godown ?? '').trim().toLowerCase();
  if (!name) return true;
  if (name === 'production') return false;
  if (name === 'customer' || name === 'supplier') return false;
  return true;
}

function mapTransferLine(line) {
  return {
    productRetailCode: line.productCode,
    productCode: line.productCode,
    itemDescription: line.productName,
    qty: line.qty,
    rate: line.rate
  };
}

/**
 * Apply store-godown stock impact for a stock transfer (e.g. production issue/receipt).
 */
export async function applyStockTransferStock(transfer) {
  const lines = (transfer?.lines ?? []).map(mapTransferLine);
  if (!lines.length) return;

  const from = transfer.fromGodown;
  const to = transfer.toGodown;

  if (isStoreGodown(from)) {
    await applyDocumentStock(lines, 'out');
  }
  if (isStoreGodown(to)) {
    await applyDocumentStock(lines, 'in');
  }
}

async function resolveProductForLine(line) {
  const code = String(line.productRetailCode ?? line.productCode ?? '').trim().toUpperCase();
  if (code) {
    const byCode = await productModel().findOne({ code });
    if (byCode) return byCode;
  }

  const name = String(line.itemDescription ?? line.productName ?? '').trim();
  if (name) {
    return productModel().findOne({ name: new RegExp(`^${escapeRegex(name)}$`, 'i') });
  }

  return null;
}

/** Revert previous lines then apply new lines (document update). */
export async function replaceDocumentStock(oldLines, newLines, direction, priorDirection = direction) {
  const oldDir = priorDirection ?? direction;
  const newDir = direction;
  if (oldDir && oldDir !== 'none') {
    const revert = oldDir === 'in' ? 'out' : 'in';
    await applyDocumentStock(oldLines, revert);
  }
  if (newDir && newDir !== 'none') {
    await applyDocumentStock(newLines, newDir);
  }
}

/** Rebuild product stock from all inventory-moving sales and purchase documents. */
function applyTransferLinesToNet(deltaByCode, lines, sign) {
  for (const line of lines || []) {
    const mapped = mapTransferLine(line);
    const code = String(mapped.productRetailCode ?? '').trim().toUpperCase();
    if (!code) continue;
    const delta = parseQty(mapped.qty) * sign;
    if (delta === 0) continue;
    const name = String(mapped.itemDescription ?? '').trim();
    const entry = deltaByCode.get(code) ?? { qty: 0, name: '' };
    entry.qty += delta;
    if (name) entry.name = name;
    deltaByCode.set(code, entry);
  }
}

export async function rebuildStockFromDocuments(models) {
  const {
    Grn,
    PurchaseInvoice,
    PurchaseReturn,
    DeliveryChallan,
    SalesInvoice,
    SalesReturn,
    StockTransfer
  } = models;

  await productModel().updateMany({}, { $set: { stockQty: 0 } });

  if (Grn) {
    for (const doc of await Grn.find({}).lean()) await applyDocumentStock(doc.lines, 'in');
  }
  if (PurchaseInvoice) {
    for (const doc of await PurchaseInvoice.find({}).lean()) await applyDocumentStock(doc.lines, 'in');
  }
  if (PurchaseReturn) {
    for (const doc of await PurchaseReturn.find({}).lean()) await applyDocumentStock(doc.lines, 'out');
  }
  if (DeliveryChallan) {
    for (const doc of await DeliveryChallan.find({}).lean()) await applyDocumentStock(doc.lines, 'out');
  }
  if (SalesInvoice) {
    for (const doc of await SalesInvoice.find({}).lean()) await applyDocumentStock(doc.lines, 'out');
  }
  if (SalesReturn) {
    for (const doc of await SalesReturn.find({}).lean()) await applyDocumentStock(doc.lines, 'in');
  }
  if (StockTransfer) {
    for (const doc of await StockTransfer.find({}).lean()) {
      await applyStockTransferStock(doc);
    }
  }
}

/** @deprecated Use rebuildStockFromDocuments */
export async function rebuildStockFromPurchaseDocuments(models) {
  return rebuildStockFromDocuments(models);
}

/**
 * Net on-hand qty per product code from all purchase/sales documents (no DB writes).
 * @returns {Map<string, { qty: number, name: string }>}
 */
export async function computeNetStockFromDocuments(models) {
  const {
    Grn,
    PurchaseInvoice,
    PurchaseReturn,
    DeliveryChallan,
    SalesInvoice,
    SalesReturn,
    StockTransfer
  } = models;

  const deltaByCode = new Map();

  const applyLines = (lines, sign) => {
    for (const line of lines || []) {
      const code = String(line.productRetailCode ?? '').trim().toUpperCase();
      if (!code) continue;
      const delta = parseQty(line.qty) * sign;
      if (delta === 0) continue;
      const name = String(line.itemDescription ?? '').trim();
      const entry = deltaByCode.get(code) ?? { qty: 0, name: '' };
      entry.qty += delta;
      if (name) entry.name = name;
      deltaByCode.set(code, entry);
    }
  };

  if (Grn) {
    for (const doc of await Grn.find({}).lean()) applyLines(doc.lines, 1);
  }
  if (PurchaseInvoice) {
    for (const doc of await PurchaseInvoice.find({}).lean()) applyLines(doc.lines, 1);
  }
  if (PurchaseReturn) {
    for (const doc of await PurchaseReturn.find({}).lean()) applyLines(doc.lines, -1);
  }
  if (DeliveryChallan) {
    for (const doc of await DeliveryChallan.find({}).lean()) applyLines(doc.lines, -1);
  }
  if (SalesInvoice) {
    for (const doc of await SalesInvoice.find({}).lean()) applyLines(doc.lines, -1);
  }
  if (SalesReturn) {
    for (const doc of await SalesReturn.find({}).lean()) applyLines(doc.lines, 1);
  }
  if (StockTransfer) {
    for (const doc of await StockTransfer.find({}).lean()) {
      if (isStoreGodown(doc.fromGodown)) applyTransferLinesToNet(deltaByCode, doc.lines, -1);
      if (isStoreGodown(doc.toGodown)) applyTransferLinesToNet(deltaByCode, doc.lines, 1);
    }
  }

  for (const [code, entry] of deltaByCode) {
    entry.qty = Math.max(0, roundQty(entry.qty));
  }

  return deltaByCode;
}

function roundQty(n) {
  return Math.round((Number(n) + Number.EPSILON) * 1000) / 1000;
}

/** Persist computed balances to Product.stockQty. */
export async function syncProductStockFromComputed(netByCode) {
  for (const [code, { qty }] of netByCode) {
    await productModel().updateOne({ code }, { $set: { stockQty: qty } });
  }
}
