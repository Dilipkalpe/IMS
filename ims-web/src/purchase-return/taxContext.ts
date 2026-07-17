import { taxContextFromHeader } from '../sales-invoice/calculations';
import type { PurchaseReturnHeader } from './types';

export function purchaseReturnGstContext(header: PurchaseReturnHeader) {
  return taxContextFromHeader({
    placeOfSupply: header.placeOfSupply,
    sellerGstin: header.companyGstin,
    customerGstin: header.supplierGstin,
  });
}
