import { apiFetch, probeApiHealth } from './client';

export interface LatestPurchaseSalesRateDto {
  productCode: string;
  salesRate: string | null;
  formattedDocNo?: string | null;
  billDate?: string | null;
}

/** WPF: ImsApiClient.GetLatestPurchaseInvoiceSalesRateAsync */
export async function fetchLatestPurchaseInvoiceSalesRate(
  productCode: string,
): Promise<LatestPurchaseSalesRateDto | null> {
  const code = productCode.trim();
  if (!code) return null;

  try {
    const apiUp = await probeApiHealth();
    if (!apiUp) return null;

    return await apiFetch<LatestPurchaseSalesRateDto>(
      `/api/purchase-invoices/latest-sales-rate/${encodeURIComponent(code)}`,
    );
  } catch {
    return null;
  }
}
