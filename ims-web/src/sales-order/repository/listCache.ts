let listVersion = 0;
const listeners = new Set<() => void>();

export function invalidateSalesOrderList(): void {
  listVersion += 1;
  listeners.forEach((fn) => fn());
}

export function subscribeSalesOrderList(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSalesOrderListVersion(): number {
  return listVersion;
}
