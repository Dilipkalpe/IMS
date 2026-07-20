import { fetchDefaultCompany, resolveCompanyLogoUrl } from '../../api/companies';
import type { PrintableDocumentV1 } from '../contracts/printableDocument';

/** WPF: CompanyProfileService.Current applied before SalesBillFlowDocumentRenderer. */
export async function enrichPrintableSeller(document: PrintableDocumentV1): Promise<PrintableDocumentV1> {
  const company = await fetchDefaultCompany();
  if (!company) return document;

  return {
    ...document,
    seller: {
      ...document.seller,
      name: company.businessName?.trim() || document.seller.name,
      address: company.address?.trim() || document.seller.address,
      gstin: company.gstin?.trim() || document.seller.gstin,
      logoImage: resolveCompanyLogoUrl(company.logoUrl || company.logoImage) || document.seller.logoImage,
      logoText: company.logoText?.trim() || document.seller.logoText,
    },
    placeOfSupply:
      document.placeOfSupply?.trim() ||
      company.placeOfSupply?.trim() ||
      company.state?.trim() ||
      document.placeOfSupply,
  };
}
