import { fetchLatestPurchaseInvoiceSalesRate } from '../api/purchaseInvoices';
import { getSalesPurchaseSettings } from '../api/salesPurchaseSettings';
import { lookupProduct } from '../api/products';
import { findLocalProduct, type SalesProductInfo } from '../components/transaction/salesProductPicker';

export interface SalesRateResolution {
  rate: number;
  warningMessage: string | null;
  usedFallback: boolean;
}

function pickWithFallback(
  primary: number,
  fallback: number,
  productCode: string,
  primaryLabel: string,
  fallbackLabel: string,
): SalesRateResolution {
  if (primary > 0) {
    return { rate: primary, warningMessage: null, usedFallback: false };
  }

  if (fallback > 0) {
    return {
      rate: fallback,
      warningMessage: `No sales rate in ${primaryLabel} for ${productCode}. Using ${fallbackLabel} rate instead.`,
      usedFallback: true,
    };
  }

  return {
    rate: 0,
    warningMessage: `No sales rate found for ${productCode} in product master or purchase invoices. Enter the rate manually.`,
    usedFallback: false,
  };
}

async function resolveProductMasterRate(
  productCode: string,
  productHint?: SalesProductInfo | null,
): Promise<number> {
  if (productHint && productHint.rate > 0) return productHint.rate;

  try {
    const product = await lookupProduct(productCode);
    if (product && product.rate > 0) return product.rate;
  } catch {
    // fall through
  }

  const local = findLocalProduct(productCode);
  if (local && local.rate > 0) return local.rate;

  return 0;
}

async function resolvePurchaseInvoiceRate(productCode: string): Promise<number> {
  try {
    const dto = await fetchLatestPurchaseInvoiceSalesRate(productCode);
    if (!dto?.salesRate) return 0;

    const rate = Number(String(dto.salesRate).replace(/,/g, ''));
    return Number.isFinite(rate) && rate > 0 ? rate : 0;
  } catch {
    return 0;
  }
}

/** WPF: SalesRateResolver.ResolveForSalesInvoiceAsync */
export async function resolveForSalesInvoice(
  productCode: string,
  productHint?: SalesProductInfo | null,
): Promise<SalesRateResolution> {
  const settings = await getSalesPurchaseSettings();
  const masterRate = await resolveProductMasterRate(productCode, productHint);
  const purchaseRate = await resolvePurchaseInvoiceRate(productCode);

  if (settings.salesRateSource === 'purchase_invoice') {
    return pickWithFallback(
      purchaseRate,
      masterRate,
      productCode,
      'purchase invoice',
      'product master',
    );
  }

  return pickWithFallback(
    masterRate,
    purchaseRate,
    productCode,
    'product master',
    'purchase invoice',
  );
}
