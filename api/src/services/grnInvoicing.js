import { Grn } from '../models/Grn.js';
import { PurchaseInvoice } from '../models/PurchaseInvoice.js';
import { parseQty, formatQty } from './salesOrderFulfillment.js';
import { buildLineQtyIndex, sumQtyFromIndex } from './fulfillmentQtyIndex.js';

export const INVOICEABLE_GRN_STATUSES = [
  'open', 'confirmed', 'dispatched', 'posted', 'received', 'partially_invoiced'
];

export const NON_SELECTABLE_GRN_STATUSES = ['cancelled', 'fully_invoiced', 'draft', 'closed'];

function normalizeSupplier(value) {
  return String(value ?? '').trim();
}

function suppliersMatch(a, b) {
  return normalizeSupplier(a).toLowerCase() === normalizeSupplier(b).toLowerCase();
}

async function loadGrnInvoicedQtyIndex(excludePiId = null) {
  const filter = {
    'lines.grnDocNo': { $ne: null },
    status: { $nin: ['cancelled', 'draft'] }
  };
  if (excludePiId) filter._id = { $ne: excludePiId };

  const invoices = await PurchaseInvoice.find(filter).select('lines').lean();
  return buildLineQtyIndex(invoices, {
    prefixField: 'grnPrefix',
    docNoField: 'grnDocNo',
    lineSrField: 'grnLineSr',
    defaultPrefix: 'GRN'
  });
}

function pendingGrnInvoiceQtyFromIndex(index, grnPrefix, docNo, lineSr, receivedQty) {
  const invoiced = sumQtyFromIndex(index, grnPrefix, docNo, lineSr, 'GRN');
  return Math.max(0, parseQty(receivedQty) - invoiced);
}

export async function sumInvoicedQtyForGrnLine(grnPrefix, docNo, lineSr, excludePiId = null) {
  const index = await loadGrnInvoicedQtyIndex(excludePiId);
  return sumQtyFromIndex(index, grnPrefix, docNo, lineSr, 'GRN');
}

export async function computePendingGrnInvoiceQty(grnPrefix, docNo, lineSr, receivedQty, excludePiId = null) {
  const invoiced = await sumInvoicedQtyForGrnLine(grnPrefix, docNo, lineSr, excludePiId);
  return Math.max(0, parseQty(receivedQty) - invoiced);
}

const GRN_OPERATIONAL_WHEN_NOT_INVOICED = new Set([
  'confirmed',
  'dispatched',
  'posted',
  'received'
]);

export function deriveGrnInvoiceStatus(lines, priorStatus = 'open') {
  if (!lines?.length) return 'open';

  let anyInvoiced = false;
  let anyPending = false;

  for (const line of lines) {
    const received = parseQty(line.qty);
    const invoiced = parseQty(line.invoicedQty ?? 0);
    if (invoiced > 0) anyInvoiced = true;
    if (invoiced < received) anyPending = true;
  }

  if (anyInvoiced && anyPending) return 'partially_invoiced';
  if (anyInvoiced && !anyPending) return 'fully_invoiced';

  const prior = String(priorStatus ?? 'open').toLowerCase();
  if (GRN_OPERATIONAL_WHEN_NOT_INVOICED.has(prior)) return prior;
  return 'open';
}

export async function syncGrnFromInvoices(grnPrefix, docNo) {
  const prefix = String(grnPrefix || 'GRN').toUpperCase();
  const grn = await Grn.findOne({ docPrefix: prefix, docNo: Number(docNo) });
  if (!grn) return null;

  const index = await loadGrnInvoicedQtyIndex();

  for (const line of grn.lines) {
    const invoiced = sumQtyFromIndex(index, prefix, docNo, line.sr, 'GRN');
    line.invoicedQty = formatQty(invoiced);
  }

  const nextStatus = deriveGrnInvoiceStatus(
    grn.lines.map((l) => ({ qty: l.qty, invoicedQty: l.invoicedQty })),
    grn.status
  );
  if (grn.status !== 'cancelled') {
    grn.status = nextStatus;
  }

  await grn.save();
  return grn;
}

