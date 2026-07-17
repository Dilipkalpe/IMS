import { Router } from 'express';
import { SaleUom } from '../models/SaleUom.js';

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
    const filter = {};

    if (search) {
      const term = String(search).trim();
      filter.$or = [
        { code: new RegExp(term, 'i') },
        { name: new RegExp(term, 'i') },
        { symbol: new RegExp(term, 'i') }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      SaleUom.find(filter).sort({ code: 1 }).skip(skip).limit(Number(limit)),
      SaleUom.countDocuments(filter)
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const item = await SaleUom.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Sale UOM not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const item = await SaleUom.create(toUpdatePayload(req.body));
    res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Sale UOM code already exists' });
    }
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const item = await SaleUom.findByIdAndUpdate(
      req.params.id,
      toUpdatePayload(req.body),
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ error: 'Sale UOM not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.put('/by-code/:code', async (req, res, next) => {
  try {
    const item = await SaleUom.findOneAndUpdate(
      { code: req.params.code.toUpperCase() },
      toUpdatePayload(req.body),
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ error: 'Sale UOM not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const item = await SaleUom.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Sale UOM not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/by-code/:code', async (req, res, next) => {
  try {
    const item = await SaleUom.findOneAndDelete({
      code: req.params.code.toUpperCase()
    });
    if (!item) return res.status(404).json({ error: 'Sale UOM not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
