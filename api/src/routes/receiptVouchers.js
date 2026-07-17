import { Router } from 'express';
import { ReceiptVoucher } from '../models/ReceiptVoucher.js';
import { SalesInvoice } from '../models/SalesInvoice.js';
import { getNextSequence } from '../models/Counter.js';
import { applyVoucherToInvoice } from '../services/invoicePayment.js';

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
    const filter = { voucherType: 'receipt' };

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
      ReceiptVoucher.find(filter).sort({ voucherNo: -1 }).skip(skip).limit(Number(limit)),
      ReceiptVoucher.countDocuments(filter)
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

router.get('/next-no', async (_req, res, next) => {
  try {
    const voucherNo = await getNextSequence('receipt_voucher', 1);
    res.json({ voucherNo });
  } catch (err) {
    next(err);
  }
});

router.get('/by-no/:voucherNo', async (req, res, next) => {
  try {
    const voucherNo = Number(req.params.voucherNo);
    const item = await ReceiptVoucher.findOne({ voucherNo });
    if (!item) return res.status(404).json({ error: 'Receipt voucher not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = toUpdatePayload(req.body);
    payload.voucherType = 'receipt';
    if (!payload.voucherNo) {
      payload.voucherNo = await getNextSequence('receipt_voucher', 1);
    }
    const item = await ReceiptVoucher.create(payload);
    if (payload.sourceDocType === 'sales_invoice') {
      await applyVoucherToInvoice(SalesInvoice, item);
    }
    res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Voucher number already exists' });
    }
    next(err);
  }
});

router.put('/by-no/:voucherNo', async (req, res, next) => {
  try {
    const payload = toUpdatePayload(req.body);
    payload.voucherType = 'receipt';
    const item = await ReceiptVoucher.findOneAndUpdate(
      { voucherNo: Number(req.params.voucherNo) },
      payload,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ error: 'Receipt voucher not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.delete('/by-no/:voucherNo', async (req, res, next) => {
  try {
    const item = await ReceiptVoucher.findOneAndDelete({
      voucherNo: Number(req.params.voucherNo)
    });
    if (!item) return res.status(404).json({ error: 'Receipt voucher not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
