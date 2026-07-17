let listVersion = 0;
const listeners = new Set<() => void>();

export function invalidatePurchaseReturnList(): void {
  listVersion += 1;
  listeners.forEach((fn) => fn());
}

export function subscribePurchaseReturnList(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPurchaseReturnListVersion(): number {
  return listVersion;
}
