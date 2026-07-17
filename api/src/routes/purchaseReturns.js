import { PurchaseReturn } from '../models/PurchaseReturn.js';
import { createNumberedPurchaseDocRoutes } from './numberedPurchaseDocRoutes.js';

export default createNumberedPurchaseDocRoutes(PurchaseReturn, {
  counterNamespace: 'purchase_return',
  defaultDocPrefix: 'PR',
  docTypeKey: 'purchase_return',
  notFoundLabel: 'Purchase return',
  stockDirection: 'out'
});
