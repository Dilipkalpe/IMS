import { PurchaseInvoice } from '../models/PurchaseInvoice.js';
import { createNumberedPurchaseDocRoutes } from './numberedPurchaseDocRoutes.js';
import { purchaseInvoiceHooks } from '../services/purchaseInvoiceHooks.js';

export default createNumberedPurchaseDocRoutes(
  PurchaseInvoice,
  {
    counterNamespace: 'purchase_invoice',
    defaultDocPrefix: 'PI',
    docTypeKey: 'purchase_invoice',
    notFoundLabel: 'Purchase invoice',
    stockDirection: 'in'
  },
  purchaseInvoiceHooks
);