export function collectGrnReferencesFromLines(lines) {
  const map = new Map();
  for (const line of lines ?? []) {
    if (!line.grnFormattedDocNo && !line.grnDocNo) continue;
    const prefix = String(line.grnPrefix || 'GRN').toUpperCase();
    const docNo = Number(line.grnDocNo);
    const key = `${prefix}-${docNo}`;
    if (!map.has(key)) {
      map.set(key, {
        docPrefix: prefix,
        docNo,
        formattedDocNo: line.grnFormattedDocNo || `${prefix}-${docNo}`
      });
    }
  }
  return [...map.values()];
}

export function buildGrnReferenceText(refs) {
  return refs.map((r) => r.formattedDocNo).filter(Boolean).join(', ');
}

export function purchaseInvoiceHasGrnSourceLines(payload) {
  return (payload?.lines ?? []).some((l) => l.grnDocNo != null && l.grnLineSr != null);
}

export async function validatePurchaseInvoiceLines(payload, { excludePiId = null } = {}) {
  const supplier = normalizeSupplier(payload.supplier);
  if (!supplier) {
    throw Object.assign(new Error('Supplier is required on purchase invoice'), { status: 400 });
  }

  const lines = payload.lines ?? [];
  const grnKeysTouched = new Set();
  const invoicedIndex = await loadGrnInvoicedQtyIndex(excludePiId);
  const grnCache = new Map();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const hasGrnRef = line.grnDocNo != null && line.grnLineSr != null;
    if (!hasGrnRef) continue;

    const grnPrefix = String(line.grnPrefix || 'GRN').toUpperCase();
    const grnDocNo = Number(line.grnDocNo);
    const grnLineSr = Number(line.grnLineSr);
    const grnKey = `${grnPrefix}|${grnDocNo}`;

    let grn = grnCache.get(grnKey);
    if (!grn) {
      grn = await Grn.findOne({ docPrefix: grnPrefix, docNo: grnDocNo }).lean();
      grnCache.set(grnKey, grn);
    }
    if (!grn) {
      throw Object.assign(
        new Error(`GRN ${line.grnFormattedDocNo || `${grnPrefix}-${grnDocNo}`} not found (line ${i + 1})`),
        { status: 400 }
      );
    }

    if (!suppliersMatch(grn.supplier, supplier)) {
      throw Object.assign(
        new Error(
          `Line ${i + 1}: GRN ${grn.formattedDocNo} belongs to a different supplier (${grn.supplier})`
        ),
        { status: 400 }
      );
    }

    if (!INVOICEABLE_GRN_STATUSES.includes(grn.status)) {
      throw Object.assign(
        new Error(`GRN ${grn.formattedDocNo} cannot be invoiced (status: ${grn.status}).`),
        { status: 400 }
      );
    }

    const grnLine = (grn.lines ?? []).find((l) => Number(l.sr) === grnLineSr);
    if (!grnLine) {
      throw Object.assign(
        new Error(`GRN line ${grnLineSr} not found on ${grn.formattedDocNo} (invoice line ${i + 1})`),
        { status: 400 }
      );
    }

    const invoiceQty = parseQty(line.qty);
    if (invoiceQty <= 0) {
      throw Object.assign(new Error(`Invoice quantity must be greater than zero (line ${i + 1})`), { status: 400 });
    }

    const pending = pendingGrnInvoiceQtyFromIndex(invoicedIndex, grnPrefix, grnDocNo, grnLineSr, grnLine.qty);
    if (invoiceQty > pending + 0.0001) {
      throw Object.assign(
        new Error(
          `Line ${i + 1}: invoice qty ${formatQty(invoiceQty)} exceeds pending ${formatQty(pending)} on ${grn.formattedDocNo} (line ${grnLineSr})`
        ),
        { status: 400 }
      );
    }

    line.grnPrefix = grnPrefix;
    line.grnDocNo = grnDocNo;
    line.grnFormattedDocNo = line.grnFormattedDocNo || grn.formattedDocNo;
    line.grnLineSr = grnLineSr;
    line.grnReceivedQty = formatQty(grnLine.qty);
    line.grnPendingQty = formatQty(pending);

    grnKeysTouched.add(`${grnPrefix}|${grnDocNo}`);
  }

  const refs = collectGrnReferencesFromLines(lines);
  payload.grnReferences = refs;
  payload.grnReference = buildGrnReferenceText(refs);

  return { grnKeysTouched: [...grnKeysTouched] };
}

