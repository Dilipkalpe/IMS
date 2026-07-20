import { apiFetch } from './client';

export interface MaterialStageEvent {
  stage?: string;
  at?: string;
  by?: string;
  qty?: number;
  godown?: string;
  note?: string;
}

export interface ProductionOrderRawLine {
  srNo: number;
  bomLineRef?: string;
  assignmentType?: string;
  stage?: string;
  stageEvents?: MaterialStageEvent[];
  itemId?: string;
  itemName?: string;
  unit?: string;
  reqQty: number;
  availableQty: number;
  rate: number;
  amount: number;
}

export interface ProductionOrderConsumableLine {
  srNo: number;
  bomLineRef?: string;
  assignmentType?: string;
  stage?: string;
  stageEvents?: MaterialStageEvent[];
  material?: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface ProductionOrderRecord {
  _id?: string;
  productionNo: number;
  productionDate?: string;
  manufacturingItemId?: string;
  manufacturingItemName?: string;
  bomProductCode?: string;
  bomRevision?: string;
  machineCode?: string;
  machineName?: string;
  operatorId?: string;
  operatorName?: string;
  startTimeText?: string;
  endTimeText?: string;
  totalDurationMinutes?: number;
  produceQty?: number;
  rejectedQty?: number;
  finalQty?: number;
  fromGodown?: string;
  rawMaterialAmount?: number;
  productionAmount?: number;
  status?: string;
  issueTransferEntryNo?: string;
  receiptTransferEntryNo?: string;
  rawMaterials?: ProductionOrderRawLine[];
  consumables?: ProductionOrderConsumableLine[];
}

export interface ProductionOrderStats {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  completedWeek: number;
}

export interface ProductionBomExpandResult {
  productCode?: string;
  revision?: string;
  standardQty?: number;
  multiplier?: number;
  rawMaterials: ProductionOrderRawLine[];
  consumables: ProductionOrderConsumableLine[];
  rawMaterialAmount: number;
  productionAmount: number;
}

export interface ProductionOrdersPagedResult {
  items: ProductionOrderRecord[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchProductionOrdersPage(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<ProductionOrdersPagedResult> {
  const q = new URLSearchParams();
  if (params?.page != null) q.set('page', String(params.page));
  if (params?.limit != null) q.set('limit', String(params.limit));
  if (params?.search?.trim()) q.set('search', params.search.trim());
  if (params?.status?.trim()) q.set('status', params.status.trim());
  const qs = q.toString();
  const result = await apiFetch<ProductionOrdersPagedResult>(
    `/api/production-orders${qs ? `?${qs}` : ''}`,
  );
  return {
    items: Array.isArray(result.items) ? result.items : [],
    total: Number(result.total) || 0,
    page: Number(result.page) || params?.page || 1,
    limit: Number(result.limit) || params?.limit || 200,
  };
}

export async function fetchProductionOrderStats(): Promise<ProductionOrderStats | null> {
  try {
    return await apiFetch<ProductionOrderStats>('/api/production-orders/stats');
  } catch {
    return null;
  }
}

export async function fetchNextProductionNo(): Promise<number | null> {
  try {
    const result = await apiFetch<{ productionNo: number }>('/api/production-orders/next-no');
    return result.productionNo ?? null;
  } catch {
    return null;
  }
}

export async function getProductionOrderByNo(productionNo: number): Promise<ProductionOrderRecord | null> {
  try {
    return await apiFetch<ProductionOrderRecord>(`/api/production-orders/by-no/${productionNo}`);
  } catch {
    return null;
  }
}

export async function expandProductionBom(
  productCode: string,
  produceQty: number,
): Promise<ProductionBomExpandResult | null> {
  try {
    return await apiFetch<ProductionBomExpandResult>('/api/production-orders/expand-bom', {
      method: 'POST',
      body: JSON.stringify({
        productCode: productCode.trim().toUpperCase(),
        produceQty,
      }),
    });
  } catch {
    return null;
  }
}

export async function createProductionOrder(
  order: ProductionOrderRecord,
): Promise<ProductionOrderRecord> {
  return apiFetch<ProductionOrderRecord>('/api/production-orders', {
    method: 'POST',
    body: JSON.stringify(order),
  });
}

export async function updateProductionOrder(
  productionNo: number,
  order: ProductionOrderRecord,
): Promise<ProductionOrderRecord> {
  return apiFetch<ProductionOrderRecord>(`/api/production-orders/by-no/${productionNo}`, {
    method: 'PUT',
    body: JSON.stringify(order),
  });
}

export async function deleteProductionOrderByNo(productionNo: number): Promise<void> {
  await apiFetch(`/api/production-orders/by-no/${productionNo}`, { method: 'DELETE' });
}
