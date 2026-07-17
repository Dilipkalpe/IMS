import { Router } from 'express';
import { ProductionOrder } from '../models/ProductionOrder.js';
import { getNextSequence } from '../models/Counter.js';
import { expandBomForProduction } from '../services/productionBomExpand.js';
import {
  appendLineStageEvent,
  applyAutoStagesOnComplete,
  ensureOrderMaterialTracking,
  findMaterialLine,
  materialTrackingSummary
} from '../services/materialTracking.js';
import { isValidMaterialStage } from '../constants/materialStages.js';

const router = Router();

function toPayload(body) {
  const { _id, id, __v, createdAt, updatedAt, ...rest } = body ?? {};
  return rest;
}

function recalcAmounts(doc) {
  const rawTotal = (doc.rawMaterials ?? []).reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const conTotal = (doc.consumables ?? []).reduce((s, l) => s + (Number(l.amount) || 0), 0);
  doc.rawMaterialAmount = rawTotal;
  doc.productionAmount = rawTotal + conTotal;
  return doc;
}

function preparePayload(body) {
  const payload = recalcAmounts(toPayload(body));
  ensureOrderMaterialTracking(payload);
  if (payload.status === 'Completed') {
    applyAutoStagesOnComplete(payload);
  }
  return payload;
}

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 200, search, status } = req.query;
    const filter = {};
    if (status) filter.status = String(status);
    if (search) {
      const term = String(search).trim();
      const num = Number(term);
      filter.$or = [
        { manufacturingItemId: new RegExp(term, 'i') },
        { manufacturingItemName: new RegExp(term, 'i') },
        { machineName: new RegExp(term, 'i') }
      ];
      if (!Number.isNaN(num)) filter.$or.push({ productionNo: num });
    }

    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.max(Number(limit) || 200, 1);
    const skip = (pageNum - 1) * limitNum;
    const [items, total] = await Promise.all([
      ProductionOrder.find(filter).sort({ productionNo: -1 }).skip(skip).limit(limitNum).lean(),
      ProductionOrder.countDocuments(filter)
    ]);
    res.json({ items, total, page: pageNum, limit: limitNum });
  } catch (err) {
    next(err);
  }
});

router.get('/stats', async (_req, res, next) => {
  try {
    const [total, open, inProgress, completed] = await Promise.all([
      ProductionOrder.countDocuments({}),
      ProductionOrder.countDocuments({ status: 'Open' }),
      ProductionOrder.countDocuments({ status: 'In Progress' }),
      ProductionOrder.countDocuments({ status: 'Completed' })
    ]);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const completedWeek = await ProductionOrder.countDocuments({
      status: 'Completed',
      updatedAt: { $gte: weekAgo }
    });
    res.json({ total, open, inProgress, completed, completedWeek });
  } catch (err) {
    next(err);
  }
});

router.get('/next-no', async (_req, res, next) => {
  try {
    const productionNo = await getNextSequence('production_order', 1);
    res.json({ productionNo });
  } catch (err) {
    next(err);
  }
});

router.get('/by-no/:productionNo', async (req, res, next) => {
  try {
    const productionNo = Number(req.params.productionNo);
    const item = await ProductionOrder.findOne({ productionNo }).lean();
    if (!item) return res.status(404).json({ error: 'Production order not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.get('/by-no/:productionNo/material-tracking', async (req, res, next) => {
  try {
    const productionNo = Number(req.params.productionNo);
    const item = await ProductionOrder.findOne({ productionNo }).lean();
    if (!item) return res.status(404).json({ error: 'Production order not found' });
    res.json(materialTrackingSummary(item));
  } catch (err) {
    next(err);
  }
});

router.post('/by-no/:productionNo/material-stage', async (req, res, next) => {
  try {
    const productionNo = Number(req.params.productionNo);
    const { lineKind, srNo, stage, qty, godown, note, by } = req.body ?? {};
    if (!lineKind || !['raw', 'consumable'].includes(String(lineKind))) {
      return res.status(400).json({ error: 'lineKind must be raw or consumable' });
    }
    if (!isValidMaterialStage(stage)) {
      return res.status(400).json({ error: 'Invalid stage' });
    }

    const item = await ProductionOrder.findOne({ productionNo });
    if (!item) return res.status(404).json({ error: 'Production order not found' });

    const line = findMaterialLine(item, String(lineKind), srNo);
    if (!line) return res.status(404).json({ error: 'Material line not found' });

    appendLineStageEvent(line, stage, {
      qty: qty ?? (lineKind === 'raw' ? line.reqQty : line.qty),
      godown: godown ?? item.fromGodown,
      note: note ?? '',
      by: by ?? item.operatorId ?? item.operatorName
    });
    await item.save();
    res.json(materialTrackingSummary(item.toObject()));
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.post('/expand-bom', async (req, res, next) => {
  try {
    const { productCode, produceQty } = req.body ?? {};
    const expanded = await expandBomForProduction(productCode, produceQty);
    res.json({
      productCode: expanded.bom.productCode,
      revision: expanded.bom.revision,
      standardQty: expanded.bom.standardQty,
      multiplier: expanded.multiplier,
      rawMaterials: expanded.rawMaterials,
      consumables: expanded.consumables,
      rawMaterialAmount: expanded.rawMaterialAmount,
      productionAmount: expanded.productionAmount
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = preparePayload(req.body);
    if (!payload.productionNo) {
      payload.productionNo = await getNextSequence('production_order', 1);
    }
    if (!payload.bomProductCode && payload.manufacturingItemId) {
      payload.bomProductCode = String(payload.manufacturingItemId).trim().toUpperCase();
    }
    if (!payload.status) payload.status = 'Open';
    const item = await ProductionOrder.create(payload);
    res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Production number already exists' });
    }
    next(err);
  }
});

router.put('/by-no/:productionNo', async (req, res, next) => {
  try {
    const payload = preparePayload(req.body);
    const item = await ProductionOrder.findOneAndUpdate(
      { productionNo: Number(req.params.productionNo) },
      payload,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ error: 'Production order not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.delete('/by-no/:productionNo', async (req, res, next) => {
  try {
    const item = await ProductionOrder.findOneAndDelete({
      productionNo: Number(req.params.productionNo)
    });
    if (!item) return res.status(404).json({ error: 'Production order not found' });
    res.json({ deleted: true, productionNo: item.productionNo });
  } catch (err) {
    next(err);
  }
});

export default router;
