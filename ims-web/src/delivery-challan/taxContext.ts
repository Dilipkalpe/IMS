import { taxContextFromHeader } from '../sales-invoice/calculations';
import type { DeliveryChallanHeader } from './types';

export function dcTaxHeader(header: DeliveryChallanHeader) {
  return taxContextFromHeader({
    placeOfSupply: header.placeOfSupply,
    sellerGstin: header.sellerGstin,
    customerGstin: header.customerGstin,
  });
}
