import { Router } from 'express';
import { TransactionDocument } from '../models/TransactionDocument.js';
import { getNextSequence } from '../models/Counter.js';
import { DOC_INITIAL, formatDocNo } from '../services/docTypeMap.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { type, page = 1, limit = 100 } = req.query;
    if (!type) return res.status(400).json({ error: 'type query parameter is required' });
    const skip = (Number(page) - 1) * Number(limit);
    const filter = { docType: type };
    const [items, total] = await Promise.all([
      TransactionDocument.find(filter).sort({ docNo: -1 }).skip(skip).limit(Number(limit)),
      TransactionDocument.countDocuments(filter)
    ]);
    res.json({ items, total });
  } catch (err) {
    next(err);
  }
});

router.get('/next-number', async (req, res, next) => {
  try {
    const { type } = req.query;
    if (!type) return res.status(400).json({ error: 'type is required' });
    const initial = DOC_INITIAL[type] ?? 1;
    const docNo = await getNextSequence(`doc_${type}`, initial);
    res.json({ docNo, formattedDocNo: formatDocNo(type, docNo) });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const doc = await TransactionDocument.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { docType, docNo, ...rest } = req.body;
    if (!docType) return res.status(400).json({ error: 'docType is required' });

    let finalDocNo = docNo;
    if (!finalDocNo) {
      const initial = DOC_INITIAL[docType] ?? 1;
      finalDocNo = await getNextSequence(`doc_${docType}`, initial);
    }

    const formattedDocNo = formatDocNo(docType, finalDocNo);
    const doc = await TransactionDocument.create({
      ...rest,
      docType,
      docNo: finalDocNo,
      formattedDocNo
    });
    res.status(201).json(doc);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Document number already exists' });
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const doc = await TransactionDocument.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await TransactionDocument.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
