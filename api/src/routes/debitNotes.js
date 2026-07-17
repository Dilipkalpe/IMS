import { Router } from 'express';
import { DebitNote } from '../models/DebitNote.js';
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

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 100, search } = req.query;
    const filter = { voucherType: 'debit_note' };

    if (search) {
      const term = String(search).trim();
      const num = Number(term);
      filter.$or = [
        { accountName: new RegExp(term, 'i') },
        { accountCode: new RegExp(term, 'i') },
        { narration: new RegExp(term, 'i') },
        { refNo: new RegExp(term, 'i') }
      ];
      if (!Number.isNaN(num)) filter.$or.push({ voucherNo: num });
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      DebitNote.find(filter).sort({ voucherNo: -1 }).skip(skip).limit(Number(limit)),
      DebitNote.countDocuments(filter)
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

router.get('/next-no', async (_req, res, next) => {
  try {
    const voucherNo = await getNextSequence('debit_note', 1);
    res.json({ voucherNo });
  } catch (err) {
    next(err);
  }
});

router.get('/by-no/:voucherNo', async (req, res, next) => {
  try {
    const voucherNo = Number(req.params.voucherNo);
    const item = await DebitNote.findOne({ voucherNo });
    if (!item) return res.status(404).json({ error: 'Debit note not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = toUpdatePayload(req.body);
    payload.voucherType = 'debit_note';
    if (!payload.voucherNo) {
      payload.voucherNo = await getNextSequence('debit_note', 1);
    }
    const item = await DebitNote.create(payload);
    res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Debit note number already exists' });
    }
    next(err);
  }
});

router.put('/by-no/:voucherNo', async (req, res, next) => {
  try {
    const payload = toUpdatePayload(req.body);
    payload.voucherType = 'debit_note';
    const item = await DebitNote.findOneAndUpdate(
      { voucherNo: Number(req.params.voucherNo) },
      payload,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ error: 'Debit note not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.delete('/by-no/:voucherNo', async (req, res, next) => {
  try {
    const item = await DebitNote.findOneAndDelete({
      voucherNo: Number(req.params.voucherNo)
    });
    if (!item) return res.status(404).json({ error: 'Debit note not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
