import { Router } from 'express';
import { ProductType } from '../models/ProductType.js';

const router = Router();

/** MongoDB _id and timestamps must not be sent on update. */
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

// GET /api/product-types?page=&limit=&search=
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
      ProductType.find(filter).sort({ code: 1 }).skip(skip).limit(Number(limit)),
      ProductType.countDocuments(filter)
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

// GET /api/product-types/:id
router.get('/:id', async (req, res, next) => {
  try {
    const item = await ProductType.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Product type not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/product-types
router.post('/', async (req, res, next) => {
  try {
    const item = await ProductType.create(toUpdatePayload(req.body));
    res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Product type code already exists' });
    }
    next(err);
  }
});

// PUT /api/product-types/:id
router.put('/:id', async (req, res, next) => {
  try {
    const item = await ProductType.findByIdAndUpdate(
      req.params.id,
      toUpdatePayload(req.body),
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ error: 'Product type not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// PUT /api/product-types/by-code/:code
router.put('/by-code/:code', async (req, res, next) => {
  try {
    const item = await ProductType.findOneAndUpdate(
      { code: req.params.code.toUpperCase() },
      toUpdatePayload(req.body),
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ error: 'Product type not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/product-types/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const item = await ProductType.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Product type not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/product-types/by-code/:code
router.delete('/by-code/:code', async (req, res, next) => {
  try {
    const item = await ProductType.findOneAndDelete({
      code: req.params.code.toUpperCase()
    });
    if (!item) return res.status(404).json({ error: 'Product type not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;

