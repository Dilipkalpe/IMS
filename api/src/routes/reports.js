import { Router } from 'express';
import { DeliveryChallan } from '../models/DeliveryChallan.js';
import { Grn } from '../models/Grn.js';
import { Product } from '../models/Product.js';
import { PurchaseInvoice } from '../models/PurchaseInvoice.js';
import { PurchaseReturn } from '../models/PurchaseReturn.js';
import { SalesInvoice } from '../models/SalesInvoice.js';
import { SalesReturn } from '../models/SalesReturn.js';
import { StockTransfer } from '../models/StockTransfer.js';
import { computeClosingStockReport } from '../services/closingStockReport.js';
import {
  computeLedgerReport,
  listLedgerAccountOptions
} from '../services/ledgerReport.js';
import { computeTrialBalance } from '../services/trialBalanceReport.js';
import {
  computePurchaseAnalysis,
  computeSalesAnalysis
} from '../services/productAnalysisReport.js';
import {
  computeDueAmountReport,
  computeDueDayReport,
  computeOutstandingReport
} from '../services/dueReports.js';
import { computeFinancialStatementReport } from '../services/financialStatements.js';
import { rebuildStockFromDocuments } from '../services/productStock.js';
import {
  computeDocumentRegisterReport,
  listDocumentRegisterTypes,
  registerTitleForType
} from '../services/documentRegisterReport.js';
import { computeStockMovementReport } from '../services/stockMovementReport.js';

const router = Router();

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function defaultAsOnDate() {
  const now = new Date();
  return new Date(now.getFullYear() - 1, 11, 31);
}