export async function applyPurchaseInvoiceFulfillment(inv) {
  const refs = collectGrnReferencesFromLines(inv.lines);
  for (const ref of refs) {
    await syncGrnFromInvoices(ref.docPrefix, ref.docNo);
  }
}

export async function refreshInvoicingForGrns(grnKeys) {
  for (const key of grnKeys) {
    const [prefix, docNo] = key.split('|');
    await syncGrnFromInvoices(prefix, Number(docNo));
  }
}

function grnHasPendingInvoiceLinesWithIndex(grn, index) {
  for (const line of grn.lines ?? []) {
    const pending = pendingGrnInvoiceQtyFromIndex(
      index,
      grn.docPrefix,
      grn.docNo,
      line.sr,
      line.qty
    );
    if (pending > 0) return true;
  }
  return false;
}

export async function grnHasPendingInvoiceLines(grn, excludePiId = null) {
  const index = await loadGrnInvoicedQtyIndex(excludePiId);
  return grnHasPendingInvoiceLinesWithIndex(grn, index);
}

export async function listPendingGrnsForInvoice(supplier) {
  const term = normalizeSupplier(supplier);
  if (!term) return [];

  const [grns, invoicedIndex] = await Promise.all([
    Grn.find({
      supplier: new RegExp(`^${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      status: { $in: INVOICEABLE_GRN_STATUSES }
    })
      .sort({ grnDate: -1, docNo: -1 })
      .lean(),
    loadGrnInvoicedQtyIndex()
  ]);

  return grns.filter((grn) => grnHasPendingInvoiceLinesWithIndex(grn, invoicedIndex));
}

export async function buildPendingPurchaseInvoiceLines(supplier, grns) {
  const term = normalizeSupplier(supplier);
  if (!term) {
    throw Object.assign(new Error('Supplier is required'), { status: 400 });
  }

  if (!Array.isArray(grns) || grns.length === 0) {
    throw Object.assign(new Error('Select at least one GRN'), { status: 400 });
  }

  const refs = [];
  const seen = new Set();
  for (const ref of grns) {
    const grnPrefix = String(ref.docPrefix || ref.grnPrefix || 'GRN').toUpperCase();
    const docNo = Number(ref.docNo);
    const key = `${grnPrefix}|${docNo}`;
    if (seen.has(key)) continue;
    seen.add(key);
    refs.push({ grnPrefix, docNo });
  }

  const prefixes = [...new Set(refs.map((r) => r.grnPrefix))];
  const docNos = refs.map((r) => r.docNo);

  const [grnDocs, invoicedIndex] = await Promise.all([
    Grn.find({
      docPrefix: { $in: prefixes },
      docNo: { $in: docNos }
    }).lean(),
    loadGrnInvoicedQtyIndex()
  ]);

  const grnByKey = new Map(
    grnDocs.map((g) => [`${String(g.docPrefix).toUpperCase()}|${g.docNo}`, g])
  );

  const lines = [];

  for (const { grnPrefix, docNo } of refs) {
    const grn = grnByKey.get(`${grnPrefix}|${docNo}`);
    if (!grn) {
      throw Object.assign(new Error(`GRN ${grnPrefix}-${docNo} not found`), { status: 404 });
    }

    if (!suppliersMatch(grn.supplier, term)) {
      throw Object.assign(
        new Error(`GRN ${grn.formattedDocNo} does not belong to supplier ${term}`),
        { status: 400 }
      );
    }

    if (!INVOICEABLE_GRN_STATUSES.includes(grn.status)) {
      throw Object.assign(
        new Error(`GRN ${grn.formattedDocNo} is not available for invoicing (status: ${grn.status})`),
        { status: 400 }
      );
    }

    for (const line of grn.lines ?? []) {
      const pending = pendingGrnInvoiceQtyFromIndex(invoicedIndex, grnPrefix, docNo, line.sr, line.qty);
      if (pending <= 0) continue;

      lines.push({
        grnPrefix,
        grnDocNo: docNo,
        grnFormattedDocNo: grn.formattedDocNo,
        grnLineSr: line.sr,
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
        grnReceivedQty: formatQty(line.qty),
        grnPendingQty: formatQty(pending)
      });
    }
  }

  if (lines.length === 0) {
    throw Object.assign(new Error('No pending lines found on selected GRNs'), { status: 400 });
  }

  return lines;
}
