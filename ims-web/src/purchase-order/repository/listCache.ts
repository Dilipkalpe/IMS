let listVersion = 0;
const listeners = new Set<() => void>();

export function invalidatePurchaseOrderList(): void {
  listVersion += 1;
  listeners.forEach((fn) => fn());
}

export function subscribePurchaseOrderList(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPurchaseOrderListVersion(): number {
  return listVersion;
}
