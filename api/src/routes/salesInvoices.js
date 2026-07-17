import { SalesInvoice } from '../models/SalesInvoice.js';
import { createNumberedSalesDocRoutes } from './numberedSalesDocRoutes.js';
import { salesInvoiceHooks } from '../services/salesInvoiceHooks.js';

export default createNumberedSalesDocRoutes(
  SalesInvoice,
  {
    counterNamespace: 'sales_invoice',
    defaultDocPrefix: 'INV',
    docTypeKey: 'sales_invoice',
    notFoundLabel: 'Sales invoice',
    stockDirection: 'out'
  },
  salesInvoiceHooks
);
