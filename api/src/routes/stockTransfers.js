import { Router } from 'express';
import { StockTransfer } from '../models/StockTransfer.js';
import { Product } from '../models/Product.js';
import { applyStockTransferStock } from '../services/productStock.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 100, search, status } = req.query;
    const filter = {};
    if (status) filter.status = String(status).toLowerCase();
    if (search) {
      const term = String(search).trim();
      filter.$or = [
        { entryNo: new RegExp(term, 'i') },
        { fromGodown: new RegExp(term, 'i') },
        { toGodown: new RegExp(term, 'i') },
        { remark: new RegExp(term, 'i') }
      ];
    }

    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.max(Number(limit) || 100, 1);
    const skip = (pageNum - 1) * limitNum;
    const [items, total] = await Promise.all([
      StockTransfer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      StockTransfer.countDocuments(filter)
    ]);
    res.json({ items, total, page: pageNum, limit: limitNum });
  } catch (err) {
    next(err);
  }
});

router.get('/stock-availability', async (req, res, next) => {
  try {
    const { godown, productCode } = req.query;
    const product = productCode
      ? await Product.findOne({ code: String(productCode).toUpperCase() })
      : null;
    const base = product?.stockQty ?? 70;
    res.json({ godown: godown || 'Counter', productCode, availableQty: base });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const transfer = await StockTransfer.create(req.body);
    await applyStockTransferStock(transfer);
    res.status(201).json(transfer);
  } catch (err) {
    next(err);
  }
});

export default router;
