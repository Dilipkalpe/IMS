import { DeliveryChallan } from '../models/DeliveryChallan.js';
import { SalesInvoice } from '../models/SalesInvoice.js';
import { parseQty, formatQty } from './salesOrderFulfillment.js';
import { buildLineQtyIndex, sumQtyFromIndex } from './fulfillmentQtyIndex.js';

export const INVOICEABLE_DC_STATUSES = [
  'open', 'confirmed', 'dispatched', 'posted', 'shipped', 'partially_invoiced'
];

export const NON_SELECTABLE_DC_STATUSES = ['cancelled', 'fully_invoiced', 'draft', 'closed'];

function normalizeCustomer(value) {
  return String(value ?? '').trim();
}

function customersMatch(a, b) {
  return normalizeCustomer(a).toLowerCase() === normalizeCustomer(b).toLowerCase();
}

export function dcLineKey(dcPrefix, docNo, lineSr) {
  return `${String(dcPrefix || 'DC').toUpperCase()}|${Number(docNo)}|${Number(lineSr)}`;
}

async function loadDcInvoicedQtyIndex(excludeInvId = null) {
  const filter = {
    'lines.dcDocNo': { $ne: null },
    status: { $nin: ['cancelled', 'draft'] }
  };
  if (excludeInvId) filter._id = { $ne: excludeInvId };

  const invoices = await SalesInvoice.find(filter).select('lines').lean();
  return buildLineQtyIndex(invoices, {
    prefixField: 'dcPrefix',
    docNoField: 'dcDocNo',
    lineSrField: 'dcLineSr',
    defaultPrefix: 'DC'
  });
}

function pendingInvoiceQtyFromIndex(index, dcPrefix, docNo, lineSr, deliveredQty) {
  const invoiced = sumQtyFromIndex(index, dcPrefix, docNo, lineSr, 'DC');
  return Math.max(0, parseQty(deliveredQty) - invoiced);
}

export async function sumInvoicedQtyForDcLine(dcPrefix, docNo, lineSr, excludeInvId = null) {
  const index = await loadDcInvoicedQtyIndex(excludeInvId);
  return sumQtyFromIndex(index, dcPrefix, docNo, lineSr, 'DC');
}

export async function computePendingInvoiceQty(dcPrefix, docNo, lineSr, deliveredQty, excludeInvId = null) {
  const invoiced = await sumInvoicedQtyForDcLine(dcPrefix, docNo, lineSr, excludeInvId);
  return Math.max(0, parseQty(deliveredQty) - invoiced);
}

const DC_OPERATIONAL_WHEN_NOT_INVOICED = new Set([
  'confirmed',
  'dispatched',
  'posted',
  'shipped'
]);

export function deriveDeliveryChallanInvoiceStatus(lines, priorStatus = 'open') {
  if (!lines?.length) return 'open';

  let anyInvoiced = false;
  let anyPending = false;

  for (const line of lines) {
    const delivered = parseQty(line.qty);
    const invoiced = parseQty(line.invoicedQty ?? 0);
    if (invoiced > 0) anyInvoiced = true;
    if (invoiced < delivered) anyPending = true;
  }

  if (anyInvoiced && anyPending) return 'partially_invoiced';
  if (anyInvoiced && !anyPending) return 'fully_invoiced';

  const prior = String(priorStatus ?? 'open').toLowerCase();
  if (DC_OPERATIONAL_WHEN_NOT_INVOICED.has(prior)) return prior;
  return 'open';
}

export async function syncDeliveryChallanFromInvoices(dcPrefix, docNo) {
  const prefix = String(dcPrefix || 'DC').toUpperCase();
  const challan = await DeliveryChallan.findOne({ docPrefix: prefix, docNo: Number(docNo) });
  if (!challan) return null;

  const index = await loadDcInvoicedQtyIndex();

  for (const line of challan.lines) {
    const invoiced = sumQtyFromIndex(index, prefix, docNo, line.sr, 'DC');
    line.invoicedQty = formatQty(invoiced);
  }

  const nextStatus = deriveDeliveryChallanInvoiceStatus(
    challan.lines.map((l) => ({ qty: l.qty, invoicedQty: l.invoicedQty })),
    challan.status
  );
  if (challan.status !== 'cancelled') {
    challan.status = nextStatus;
  }

  await challan.save();
  return challan;
}

