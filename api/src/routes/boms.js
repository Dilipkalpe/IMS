import { Router } from 'express';
import { Bom } from '../models/Bom.js';
import { Product } from '../models/Product.js';

const router = Router();

function normalizeCode(code) {
  return String(code || '').trim().toUpperCase();
}

function recalcTotals(doc) {
  const rawMaterials = Array.isArray(doc.rawMaterials) ? doc.rawMaterials : [];
  const consumables = Array.isArray(doc.consumables) ? doc.consumables : [];
  const rawTotal = rawMaterials.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
  const consumableTotal = consumables.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
  doc.rawMaterials = rawMaterials;
  doc.consumables = consumables;
  doc.rawMaterialAmount = rawTotal;
  doc.productionAmount = rawTotal + consumableTotal;
  return doc;
}

function toBomPayload(body, productCode) {
  const { _id, id, __v, createdAt, updatedAt, ...rest } = body ?? {};
  return recalcTotals({
    ...rest,
    productCode: normalizeCode(productCode),
    productId: rest.productId ?? '',
    productName: rest.productName ?? '',
    revision: rest.revision ?? 'Rev A',
    standardQty: Number(rest.standardQty) || 1,
    rawMaterials: Array.isArray(rest.rawMaterials) ? rest.rawMaterials : [],
    consumables: Array.isArray(rest.consumables) ? rest.consumables : [],
    status: rest.status ?? 'active'
  });
}

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 200, search } = req.query;
    const filter = {};
    if (search) {
      const term = String(search).trim();
      filter.$or = [
        { productCode: new RegExp(term, 'i') },
        { productName: new RegExp(term, 'i') },
        { revision: new RegExp(term, 'i') }
      ];
    }
    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.max(Number(limit) || 200, 1);
    const skip = (pageNum - 1) * limitNum;
    const [items, total] = await Promise.all([
      Bom.find(filter).sort({ productCode: 1 }).skip(skip).limit(limitNum).lean(),
      Bom.countDocuments(filter)
    ]);
    res.json({ items, total, page: pageNum, limit: limitNum });
  } catch (err) {
    next(err);
  }
});

router.get('/by-product/:productCode', async (req, res, next) => {
  try {
    const productCode = normalizeCode(req.params.productCode);
    const bom = await Bom.findOne({ productCode }).lean();
    if (!bom) {
      return res.status(404).json({ error: 'BOM not found', productCode });
    }
    res.json(bom);
  } catch (err) {
    next(err);
  }
});

router.put('/by-product/:productCode', async (req, res, next) => {
  try {
    const productCode = normalizeCode(req.params.productCode);
    const payload = toBomPayload(req.body, productCode);

    let bom = await Bom.findOne({ productCode });
    if (bom) {
      bom.productId = payload.productId;
      bom.productName = payload.productName;
      bom.revision = payload.revision;
      bom.effectiveFrom = payload.effectiveFrom;
      bom.standardQty = payload.standardQty;
      bom.rawMaterials = payload.rawMaterials;
      bom.consumables = payload.consumables;
      bom.rawMaterialAmount = payload.rawMaterialAmount;
      bom.productionAmount = payload.productionAmount;
      bom.status = payload.status;
      bom.markModified('rawMaterials');
      bom.markModified('consumables');
      await bom.save();
    } else {
      bom = await Bom.create(payload);
    }
    res.json(bom.toObject ? bom.toObject() : bom);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const productCode = normalizeCode(req.body?.productCode);
    if (!productCode) {
      return res.status(400).json({ error: 'productCode is required' });
    }

    const product = await Product.findOne({ code: productCode });
    const payload = toBomPayload(
      {
        ...req.body,
        productId: req.body?.productId || product?._id?.toString() || '',
        productName: req.body?.productName || product?.name || ''
      },
      productCode
    );

    const existing = await Bom.findOne({ productCode });
    if (existing) {
      existing.productId = payload.productId;
      existing.productName = payload.productName;
      existing.revision = payload.revision;
      existing.effectiveFrom = payload.effectiveFrom;
      existing.standardQty = payload.standardQty;
      existing.rawMaterials = payload.rawMaterials;
      existing.consumables = payload.consumables;
      existing.rawMaterialAmount = payload.rawMaterialAmount;
      existing.productionAmount = payload.productionAmount;
      existing.status = payload.status;
      existing.markModified('rawMaterials');
      existing.markModified('consumables');
      const bom = await existing.save();
      return res.json(bom.toObject ? bom.toObject() : bom);
    }

    const bom = await Bom.create(payload);
    res.status(201).json(bom.toObject ? bom.toObject() : bom);
  } catch (err) {
    next(err);
  }
});

export default router;
