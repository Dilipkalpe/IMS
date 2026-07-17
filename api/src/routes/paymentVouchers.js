import { Router } from 'express';
import { PaymentVoucher } from '../models/PaymentVoucher.js';
import { PurchaseInvoice } from '../models/PurchaseInvoice.js';
import { getNextSequence } from '../models/Counter.js';
import {
  applyVoucherAllocations,
  assertAllocationsWithinOutstanding,
  collectVoucherInvoiceAllocations,
  mapOutstandingInvoice,
  replaceVoucherAllocations,
  validatePaymentAllocations,
} from '../services/invoicePayment.js';

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

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasAllocations(payload) {
  return (
    payload.sourceDocType === 'purchase_invoice' ||
    (Array.isArray(payload.invoiceAllocations) && payload.invoiceAllocations.length > 0)
  );
}

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 100, search } = req.query;
    const filter = { voucherType: 'payment' };

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
      PaymentVoucher.find(filter).sort({ voucherNo: -1 }).skip(skip).limit(Number(limit)),
      PaymentVoucher.countDocuments(filter)
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

router.get('/outstanding-purchase-invoices', async (req, res, next) => {
  try {
    const supplier = String(req.query.supplier ?? '').trim();
    const accountName = String(req.query.accountName ?? '').trim();
    const accountCode = String(req.query.accountCode ?? '').trim();

    const filter = {
      balanceDue: { $gt: 0.001 },
      status: { $nin: ['cancelled', 'draft'] }
    };

    if (supplier) {
      filter.supplier = new RegExp(`^${escapeRegex(supplier)}$`, 'i');
    } else if (accountName) {
      filter.supplier = new RegExp(`^${escapeRegex(accountName)}$`, 'i');
    } else if (accountCode) {
      const or = [{ supplier: new RegExp(escapeRegex(accountCode), 'i') }];
      filter.$or = or;
    } else {
      return res.status(400).json({ error: 'supplier, accountName, or accountCode is required.' });
    }

    const items = await PurchaseInvoice.find(filter).sort({ billDate: 1, docNo: 1 }).lean();
    res.json({ items: items.map(mapOutstandingInvoice) });
  } catch (err) {
    next(err);
  }
});

router.get('/next-no', async (_req, res, next) => {
  try {
    const voucherNo = await getNextSequence('payment_voucher', 1);
    res.json({ voucherNo });
  } catch (err) {
    next(err);
  }
});

router.get('/by-no/:voucherNo', async (req, res, next) => {
  try {
    const voucherNo = Number(req.params.voucherNo);
    const item = await PaymentVoucher.findOne({ voucherNo });
    if (!item) return res.status(404).json({ error: 'Payment voucher not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = toUpdatePayload(req.body);
    payload.voucherType = 'payment';
    if (!payload.voucherNo) {
      payload.voucherNo = await getNextSequence('payment_voucher', 1);
    }

    if (hasAllocations(payload)) {
      validatePaymentAllocations(payload.amount, payload.invoiceAllocations);
      await assertAllocationsWithinOutstanding(PurchaseInvoice, payload.invoiceAllocations, payload, {
        editing: false
      });
    }

    const item = await PaymentVoucher.create(payload);
    if (hasAllocations(payload)) {
      await applyVoucherAllocations(PurchaseInvoice, item);
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
    const voucherNo = Number(req.params.voucherNo);
    const existing = await PaymentVoucher.findOne({ voucherNo });
    if (!existing) return res.status(404).json({ error: 'Payment voucher not found' });

    const payload = toUpdatePayload(req.body);
    payload.voucherType = 'payment';

    if (hasAllocations(payload)) {
      validatePaymentAllocations(payload.amount, payload.invoiceAllocations);
      await assertAllocationsWithinOutstanding(PurchaseInvoice, payload.invoiceAllocations, existing, {
        editing: true
      });
    }

    const item = await PaymentVoucher.findOneAndUpdate({ voucherNo }, payload, {
      new: true,
      runValidators: true
    });

    if (hasAllocations(payload)) {
      await replaceVoucherAllocations(PurchaseInvoice, existing, item);
    } else if (collectVoucherInvoiceAllocations(existing).length > 0) {
      await replaceVoucherAllocations(PurchaseInvoice, existing, { ...item.toObject(), invoiceAllocations: [] });
    }

    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.delete('/by-no/:voucherNo', async (req, res, next) => {
  try {
    const voucherNo = Number(req.params.voucherNo);
    const item = await PaymentVoucher.findOne({ voucherNo });
    if (!item) return res.status(404).json({ error: 'Payment voucher not found' });

    if (collectVoucherInvoiceAllocations(item).length > 0) {
      await replaceVoucherAllocations(PurchaseInvoice, item, { ...item.toObject(), invoiceAllocations: [] });
    }

    await PaymentVoucher.findOneAndDelete({ voucherNo });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