export function collectDcReferencesFromLines(lines) {
  const map = new Map();
  for (const line of lines ?? []) {
    if (!line.dcFormattedDocNo && !line.dcDocNo) continue;
    const prefix = String(line.dcPrefix || 'DC').toUpperCase();
    const docNo = Number(line.dcDocNo);
    const key = `${prefix}-${docNo}`;
    if (!map.has(key)) {
      map.set(key, {
        docPrefix: prefix,
        docNo,
        formattedDocNo: line.dcFormattedDocNo || `${prefix}-${docNo}`
      });
    }
  }
  return [...map.values()];
}

export function buildDcReferenceText(refs) {
  return refs.map((r) => r.formattedDocNo).filter(Boolean).join(', ');
}

export function invoiceHasDcSourceLines(payload) {
  return (payload?.lines ?? []).some((l) => l.dcDocNo != null && l.dcLineSr != null);
}

export async function validateSalesInvoiceLines(payload, { excludeInvId = null } = {}) {
  const customer = normalizeCustomer(payload.customer);
  if (!customer) {
    throw Object.assign(new Error('Customer is required on sales invoice'), { status: 400 });
  }

  const lines = payload.lines ?? [];
  const dcKeysTouched = new Set();
  const invoicedIndex = await loadDcInvoicedQtyIndex(excludeInvId);

  const challanCache = new Map();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const hasDcRef = line.dcDocNo != null && line.dcLineSr != null;
    if (!hasDcRef) continue;

    const dcPrefix = String(line.dcPrefix || 'DC').toUpperCase();
    const dcDocNo = Number(line.dcDocNo);
    const dcLineSr = Number(line.dcLineSr);
    const challanKey = `${dcPrefix}|${dcDocNo}`;

    let challan = challanCache.get(challanKey);
    if (!challan) {
      challan = await DeliveryChallan.findOne({ docPrefix: dcPrefix, docNo: dcDocNo }).lean();
      challanCache.set(challanKey, challan);
    }

    if (!challan) {
      throw Object.assign(
        new Error(`Delivery challan ${line.dcFormattedDocNo || `${dcPrefix}-${dcDocNo}`} not found (line ${i + 1})`),
        { status: 400 }
      );
    }

    if (!customersMatch(challan.customer, customer)) {
      throw Object.assign(
        new Error(
          `Line ${i + 1}: delivery challan ${challan.formattedDocNo} belongs to a different customer (${challan.customer})`
        ),
        { status: 400 }
      );
    }

    if (!INVOICEABLE_DC_STATUSES.includes(challan.status)) {
      throw Object.assign(
        new Error(
          `Delivery challan ${challan.formattedDocNo} cannot be invoiced (status: ${challan.status}).`
        ),
        { status: 400 }
      );
    }

    const dcLine = (challan.lines ?? []).find((l) => Number(l.sr) === dcLineSr);
    if (!dcLine) {
      throw Object.assign(
        new Error(`DC line ${dcLineSr} not found on ${challan.formattedDocNo} (invoice line ${i + 1})`),
        { status: 400 }
      );
    }

    const invoiceQty = parseQty(line.qty);
    if (invoiceQty <= 0) {
      throw Object.assign(new Error(`Invoice quantity must be greater than zero (line ${i + 1})`), { status: 400 });
    }

    const pending = pendingInvoiceQtyFromIndex(invoicedIndex, dcPrefix, dcDocNo, dcLineSr, dcLine.qty);
    if (invoiceQty > pending + 0.0001) {
      throw Object.assign(
        new Error(
          `Line ${i + 1}: invoice qty ${formatQty(invoiceQty)} exceeds pending ${formatQty(pending)} on ${challan.formattedDocNo} (line ${dcLineSr})`
        ),
        { status: 400 }
      );
    }

    line.dcPrefix = dcPrefix;
    line.dcDocNo = dcDocNo;
    line.dcFormattedDocNo = line.dcFormattedDocNo || challan.formattedDocNo;
    line.dcLineSr = dcLineSr;
    line.dcDeliveredQty = formatQty(dcLine.qty);
    line.dcPendingQty = formatQty(pending);

    dcKeysTouched.add(`${dcPrefix}|${dcDocNo}`);
  }

  const refs = collectDcReferencesFromLines(lines);
  payload.dcReferences = refs;
  payload.dcReference = buildDcReferenceText(refs);

  return { dcKeysTouched: [...dcKeysTouched] };
}

