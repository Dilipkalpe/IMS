import { Router } from 'express';
import { SalesOrder } from '../models/SalesOrder.js';
import { parsePagination } from '../utils/pagination.js';
import { fetchSalesOrderListResponse } from '../services/salesOrderListSummary.js';
import { ensureCounterAtLeast, getNextSequence } from '../models/Counter.js';
import { DOC_INITIAL } from '../services/docTypeMap.js';
import {
  formatSalesOrderNo,
  initialDocNoForPrefix,
  normalizeSoPrefix,
  parseFormattedSalesOrderNo,
  peekNextSalesOrderDocNo,
  salesOrderCounterKey
} from '../services/salesOrderNo.js';
import {
  buildPendingDeliveryLines,
  listPendingSalesOrders
} from '../services/salesOrderFulfillment.js';

const router = Router();

function toUpdatePayload(body) {
  const {
    _id,
    id,
    __v,
    createdAt,
    updatedAt,
    ...rest
  } = body ?? {};
  return rest;
}

function normalizeTotals(totals) {
  if (!totals || typeof totals !== 'object') return {};
  const sale = totals.saleAmount ?? totals.orderAmount ?? totals.net ?? '0';
  return {
    ...totals,
    saleAmount: sale,
    orderAmount: totals.orderAmount ?? sale
  };
}

function applySalesOrderNumbers(payload, docNo) {
  const soPrefix = normalizeSoPrefix(payload.soPrefix);
  payload.soPrefix = soPrefix;
  payload.docNo = docNo;
  payload.formattedDocNo = formatSalesOrderNo(soPrefix, docNo);
  return payload;
}

router.get('/', async (req, res, next) => {
  try {
    const { search, status, sort, sortDir } = req.query;
    const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 25, maxLimit: 500 });
    const filter = {};

    if (status) filter.status = String(status).toLowerCase();
    if (search) {
      const term = String(search).trim();
      const num = Number(term);
      filter.$or = [
        { customer: new RegExp(term, 'i') },
        { salesMan: new RegExp(term, 'i') },
        { narration: new RegExp(term, 'i') },
        { formattedDocNo: new RegExp(term, 'i') },
        { soPrefix: new RegExp(term, 'i') },
        { paymentTerms: new RegExp(term, 'i') }
      ];
      if (!Number.isNaN(num)) filter.$or.push({ docNo: num });
    }

    const { items, total } = await fetchSalesOrderListResponse(filter, sort, sortDir, skip, limit);

    res.json({ items, total, page, limit });
  } catch (err) {
    next(err);
  }
});

router.get('/stats', async (_req, res, next) => {
  try {
    const [total, open, confirmed, picking, shipped, closed, cancelled, draft] = await Promise.all([
      SalesOrder.countDocuments(),
      SalesOrder.countDocuments({ status: 'open' }),
      SalesOrder.countDocuments({ status: 'confirmed' }),
      SalesOrder.countDocuments({ status: 'picking' }),
      SalesOrder.countDocuments({ status: 'shipped' }),
      SalesOrder.countDocuments({ status: 'closed' }),
      SalesOrder.countDocuments({ status: 'cancelled' }),
      SalesOrder.countDocuments({ status: 'draft' })
    ]);

    res.json({
      total,
      open,
      confirmed,
      picking,
      shipped,
      closed,
      cancelled,
      draft,
      toShip: confirmed + picking + draft,
      active: open + confirmed + picking + draft
    });
  } catch (err) {
    next(err);
  }
});

router.get('/next-no', async (req, res, next) => {
  try {
    const soPrefix = normalizeSoPrefix(req.query.prefix);
    const docNo = await peekNextSalesOrderDocNo(soPrefix, DOC_INITIAL.sales_order ?? 1);
    res.json({
      soPrefix,
      docNo,
      formattedDocNo: formatSalesOrderNo(soPrefix, docNo)
    });
  } catch (err) {
    next(err);
  }
});

