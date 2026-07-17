import { Router } from 'express';
import { getYearModelFromRequest } from '../db/yearModels.js';
import { ensureCounterAtLeast, getNextSequence } from '../models/Counter.js';
import { applyDocumentStock, replaceDocumentStock } from '../services/productStock.js';
import { normalizeSoPrefix } from '../services/salesOrderNo.js';
import {
  formatPrefixDocNo,
  parseFormattedDocNo,
  peekNextNumberedDoc,
  resolveInitialDocNo,
  salesDocCounterKey,
  initialDocNoForDefaultPrefix
} from '../services/numberedSalesDocNo.js';
import { normalizeInvoicePaymentFields } from '../services/invoicePayment.js';
import { parsePagination } from '../utils/pagination.js';
import { applyColumnFilters } from '../utils/columnFilters.js';
import { resolveNumberedSalesDocListSort } from '../services/numberedSalesDocListSort.js';

function toUpdatePayload(body) {
  const { _id, id, __v, createdAt, updatedAt, ...rest } = body ?? {};
  return rest;
}

function normalizeTotals(totals) {
  if (!totals || typeof totals !== 'object') return {};
  const sale = totals.saleAmount ?? totals.orderAmount ?? totals.net ?? '0';
  return { ...totals, saleAmount: sale, orderAmount: totals.orderAmount ?? sale };
}

/**
 * @param {import('mongoose').Model} Model
 * @param {{ counterNamespace: string, defaultDocPrefix: string, docTypeKey: string, notFoundLabel: string, stockDirection?: 'in' | 'out' | 'none' }} config
 * @param {{ beforeCreate?: Function, afterCreate?: Function, beforeUpdate?: Function, afterUpdate?: Function, afterDelete?: Function }} [hooks]
 */
