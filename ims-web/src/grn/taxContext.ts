import type { GstTaxContext } from '../sales-invoice/gstTax';
import type { GrnHeader } from './types';

export function grnTaxHeader(
  header: GrnHeader,
): Pick<GrnHeader, 'placeOfSupply'> & { sellerGstin: string; customerGstin: string } {
  return {
    placeOfSupply: header.placeOfSupply,
    sellerGstin: header.companyGstin,
    customerGstin: header.supplierGstin,
  };
}

export function grnGstContext(header: GrnHeader): GstTaxContext {
  return grnTaxHeader(header);
}