router.get('/by-no/:docNo', async (req, res, next) => {
  try {
    const docNo = Number(req.params.docNo);
    const soPrefix = normalizeSoPrefix(req.query.prefix);
    const item = await SalesOrder.findOne({ docNo, soPrefix });
    if (!item) return res.status(404).json({ error: 'Sales order not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.get('/by-formatted/:formatted', async (req, res, next) => {
  try {
    const formatted = decodeURIComponent(req.params.formatted ?? '').trim();
    const item = await SalesOrder.findOne({ formattedDocNo: formatted });
    if (!item) {
      const parsed = parseFormattedSalesOrderNo(formatted);
      if (parsed.docNo > 0) {
        const fallback = await SalesOrder.findOne({
          docNo: parsed.docNo,
          soPrefix: parsed.soPrefix
        });
        if (fallback) return res.json(fallback);
      }
      return res.status(404).json({ error: 'Sales order not found' });
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.get('/pending-for-delivery', async (req, res, next) => {
  try {
    const customer = String(req.query.customer ?? '').trim();
    if (!customer) return res.status(400).json({ error: 'customer query parameter is required' });
    const items = await listPendingSalesOrders(customer);
    res.json({
      items: items.map((o) => ({
        soPrefix: o.soPrefix,
        docNo: o.docNo,
        formattedDocNo: o.formattedDocNo,
        customer: o.customer,
        status: o.status,
        soDate: o.soDate
      })),
      total: items.length
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.post('/pending-delivery-lines', async (req, res, next) => {
  try {
    const { customer, salesOrders } = req.body ?? {};
    const lines = await buildPendingDeliveryLines(customer, salesOrders);
    res.json({ lines });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const item = await SalesOrder.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Sales order not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = toUpdatePayload(req.body);
    const soPrefix = normalizeSoPrefix(payload.soPrefix);
    const initial = initialDocNoForPrefix(soPrefix, DOC_INITIAL.sales_order ?? 1);

    const counterKey = salesOrderCounterKey(soPrefix);
    if (!payload.docNo) {
      payload.docNo = await getNextSequence(counterKey, initial);
    } else {
      await ensureCounterAtLeast(counterKey, payload.docNo, initial);
    }

    applySalesOrderNumbers(payload, payload.docNo);
    payload.totals = normalizeTotals(payload.totals);

    const item = await SalesOrder.create(payload);
    res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Sales order number already exists for this prefix' });
    }
    next(err);
  }
});

router.put('/by-no/:docNo', async (req, res, next) => {
  try {
    const payload = toUpdatePayload(req.body);
    payload.totals = normalizeTotals(payload.totals);
    const lookupPrefix = normalizeSoPrefix(req.query.prefix ?? payload.soPrefix);
    const docNo = Number(req.params.docNo);

    if (payload.soPrefix || payload.docNo) {
      const soPrefix = normalizeSoPrefix(payload.soPrefix ?? lookupPrefix);
      const nextDocNo = payload.docNo ? Number(payload.docNo) : docNo;
      applySalesOrderNumbers(payload, nextDocNo);
    }

    const item = await SalesOrder.findOneAndUpdate(
      { docNo, soPrefix: lookupPrefix },
      payload,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ error: 'Sales order not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const payload = toUpdatePayload(req.body);
    payload.totals = normalizeTotals(payload.totals);
    if (payload.soPrefix && payload.docNo) {
      applySalesOrderNumbers(payload, Number(payload.docNo));
    } else if (payload.soPrefix && !payload.docNo) {
      const existing = await SalesOrder.findById(req.params.id);
      if (existing) {
        applySalesOrderNumbers(payload, existing.docNo);
      }
    } else if (payload.docNo) {
      const existing = await SalesOrder.findById(req.params.id);
      if (existing) {
        applySalesOrderNumbers(payload, Number(payload.docNo));
      }
    }

    const item = await SalesOrder.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    });
    if (!item) return res.status(404).json({ error: 'Sales order not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.delete('/by-no/:docNo', async (req, res, next) => {
  try {
    const docNo = Number(req.params.docNo);
    const soPrefix = normalizeSoPrefix(req.query.prefix);
    const item = await SalesOrder.findOneAndDelete({ docNo, soPrefix });
    if (!item) return res.status(404).json({ error: 'Sales order not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const item = await SalesOrder.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Sales order not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
