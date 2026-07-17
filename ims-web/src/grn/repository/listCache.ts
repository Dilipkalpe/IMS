let listVersion = 0;
const listeners = new Set<() => void>();

export function invalidateGrnList(): void {
  listVersion += 1;
  listeners.forEach((fn) => fn());
}

export function subscribeGrnList(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getGrnListVersion(): number {
  return listVersion;
}
