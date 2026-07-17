import { Router } from 'express';
import { CashEntry } from '../models/CashEntry.js';
import { getNextSequence } from '../models/Counter.js';

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

function computeTotal(lines) {
  if (!Array.isArray(lines)) return 0;
  return lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
}

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 100, search } = req.query;
    const filter = { entryType: 'cash_entry' };

    if (search) {
      const term = String(search).trim();
      const num = Number(term);
      filter.$or = [{ 'lines.particular': new RegExp(term, 'i') }];
      if (!Number.isNaN(num)) filter.$or.push({ entryNo: num });
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      CashEntry.find(filter).sort({ entryNo: -1 }).skip(skip).limit(Number(limit)),
      CashEntry.countDocuments(filter)
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

router.get('/next-no', async (_req, res, next) => {
  try {
    const entryNo = await getNextSequence('cash_entry', 1);
    res.json({ entryNo });
  } catch (err) {
    next(err);
  }
});

router.get('/by-no/:entryNo', async (req, res, next) => {
  try {
    const entryNo = Number(req.params.entryNo);
    const item = await CashEntry.findOne({ entryNo });
    if (!item) return res.status(404).json({ error: 'Cash entry not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = toUpdatePayload(req.body);
    payload.entryType = 'cash_entry';
    if (!payload.entryNo) {
      payload.entryNo = await getNextSequence('cash_entry', 1);
    }
    payload.totalAmount = computeTotal(payload.lines);
    const item = await CashEntry.create(payload);
    res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Cash entry number already exists' });
    }
    next(err);
  }
});

router.put('/by-no/:entryNo', async (req, res, next) => {
  try {
    const payload = toUpdatePayload(req.body);
    payload.entryType = 'cash_entry';
    payload.totalAmount = computeTotal(payload.lines);
    const item = await CashEntry.findOneAndUpdate(
      { entryNo: Number(req.params.entryNo) },
      payload,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ error: 'Cash entry not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.delete('/by-no/:entryNo', async (req, res, next) => {
  try {
    const item = await CashEntry.findOneAndDelete({
      entryNo: Number(req.params.entryNo)
    });
    if (!item) return res.status(404).json({ error: 'Cash entry not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
