import { Product } from '../models/Product.js';
import { PurchaseInvoice } from '../models/PurchaseInvoice.js';
import { SalesInvoice } from '../models/SalesInvoice.js';

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

export function defaultFinancialYearRange() {
  const today = new Date();
  const year = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  return {
    from: new Date(year, 3, 1),
    to: new Date(year + 1, 2, 31)
  };
}

export function formatReportDate(value) {
  const d = value instanceof Date && !Number.isNaN(value.getTime()) ? value : new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
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

function parseDateRange(dateFrom, dateTo) {
  const fy = defaultFinancialYearRange();
  const fromInput = dateFrom ? new Date(dateFrom) : fy.from;
  const toInput = dateTo ? new Date(dateTo) : fy.to;
  const fromDate = startOfDay(Number.isNaN(fromInput.getTime()) ? fy.from : fromInput);
  const toDate = endOfDay(Number.isNaN(toInput.getTime()) ? fy.to : toInput);
  if (fromDate > toDate) {
    throw new Error('From date cannot be after to date');
  }
  return { fromDate, toDate };
}

function matchesProductFilters(code, pname, pmain, productCode, productName, mainName) {
  if (productCode && !code.includes(productCode.toUpperCase())) return false;
  if (productName && !pname.toLowerCase().includes(productName.toLowerCase())) return false;
  if (mainName && !/^all$/i.test(mainName) && pmain.toLowerCase() !== mainName.toLowerCase()) {
    return false;
  }
  return true;
}

function createBucket(code, productMap, supplier = '') {
  return {
    productId: code,
    productName: String(productMap.get(code)?.name || code),
    mainGroup: String(productMap.get(code)?.productMainGroup || ''),
    supplier: supplier || '',
    qty: 0,
    amount: 0,
    discount: 0,
    cogs: 0,
    rateSum: 0,
    rateCount: 0,
    invoiceIds: new Set(),
    customers: new Set()
  };
}

function finalizeSalesRow(bucket) {
  const revenue = roundMoney(bucket.amount);
  const discount = roundMoney(bucket.discount);
  const qty = roundMoney(bucket.qty);
  const cogs = roundMoney(bucket.cogs);
  const grossProfit = roundMoney(revenue - cogs);
  return {
    productId: bucket.productId,
    productName: bucket.productName,
    mainGroup: bucket.mainGroup,
    qty,
    revenue,
    discount,
    cogs,
    grossProfit,
    marginPct: revenue > 0 ? roundMoney((grossProfit / revenue) * 100) : 0,
    invoiceCount: bucket.invoiceIds.size,
    customer: [...bucket.customers].filter(Boolean).sort().join(', ') || '—'
  };
}

function finalizePurchaseRow(bucket) {
  const amount = roundMoney(bucket.amount);
  const discount = roundMoney(bucket.discount);
  const qty = roundMoney(bucket.qty);
  const avgRate =
    bucket.rateCount > 0 ? roundMoney(bucket.rateSum / bucket.rateCount) : qty > 0 ? roundMoney(amount / qty) : 0;
  return {
    productId: bucket.productId,
    productName: bucket.productName,
    mainGroup: bucket.mainGroup,
    supplier: bucket.supplier || '—',
    qty,
    purchaseAmount: amount,
    discount,
    avgRate,
    invoiceCount: bucket.invoiceIds.size
  };
}

export async function computeSalesAnalysis(params) {
  const { fromDate, toDate } = parseDateRange(params.dateFrom, params.dateTo);
  const productCode = String(params.productCode || '').trim();
  const productName = String(params.productName || '').trim();
  const mainName = String(params.mainName || '').trim();
  const supplierFilter = String(params.supplier || '').trim();

  const products = await Product.find({ activeStatus: { $ne: false } }).lean();
  const productMap = new Map(products.map((p) => [String(p.code || '').toUpperCase(), p]));

  const invoiceFilter = {
    invoiceDate: { $gte: fromDate, $lte: toDate },
    status: { $nin: ['cancelled', 'draft'] }
  };
  const invoices = await SalesInvoice.find(invoiceFilter).lean();
  const buckets = new Map();

  for (const doc of invoices) {
    const customer = String(doc.customer || '').trim();
    const headerSupplier = String(doc.salesMan || '').trim(); // fallback only

    for (const line of doc.lines || []) {
      const code = String(line.productRetailCode || '').trim().toUpperCase();
      if (!code) continue;

      const product = productMap.get(code);
      const pname = String(product?.name || line.itemDescription || code);
      const pmain = String(product?.productMainGroup || '');

      if (!matchesProductFilters(code, pname, pmain, productCode, productName, mainName)) continue;
      if (supplierFilter && !customer.toLowerCase().includes(supplierFilter.toLowerCase())) continue;

      const qty = parseNumber(line.qty);
      const rate = parseNumber(line.rate);
      const disc = parseNumber(line.discValue);
      const amount = roundMoney(Math.max(0, parseNumber(line.amount)));
      const unitCost = parseNumber(product?.purchasePrice);

      if (!buckets.has(code)) {
        buckets.set(code, createBucket(code, productMap, headerSupplier));
      }
      const b = buckets.get(code);
      b.qty = roundMoney(b.qty + qty);
      b.amount = roundMoney(b.amount + amount);
      b.discount = roundMoney(b.discount + disc);
      b.rateSum = roundMoney(b.rateSum + rate);
      b.rateCount += 1;
      b.invoiceIds.add(String(doc._id || doc.formattedDocNo || ''));
      if (customer) b.customers.add(customer);
      b.cogs = roundMoney(b.cogs + roundMoney(qty * unitCost));
    }
  }

  const rows = [...buckets.values()]
    .map((b) => finalizeSalesRow(b))
    .sort((a, b) => a.productId.localeCompare(b.productId))
    .map((row, idx) => ({ serialNo: idx + 1, ...row }));

  const totals = rows.reduce(
    (acc, r) => ({
      qty: roundMoney(acc.qty + r.qty),
      revenue: roundMoney(acc.revenue + r.revenue),
      discount: roundMoney(acc.discount + r.discount),
      cogs: roundMoney(acc.cogs + r.cogs),
      grossProfit: roundMoney(acc.grossProfit + r.grossProfit),
      invoiceCount: acc.invoiceCount + r.invoiceCount
    }),
    { qty: 0, revenue: 0, discount: 0, cogs: 0, grossProfit: 0, invoiceCount: 0 }
  );
  totals.grossProfit = roundMoney(totals.revenue - totals.cogs);
  totals.marginPct = totals.revenue > 0 ? roundMoney((totals.grossProfit / totals.revenue) * 100) : 0;

  return {
    dateFromLabel: formatReportDate(fromDate),
    dateToLabel: formatReportDate(toDate),
    rows,
    totals,
    count: rows.length
  };
}

export async function computePurchaseAnalysis(params) {
  const { fromDate, toDate } = parseDateRange(params.dateFrom, params.dateTo);
  const productCode = String(params.productCode || '').trim();
  const productName = String(params.productName || '').trim();
  const mainName = String(params.mainName || '').trim();
  const supplierFilter = String(params.supplier || '').trim();

  const products = await Product.find({ activeStatus: { $ne: false } }).lean();
  const productMap = new Map(products.map((p) => [String(p.code || '').toUpperCase(), p]));

  const invoiceFilter = {
    invoiceDate: { $gte: fromDate, $lte: toDate },
    status: { $nin: ['cancelled', 'draft'] }
  };
  const invoices = await PurchaseInvoice.find(invoiceFilter).lean();
  const buckets = new Map();

  for (const doc of invoices) {
    const supplier = String(doc.supplier || '').trim();

    if (supplierFilter && !supplier.toLowerCase().includes(supplierFilter.toLowerCase())) continue;

    for (const line of doc.lines || []) {
      const code = String(line.productRetailCode || '').trim().toUpperCase();
      if (!code) continue;

      const product = productMap.get(code);
      const pname = String(product?.name || line.itemDescription || code);
      const pmain = String(product?.productMainGroup || '');

      if (!matchesProductFilters(code, pname, pmain, productCode, productName, mainName)) continue;

      const qty = parseNumber(line.qty);
      const rate = parseNumber(line.rate);
      const disc = parseNumber(line.discValue);
      const amount = roundMoney(Math.max(0, parseNumber(line.amount)));

      if (!buckets.has(code)) {
        buckets.set(code, createBucket(code, productMap, supplier));
      }
      const b = buckets.get(code);
      if (!b.supplier && supplier) b.supplier = supplier;
      b.qty = roundMoney(b.qty + qty);
      b.amount = roundMoney(b.amount + amount);
      b.discount = roundMoney(b.discount + disc);
      b.rateSum = roundMoney(b.rateSum + rate);
      b.rateCount += 1;
      b.invoiceIds.add(String(doc._id || doc.formattedDocNo || ''));
    }
  }

  const rows = [...buckets.values()]
    .map((b) => finalizePurchaseRow(b))
    .sort((a, b) => a.productId.localeCompare(b.productId))
    .map((row, idx) => ({ serialNo: idx + 1, ...row }));

  const totals = rows.reduce(
    (acc, r) => ({
      qty: roundMoney(acc.qty + r.qty),
      purchaseAmount: roundMoney(acc.purchaseAmount + r.purchaseAmount),
      discount: roundMoney(acc.discount + r.discount),
      invoiceCount: acc.invoiceCount + r.invoiceCount
    }),
    { qty: 0, purchaseAmount: 0, discount: 0, invoiceCount: 0 }
  );

  return {
    dateFromLabel: formatReportDate(fromDate),
    dateToLabel: formatReportDate(toDate),
    rows,
    totals,
    count: rows.length
  };
}
