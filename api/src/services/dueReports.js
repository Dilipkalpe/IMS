import { PurchaseInvoice } from '../models/PurchaseInvoice.js';
import { SalesInvoice } from '../models/SalesInvoice.js';

function roundMoney(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function parseDate(value, fallback) {
  if (!value) return fallback;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

function formatReportDate(value) {
  const d = value instanceof Date && !Number.isNaN(value.getTime()) ? value : new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

function defaultAsOnDate() {
  return new Date();
}

function computeBill(doc) {
  const bill = Number(doc.billAmount);
  if (!Number.isNaN(bill) && bill > 0) return roundMoney(bill);
  const fallback = Number(doc?.totals?.net ?? doc?.totals?.saleAmount ?? doc?.totals?.orderAmount ?? 0);
  return roundMoney(Number.isNaN(fallback) ? 0 : fallback);
}

function computePaid(doc) {
  const paid = Number(doc.paidAmount);
  return roundMoney(Number.isNaN(paid) ? 0 : paid);
}

function computeBalance(doc) {
  const balance = Number(doc.balanceDue);
  if (!Number.isNaN(balance) && balance > 0) return roundMoney(balance);
  const calc = computeBill(doc) - computePaid(doc);
  return roundMoney(Math.max(0, calc));
}

function ageDays(invoiceDate, asOnDate) {
  const inv = startOfDay(invoiceDate);
  const asOn = startOfDay(asOnDate);
  const diff = asOn.getTime() - inv.getTime();
  return Math.max(0, Math.floor(diff / (24 * 60 * 60 * 1000)));
}

function overdueDays(dueDate, asOnDate) {
  if (!dueDate) return 0;
  const due = startOfDay(dueDate);
  const asOn = startOfDay(asOnDate);
  const diff = asOn.getTime() - due.getTime();
  return Math.max(0, Math.floor(diff / (24 * 60 * 60 * 1000)));
}

function dueBucketByDays(days) {
  if (days <= 0) return 'Not Due';
  if (days <= 30) return '1-30';
  if (days <= 60) return '31-60';
  if (days <= 90) return '61-90';
  return '90+';
}

function amountSlab(amount) {
  if (amount <= 10000) return '0 - 10,000';
  if (amount <= 50000) return '10,001 - 50,000';
  if (amount <= 100000) return '50,001 - 100,000';
  return '100,000+';
}

async function collectOutstandingRows(asOnDate) {
  const cutoff = endOfDay(asOnDate);
  const invoiceFilter = {
    invoiceDate: { $lte: cutoff },
    status: { $nin: ['cancelled', 'draft', 'paid'] }
  };

  const sales = await SalesInvoice.find(invoiceFilter).lean();
  const purchases = await PurchaseInvoice.find(invoiceFilter).lean();
  const rows = [];

  sales.forEach((doc) => {
    const balance = computeBalance(doc);
    if (balance <= 0) return;
    const invoiceDate = doc.invoiceDate || doc.createdAt || asOnDate;
    const dueDate = doc.dueDate || null;
    const od = overdueDays(dueDate, asOnDate);
    rows.push({
      partyType: 'Receivable',
      partyName: String(doc.customer || 'Walk In'),
      docNo: String(doc.formattedDocNo || doc.docNo || ''),
      invoiceDate,
      dueDate,
      billAmount: computeBill(doc),
      paidAmount: computePaid(doc),
      balanceDue: balance,
      ageDays: ageDays(invoiceDate, asOnDate),
      dueDays: od,
      dueStatus: od > 0 ? 'Overdue' : 'Current'
    });
  });

  purchases.forEach((doc) => {
    const balance = computeBalance(doc);
    if (balance <= 0) return;
    const invoiceDate = doc.invoiceDate || doc.createdAt || asOnDate;
    const dueDate = doc.dueDate || null;
    const od = overdueDays(dueDate, asOnDate);
    rows.push({
      partyType: 'Payable',
      partyName: String(doc.supplier || 'Supplier'),
      docNo: String(doc.formattedDocNo || doc.docNo || ''),
      invoiceDate,
      dueDate,
      billAmount: computeBill(doc),
      paidAmount: computePaid(doc),
      balanceDue: balance,
      ageDays: ageDays(invoiceDate, asOnDate),
      dueDays: od,
      dueStatus: od > 0 ? 'Overdue' : 'Current'
    });
  });

  return rows.sort((a, b) => a.partyName.localeCompare(b.partyName) || a.docNo.localeCompare(b.docNo));
}

export async function computeOutstandingReport(params) {
  const asOnDate = startOfDay(parseDate(params.asOnDate, defaultAsOnDate()));
  const partyName = String(params.partyName || '').trim().toLowerCase();
  const reportType = String(params.type || 'all').trim().toLowerCase();
  const baseRows = await collectOutstandingRows(asOnDate);

  const rows = baseRows
    .filter((r) => (reportType === 'all' ? true : r.partyType.toLowerCase() === reportType))
    .filter((r) => (!partyName ? true : r.partyName.toLowerCase().includes(partyName)))
    .map((r, index) => ({
      serialNo: index + 1,
      partyType: r.partyType,
      partyName: r.partyName,
      docNo: r.docNo,
      invoiceDate: formatReportDate(r.invoiceDate),
      dueDate: r.dueDate ? formatReportDate(r.dueDate) : '—',
      billAmount: r.billAmount,
      paidAmount: r.paidAmount,
      balanceDue: r.balanceDue,
      ageDays: r.ageDays,
      dueDays: r.dueDays,
      dueStatus: r.dueStatus
    }));

  const totals = rows.reduce(
    (acc, r) => {
      if (r.partyType === 'Receivable') acc.totalReceivable = roundMoney(acc.totalReceivable + r.balanceDue);
      else acc.totalPayable = roundMoney(acc.totalPayable + r.balanceDue);
      acc.totalBalance = roundMoney(acc.totalBalance + r.balanceDue);
      return acc;
    },
    { totalReceivable: 0, totalPayable: 0, totalBalance: 0 }
  );

  return {
    asOnDateLabel: formatReportDate(asOnDate),
    count: rows.length,
    rows,
    totals
  };
}

export async function computeDueDayReport(params) {
  const asOnDate = startOfDay(parseDate(params.asOnDate, defaultAsOnDate()));
  const partyName = String(params.partyName || '').trim().toLowerCase();
  const reportType = String(params.type || 'all').trim().toLowerCase();
  const outstanding = await collectOutstandingRows(asOnDate);

  const rows = outstanding
    .filter((r) => (reportType === 'all' ? true : r.partyType.toLowerCase() === reportType))
    .filter((r) => (!partyName ? true : r.partyName.toLowerCase().includes(partyName)))
    .map((r, index) => ({
      serialNo: index + 1,
      partyType: r.partyType,
      partyName: r.partyName,
      docNo: r.docNo,
      dueDate: r.dueDate ? formatReportDate(r.dueDate) : '—',
      dueDays: r.dueDays,
      dueBucket: dueBucketByDays(r.dueDays),
      balanceDue: r.balanceDue
    }))
    .sort((a, b) => b.dueDays - a.dueDays || a.partyName.localeCompare(b.partyName));

  const totals = rows.reduce(
    (acc, r) => {
      acc.totalAmount = roundMoney(acc.totalAmount + r.balanceDue);
      if (r.dueBucket === 'Not Due') acc.notDue = roundMoney(acc.notDue + r.balanceDue);
      if (r.dueBucket === '1-30') acc.d1To30 = roundMoney(acc.d1To30 + r.balanceDue);
      if (r.dueBucket === '31-60') acc.d31To60 = roundMoney(acc.d31To60 + r.balanceDue);
      if (r.dueBucket === '61-90') acc.d61To90 = roundMoney(acc.d61To90 + r.balanceDue);
      if (r.dueBucket === '90+') acc.d90Plus = roundMoney(acc.d90Plus + r.balanceDue);
      return acc;
    },
    { totalAmount: 0, notDue: 0, d1To30: 0, d31To60: 0, d61To90: 0, d90Plus: 0 }
  );

  return {
    asOnDateLabel: formatReportDate(asOnDate),
    count: rows.length,
    rows,
    totals
  };
}

export async function computeDueAmountReport(params) {
  const asOnDate = startOfDay(parseDate(params.asOnDate, defaultAsOnDate()));
  const partyName = String(params.partyName || '').trim().toLowerCase();
  const reportType = String(params.type || 'all').trim().toLowerCase();
  const outstanding = await collectOutstandingRows(asOnDate);
  const filtered = outstanding
    .filter((r) => (reportType === 'all' ? true : r.partyType.toLowerCase() === reportType))
    .filter((r) => (!partyName ? true : r.partyName.toLowerCase().includes(partyName)));

  const bucketMap = new Map();
  filtered.forEach((r) => {
    const slab = amountSlab(r.balanceDue);
    if (!bucketMap.has(slab)) {
      bucketMap.set(slab, {
        slab,
        invoiceCount: 0,
        partySet: new Set(),
        amount: 0
      });
    }
    const b = bucketMap.get(slab);
    b.invoiceCount += 1;
    b.partySet.add(`${r.partyType}|${r.partyName}`);
    b.amount = roundMoney(b.amount + r.balanceDue);
  });

  const slabOrder = ['0 - 10,000', '10,001 - 50,000', '50,001 - 100,000', '100,000+'];
  const rows = slabOrder
    .filter((slab) => bucketMap.has(slab))
    .map((slab, index) => {
      const b = bucketMap.get(slab);
      return {
        serialNo: index + 1,
        slab: b.slab,
        invoiceCount: b.invoiceCount,
        partyCount: b.partySet.size,
        amount: b.amount
      };
    });

  const totals = rows.reduce(
    (acc, r) => {
      acc.invoiceCount += r.invoiceCount;
      acc.partyCount += r.partyCount;
      acc.totalAmount = roundMoney(acc.totalAmount + r.amount);
      return acc;
    },
    { invoiceCount: 0, partyCount: 0, totalAmount: 0 }
  );

  return {
    asOnDateLabel: formatReportDate(asOnDate),
    count: rows.length,
    rows,
    totals
  };
}
