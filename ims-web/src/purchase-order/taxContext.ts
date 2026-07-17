import type { GstTaxContext } from '../sales-invoice/gstTax';
import type { PurchaseOrderHeader } from './types';

/** Maps purchase order header → shared GST tax context (company = buyer side). */
export function purchaseOrderTaxHeader(
  header: PurchaseOrderHeader,
): Pick<PurchaseOrderHeader, 'placeOfSupply'> & { sellerGstin: string; customerGstin: string } {
  return {
    placeOfSupply: header.placeOfSupply,
    sellerGstin: header.companyGstin,
    customerGstin: header.supplierGstin,
  };
}

export function purchaseOrderGstContext(header: PurchaseOrderHeader): GstTaxContext {
  return purchaseOrderTaxHeader(header);
}
