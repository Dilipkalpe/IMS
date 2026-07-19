/** Tracks last printed document snapshot per transaction module (desktop PrintPrevious parity). */
const registry = new Map<string, unknown>();

export function registerPrintPreviousSnapshot(moduleKey: string, snapshot: unknown): void {
  registry.set(moduleKey, snapshot);
}

export function getPrintPreviousSnapshot<T>(moduleKey: string): T | null {
  const value = registry.get(moduleKey);
  return value == null ? null : (value as T);
}

export function hasPrintPreviousSnapshot(moduleKey: string): boolean {
  return registry.has(moduleKey);
}