function formatReportDate(value) {
  const d = value instanceof Date && !Number.isNaN(value.getTime()) ? value : defaultAsOnDate();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
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

function defaultFinancialYearRange() {
  const today = new Date();
  const year = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  return {
    from: new Date(year, 3, 1),
    to: new Date(year + 1, 2, 31)
  };
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

router.post('/recalculate-stock', async (_req, res, next) => {
  try {
    await rebuildStockFromDocuments({
      Grn,
      PurchaseInvoice,
      PurchaseReturn,
      DeliveryChallan,
      SalesInvoice,
      SalesReturn,
      StockTransfer
    });
    res.json({
      ok: true,
      message:
        'Stock recalculated from purchases, sales, returns, and store godown transfers (including production).'
    });
  } catch (err) {
    next(err);
  }
});

router.get('/opening-stock', async (req, res, next) => {
  try {
    const productCode = String(req.query.productCode || '').trim();
    const productName = String(req.query.productName || '').trim();
    const mainName = String(req.query.mainName || '').trim();
    const productType = String(req.query.productType || '').trim();
    const includeZero = String(req.query.includeZero || '').toLowerCase() === 'true';

    const filter = {};
    const hasProductFilter = Boolean(productCode || productName);
    if (!hasProductFilter) {
      filter.activeStatus = { $ne: false };
    }

    if (productCode) {
      filter.code = new RegExp(escapeRegex(productCode), 'i');
    }
    if (productName) {
      filter.name = new RegExp(escapeRegex(productName), 'i');
    }
    if (mainName && !/^all$/i.test(mainName)) {
      filter.productMainGroup = new RegExp(`^${escapeRegex(mainName)}$`, 'i');
    }
    if (productType && !/^all$/i.test(productType)) {
      filter.productType = new RegExp(`^${escapeRegex(productType)}$`, 'i');
    }

    let asOnDate = defaultAsOnDate();
    if (req.query.asOnDate) {
      const parsed = new Date(req.query.asOnDate);
      if (!Number.isNaN(parsed.getTime())) asOnDate = parsed;
    }

    // Read stored balances — do not scan all movement documents on each report open.
    // Use POST /api/reports/recalculate-stock to rebuild stockQty from transactions.
    const products = await Product.find(filter)
      .select('code name unit purchasePrice stockQty activeStatus')
      .sort({ code: 1 })
      .lean();

    const rows = [];
    let totalValuation = 0;

    const showZeroWhenNameFilter = Boolean(productName);

    products.forEach((p) => {
      const qty = Number(p.stockQty) || 0;
      if (!includeZero && !showZeroWhenNameFilter && qty <= 0) return;

      const rate = Number(p.purchasePrice) || 0;
      const valuation = roundMoney(qty * rate);
      totalValuation += valuation;

      rows.push({
        serialNo: rows.length + 1,
        itemId: p.code,
        itemName: p.name,
        unit: p.unit || 'EA',
        date: formatReportDate(asOnDate),
        qty,
        rate,
        valuation
      });
    });

    res.json({
      asOnDate: asOnDate.toISOString(),
      dateLabel: formatReportDate(asOnDate),
      rows,
      totalQty: roundMoney(rows.reduce((s, r) => s + r.qty, 0)),
      totalValuation: roundMoney(totalValuation),
      count: rows.length
    });
  } catch (err) {
    next(err);
  }
});

router.get('/stock-details-summary', async (req, res, next) => {
  try {
    const productCode = String(req.query.productCode || '').trim();
    const productName = String(req.query.productName || '').trim();
    const mainName = String(req.query.mainName || '').trim();
    const productType = String(req.query.productType || '').trim();
    const includeZero = String(req.query.includeZero || '').toLowerCase() === 'true';

    const filter = { activeStatus: { $ne: false } };
    if (productCode) filter.code = new RegExp(escapeRegex(productCode), 'i');
    if (productName) filter.name = new RegExp(escapeRegex(productName), 'i');
    if (mainName && !/^all$/i.test(mainName)) {
      filter.productMainGroup = new RegExp(`^${escapeRegex(mainName)}$`, 'i');
    }
    if (productType && !/^all$/i.test(productType)) {
      filter.productType = new RegExp(`^${escapeRegex(productType)}$`, 'i');
    }

    const products = await Product.find(filter)
      .select('code name unit purchasePrice stockQty reorderQty productMainGroup productType')
      .sort({ code: 1 })
      .lean();

    const rows = [];
    let totalOnHand = 0;
    let totalValue = 0;
    let totalShortage = 0;
    let belowReorderCount = 0;

    for (const p of products) {
      const onHand = roundMoney(parseNumber(p.stockQty));
      if (!includeZero && onHand <= 0) continue;

      const rate = roundMoney(parseNumber(p.purchasePrice));
      const value = roundMoney(onHand * rate);
      const reorderLevel = roundMoney(parseNumber(p.reorderQty));
      const shortage = roundMoney(Math.max(0, reorderLevel - onHand));
      const status = shortage > 0 ? 'Below Reorder' : reorderLevel > 0 ? 'OK' : 'No Reorder Set';

      if (shortage > 0) belowReorderCount += 1;

      rows.push({
        serialNo: rows.length + 1,
        productCode: String(p.code || ''),
        productName: String(p.name || ''),
        mainGroup: String(p.productMainGroup || ''),
        productType: String(p.productType || ''),
        unit: String(p.unit || 'EA'),
        onHandQty: onHand,
        purchaseRate: rate,
        stockValue: value,
        reorderLevel,
        shortageQty: shortage,
        status
      });

      totalOnHand = roundMoney(totalOnHand + onHand);
      totalValue = roundMoney(totalValue + value);
      totalShortage = roundMoney(totalShortage + shortage);
    }

    res.json({
      rows,
      count: rows.length,
      belowReorderCount,
      totalOnHand,
      totalStockValue: totalValue,
      totalShortageQty: totalShortage
    });
  } catch (err) {
    next(err);
  }
});

router.get('/ledger-accounts', async (_req, res, next) => {
  try {
    const accounts = await listLedgerAccountOptions();
    res.json({ accounts });
  } catch (err) {
    next(err);
  }
});

router.get('/trial-balance', async (req, res, next) => {
  try {
    const report = await computeTrialBalance({
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      includeZero: req.query.includeZero
    });
    res.json(report);
  } catch (err) {
    if (String(err.message || '').includes('after to date')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

router.get('/reorder-level', async (req, res, next) => {
  try {
    const productCode = String(req.query.productCode || '').trim();
    const productName = String(req.query.productName || '').trim();
    const includeZero = String(req.query.includeZero || '').toLowerCase() === 'true';

    const filter = { activeStatus: { $ne: false } };
    if (productCode) filter.code = new RegExp(escapeRegex(productCode), 'i');
    if (productName) filter.name = new RegExp(escapeRegex(productName), 'i');

    const products = await Product.find(filter).sort({ code: 1 }).lean();

    const rows = [];
    let totalOnHand = 0;
    let totalReorder = 0;
    let totalShortage = 0;

    for (const product of products) {
      const onHand = Number(product.stockQty) || 0;
      const reorderLevel = Number(product.reorderQty) || 0;
      const shortage = Math.max(0, roundMoney(reorderLevel - onHand));
      if (!includeZero && reorderLevel <= 0 && shortage <= 0) continue;

      const status = shortage > 0
        ? 'Below Reorder'
        : reorderLevel > 0
          ? 'OK'
          : 'No Reorder Set';

      rows.push({
        serialNo: rows.length + 1,
        productId: String(product.code || ''),
        productName: String(product.name || ''),
        unit: String(product.unit || 'EA'),
        onHand,
        reorderLevel,
        shortage,
        status
      });

      totalOnHand = roundMoney(totalOnHand + onHand);
      totalReorder = roundMoney(totalReorder + reorderLevel);
      totalShortage = roundMoney(totalShortage + shortage);
    }

    const belowCount = rows.filter((r) => r.shortage > 0).length;

    res.json({
      rows,
      count: rows.length,
      belowCount,
      totalOnHand,
      totalReorder,
      totalShortage
    });
  } catch (err) {
    next(err);
  }
});

router.get('/profit-analysis', async (req, res, next) => {
  try {
    const fy = defaultFinancialYearRange();
    const fromInput = req.query.dateFrom ? new Date(req.query.dateFrom) : fy.from;
    const toInput = req.query.dateTo ? new Date(req.query.dateTo) : fy.to;
    const fromDate = startOfDay(Number.isNaN(fromInput.getTime()) ? fy.from : fromInput);
    const toDate = endOfDay(Number.isNaN(toInput.getTime()) ? fy.to : toInput);
    if (fromDate > toDate) {
      return res.status(400).json({ error: 'From date cannot be after to date' });
    }

    const productCode = String(req.query.productCode || '').trim();
    const productName = String(req.query.productName || '').trim();
    const mainName = String(req.query.mainName || '').trim();

    const invoiceFilter = {
      invoiceDate: { $gte: fromDate, $lte: toDate },
      status: { $nin: ['cancelled', 'draft'] }
    };
    const invoices = await SalesInvoice.find(invoiceFilter).lean();
    const products = await Product.find({ activeStatus: { $ne: false } }).lean();
    const productMap = new Map(products.map((p) => [String(p.code || '').toUpperCase(), p]));
    const buckets = new Map();

    for (const doc of invoices) {
      for (const line of doc.lines || []) {
        const code = String(line.productRetailCode || '').trim().toUpperCase();
        if (!code) continue;
        const product = productMap.get(code);
        const pname = String(product?.name || line.itemDescription || code);
        const pmain = String(product?.productMainGroup || '');

        if (productCode && !code.includes(productCode.toUpperCase())) continue;
        if (productName && !pname.toLowerCase().includes(productName.toLowerCase())) continue;
        if (mainName && !/^all$/i.test(mainName) && pmain.toLowerCase() !== mainName.toLowerCase()) continue;

        const qty = parseNumber(line.qty);
        const saleRate = parseNumber(line.rate);
        const disc = parseNumber(line.discValue);
        const revenue = roundMoney(Math.max(0, parseNumber(line.amount)));
        const unitCost = parseNumber(product?.purchasePrice);
        const cogs = roundMoney(Math.max(0, qty * unitCost));
        const grossProfit = roundMoney(revenue - cogs);
        const marginPct = revenue > 0 ? roundMoney((grossProfit / revenue) * 100) : 0;

        const key = code;
        if (!buckets.has(key)) {
          buckets.set(key, {
            productId: code,
            productName: pname,
            mainGroup: pmain,
            qty: 0,
            saleRate: 0,
            revenue: 0,
            discount: 0,
            cogs: 0,
            grossProfit: 0
          });
        }
        const b = buckets.get(key);
        b.qty = roundMoney(b.qty + qty);
        b.saleRate = roundMoney(Math.max(b.saleRate, saleRate));
        b.revenue = roundMoney(b.revenue + revenue);
        b.discount = roundMoney(b.discount + disc);
        b.cogs = roundMoney(b.cogs + cogs);
        b.grossProfit = roundMoney(b.grossProfit + grossProfit);
        b.marginPct = b.revenue > 0 ? roundMoney((b.grossProfit / b.revenue) * 100) : 0;
      }
    }

    const rows = [...buckets.values()]
      .sort((a, b) => a.productId.localeCompare(b.productId))
      .map((row, idx) => ({ serialNo: idx + 1, ...row }));

    const totals = rows.reduce((acc, r) => {
      acc.qty = roundMoney(acc.qty + r.qty);
      acc.revenue = roundMoney(acc.revenue + r.revenue);
      acc.discount = roundMoney(acc.discount + r.discount);
      acc.cogs = roundMoney(acc.cogs + r.cogs);
      acc.grossProfit = roundMoney(acc.grossProfit + r.grossProfit);
      return acc;
    }, { qty: 0, revenue: 0, discount: 0, cogs: 0, grossProfit: 0 });
    totals.marginPct = totals.revenue > 0 ? roundMoney((totals.grossProfit / totals.revenue) * 100) : 0;

    res.json({
      dateFromLabel: formatReportDate(fromDate),
      dateToLabel: formatReportDate(toDate),
      rows,
      totals,
      count: rows.length
    });
  } catch (err) {
    next(err);
  }
});

router.get('/trading-account', async (req, res, next) => {
  try {
    const report = await computeFinancialStatementReport(
      {
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo
      },
      'trading-account'
    );
    res.json(report);
  } catch (err) {
    if (String(err.message || '').includes('From date')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

router.get('/profit-loss', async (req, res, next) => {
  try {
    const report = await computeFinancialStatementReport(
      {
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo
      },
      'profit-loss'
    );
    res.json(report);
  } catch (err) {
    if (String(err.message || '').includes('From date')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

router.get('/profit-loss-trading', async (req, res, next) => {
  try {
    const report = await computeFinancialStatementReport(
      {
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo
      },
      'profit-loss-trading'
    );
    res.json(report);
  } catch (err) {
    if (String(err.message || '').includes('From date')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

router.get('/balance-sheet', async (req, res, next) => {
  try {
    const report = await computeFinancialStatementReport(
      {
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo
      },
      'balance-sheet'
    );
    res.json(report);
  } catch (err) {
    if (String(err.message || '').includes('From date')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

router.get('/sales-analysis', async (req, res, next) => {
  try {
    const report = await computeSalesAnalysis({
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      productCode: req.query.productCode,
      productName: req.query.productName,
      mainName: req.query.mainName,
      supplier: req.query.customer || req.query.supplier
    });
    res.json(report);
  } catch (err) {
    if (String(err.message || '').includes('From date')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

router.get('/purchase-analysis', async (req, res, next) => {
  try {
    const report = await computePurchaseAnalysis({
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      productCode: req.query.productCode,
      productName: req.query.productName,
      mainName: req.query.mainName,
      supplier: req.query.supplier
    });
    res.json(report);
  } catch (err) {
    if (String(err.message || '').includes('From date')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

router.get('/outstanding', async (req, res, next) => {
  try {
    const report = await computeOutstandingReport({
      asOnDate: req.query.asOnDate,
      type: req.query.type,
      partyName: req.query.partyName
    });
    res.json(report);
  } catch (err) {
    next(err);
  }
});

router.get('/due-day', async (req, res, next) => {
  try {
    const report = await computeDueDayReport({
      asOnDate: req.query.asOnDate,
      type: req.query.type,
      partyName: req.query.partyName
    });
    res.json(report);
  } catch (err) {
    next(err);
  }
});

router.get('/due-amount', async (req, res, next) => {
  try {
    const report = await computeDueAmountReport({
      asOnDate: req.query.asOnDate,
      type: req.query.type,
      partyName: req.query.partyName
    });
    res.json(report);
  } catch (err) {
    next(err);
  }
});

router.get('/ledger', async (req, res, next) => {
  try {
    const accountCode = String(req.query.accountCode || req.query.account || '').trim();
    if (!accountCode) {
      return res.status(400).json({ error: 'accountCode is required' });
    }
    const report = await computeLedgerReport({
      accountCode,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    });
    res.json(report);
  } catch (err) {
    if (String(err.message || '').includes('not found')) {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
});

router.get('/document-register/types', (_req, res) => {
  res.json({
    types: listDocumentRegisterTypes().map((type) => ({
      type,
      title: registerTitleForType(type)
    }))
  });
});

router.get('/document-register', async (req, res, next) => {
  try {
    const type = String(req.query.type || '').trim();
    if (!type) {
      return res.status(400).json({ error: 'type is required' });
    }
    const report = await computeDocumentRegisterReport(type, {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      billNo: req.query.billNo
    });
    res.json(report);
  } catch (err) {
    if (String(err.message || '').includes('Unknown register type')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

router.get('/closing-stock', async (req, res, next) => {
  try {
    const report = await computeClosingStockReport(
      {
        Grn,
        PurchaseInvoice,
        PurchaseReturn,
        DeliveryChallan,
        SalesInvoice,
        SalesReturn,
        StockTransfer
      },
      {
        productCode: req.query.productCode,
        productName: req.query.productName,
        itemDescription: req.query.itemDescription,
        mainName: req.query.mainName,
        productType: req.query.productType,
        godown: req.query.godown,
        batchNo: req.query.batchNo,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo
      }
    );
    res.json(report);
  } catch (err) {
    next(err);
  }
});

router.get('/stock-movement', async (req, res, next) => {
  try {
    const report = await computeStockMovementReport(
      {
        Grn,
        PurchaseInvoice,
        PurchaseReturn,
        DeliveryChallan,
        SalesInvoice,
        SalesReturn,
        StockTransfer
      },
      {
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        productCode: req.query.productCode,
        godown: req.query.godown,
        movementType: req.query.movementType
      }
    );
    res.json(report);
  } catch (err) {
    if (String(err.message || '').includes('From date')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

export default router;
