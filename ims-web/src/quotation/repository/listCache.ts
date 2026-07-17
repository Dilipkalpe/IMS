let listVersion = 0;
const listeners = new Set<() => void>();

export function invalidateQuotationList(): void {
  listVersion += 1;
  listeners.forEach((fn) => fn());
}

export function subscribeQuotationList(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getQuotationListVersion(): number {
  return listVersion;
}
