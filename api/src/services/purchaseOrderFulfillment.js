import { Grn } from '../models/Grn.js';
import { PurchaseOrder } from '../models/PurchaseOrder.js';
import { parseQty, formatQty } from './salesOrderFulfillment.js';
import { buildLineQtyIndex, sumQtyFromIndex } from './fulfillmentQtyIndex.js';

export const RECEIVABLE_PO_STATUSES = ['open', 'partially_received'];

export const NON_SELECTABLE_PO_STATUSES = ['fully_received', 'cancelled'];

function normalizeSupplier(value) {
  return String(value ?? '').trim();
}

function suppliersMatch(a, b) {
  return normalizeSupplier(a).toLowerCase() === normalizeSupplier(b).toLowerCase();
}

async function loadPoReceivedQtyIndex(excludeGrnId = null) {
  const filter = {
    'lines.poDocNo': { $ne: null },
    status: { $nin: ['cancelled', 'draft'] }
  };
  if (excludeGrnId) filter._id = { $ne: excludeGrnId };

  const grns = await Grn.find(filter).select('lines').lean();
  return buildLineQtyIndex(grns, {
    prefixField: 'poPrefix',
    docNoField: 'poDocNo',
    lineSrField: 'poLineSr',
    defaultPrefix: 'PO'
  });
}

function pendingReceiptQtyFromIndex(index, poPrefix, docNo, lineSr, orderedQty) {
  const received = sumQtyFromIndex(index, poPrefix, docNo, lineSr, 'PO');
  return Math.max(0, parseQty(orderedQty) - received);
}

export async function sumReceivedQtyForPoLine(poPrefix, docNo, lineSr, excludeGrnId = null) {
  const index = await loadPoReceivedQtyIndex(excludeGrnId);
  return sumQtyFromIndex(index, poPrefix, docNo, lineSr, 'PO');
}

export async function computePendingReceiptQty(poPrefix, docNo, lineSr, orderedQty, excludeGrnId = null) {
  const received = await sumReceivedQtyForPoLine(poPrefix, docNo, lineSr, excludeGrnId);
  return Math.max(0, parseQty(orderedQty) - received);
}

export function derivePurchaseOrderStatus(lines) {
  if (!lines?.length) return 'open';

  let anyReceived = false;
  let anyPending = false;

  for (const line of lines) {
    const ordered = parseQty(line.qty);
    const received = parseQty(line.receivedQty);
    if (received > 0) anyReceived = true;
    if (received < ordered) anyPending = true;
  }

  if (anyReceived && anyPending) return 'partially_received';
  if (anyReceived && !anyPending) return 'fully_received';
  return 'open';
}

export async function syncPurchaseOrderFromReceipts(poPrefix, docNo) {
  const prefix = String(poPrefix || 'PO').toUpperCase();
  const order = await PurchaseOrder.findOne({ docPrefix: prefix, docNo: Number(docNo) });
  if (!order) return null;

  const index = await loadPoReceivedQtyIndex();

  for (const line of order.lines) {
    const received = sumQtyFromIndex(index, prefix, docNo, line.sr, 'PO');
    line.receivedQty = formatQty(received);
  }

  const nextStatus = derivePurchaseOrderStatus(order.lines);
  if (order.status !== 'cancelled') {
    order.status = nextStatus;
  }

  await order.save();
  return order;
}

export function collectPoReferencesFromLines(lines) {
  const map = new Map();
  for (const line of lines ?? []) {
    if (!line.poFormattedDocNo && !line.poDocNo) continue;
    const prefix = String(line.poPrefix || 'PO').toUpperCase();
    const docNo = Number(line.poDocNo);
    const key = `${prefix}-${docNo}`;
    if (!map.has(key)) {
      map.set(key, {
        docPrefix: prefix,
        docNo,
        formattedDocNo: line.poFormattedDocNo || `${prefix}-${docNo}`
      });
    }
  }
  return [...map.values()];
}

export function buildPoReferenceText(refs) {
  return refs.map((r) => r.formattedDocNo).filter(Boolean).join(', ');
}

