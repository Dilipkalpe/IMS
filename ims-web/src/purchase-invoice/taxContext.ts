import type { GstTaxContext } from '../sales-invoice/gstTax';
import type { PurchaseInvoiceHeader } from './types';

/** Maps purchase header fields → shared GST tax context (company = seller side). */
export function purchaseTaxHeader(
  header: PurchaseInvoiceHeader,
): Pick<PurchaseInvoiceHeader, 'placeOfSupply'> & { sellerGstin: string; customerGstin: string } {
  return {
    placeOfSupply: header.placeOfSupply,
    sellerGstin: header.companyGstin,
    customerGstin: header.supplierGstin,
  };
}

export function purchaseGstContext(header: PurchaseInvoiceHeader): GstTaxContext {
  return purchaseTaxHeader(header);
}
