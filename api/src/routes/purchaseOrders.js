import { Router } from 'express';
import { PurchaseOrder } from '../models/PurchaseOrder.js';
import { createNumberedPurchaseDocRoutes } from './numberedPurchaseDocRoutes.js';
import {
  buildPendingReceiptLines,
  listPendingPurchaseOrders
} from '../services/purchaseOrderFulfillment.js';

const docRouter = createNumberedPurchaseDocRoutes(PurchaseOrder, {
  counterNamespace: 'purchase_order',
  defaultDocPrefix: 'PO',
  docTypeKey: 'purchase_order',
  notFoundLabel: 'Purchase order'
});

const router = Router();

router.get('/pending-for-receipt', async (req, res, next) => {
  try {
    const supplier = String(req.query.supplier ?? '').trim();
    if (!supplier) return res.status(400).json({ error: 'supplier query parameter is required' });
    const items = await listPendingPurchaseOrders(supplier);
    res.json({
      items: items.map((o) => ({
        docPrefix: o.docPrefix,
        docNo: o.docNo,
        formattedDocNo: o.formattedDocNo,
        supplier: o.supplier,
        status: o.status,
        poDate: o.poDate
      })),
      total: items.length
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.post('/pending-receipt-lines', async (req, res, next) => {
  try {
    const { supplier, purchaseOrders } = req.body ?? {};
    const lines = await buildPendingReceiptLines(supplier, purchaseOrders);
    res.json({ lines });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.use(docRouter);

export default router;