export async function validateGrnLines(payload, { excludeGrnId = null } = {}) {
  const supplier = normalizeSupplier(payload.supplier);
  if (!supplier) {
    throw Object.assign(new Error('Supplier is required on GRN'), { status: 400 });
  }

  const lines = payload.lines ?? [];
  const poKeysTouched = new Set();
  const receivedIndex = await loadPoReceivedQtyIndex(excludeGrnId);
  const orderCache = new Map();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const hasPoRef = line.poDocNo != null && line.poLineSr != null;
    if (!hasPoRef) continue;

    const poPrefix = String(line.poPrefix || 'PO').toUpperCase();
    const poDocNo = Number(line.poDocNo);
    const poLineSr = Number(line.poLineSr);
    const orderKey = `${poPrefix}|${poDocNo}`;

    let order = orderCache.get(orderKey);
    if (!order) {
      order = await PurchaseOrder.findOne({ docPrefix: poPrefix, docNo: poDocNo }).lean();
      orderCache.set(orderKey, order);
    }
    if (!order) {
      throw Object.assign(
        new Error(`Purchase order ${line.poFormattedDocNo || `${poPrefix}-${poDocNo}`} not found (line ${i + 1})`),
        { status: 400 }
      );
    }

    if (!suppliersMatch(order.supplier, supplier)) {
      throw Object.assign(
        new Error(
          `Line ${i + 1}: purchase order ${order.formattedDocNo} belongs to a different supplier (${order.supplier})`
        ),
        { status: 400 }
      );
    }

    if (!RECEIVABLE_PO_STATUSES.includes(order.status)) {
      throw Object.assign(
        new Error(
          `Purchase order ${order.formattedDocNo} cannot be received (status: ${order.status}). Only Open or Partially Received orders are allowed.`
        ),
        { status: 400 }
      );
    }

    const poLine = (order.lines ?? []).find((l) => Number(l.sr) === poLineSr);
    if (!poLine) {
      throw Object.assign(
        new Error(`PO line ${poLineSr} not found on ${order.formattedDocNo} (GRN line ${i + 1})`),
        { status: 400 }
      );
    }

    const receiveQty = parseQty(line.qty);
    if (receiveQty <= 0) {
      throw Object.assign(new Error(`Receipt quantity must be greater than zero (line ${i + 1})`), { status: 400 });
    }

    const pending = pendingReceiptQtyFromIndex(receivedIndex, poPrefix, poDocNo, poLineSr, poLine.qty);
    if (receiveQty > pending + 0.0001) {
      throw Object.assign(
        new Error(
          `Line ${i + 1}: receipt qty ${formatQty(receiveQty)} exceeds pending ${formatQty(pending)} on ${order.formattedDocNo} (line ${poLineSr})`
        ),
        { status: 400 }
      );
    }

    line.poPrefix = poPrefix;
    line.poDocNo = poDocNo;
    line.poFormattedDocNo = line.poFormattedDocNo || order.formattedDocNo;
    line.poLineSr = poLineSr;
    line.poOrderedQty = formatQty(poLine.qty);
    line.poPendingQty = formatQty(pending);

    poKeysTouched.add(`${poPrefix}|${poDocNo}`);
  }

  const refs = collectPoReferencesFromLines(lines);
  payload.poReferences = refs;
  payload.poReference = buildPoReferenceText(refs);

  return { poKeysTouched: [...poKeysTouched] };
}

export async function applyGrnFulfillment(grn) {
  const refs = collectPoReferencesFromLines(grn.lines);
  for (const ref of refs) {
    await syncPurchaseOrderFromReceipts(ref.docPrefix, ref.docNo);
  }
}

export async function refreshFulfillmentForPurchaseOrders(poKeys) {
  for (const key of poKeys) {
    const [prefix, docNo] = key.split('|');
    await syncPurchaseOrderFromReceipts(prefix, Number(docNo));
  }
}

