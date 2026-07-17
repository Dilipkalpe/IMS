import { DeliveryChallan } from '../models/DeliveryChallan.js';
import { SalesOrder } from '../models/SalesOrder.js';

/** Statuses eligible for delivery challan consolidation. */
export const DELIVERABLE_SO_STATUSES = ['open', 'partially_delivered'];

export const NON_SELECTABLE_SO_STATUSES = ['fully_delivered', 'cancelled'];

export function parseQty(value) {
  const n = Number(String(value ?? '0').replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : 0;
}

export function formatQty(n) {
  const v = Math.round(n * 1000) / 1000;
  return Number.isInteger(v) ? String(v) : v.toFixed(3).replace(/\.?0+$/, '');
}

export function soLineKey(soPrefix, docNo, lineSr) {
  return `${String(soPrefix || 'SO').toUpperCase()}|${Number(docNo)}|${Number(lineSr)}`;
}

function normalizeCustomer(value) {
  return String(value ?? '').trim();
}

function customersMatch(a, b) {
  return normalizeCustomer(a).toLowerCase() === normalizeCustomer(b).toLowerCase();
}

/**
 * Sum delivered qty on all DC lines for an SO line (optionally excluding one DC document).
 */
export async function sumDeliveredQtyForSoLine(soPrefix, docNo, lineSr, excludeDcId = null) {
  const filter = { status: { $nin: ['cancelled', 'draft'] } };
  if (excludeDcId) {
    filter._id = { $ne: excludeDcId };
  }

  const challans = await DeliveryChallan.find(filter).select('lines').lean();
  let total = 0;
  const prefix = String(soPrefix || 'SO').toUpperCase();
  const doc = Number(docNo);
  const sr = Number(lineSr);

  for (const dc of challans) {
    for (const line of dc.lines ?? []) {
      if (String(line.soPrefix || 'SO').toUpperCase() !== prefix) continue;
      if (Number(line.soDocNo) !== doc) continue;
      if (Number(line.soLineSr) !== sr) continue;
      total += parseQty(line.qty);
    }
  }

  return total;
}

export async function computePendingQty(soPrefix, docNo, lineSr, orderedQty, excludeDcId = null) {
  const delivered = await sumDeliveredQtyForSoLine(soPrefix, docNo, lineSr, excludeDcId);
  return Math.max(0, parseQty(orderedQty) - delivered);
}

export async function orderHasPendingLines(order, excludeDcId = null) {
  for (const line of order.lines ?? []) {
    const pending = await computePendingQty(
      order.soPrefix,
      order.docNo,
      line.sr,
      line.qty,
      excludeDcId
    );
    if (pending > 0) return true;
  }
  return false;
}

export function deriveSalesOrderStatus(lines) {
  if (!lines?.length) return 'open';

  let anyDelivered = false;
  let anyPending = false;

  for (const line of lines) {
    const ordered = parseQty(line.qty);
    const delivered = parseQty(line.deliveredQty);
    if (delivered > 0) anyDelivered = true;
    if (delivered < ordered) anyPending = true;
  }

  if (anyDelivered && anyPending) return 'partially_delivered';
  if (anyDelivered && !anyPending) return 'fully_delivered';
  return 'open';
}

export async function syncSalesOrderFromDeliveries(soPrefix, docNo) {
  const order = await SalesOrder.findOne({
    soPrefix: String(soPrefix || 'SO').toUpperCase(),
    docNo: Number(docNo)
  });
  if (!order) return null;

  for (const line of order.lines) {
    const delivered = await sumDeliveredQtyForSoLine(order.soPrefix, order.docNo, line.sr);
    line.deliveredQty = formatQty(delivered);
  }

  const nextStatus = deriveSalesOrderStatus(order.lines);
  if (order.status !== 'cancelled') {
    order.status = nextStatus;
  }

  await order.save();
  return order;
}

export function collectSoReferencesFromLines(lines) {
  const map = new Map();
  for (const line of lines ?? []) {
    if (!line.soFormattedDocNo && !line.soDocNo) continue;
    const prefix = String(line.soPrefix || 'SO').toUpperCase();
    const docNo = Number(line.soDocNo);
    const key = `${prefix}-${docNo}`;
    if (!map.has(key)) {
      map.set(key, {
        soPrefix: prefix,
        docNo,
        formattedDocNo: line.soFormattedDocNo || `${prefix}-${docNo}`
      });
    }
  }
  return [...map.values()];
}

export function buildSoReferenceText(refs) {
  return refs.map((r) => r.formattedDocNo).filter(Boolean).join(', ');
}

/**
 * Validate DC payload lines against SO pending quantities and customer.
 */
export async function validateDeliveryChallanLines(payload, { excludeDcId = null } = {}) {
  const customer = normalizeCustomer(payload.customer);
  if (!customer) {
    throw Object.assign(new Error('Customer is required on delivery challan'), { status: 400 });
  }

  const lines = payload.lines ?? [];
  const soKeysTouched = new Set();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const hasSoRef = line.soDocNo != null && line.soLineSr != null;
    if (!hasSoRef) continue;

    const soPrefix = String(line.soPrefix || 'SO').toUpperCase();
    const soDocNo = Number(line.soDocNo);
    const soLineSr = Number(line.soLineSr);

    const order = await SalesOrder.findOne({ soPrefix, docNo: soDocNo }).lean();
    if (!order) {
      throw Object.assign(
        new Error(`Sales order ${line.soFormattedDocNo || `${soPrefix}-${soDocNo}`} not found (line ${i + 1})`),
        { status: 400 }
      );
    }

    if (!customersMatch(order.customer, customer)) {
      throw Object.assign(
        new Error(
          `Line ${i + 1}: sales order ${order.formattedDocNo} belongs to a different customer (${order.customer})`
        ),
        { status: 400 }
      );
    }

    if (!DELIVERABLE_SO_STATUSES.includes(order.status)) {
      throw Object.assign(
        new Error(
          `Sales order ${order.formattedDocNo} cannot be delivered (status: ${order.status}). Only Open or Partially Delivered orders are allowed.`
        ),
        { status: 400 }
      );
    }

    const soLine = (order.lines ?? []).find((l) => Number(l.sr) === soLineSr);
    if (!soLine) {
      throw Object.assign(
        new Error(`Sales order line ${soLineSr} not found on ${order.formattedDocNo} (DC line ${i + 1})`),
        { status: 400 }
      );
    }

    const deliverQty = parseQty(line.qty);
    if (deliverQty <= 0) {
      throw Object.assign(new Error(`Delivery quantity must be greater than zero (line ${i + 1})`), { status: 400 });
    }

    const pending = await computePendingQty(soPrefix, soDocNo, soLineSr, soLine.qty, excludeDcId);
    if (deliverQty > pending + 0.0001) {
      throw Object.assign(
        new Error(
          `Line ${i + 1}: delivery qty ${formatQty(deliverQty)} exceeds pending ${formatQty(pending)} on ${order.formattedDocNo} (line ${soLineSr})`
        ),
        { status: 400 }
      );
    }

    line.soPrefix = soPrefix;
    line.soDocNo = soDocNo;
    line.soFormattedDocNo = line.soFormattedDocNo || order.formattedDocNo;
    line.soLineSr = soLineSr;
    line.soOrderedQty = formatQty(soLine.qty);
    line.soPendingQty = formatQty(pending);

    soKeysTouched.add(`${soPrefix}|${soDocNo}`);
  }

  const refs = collectSoReferencesFromLines(lines);
  payload.soReferences = refs;
  payload.soReference = buildSoReferenceText(refs);

  return { soKeysTouched: [...soKeysTouched] };
}

