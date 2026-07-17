import { Router } from 'express';
import { DeliveryChallan } from '../models/DeliveryChallan.js';
import { createNumberedSalesDocRoutes } from './numberedSalesDocRoutes.js';
import { deliveryChallanHooks } from '../services/deliveryChallanHooks.js';
import {
  buildPendingInvoiceLines,
  listPendingDeliveryChallansForInvoice
} from '../services/deliveryChallanInvoicing.js';

const docRouter = createNumberedSalesDocRoutes(
  DeliveryChallan,
  {
    counterNamespace: 'delivery_challan',
    defaultDocPrefix: 'DC',
    docTypeKey: 'delivery_challan',
    notFoundLabel: 'Delivery challan',
    stockDirection: 'out'
  },
  deliveryChallanHooks
);

const router = Router();

router.get('/pending-for-invoice', async (req, res, next) => {
  try {
    const customer = String(req.query.customer ?? '').trim();
    if (!customer) return res.status(400).json({ error: 'customer query parameter is required' });
    const items = await listPendingDeliveryChallansForInvoice(customer);
    res.json({
      items: items.map((dc) => ({
        docPrefix: dc.docPrefix,
        docNo: dc.docNo,
        formattedDocNo: dc.formattedDocNo,
        customer: dc.customer,
        status: dc.status,
        dcDate: dc.dcDate
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
    const { customer, deliveryChallans } = req.body ?? {};
    const lines = await buildPendingInvoiceLines(customer, deliveryChallans);
    res.json({ lines });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.use(docRouter);

export default router;
