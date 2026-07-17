import { Router } from 'express';
import { ProductMainGroup } from '../models/ProductMainGroup.js';

const router = Router();

function toPayload(body) {
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
        { name: new RegExp(term, 'i') }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      ProductMainGroup.find(filter).sort({ code: 1 }).skip(skip).limit(Number(limit)),
      ProductMainGroup.countDocuments(filter)
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const item = await ProductMainGroup.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Product main group not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const item = await ProductMainGroup.create(toPayload(req.body));
    res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Product main group code already exists' });
    }
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const item = await ProductMainGroup.findByIdAndUpdate(
      req.params.id,
      toPayload(req.body),
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ error: 'Product main group not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.put('/by-code/:code', async (req, res, next) => {
  try {
    const item = await ProductMainGroup.findOneAndUpdate(
      { code: req.params.code.toUpperCase() },
      toPayload(req.body),
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ error: 'Product main group not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const item = await ProductMainGroup.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Product main group not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/by-code/:code', async (req, res, next) => {
  try {
    const item = await ProductMainGroup.findOneAndDelete({
      code: req.params.code.toUpperCase()
    });
    if (!item) return res.status(404).json({ error: 'Product main group not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;

