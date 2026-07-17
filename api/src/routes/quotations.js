import { Router } from 'express';
import { Quotation } from '../models/Quotation.js';
import { parsePagination } from '../utils/pagination.js';
import { fetchQuotationListResponse } from '../services/quotationListSummary.js';
import { ensureCounterAtLeast, getNextSequence } from '../models/Counter.js';
import { DOC_INITIAL } from '../services/docTypeMap.js';
import {
  formatQuotationNo,
  initialDocNoForPrefix,
  normalizeQtPrefix,
  parseFormattedQuotationNo,
  peekNextQuotationDocNo,
  quotationCounterKey
} from '../services/quotationNo.js';

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

function applyQuotationNumbers(payload, docNo) {
  const qtPrefix = normalizeQtPrefix(payload.qtPrefix);
  payload.qtPrefix = qtPrefix;
  payload.docNo = docNo;
  payload.formattedDocNo = formatQuotationNo(qtPrefix, docNo);
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
        { qtPrefix: new RegExp(term, 'i') },
        { paymentTerms: new RegExp(term, 'i') }
      ];
      if (!Number.isNaN(num)) filter.$or.push({ docNo: num });
    }

    const { items, total } = await fetchQuotationListResponse(filter, sort, sortDir, skip, limit);

    res.json({ items, total, page, limit });
  } catch (err) {
    next(err);
  }
});

router.get('/stats', async (_req, res, next) => {
  try {
    const [total, open, sent, accepted, expired, cancelled, draft] = await Promise.all([
      Quotation.countDocuments(),
      Quotation.countDocuments({ status: 'open' }),
      Quotation.countDocuments({ status: 'sent' }),
      Quotation.countDocuments({ status: 'accepted' }),
      Quotation.countDocuments({ status: 'expired' }),
      Quotation.countDocuments({ status: 'cancelled' }),
      Quotation.countDocuments({ status: 'draft' })
    ]);

    res.json({
      total,
      open,
      sent,
      accepted,
      expired,
      cancelled,
      draft,
      confirmed: sent,
      active: open + sent + draft
    });
  } catch (err) {
    next(err);
  }
});

router.get('/next-no', async (req, res, next) => {
  try {
    const qtPrefix = normalizeQtPrefix(req.query.prefix);
    const docNo = await peekNextQuotationDocNo(qtPrefix, DOC_INITIAL.quotation ?? 1);
    res.json({
      qtPrefix,
      docNo,
      formattedDocNo: formatQuotationNo(qtPrefix, docNo)
    });
  } catch (err) {
    next(err);
  }
});

router.get('/by-no/:docNo', async (req, res, next) => {
  try {
    const docNo = Number(req.params.docNo);
    const qtPrefix = normalizeQtPrefix(req.query.prefix);
    const item = await Quotation.findOne({ docNo, qtPrefix });
    if (!item) return res.status(404).json({ error: 'Quotation not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.get('/by-formatted/:formatted', async (req, res, next) => {
  try {
    const formatted = decodeURIComponent(req.params.formatted ?? '').trim();
    const item = await Quotation.findOne({ formattedDocNo: formatted });
    if (!item) {
      const parsed = parseFormattedQuotationNo(formatted);
      if (parsed.docNo > 0) {
        const fallback = await Quotation.findOne({
          docNo: parsed.docNo,
          qtPrefix: parsed.qtPrefix
        });
        if (fallback) return res.json(fallback);
      }
      return res.status(404).json({ error: 'Quotation not found' });
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const item = await Quotation.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Quotation not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = toUpdatePayload(req.body);
    const qtPrefix = normalizeQtPrefix(payload.qtPrefix);
    const initial = initialDocNoForPrefix(qtPrefix, DOC_INITIAL.quotation ?? 1);

    const counterKey = quotationCounterKey(qtPrefix);
    if (!payload.docNo) {
      payload.docNo = await getNextSequence(counterKey, initial);
    } else {
      await ensureCounterAtLeast(counterKey, payload.docNo, initial);
    }

    applyQuotationNumbers(payload, payload.docNo);
    payload.totals = normalizeTotals(payload.totals);

    const item = await Quotation.create(payload);
    res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Quotation number already exists for this prefix' });
    }
    next(err);
  }
});

router.put('/by-no/:docNo', async (req, res, next) => {
  try {
    const payload = toUpdatePayload(req.body);
    payload.totals = normalizeTotals(payload.totals);
    const lookupPrefix = normalizeQtPrefix(req.query.prefix ?? payload.qtPrefix);
    const docNo = Number(req.params.docNo);

    if (payload.qtPrefix || payload.docNo) {
      const qtPrefix = normalizeQtPrefix(payload.qtPrefix ?? lookupPrefix);
      const nextDocNo = payload.docNo ? Number(payload.docNo) : docNo;
      applyQuotationNumbers(payload, nextDocNo);
    }

    const item = await Quotation.findOneAndUpdate(
      { docNo, qtPrefix: lookupPrefix },
      payload,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ error: 'Quotation not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const payload = toUpdatePayload(req.body);
    payload.totals = normalizeTotals(payload.totals);
    if (payload.qtPrefix && payload.docNo) {
      applyQuotationNumbers(payload, Number(payload.docNo));
    } else if (payload.qtPrefix && !payload.docNo) {
      const existing = await Quotation.findById(req.params.id);
      if (existing) {
        applyQuotationNumbers(payload, existing.docNo);
      }
    } else if (payload.docNo) {
      const existing = await Quotation.findById(req.params.id);
      if (existing) {
        applyQuotationNumbers(payload, Number(payload.docNo));
      }
    }

    const item = await Quotation.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    });
    if (!item) return res.status(404).json({ error: 'Quotation not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.delete('/by-no/:docNo', async (req, res, next) => {
  try {
    const docNo = Number(req.params.docNo);
    const qtPrefix = normalizeQtPrefix(req.query.prefix);
    const item = await Quotation.findOneAndDelete({ docNo, qtPrefix });
    if (!item) return res.status(404).json({ error: 'Quotation not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const item = await Quotation.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Quotation not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
