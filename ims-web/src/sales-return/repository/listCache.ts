let listVersion = 0;
const listeners = new Set<() => void>();

export function invalidateSalesReturnList(): void {
  listVersion += 1;
  listeners.forEach((fn) => fn());
}

export function subscribeSalesReturnList(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSalesReturnListVersion(): number {
  return listVersion;
}
