let listVersion = 0;
const listeners = new Set<() => void>();

export function invalidateDeliveryChallanList(): void {
  listVersion += 1;
  listeners.forEach((fn) => fn());
}

export function subscribeDeliveryChallanList(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDeliveryChallanListVersion(): number {
  return listVersion;
}
