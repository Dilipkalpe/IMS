import { Router } from 'express';
import { Grn } from '../models/Grn.js';
import { createNumberedPurchaseDocRoutes } from './numberedPurchaseDocRoutes.js';
import { grnHooks } from '../services/grnHooks.js';
import { listPendingGrnsForInvoice, buildPendingPurchaseInvoiceLines } from '../services/grnInvoicing.js';

const docRouter = createNumberedPurchaseDocRoutes(
  Grn,
  {
    counterNamespace: 'grn',
    defaultDocPrefix: 'GRN',
    docTypeKey: 'grn',
    notFoundLabel: 'GRN',
    stockDirection: 'in'
  },
  grnHooks
);

const router = Router();

router.get('/pending-for-invoice', async (req, res, next) => {
  try {
    const supplier = String(req.query.supplier ?? '').trim();
    if (!supplier) return res.status(400).json({ error: 'supplier query parameter is required' });
    const items = await listPendingGrnsForInvoice(supplier);
    res.json({
      items: items.map((g) => ({
        docPrefix: g.docPrefix,
        docNo: g.docNo,
        formattedDocNo: g.formattedDocNo,
        supplier: g.supplier,
        status: g.status,
        grnDate: g.grnDate
      })),
      total: items.length
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.post('/pending-invoice-lines', async (req, res, next) => {
  try {
    const { supplier, grns } = req.body ?? {};
    const lines = await buildPendingPurchaseInvoiceLines(supplier, grns);
    res.json({ lines });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.use(docRouter);

export default router;
