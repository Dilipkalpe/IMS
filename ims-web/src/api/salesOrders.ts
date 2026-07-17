import { apiFetch } from './client';

import {
  appendTransactionListQueryParams,
  type TransactionListQueryBase,
} from '../components/transaction/transactionListQuery';



export interface SalesOrderReference {

  soPrefix: string;

  docNo: number;

  formattedDocNo: string;

}



export interface SalesOrderListSummary {

  id: string;

  soPrefix?: string;

  docNo?: number;

  formattedDocNo?: string;

  soDate?: string;

  billDate?: string;

  customer: string;

  status?: string;

  salesAmount?: number;

  paidAmount?: number;

  balance?: number;

}



export interface SalesOrderListResponse {

  items: SalesOrderListSummary[];

  total: number;

  page: number;

  limit: number;

}



export interface SalesOrderStatsResponse {

  total: number;

  draft: number;

  open: number;

  confirmed: number;

  picking?: number;

  toShip?: number;

  shipped?: number;

  closed?: number;

  cancelled?: number;

}



export interface SalesOrderNextNoResponse {

  soPrefix: string;

  docNo: number;

  formattedDocNo: string;

}



export interface PendingSalesOrderHeader {

  soPrefix: string;

  docNo: number;

  formattedDocNo: string;

  customer: string;

  status: string;

  soDate?: string;

}



export interface PendingSalesOrdersResponse {

  items: PendingSalesOrderHeader[];

  total: number;

}



export interface PendingDeliveryLineDto {

  soPrefix?: string;

  soDocNo?: number;

  soFormattedDocNo?: string;

  soLineSr?: number;

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

  soOrderedQty?: string | number;

  soPendingQty?: string | number;

}



export interface PendingDeliveryLinesResponse {

  lines: PendingDeliveryLineDto[];

}



const BASE = '/api/sales-orders';



export async function listSalesOrders(query: TransactionListQueryBase = {}): Promise<SalesOrderListResponse> {
  const params = new URLSearchParams();
  appendTransactionListQueryParams(params, query);
  const q = params.toString();
  return apiFetch<SalesOrderListResponse>(`${BASE}${q ? `?${q}` : ''}`);
}



export async function getSalesOrderStats(): Promise<SalesOrderStatsResponse> {

  return apiFetch<SalesOrderStatsResponse>(`${BASE}/stats`);

}



export async function getSalesOrderById(id: string): Promise<Record<string, unknown>> {

  return apiFetch<Record<string, unknown>>(`${BASE}/${encodeURIComponent(id)}`);

}



export async function getSalesOrderByFormatted(formatted: string): Promise<Record<string, unknown>> {

  return apiFetch<Record<string, unknown>>(`${BASE}/by-formatted/${encodeURIComponent(formatted)}`);

}



export async function peekSalesOrderNextNo(prefix = 'SO'): Promise<SalesOrderNextNoResponse> {

  const q = prefix ? `?prefix=${encodeURIComponent(prefix)}` : '';

  return apiFetch<SalesOrderNextNoResponse>(`${BASE}/next-no${q}`);

}



export async function createSalesOrder(payload: Record<string, unknown>): Promise<Record<string, unknown>> {

  return apiFetch<Record<string, unknown>>(BASE, {

    method: 'POST',

    body: JSON.stringify(payload),

  });

}



export async function updateSalesOrder(

  id: string,

  payload: Record<string, unknown>,

): Promise<Record<string, unknown>> {

  return apiFetch<Record<string, unknown>>(`${BASE}/${encodeURIComponent(id)}`, {

    method: 'PUT',

    body: JSON.stringify(payload),

  });

}



export async function deleteSalesOrder(id: string): Promise<void> {

  await apiFetch(`${BASE}/${encodeURIComponent(id)}`, { method: 'DELETE' });

}



export async function deleteSalesOrderByNo(docNo: number, prefix = 'SO'): Promise<void> {

  const q = prefix ? `?prefix=${encodeURIComponent(prefix)}` : '';

  await apiFetch(`${BASE}/by-no/${docNo}${q}`, { method: 'DELETE' });

}



export async function fetchPendingSalesOrdersForDelivery(

  customer: string,

): Promise<PendingSalesOrdersResponse> {

  const q = encodeURIComponent(customer.trim());

  return apiFetch<PendingSalesOrdersResponse>(`${BASE}/pending-for-delivery?customer=${q}`);

}



export async function fetchPendingDeliveryLines(

  customer: string,

  salesOrders: SalesOrderReference[],

): Promise<PendingDeliveryLinesResponse> {

  return apiFetch<PendingDeliveryLinesResponse>(`${BASE}/pending-delivery-lines`, {

    method: 'POST',

    body: JSON.stringify({ customer: customer.trim(), salesOrders }),

  });

}


