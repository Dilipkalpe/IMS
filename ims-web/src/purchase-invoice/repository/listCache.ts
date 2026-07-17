let listVersion = 0;
const listeners = new Set<() => void>();

export function getPurchaseListVersion(): number {
  return listVersion;
}

export function invalidatePurchaseInvoiceList(): void {
  listVersion += 1;
  listeners.forEach((fn) => fn());
}

export function subscribePurchaseInvoiceList(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
