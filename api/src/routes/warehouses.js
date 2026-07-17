import { Router } from 'express';
import { Warehouse } from '../models/Warehouse.js';

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
        { location: new RegExp(term, 'i') }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Warehouse.find(filter).sort({ code: 1 }).skip(skip).limit(Number(limit)),
      Warehouse.countDocuments(filter)
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

router.get('/by-code/:code', async (req, res, next) => {
  try {
    const item = await Warehouse.findOne({
      code: req.params.code.toUpperCase()
    });
    if (!item) return res.status(404).json({ error: 'Warehouse not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = toUpdatePayload(req.body);
    if (payload.code) payload.code = String(payload.code).trim().toUpperCase();
    const item = await Warehouse.create(payload);
    res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Warehouse code already exists' });
    }
    next(err);
  }
});

router.put('/by-code/:code', async (req, res, next) => {
  try {
    const payload = toUpdatePayload(req.body);
    if (payload.code) payload.code = String(payload.code).trim().toUpperCase();
    const item = await Warehouse.findOneAndUpdate(
      { code: req.params.code.toUpperCase() },
      payload,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ error: 'Warehouse not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.delete('/by-code/:code', async (req, res, next) => {
  try {
    const item = await Warehouse.findOneAndDelete({
      code: req.params.code.toUpperCase()
    });
    if (!item) return res.status(404).json({ error: 'Warehouse not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
