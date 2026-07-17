import { DeliveryChallan } from '../models/DeliveryChallan.js';
import { Grn } from '../models/Grn.js';
import { PurchaseInvoice } from '../models/PurchaseInvoice.js';
import { PurchaseOrder } from '../models/PurchaseOrder.js';
import { PurchaseReturn } from '../models/PurchaseReturn.js';
import { SalesInvoice } from '../models/SalesInvoice.js';
import { SalesOrder } from '../models/SalesOrder.js';
import { SalesReturn } from '../models/SalesReturn.js';
import { parseBillDate } from './closingStockReport.js';

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function roundMoney(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function parseNumber(value) {
  if (value === null || value === undefined) return 0;
  const n = Number(value);
  if (!Number.isNaN(n)) return n;
  const s = String(value).replace(/,/g, '').trim();
  const p = parseFloat(s);
  return Number.isNaN(p) ? 0 : p;
}

function formatReportDate(value) {
  if (!value) return '';
  const d = value instanceof Date && !Number.isNaN(value.getTime()) ? value : parseBillDate(value);
  if (!d) return String(value ?? '').trim();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function endOfDay(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  return x;
}

/** Default register window: last 3 calendar months through today (matches recent transactional data). */
function defaultRegisterDateRange() {
  const today = new Date();
  const to = endOfDay(today);
  const from = new Date(today.getFullYear(), today.getMonth() - 2, 1);
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

function parseInputDate(value, fallback) {
  if (!value) return fallback;
  const text = String(value).trim();
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return Number.isNaN(d.getTime()) ? fallback : d;
  }
  const parsed = parseBillDate(text);
  return parsed ?? fallback;
}

function resolveDateRange(dateFrom, dateTo) {
  const defaults = defaultRegisterDateRange();
  let from = parseInputDate(dateFrom, defaults.from);
  let to = parseInputDate(dateTo, defaults.to);
  if (from > to) {
    const swap = from;
    from = to;
    to = swap;
  }
  from.setHours(0, 0, 0, 0);
  to = endOfDay(to);
  return { from, to };
}

const REGISTER_CONFIG = {
  sales_order: {
    Model: SalesOrder,
    partyField: 'customer',
    partyLabel: 'Customer',
    dateFields: ['soDate', 'billDate', 'createdAt'],
    nativeDateField: 'soDate'
  },
  delivery_challan: {
    Model: DeliveryChallan,
    partyField: 'customer',
    partyLabel: 'Customer',
    dateFields: ['billDate', 'createdAt']
  },
  sales_invoice: {
    Model: SalesInvoice,
    partyField: 'customer',
    partyLabel: 'Customer',
    dateFields: ['invoiceDate', 'billDate', 'createdAt'],
    nativeDateField: 'invoiceDate'
  },
  sales_return: {
    Model: SalesReturn,
    partyField: 'customer',
    partyLabel: 'Customer',
    dateFields: ['billDate', 'createdAt']
  },
  purchase_order: {
    Model: PurchaseOrder,
    partyField: 'supplier',
    partyLabel: 'Supplier',
    dateFields: ['billDate', 'createdAt']
  },
  grn: {
    Model: Grn,
    partyField: 'supplier',
    partyLabel: 'Supplier',
    dateFields: ['billDate', 'createdAt']
  },
  purchase_invoice: {
    Model: PurchaseInvoice,
    partyField: 'supplier',
    partyLabel: 'Supplier',
    dateFields: ['invoiceDate', 'billDate', 'createdAt'],
    nativeDateField: 'invoiceDate'
  },
  purchase_return: {
    Model: PurchaseReturn,
    partyField: 'supplier',
    partyLabel: 'Supplier',
    dateFields: ['billDate', 'createdAt']
  }
};

export function listDocumentRegisterTypes() {
  return Object.keys(REGISTER_CONFIG);
}

function resolveDocumentDate(doc, config) {
  for (const field of config.dateFields) {
    const parsed = parseBillDate(doc[field]);
    if (parsed) return parsed;
  }
  return null;
}

function buildMongoQuery(config, from, to, billNo) {
  const clauses = [];
  const billFilter = buildMongoFilter(billNo);
  if (billFilter.$or) clauses.push(billFilter);

  if (config.nativeDateField) {
    clauses.push({
      [config.nativeDateField]: { $gte: from, $lte: to }
    });
  }

  if (clauses.length === 0) return {};
  if (clauses.length === 1) return clauses[0];
  return { $and: clauses };
}

function resolveAmount(doc) {
  if (doc.billAmount !== undefined && doc.billAmount !== null) {
    return roundMoney(doc.billAmount);
  }
  const totals = doc.totals ?? {};
  return roundMoney(
    parseNumber(totals.saleAmount) ||
      parseNumber(totals.orderAmount) ||
      parseNumber(totals.net) ||
      parseNumber(totals.gross)
  );
}

function buildMongoFilter(billNo) {
  const filter = {};
  const term = String(billNo ?? '').trim();
  if (!term) return filter;

  const num = Number(term);
  filter.$or = [
    { formattedDocNo: new RegExp(escapeRegex(term), 'i') },
    { docPrefix: new RegExp(escapeRegex(term), 'i') }
  ];
  if (!Number.isNaN(num)) filter.$or.push({ docNo: num });

  const parsed = term.match(/^([A-Za-z]+)[\s-]*(\d+)$/i);
  if (parsed) {
    filter.$or.push({
      docPrefix: new RegExp(`^${escapeRegex(parsed[1])}$`, 'i'),
      docNo: Number(parsed[2])
    });
  }

  return filter;
}

function inDateRange(docDate, from, to) {
  if (!docDate) return false;
  const day = parseBillDate(docDate) ?? docDate;
  const t = day.getTime();
  return t >= from.getTime() && t <= to.getTime();
}

export async function computeDocumentRegisterReport(type, { dateFrom, dateTo, billNo } = {}) {
  const config = REGISTER_CONFIG[type];
  if (!config) {
    throw new Error(`Unknown register type: ${type}`);
  }

  const { from, to } = resolveDateRange(dateFrom, dateTo);
  const filter = buildMongoQuery(config, from, to, billNo);

  const docs = await config.Model.find(filter).sort({ docNo: -1 }).lean();

  const rows = [];
  let totalAmount = 0;
  let serial = 0;

  for (const doc of docs) {
    const docDate = resolveDocumentDate(doc, config);
    if (!inDateRange(docDate, from, to)) continue;

    serial += 1;
    const amount = resolveAmount(doc);
    totalAmount += amount;

    rows.push({
      serialNo: serial,
      billNo: doc.formattedDocNo || '',
      billDate: formatReportDate(docDate ?? doc.billDate ?? ''),
      party: String(doc[config.partyField] ?? '').trim(),
      amount,
      amountDisplay: amount.toFixed(2),
      status: String(doc.status ?? '').trim(),
      narration: String(doc.narration ?? '').trim()
    });
  }

  return {
    registerType: type,
    title: registerTitleForType(type),
    partyLabel: config.partyLabel,
    dateFromLabel: formatReportDate(from),
    dateToLabel: formatReportDate(to),
    billNoFilter: String(billNo ?? '').trim(),
    documentCount: rows.length,
    totalAmount: roundMoney(totalAmount),
    totalAmountDisplay: roundMoney(totalAmount).toFixed(2),
    rows
  };
}

export function registerTitleForType(type) {
  const titles = {
    sales_order: 'Sales Order Register',
    delivery_challan: 'Sales D.C. Register',
    sales_invoice: 'Sales Invoice Register',
    sales_return: 'Sales Return Register',
    purchase_order: 'Purchase Order Register',
    grn: 'GRN Register',
    purchase_invoice: 'Purchase Invoice Register',
    purchase_return: 'Purchase Return Register'
  };
  return titles[type] ?? 'Document Register';
}
