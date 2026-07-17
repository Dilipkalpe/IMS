import { SalesReturn } from '../models/SalesReturn.js';
import { createNumberedSalesDocRoutes } from './numberedSalesDocRoutes.js';

export default createNumberedSalesDocRoutes(SalesReturn, {
  counterNamespace: 'sales_return',
  defaultDocPrefix: 'SR',
  docTypeKey: 'sales_return',
  notFoundLabel: 'Sales return',
  stockDirection: 'in'
});
