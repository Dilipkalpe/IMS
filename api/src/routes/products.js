import { Router } from 'express';
import { getYearModelFromRequest } from '../db/yearModels.js';
import { Product } from '../models/Product.js';
import { logMasterAudit } from '../services/masterAudit.js';

const router = Router();

function productModel(req) {
  return getYearModelFromRequest(Product, req);
}

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

function resolveTaxPercent(product) {
  if (product.taxPercent != null && product.taxPercent !== '') {
    return String(product.taxPercent);
  }
  const fromGst = product.igst > 0
    ? product.igst
    : (product.cgst || 0) + (product.sgst || 0);
  return String(fromGst > 0 ? fromGst : 18);
}

router.get('/', async (req, res, next) => {
  try {
    const ProductModel = productModel(req);
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
      ProductModel.find(filter).sort({ code: 1 }).skip(skip).limit(Number(limit)),
      ProductModel.countDocuments(filter)
    ]);
    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

router.get('/search', async (req, res, next) => {
  try {
    const ProductModel = productModel(req);
    const term = String(req.query.q || '').trim();
    const limit = Math.min(Math.max(Number(req.query.limit) || 40, 1), 100);
    if (!term) return res.json({ items: [], total: 0 });

    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const filter = {
      $or: [
        { code: new RegExp(escaped, 'i') },
        { name: new RegExp(escaped, 'i') }
      ]
    };

    const [items, total] = await Promise.all([
      ProductModel.find(filter).sort({ code: 1 }).limit(limit).lean(),
      ProductModel.countDocuments(filter)
    ]);

    res.json({
      items: items.map((p) => ({
        code: p.code,
        name: p.name,
        rate: p.salePrice,
        purchasePrice: p.purchasePrice ?? 0,
        stockQty: Number(p.stockQty) || 0,
        taxType: p.taxType || 'GST',
        taxPercent: resolveTaxPercent(p)
      })),
      total
    });
  } catch (err) {
    next(err);
  }
});

router.get('/lookup', async (req, res, next) => {
  try {
    const ProductModel = productModel(req);
    const term = String(req.query.q || '').trim();
    if (!term) return res.json(null);
    const product =
      (await ProductModel.findOne({ code: new RegExp(`^${term}$`, 'i') })) ||
      (await ProductModel.findOne({ name: new RegExp(term, 'i') }));
    if (!product) return res.json(null);
    res.json({
      code: product.code,
      name: product.name,
      rate: product.salePrice,
      purchasePrice: product.purchasePrice ?? 0,
      stockQty: Number(product.stockQty) || 0,
      taxType: product.taxType || 'GST',
      taxPercent: product.taxPercent || '18'
    });
  } catch (err) {
    next(err);
  }
});

router.get('/by-code/:code', async (req, res, next) => {
  try {
    const ProductModel = productModel(req);
    const product = await ProductModel.findOne({ code: req.params.code.toUpperCase() });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const ProductModel = productModel(req);
    const product = await ProductModel.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const ProductModel = productModel(req);
    const payload = toPayload(req.body);
    if (payload.code) payload.code = String(payload.code).trim().toUpperCase();
    const product = await ProductModel.create(payload);
    await logMasterAudit({
      entityType: 'product',
      entityKey: product.code,
      action: 'create',
      changes: { name: product.name, salePrice: product.salePrice },
    });
    res.status(201).json(product);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Product code already exists' });
    next(err);
  }
});

router.put('/by-code/:code', async (req, res, next) => {
  try {
    const ProductModel = productModel(req);
    const product = await ProductModel.findOneAndUpdate(
      { code: req.params.code.toUpperCase() },
      toPayload(req.body),
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    await logMasterAudit({
      entityType: 'product',
      entityKey: product.code,
      action: 'update',
      changes: { name: product.name, activeStatus: product.activeStatus },
    });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const ProductModel = productModel(req);
    const product = await ProductModel.findByIdAndUpdate(req.params.id, toPayload(req.body), { new: true, runValidators: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    await logMasterAudit({
      entityType: 'product',
      entityKey: product.code,
      action: 'update',
      changes: { name: product.name, activeStatus: product.activeStatus },
    });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const ProductModel = productModel(req);
    const product = await ProductModel.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    await logMasterAudit({ entityType: 'product', entityKey: product.code, action: 'delete' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/by-code/:code', async (req, res, next) => {
  try {
    const ProductModel = productModel(req);
    const product = await ProductModel.findOneAndDelete({ code: req.params.code.toUpperCase() });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    await logMasterAudit({ entityType: 'product', entityKey: product.code, action: 'delete' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