export async function applySalesInvoiceFulfillment(inv) {
  const refs = collectDcReferencesFromLines(inv.lines);
  for (const ref of refs) {
    await syncDeliveryChallanFromInvoices(ref.docPrefix, ref.docNo);
  }
}

export async function refreshInvoicingForDeliveryChallans(dcKeys) {
  for (const key of dcKeys) {
    const [prefix, docNo] = key.split('|');
    await syncDeliveryChallanFromInvoices(prefix, Number(docNo));
  }
}

function challanHasPendingInvoiceLinesWithIndex(challan, index) {
  for (const line of challan.lines ?? []) {
    const pending = pendingInvoiceQtyFromIndex(
      index,
      challan.docPrefix,
      challan.docNo,
      line.sr,
      line.qty
    );
    if (pending > 0) return true;
  }
  return false;
}

export async function challanHasPendingInvoiceLines(challan, excludeInvId = null) {
  const index = await loadDcInvoicedQtyIndex(excludeInvId);
  return challanHasPendingInvoiceLinesWithIndex(challan, index);
}

export async function listPendingDeliveryChallansForInvoice(customer) {
  const term = normalizeCustomer(customer);
  if (!term) return [];

  const [challans, invoicedIndex] = await Promise.all([
    DeliveryChallan.find({
      customer: new RegExp(`^${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      status: { $in: INVOICEABLE_DC_STATUSES }
    })
      .sort({ dcDate: -1, docNo: -1 })
      .lean(),
    loadDcInvoicedQtyIndex()
  ]);

  return challans.filter((dc) => challanHasPendingInvoiceLinesWithIndex(dc, invoicedIndex));
}

export async function buildPendingInvoiceLines(customer, deliveryChallans) {
  const term = normalizeCustomer(customer);
  if (!term) {
    throw Object.assign(new Error('Customer is required'), { status: 400 });
  }

  if (!Array.isArray(deliveryChallans) || deliveryChallans.length === 0) {
    throw Object.assign(new Error('Select at least one delivery challan'), { status: 400 });
  }

  const refs = [];
  const seen = new Set();
  for (const ref of deliveryChallans) {
    const dcPrefix = String(ref.docPrefix || ref.dcPrefix || 'DC').toUpperCase();
    const docNo = Number(ref.docNo);
    const key = `${dcPrefix}|${docNo}`;
    if (seen.has(key)) continue;
    seen.add(key);
    refs.push({ dcPrefix, docNo });
  }

  const prefixes = [...new Set(refs.map((r) => r.dcPrefix))];
  const docNos = refs.map((r) => r.docNo);

  const [challans, invoicedIndex] = await Promise.all([
    DeliveryChallan.find({
      docPrefix: { $in: prefixes },
      docNo: { $in: docNos }
    }).lean(),
    loadDcInvoicedQtyIndex()
  ]);

  const challanByKey = new Map(
    challans.map((c) => [`${String(c.docPrefix).toUpperCase()}|${c.docNo}`, c])
  );

  const lines = [];

  for (const { dcPrefix, docNo } of refs) {
    const challan = challanByKey.get(`${dcPrefix}|${docNo}`);
    if (!challan) {
      throw Object.assign(new Error(`Delivery challan ${dcPrefix}-${docNo} not found`), { status: 404 });
    }

    if (!customersMatch(challan.customer, term)) {
      throw Object.assign(
        new Error(`Delivery challan ${challan.formattedDocNo} does not belong to customer ${term}`),
        { status: 400 }
      );
    }

    if (!INVOICEABLE_DC_STATUSES.includes(challan.status)) {
      throw Object.assign(
        new Error(`Delivery challan ${challan.formattedDocNo} is not available for invoicing (status: ${challan.status})`),
        { status: 400 }
      );
    }

    for (const line of challan.lines ?? []) {
      const pending = pendingInvoiceQtyFromIndex(invoicedIndex, dcPrefix, docNo, line.sr, line.qty);
      if (pending <= 0) continue;

      lines.push({
        dcPrefix,
        dcDocNo: docNo,
        dcFormattedDocNo: challan.formattedDocNo,
        dcLineSr: line.sr,
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
        dcDeliveredQty: formatQty(line.qty),
        dcPendingQty: formatQty(pending)
      });
    }
  }

  if (lines.length === 0) {
    throw Object.assign(new Error('No pending lines found on selected delivery challans'), { status: 400 });
  }

  return lines;
}