function orderHasPendingReceiptLinesWithIndex(order, index) {
  for (const line of order.lines ?? []) {
    const pending = pendingReceiptQtyFromIndex(
      index,
      order.docPrefix,
      order.docNo,
      line.sr,
      line.qty
    );
    if (pending > 0) return true;
  }
  return false;
}

export async function orderHasPendingReceiptLines(order, excludeGrnId = null) {
  const index = await loadPoReceivedQtyIndex(excludeGrnId);
  return orderHasPendingReceiptLinesWithIndex(order, index);
}

export async function listPendingPurchaseOrders(supplier) {
  const term = normalizeSupplier(supplier);
  if (!term) return [];

  const [orders, receivedIndex] = await Promise.all([
    PurchaseOrder.find({
      supplier: new RegExp(`^${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      status: { $in: RECEIVABLE_PO_STATUSES }
    })
      .sort({ poDate: -1, docNo: -1 })
      .lean(),
    loadPoReceivedQtyIndex()
  ]);

  return orders.filter((order) => orderHasPendingReceiptLinesWithIndex(order, receivedIndex));
}

export async function buildPendingReceiptLines(supplier, purchaseOrders) {
  const term = normalizeSupplier(supplier);
  if (!term) {
    throw Object.assign(new Error('Supplier is required'), { status: 400 });
  }

  if (!Array.isArray(purchaseOrders) || purchaseOrders.length === 0) {
    throw Object.assign(new Error('Select at least one purchase order'), { status: 400 });
  }

  const refs = [];
  const seen = new Set();
  for (const ref of purchaseOrders) {
    const poPrefix = String(ref.docPrefix || ref.poPrefix || 'PO').toUpperCase();
    const docNo = Number(ref.docNo);
    const key = `${poPrefix}|${docNo}`;
    if (seen.has(key)) continue;
    seen.add(key);
    refs.push({ poPrefix, docNo });
  }

  const prefixes = [...new Set(refs.map((r) => r.poPrefix))];
  const docNos = refs.map((r) => r.docNo);

  const [orders, receivedIndex] = await Promise.all([
    PurchaseOrder.find({
      docPrefix: { $in: prefixes },
      docNo: { $in: docNos }
    }).lean(),
    loadPoReceivedQtyIndex()
  ]);

  const orderByKey = new Map(
    orders.map((o) => [`${String(o.docPrefix).toUpperCase()}|${o.docNo}`, o])
  );

  const lines = [];

  for (const { poPrefix, docNo } of refs) {
    const order = orderByKey.get(`${poPrefix}|${docNo}`);
    if (!order) {
      throw Object.assign(new Error(`Purchase order ${poPrefix}-${docNo} not found`), { status: 404 });
    }

    if (!suppliersMatch(order.supplier, term)) {
      throw Object.assign(
        new Error(`Purchase order ${order.formattedDocNo} does not belong to supplier ${term}`),
        { status: 400 }
      );
    }

    if (!RECEIVABLE_PO_STATUSES.includes(order.status)) {
      throw Object.assign(
        new Error(`Purchase order ${order.formattedDocNo} is not available for receipt (status: ${order.status})`),
        { status: 400 }
      );
    }

    for (const line of order.lines ?? []) {
      const pending = pendingReceiptQtyFromIndex(receivedIndex, poPrefix, docNo, line.sr, line.qty);
      if (pending <= 0) continue;

      lines.push({
        poPrefix,
        poDocNo: docNo,
        poFormattedDocNo: order.formattedDocNo,
        poLineSr: line.sr,
        productRetailCode: line.productRetailCode,
        itemDescription: line.itemDescription,
        qty: formatQty(pending),
        rate: line.rate,
        salesRate: line.salesRate ?? line.rate,
        discPercent: line.discPercent,
        discValue: line.discValue,
        taxType: line.taxType,
        taxPercent: line.taxPercent,
        amount: line.amount,
        poOrderedQty: formatQty(line.qty),
        poPendingQty: formatQty(pending)
      });
    }
  }

  if (lines.length === 0) {
    throw Object.assign(new Error('No pending lines found on selected purchase orders'), { status: 400 });
  }

  return lines;
}