export async function applyDeliveryChallanFulfillment(dc) {
  const refs = collectSoReferencesFromLines(dc.lines);
  for (const ref of refs) {
    await syncSalesOrderFromDeliveries(ref.soPrefix, ref.docNo);
  }
}

export async function refreshFulfillmentForSalesOrders(soKeys) {
  for (const key of soKeys) {
    const [prefix, docNo] = key.split('|');
    await syncSalesOrderFromDeliveries(prefix, Number(docNo));
  }
}

export async function listPendingSalesOrders(customer) {
  const term = normalizeCustomer(customer);
  if (!term) return [];

  const orders = await SalesOrder.find({
    customer: new RegExp(`^${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    status: { $in: DELIVERABLE_SO_STATUSES }
  })
    .sort({ soDate: -1, docNo: -1 })
    .lean();

  const result = [];
  for (const order of orders) {
    if (await orderHasPendingLines(order)) {
      result.push(order);
    }
  }
  return result;
}

export async function buildPendingDeliveryLines(customer, salesOrders) {
  const term = normalizeCustomer(customer);
  if (!term) {
    throw Object.assign(new Error('Customer is required'), { status: 400 });
  }

  if (!Array.isArray(salesOrders) || salesOrders.length === 0) {
    throw Object.assign(new Error('Select at least one sales order'), { status: 400 });
  }

  const lines = [];
  const seenOrders = new Set();

  for (const ref of salesOrders) {
    const soPrefix = String(ref.soPrefix || 'SO').toUpperCase();
    const docNo = Number(ref.docNo);
    const key = `${soPrefix}|${docNo}`;
    if (seenOrders.has(key)) continue;
    seenOrders.add(key);

    const order = await SalesOrder.findOne({ soPrefix, docNo }).lean();
    if (!order) {
      throw Object.assign(new Error(`Sales order ${soPrefix}-${docNo} not found`), { status: 404 });
    }

    if (!customersMatch(order.customer, term)) {
      throw Object.assign(
        new Error(`Sales order ${order.formattedDocNo} does not belong to customer ${term}`),
        { status: 400 }
      );
    }

    if (!DELIVERABLE_SO_STATUSES.includes(order.status)) {
      throw Object.assign(
        new Error(`Sales order ${order.formattedDocNo} is not available for delivery (status: ${order.status})`),
        { status: 400 }
      );
    }

    for (const line of order.lines ?? []) {
      const pending = await computePendingQty(soPrefix, docNo, line.sr, line.qty);
      if (pending <= 0) continue;

      lines.push({
        soPrefix,
        soDocNo: docNo,
        soFormattedDocNo: order.formattedDocNo,
        soLineSr: line.sr,
        productRetailCode: line.productRetailCode,
        itemDescription: line.itemDescription,
        qty: formatQty(pending),
        rate: line.rate,
        salesRate: line.rate,
        discPercent: line.discPercent,
        discValue: line.discValue,
        taxType: line.taxType,
        taxPercent: line.taxPercent,
        amount: line.amount,
        soOrderedQty: formatQty(line.qty),
        soPendingQty: formatQty(pending)
      });
    }
  }

  if (lines.length === 0) {
    throw Object.assign(new Error('No pending lines found on selected sales orders'), { status: 400 });
  }

  return lines;
}