export function createNumberedSalesDocRoutes(Model, config, hooks = {}) {
  const { counterNamespace, defaultDocPrefix, docTypeKey, notFoundLabel, stockDirection = 'none' } = config;
  const legacyInitial = resolveInitialDocNo(docTypeKey);
  const router = Router();
  const scoped = (req) => getYearModelFromRequest(Model, req);

  function resolvePrefix(value) {
    return normalizeSoPrefix(value ?? defaultDocPrefix);
  }

  function applyNumbers(payload, docNo, prefix) {
    const docPrefix = resolvePrefix(prefix ?? payload.docPrefix);
    payload.docPrefix = docPrefix;
    payload.docNo = docNo;
    payload.formattedDocNo = formatPrefixDocNo(docPrefix, docNo);
    return payload;
  }

  router.get('/', async (req, res, next) => {
    try {
      const { search, status, sort, sortDir } = req.query;
      const { page, limit, skip } = parsePagination(req.query);
      const listSort = resolveNumberedSalesDocListSort(docTypeKey, sort, sortDir);
      const filter = {};
      if (status) {
        filter.status = String(status).trim().toLowerCase().replace(/\s+/g, '_');
      }
      if (search) {
        const term = String(search).trim();
        const num = Number(term);
        filter.$or = [
          { customer: new RegExp(term, 'i') },
          { salesMan: new RegExp(term, 'i') },
          { narration: new RegExp(term, 'i') },
          { formattedDocNo: new RegExp(term, 'i') },
          { docPrefix: new RegExp(term, 'i') }
        ];
        if (!Number.isNaN(num)) filter.$or.push({ docNo: num });
      }

      applyColumnFilters(filter, req.query, 'sales');

      const [items, total] = await Promise.all([
        scoped(req).find(filter).sort(listSort).skip(skip).limit(limit),
        scoped(req).countDocuments(filter)
      ]);
      res.json({ items, total, page, limit });
    } catch (err) {
      next(err);
    }
  });

  router.get('/stats', async (req, res, next) => {
    try {
      const [total, open, draft, dispatched, posted, closed, cancelled] = await Promise.all([
        scoped(req).countDocuments(),
        scoped(req).countDocuments({ status: 'open' }),
        scoped(req).countDocuments({ status: 'draft' }),
        scoped(req).countDocuments({ status: 'dispatched' }),
        scoped(req).countDocuments({ status: 'posted' }),
        scoped(req).countDocuments({ status: 'closed' }),
        scoped(req).countDocuments({ status: 'cancelled' })
      ]);
      res.json({ total, open, draft, dispatched, posted, closed, cancelled, active: open + draft + dispatched });
    } catch (err) {
      next(err);
    }
  });

  router.get('/next-no', async (req, res, next) => {
    try {
      const { docPrefix, docNo } = await peekNextNumberedDoc(
        scoped(req),
        counterNamespace,
        req.query.prefix,
        defaultDocPrefix,
        legacyInitial
      );
      res.json({
        docPrefix,
        soPrefix: docPrefix,
        docNo,
        formattedDocNo: formatPrefixDocNo(docPrefix, docNo)
      });
    } catch (err) {
      next(err);
    }
  });

  router.get('/by-no/:docNo', async (req, res, next) => {
    try {
      const docNo = Number(req.params.docNo);
      const docPrefix = resolvePrefix(req.query.prefix);
      const item = await scoped(req).findOne({ docNo, docPrefix });
      if (!item) return res.status(404).json({ error: notFoundLabel });
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  router.get('/by-formatted/:formatted', async (req, res, next) => {
    try {
      const formatted = decodeURIComponent(req.params.formatted ?? '').trim();
      let item = await scoped(req).findOne({ formattedDocNo: formatted });
      if (!item) {
        const parsed = parseFormattedDocNo(formatted, defaultDocPrefix);
        if (parsed.docNo > 0) {
          item = await scoped(req).findOne({ docNo: parsed.docNo, docPrefix: parsed.docPrefix });
        }
      }
      if (!item) return res.status(404).json({ error: notFoundLabel });
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const item = await scoped(req).findById(req.params.id);
      if (!item) return res.status(404).json({ error: notFoundLabel });
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const payload = toUpdatePayload(req.body);
      const docPrefix = resolvePrefix(payload.docPrefix);
      const initial = initialDocNoForDefaultPrefix(docPrefix, defaultDocPrefix, legacyInitial);
      const counterKey = salesDocCounterKey(counterNamespace, docPrefix, defaultDocPrefix);

      if (!payload.docNo) {
        payload.docNo = await getNextSequence(counterKey, initial);
      } else {
        await ensureCounterAtLeast(counterKey, payload.docNo, initial);
      }

      applyNumbers(payload, payload.docNo, docPrefix);
      payload.totals = normalizeTotals(payload.totals);
      if (docTypeKey === 'sales_invoice') {
        normalizeInvoicePaymentFields(payload);
      }

      if (hooks.beforeCreate) await hooks.beforeCreate(payload);

      const createStockDirection =
        typeof hooks.resolveStockDirection === 'function'
          ? hooks.resolveStockDirection(payload) ?? stockDirection
          : stockDirection;

      const item = await scoped(req).create(payload);
      await applyDocumentStock(item.lines, createStockDirection);
      if (hooks.afterCreate) await hooks.afterCreate(item);
      res.status(201).json(item);
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      if (err.code === 11000) {
        return res.status(409).json({ error: `${notFoundLabel} number already exists for this prefix` });
      }
      next(err);
    }
  });

  router.put('/by-no/:docNo', async (req, res, next) => {
    try {
      const payload = toUpdatePayload(req.body);
      payload.totals = normalizeTotals(payload.totals);
      if (docTypeKey === 'sales_invoice') {
        normalizeInvoicePaymentFields(payload);
      }
      const lookupPrefix = resolvePrefix(req.query.prefix ?? payload.docPrefix);
      const docNo = Number(req.params.docNo);

      if (payload.docPrefix || payload.docNo) {
        const nextPrefix = resolvePrefix(payload.docPrefix ?? lookupPrefix);
        const nextDocNo = payload.docNo ? Number(payload.docNo) : docNo;
        applyNumbers(payload, nextDocNo, nextPrefix);
      }

      const existing = await scoped(req).findOne({ docNo, docPrefix: lookupPrefix });
      if (!existing) return res.status(404).json({ error: notFoundLabel });

      if (hooks.beforeUpdate) await hooks.beforeUpdate(existing, payload);

      const item = await scoped(req).findOneAndUpdate(
        { docNo, docPrefix: lookupPrefix },
        payload,
        { new: true, runValidators: true }
      );
      if (!item) return res.status(404).json({ error: notFoundLabel });
      const updateStockDirection =
        typeof hooks.resolveStockDirection === 'function'
          ? hooks.resolveStockDirection(payload) ?? stockDirection
          : stockDirection;
      const priorStockDirection =
        typeof hooks.resolveStockDirection === 'function'
          ? hooks.resolveStockDirection(existing.toObject?.() ?? existing) ?? stockDirection
          : stockDirection;
      await replaceDocumentStock(existing.lines, item.lines, updateStockDirection, priorStockDirection);
      if (hooks.afterUpdate) await hooks.afterUpdate(existing, item);
      res.json(item);
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      next(err);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const payload = toUpdatePayload(req.body);
      payload.totals = normalizeTotals(payload.totals);
      if (docTypeKey === 'sales_invoice') {
        normalizeInvoicePaymentFields(payload);
      }
      const existingBefore = await scoped(req).findById(req.params.id);
      if (!existingBefore) return res.status(404).json({ error: notFoundLabel });

      if (hooks.beforeUpdate) await hooks.beforeUpdate(existingBefore, payload);

      if (payload.docPrefix && payload.docNo) {
        applyNumbers(payload, Number(payload.docNo), payload.docPrefix);
      } else if (payload.docPrefix) {
        applyNumbers(payload, existingBefore.docNo, payload.docPrefix);
      } else if (payload.docNo) {
        applyNumbers(payload, Number(payload.docNo), existingBefore.docPrefix);
      }

      const item = await scoped(req).findByIdAndUpdate(req.params.id, payload, {
        new: true,
        runValidators: true
      });
      if (!item) return res.status(404).json({ error: notFoundLabel });
      const updateStockDirection =
        typeof hooks.resolveStockDirection === 'function'
          ? hooks.resolveStockDirection(payload) ?? stockDirection
          : stockDirection;
      const priorStockDirection =
        typeof hooks.resolveStockDirection === 'function'
          ? hooks.resolveStockDirection(existingBefore.toObject?.() ?? existingBefore) ?? stockDirection
          : stockDirection;
      await replaceDocumentStock(existingBefore.lines, item.lines, updateStockDirection, priorStockDirection);
      if (hooks.afterUpdate) await hooks.afterUpdate(existingBefore, item);
      res.json(item);
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      next(err);
    }
  });

  router.delete('/by-no/:docNo', async (req, res, next) => {
    try {
      const docNo = Number(req.params.docNo);
      const docPrefix = resolvePrefix(req.query.prefix);
      const item = await scoped(req).findOneAndDelete({ docNo, docPrefix });
      if (!item) return res.status(404).json({ error: notFoundLabel });
      const deletedStockDirection =
        typeof hooks.resolveStockDirection === 'function'
          ? hooks.resolveStockDirection(item.toObject?.() ?? item) ?? stockDirection
          : stockDirection;
      const revert = deletedStockDirection === 'in' ? 'out' : deletedStockDirection === 'out' ? 'in' : 'none';
      await applyDocumentStock(item.lines, revert);
      if (hooks.afterDelete) await hooks.afterDelete(item);
      res.json({ ok: true });
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      next(err);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const item = await scoped(req).findByIdAndDelete(req.params.id);
      if (!item) return res.status(404).json({ error: notFoundLabel });
      const deletedStockDirection =
        typeof hooks.resolveStockDirection === 'function'
          ? hooks.resolveStockDirection(item.toObject?.() ?? item) ?? stockDirection
          : stockDirection;
      const revert = deletedStockDirection === 'in' ? 'out' : deletedStockDirection === 'out' ? 'in' : 'none';
      await applyDocumentStock(item.lines, revert);
      if (hooks.afterDelete) await hooks.afterDelete(item);
      res.json({ ok: true });
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      next(err);
    }
  });

  return router;
}
