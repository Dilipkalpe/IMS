/** List invalidation — bump after save/delete so list screens refetch. */
let listVersion = 0;
const listeners = new Set<() => void>();

export function getListVersion(): number {
  return listVersion;
}

export function invalidateSalesInvoiceList(): void {
  listVersion += 1;
  listeners.forEach((fn) => fn());
}

export function subscribeSalesInvoiceList(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
