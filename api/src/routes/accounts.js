import { Router } from 'express';
import { Account } from '../models/Account.js';
import { logMasterAudit } from '../services/masterAudit.js';

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
    const { type, page = 1, limit = 100, search } = req.query;
    const filter = {};
    if (type) filter.accountType = type;
    if (search) {
      const term = String(search).trim();
      filter.$or = [
        { code: new RegExp(term, 'i') },
        { name: new RegExp(term, 'i') },
        { gstNo: new RegExp(term, 'i') },
        { city: new RegExp(term, 'i') },
        { email: new RegExp(term, 'i') },
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Account.find(filter).sort({ code: 1 }).skip(skip).limit(Number(limit)),
      Account.countDocuments(filter)
    ]);
    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

router.get('/names', async (req, res, next) => {
  try {
    const { type = 'customer' } = req.query;
    const accounts = await Account.find({ accountType: type, activeStatus: true }).sort({ name: 1 });
    res.json(['— Select —', 'Walk In', ...accounts.map((a) => a.name)]);
  } catch (err) {
    next(err);
  }
});

router.get('/by-code/:code', async (req, res, next) => {
  try {
    const item = await Account.findOne({ code: req.params.code.toUpperCase() });
    if (!item) return res.status(404).json({ error: 'Account not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = toUpdatePayload(req.body);
    if (payload.code) payload.code = String(payload.code).trim().toUpperCase();
    const account = await Account.create(payload);
    await logMasterAudit({
      entityType: 'account',
      entityKey: account.code,
      action: 'create',
      changes: { accountType: account.accountType, name: account.name },
    });
    res.status(201).json(account);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Account code already exists' });
    next(err);
  }
});

router.put('/by-code/:code', async (req, res, next) => {
  try {
    const item = await Account.findOneAndUpdate(
      { code: req.params.code.toUpperCase() },
      toUpdatePayload(req.body),
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ error: 'Account not found' });
    await logMasterAudit({
      entityType: 'account',
      entityKey: item.code,
      action: 'update',
      changes: { name: item.name, activeStatus: item.activeStatus },
    });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.delete('/by-code/:code', async (req, res, next) => {
  try {
    const item = await Account.findOneAndDelete({ code: req.params.code.toUpperCase() });
    if (!item) return res.status(404).json({ error: 'Account not found' });
    await logMasterAudit({ entityType: 'account', entityKey: item.code, action: 'delete' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const item = await Account.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Account not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
