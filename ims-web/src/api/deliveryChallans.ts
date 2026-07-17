import { apiFetch } from './client';

export interface DeliveryChallanReference {
  docPrefix: string;
  docNo: number;
  formattedDocNo: string;
}

export interface PendingDeliveryChallanHeader {
  docPrefix: string;
  docNo: number;
  formattedDocNo: string;
  customer: string;
  status: string;
  dcDate?: string;
}

export interface PendingDeliveryChallansForInvoiceResponse {
  items: PendingDeliveryChallanHeader[];
  total: number;
}

export interface PendingInvoiceLineDto {
  dcPrefix?: string;
  dcDocNo?: number;
  dcFormattedDocNo?: string;
  dcLineSr?: number;
  productRetailCode?: string;
  itemDescription?: string;
  qty?: string | number;
  rate?: string | number;
  salesRate?: string | number;
  discPercent?: string | number;
  discValue?: string | number;
  taxType?: string;
  taxPercent?: string | number;
  amount?: string | number;
  dcDeliveredQty?: string | number;
  dcPendingQty?: string | number;
}

export interface PendingInvoiceLinesResponse {
  lines: PendingInvoiceLineDto[];
}

export async function fetchPendingDeliveryChallansForInvoice(
  customer: string,
): Promise<PendingDeliveryChallansForInvoiceResponse> {
  const q = encodeURIComponent(customer.trim());
  return apiFetch<PendingDeliveryChallansForInvoiceResponse>(
    `/api/delivery-challans/pending-for-invoice?customer=${q}`,
  );
}

export async function fetchPendingInvoiceLines(
  customer: string,
  deliveryChallans: DeliveryChallanReference[],
): Promise<PendingInvoiceLinesResponse> {
  return apiFetch<PendingInvoiceLinesResponse>('/api/delivery-challans/pending-invoice-lines', {
    method: 'POST',
    body: JSON.stringify({ customer: customer.trim(), deliveryChallans }),
  });
}
