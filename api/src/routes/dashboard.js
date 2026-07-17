import { Router } from 'express';
import { Product } from '../models/Product.js';
import { PurchaseInvoice } from '../models/PurchaseInvoice.js';
import { PurchaseOrder } from '../models/PurchaseOrder.js';
import { SalesInvoice } from '../models/SalesInvoice.js';
import { SalesOrder } from '../models/SalesOrder.js';
import { StockTransfer } from '../models/StockTransfer.js';

const router = Router();

const CORPORATE = {
  primary: '#006B9E',
  success: '#0D7A55',
  warning: '#B8860B',
  purple: '#5B4B8A',
  teal: '#00857A'
};

function formatInr(amount) {
  const raw = Number(amount) || 0;
  const sign = raw < 0 ? '-' : '';
  const n = Math.abs(raw);
  if (n >= 10000000) return `${sign}₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `${sign}₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `${sign}₹${(n / 1000).toFixed(1)} K`;
  return `${sign}₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function parseBillDate(value) {
  if (!value) return null;
  const text = String(value).trim();
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]) - 1;
    const year = Number(match[3]);
    const date = new Date(year, month, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseAmount(value) {
  const n = Number(String(value ?? '0').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function parseMoney(value) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function invoiceNet(doc) {
  const bill = parseMoney(doc.billAmount);
  if (bill > 0) return bill;
  return parseAmount(doc?.totals?.net ?? doc?.totals?.saleAmount ?? doc?.totals?.orderAmount);
}

function isSameDay(date, start, end) {
  if (!date) return false;
  const d = new Date(date);
  return d >= start && d <= end;
}

function classifyProductType(value) {
  const t = String(value || '').trim().toLowerCase();
  if (t.includes('raw')) return 'raw';
  if (t.includes('wip')) return 'wip';
  if (t.includes('finish')) return 'finished';
  return 'other';
}

function last6MonthBuckets() {
  const buckets = [];
  const now = new Date();
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleString('en-IN', { month: 'short' })
    });
  }
  return buckets;
}

function monthKeyFromDate(date) {
  if (!date) return null;
  return `${date.getFullYear()}-${date.getMonth()}`;
}

const PIE_COLORS = ['#006B9E', '#0D7A55', '#B8860B', '#5B4B8A', '#00857A', '#C5A572'];

router.get('/', async (_req, res, next) => {
  try {
    const [
      productCount,
      openSalesOrders,
      openPurchaseOrders,
      stockTransfers,
      lowStockCount,
      productsForValue,
      salesInvoices,
      purchaseInvoices
    ] = await Promise.all([
      Product.countDocuments({ activeStatus: true }),
      SalesOrder.countDocuments({ status: 'open' }),
      PurchaseOrder.countDocuments({ status: 'open' }),
      StockTransfer.countDocuments(),
      Product.countDocuments({
        activeStatus: true,
        reorderQty: { $gt: 0 },
        $expr: { $lte: [{ $ifNull: ['$stockQty', 0] }, '$reorderQty'] }
      }),
      Product.find({ activeStatus: true }).select('stockQty purchasePrice productType category').lean(),
      SalesInvoice.find({ status: { $nin: ['cancelled', 'draft'] } }).select('invoiceDate billAmount paidAmount balanceDue totals dueDate status').lean(),
      PurchaseInvoice.find({ status: { $nin: ['cancelled', 'draft'] } }).select('invoiceDate billAmount paidAmount balanceDue totals dueDate status').lean()
    ]);

    const stockValue = productsForValue.reduce(
      (sum, p) => sum + (Number(p.stockQty) || 0) * (Number(p.purchasePrice) || 0),
      0
    );

    const totalSales = salesInvoices.reduce((sum, doc) => sum + invoiceNet(doc), 0);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const todaySales = salesInvoices
      .filter((doc) => isSameDay(doc.invoiceDate, todayStart, todayEnd))
      .reduce((sum, doc) => sum + invoiceNet(doc), 0);
    const totalPurchase = purchaseInvoices.reduce((sum, doc) => sum + invoiceNet(doc), 0);
    const receivables = salesInvoices.reduce((sum, doc) => sum + Math.max(0, parseMoney(doc.balanceDue)), 0);
    const payables = purchaseInvoices.reduce((sum, doc) => sum + Math.max(0, parseMoney(doc.balanceDue)), 0);
    const receivableCount = salesInvoices.filter((doc) => parseMoney(doc.balanceDue) > 0).length;
    const payableCount = purchaseInvoices.filter((doc) => parseMoney(doc.balanceDue) > 0).length;
    const incomeExpenses = totalSales - totalPurchase;

    const today = new Date();
    const completedSales = salesInvoices.filter((x) => String(x.status || '').toLowerCase() === 'paid').length;
    const overdueInvoices =
      salesInvoices.filter((x) => x.dueDate && new Date(x.dueDate) < today && parseMoney(x.balanceDue) > 0).length
      + purchaseInvoices.filter((x) => x.dueDate && new Date(x.dueDate) < today && parseMoney(x.balanceDue) > 0).length;
    const totalOrders = openSalesOrders + openPurchaseOrders;
    const progressMetric = Math.max(0, Math.min(100, Math.round((completedSales / Math.max(1, salesInvoices.length)) * 100)));
    const progressBase = salesInvoices.length;

    const inventoryHealth =
      lowStockCount === 0 ? 'Excellent' : lowStockCount <= 5 ? 'Stable' : 'Attention needed';

    const stats = [
      {
        label: "Today's Sales",
        value: formatInr(todaySales),
        iconGlyph: '\uE8A1',
        accentColor: CORPORATE.primary
      },
      {
        label: 'Total Sales',
        value: formatInr(totalSales),
        iconGlyph: '\uE7B8',
        accentColor: CORPORATE.primary
      },
      {
        label: 'Total Purchase',
        value: formatInr(totalPurchase),
        iconGlyph: '\uE73E',
        accentColor: CORPORATE.success
      },
      {
        label: 'Income / Expenses',
        value: formatInr(incomeExpenses),
        iconGlyph: '\uE719',
        accentColor: CORPORATE.warning
      },
      {
        label: 'Inventory Value',
        value: formatInr(stockValue),
        iconGlyph: '\uE8A1',
        accentColor: CORPORATE.purple
      },
      {
        label: 'Open Sales Orders',
        value: openSalesOrders.toString(),
        iconGlyph: '\uE8FD',
        accentColor: CORPORATE.teal
      }
    ];

    const inventorySections = {
      raw: { qty: 0, count: 0 },
      wip: { qty: 0, count: 0 },
      finished: { qty: 0, count: 0 }
    };
    for (const p of productsForValue) {
      const type = classifyProductType(p.productType);
      const qty = parseMoney(p.stockQty);
      if (type in inventorySections) {
        inventorySections[type].qty += qty;
        inventorySections[type].count += 1;
      }
    }

    const summaryLines = [
      {
        label: `Raw (${inventorySections.raw.count})`,
        value: Math.round(inventorySections.raw.qty).toLocaleString('en-IN'),
        iconGlyph: '\uE7FC'
      },
      {
        label: `WIP (${inventorySections.wip.count})`,
        value: Math.round(inventorySections.wip.qty).toLocaleString('en-IN'),
        iconGlyph: '\uE9CE'
      },
      {
        label: `Finished (${inventorySections.finished.count})`,
        value: Math.round(inventorySections.finished.qty).toLocaleString('en-IN'),
        iconGlyph: '\uE8A5'
      },
      { label: `Low Stock (${lowStockCount})`, value: lowStockCount.toLocaleString('en-IN'), iconGlyph: '\uE7BA' }
    ];

    const alerts = [
      { title: `Orders (${totalOrders})`, detail: String(totalOrders), severity: 'Active', iconGlyph: '\uE8A1' },
      { title: `Progress (${progressBase})`, detail: `${progressMetric}%`, severity: 'Good', iconGlyph: '\uE895' },
      { title: `Completed (${completedSales})`, detail: String(completedSales), severity: 'Good', iconGlyph: '\uE73E' },
      { title: `Delayed (${overdueInvoices})`, detail: String(overdueInvoices), severity: overdueInvoices > 0 ? 'Warning' : 'Good', iconGlyph: '\uE7BA' }
    ];

    const rows = [
      {
        col1: `Income (${salesInvoices.length})`,
        col2: formatInr(totalSales),
        col3: 'Accounting',
        col4: 'Live',
        status: 'Active'
      },
      {
        col1: `Expenses (${purchaseInvoices.length})`,
        col2: formatInr(totalPurchase),
        col3: 'Accounting',
        col4: 'Live',
        status: 'Active'
      },
      {
        col1: `Receivables (${receivableCount})`,
        col2: formatInr(receivables),
        col3: 'Finance',
        col4: 'Outstanding',
        status: receivables > 0 ? 'Open' : 'Good'
      },
      {
        col1: `Payables (${payableCount})`,
        col2: formatInr(payables),
        col3: 'Finance',
        col4: 'Outstanding',
        status: payables > 0 ? 'Open' : 'Good'
      }
    ];

    const monthBuckets = last6MonthBuckets();
    const salesByMonth = Object.fromEntries(monthBuckets.map((b) => [b.key, 0]));
    const purchaseByMonth = Object.fromEntries(monthBuckets.map((b) => [b.key, 0]));

    const categoryProducts = productsForValue;

    for (const doc of salesInvoices) {
      const key = monthKeyFromDate(doc.invoiceDate || parseBillDate(doc.billDate));
      if (!key || salesByMonth[key] === undefined) continue;
      salesByMonth[key] += invoiceNet(doc);
    }

    for (const doc of purchaseInvoices) {
      const key = monthKeyFromDate(doc.invoiceDate || parseBillDate(doc.billDate));
      if (!key || purchaseByMonth[key] === undefined) continue;
      purchaseByMonth[key] += invoiceNet(doc);
    }

    const charts = {
      salesVsPurchase: {
        title: 'Accounting Overview',
        series1Name: 'Sales',
        series2Name: 'Purchase',
        series1Color: CORPORATE.primary,
        series2Color: CORPORATE.warning,
        labels: monthBuckets.map((b) => b.label),
        series1: monthBuckets.map((b) => Math.round(salesByMonth[b.key])),
        series2: monthBuckets.map((b) => Math.round(purchaseByMonth[b.key]))
      },
      stockByCategory: {
        title: 'Stock value by category',
        slices: []
      },
      stockByType: {
        title: 'Inventory trend by type',
        series1Name: 'Qty on hand',
        series2Name: 'Products',
        series1Color: CORPORATE.primary,
        series2Color: CORPORATE.teal,
        labels: ['Raw', 'WIP', 'Finished', 'Low stock'],
        series1: [
          Math.round(inventorySections.raw.qty),
          Math.round(inventorySections.wip.qty),
          Math.round(inventorySections.finished.qty),
          lowStockCount
        ],
        series2: [
          inventorySections.raw.count,
          inventorySections.wip.count,
          inventorySections.finished.count,
          0
        ]
      }
    };

    const categoryTotals = {};
    for (const product of categoryProducts) {
      const category = (product.category || 'Other').trim() || 'Other';
      const value = (Number(product.stockQty) || 0) * (Number(product.purchasePrice) || 0);
      categoryTotals[category] = (categoryTotals[category] || 0) + value;
    }

    charts.stockByCategory.slices = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value], index) => ({
        label,
        value: Math.round(value),
        color: PIE_COLORS[index % PIE_COLORS.length]
      }));

    if (charts.stockByCategory.slices.length === 0) {
      charts.stockByCategory.slices = [{ label: 'No stock', value: 1, color: PIE_COLORS[0] }];
    }

    res.json({ stats, rows, alerts, summaryLines, charts });
  } catch (err) {
    next(err);
  }
});

export default router;
