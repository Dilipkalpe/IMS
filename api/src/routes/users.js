import { Router } from 'express';
import { AppUser } from '../models/AppUser.js';
import { hashPassword } from '../services/auth.js';
import { Role } from '../models/Role.js';

const router = Router();

async function attachRoleId(payload) {
  const roleName = String(payload.role ?? '').trim();
  if (!roleName) return payload;
  const role = await Role.findOne({
    roleName: new RegExp(`^${roleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    isDeleted: { $ne: true }
  }).lean();
  if (role) payload.roleId = role._id;
  return payload;
}

function toUpdatePayload(body) {
  const {
    _id,
    id,
    __v,
    createdAt,
    updatedAt,
    ...rest
  } = body ?? {};
  const payload = { ...rest };
  const rawPassword = typeof payload.password === 'string' ? payload.password.trim() : '';
  delete payload.password;
  if (rawPassword) {
    payload.passwordHash = hashPassword(rawPassword);
  }
  return payload;
}

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 100, search } = req.query;
    const filter = {};

    if (search) {
      const term = String(search).trim();
      filter.$or = [
        { username: new RegExp(term, 'i') },
        { fullName: new RegExp(term, 'i') },
        { role: new RegExp(term, 'i') },
        { department: new RegExp(term, 'i') }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      AppUser.find(filter).sort({ username: 1 }).skip(skip).limit(Number(limit)),
      AppUser.countDocuments(filter)
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

router.get('/by-username/:username', async (req, res, next) => {
  try {
    const item = await AppUser.findOne({
      username: req.params.username.toLowerCase()
    });
    if (!item) return res.status(404).json({ error: 'User not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = toUpdatePayload(req.body);
    if (payload.username) payload.username = String(payload.username).trim().toLowerCase();
    if (!payload.passwordHash) {
      return res.status(400).json({ error: 'Password is required.' });
    }
    await attachRoleId(payload);
    const item = await AppUser.create(payload);
    res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    next(err);
  }
});

router.put('/by-username/:username', async (req, res, next) => {
  try {
    const payload = toUpdatePayload(req.body);
    if (payload.username) payload.username = String(payload.username).trim().toLowerCase();
    await attachRoleId(payload);
    const item = await AppUser.findOneAndUpdate(
      { username: req.params.username.toLowerCase() },
      payload,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ error: 'User not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.delete('/by-username/:username', async (req, res, next) => {
  try {
    const item = await AppUser.findOneAndDelete({
      username: req.params.username.toLowerCase()
    });
    if (!item) return res.status(404).json({ error: 'User not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
