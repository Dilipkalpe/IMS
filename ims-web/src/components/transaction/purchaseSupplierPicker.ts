/** Invalid placeholder labels for supplier dropdowns. */
export const INVALID_SUPPLIER_NAMES = ['— Select —', 'Select'] as const;

export const OFFLINE_SUPPLIER_NAMES_FALLBACK: readonly string[] = ['— Select —'];

function isInvalidSupplierLabel(name: string): boolean {
  const trimmed = name.trim();
  return INVALID_SUPPLIER_NAMES.some(
    (bad) => bad.localeCompare(trimmed, undefined, { sensitivity: 'accent' }) === 0,
  );
}

export function buildValidSupplierNameSet(names: readonly string[]): Set<string> {
  const valid = names.filter((n) => n.trim() && !isInvalidSupplierLabel(n));
  return new Set(valid);
}

export function isValidPurchaseSupplierName(supplier: string | undefined, validNames: Set<string>): boolean {
  const name = supplier?.trim() ?? '';
  if (!name) return false;
  for (const candidate of validNames) {
    if (candidate.localeCompare(name, undefined, { sensitivity: 'accent' }) === 0) {
      return true;
    }
  }
  return false;
}

export function getPurchaseSupplierFieldError(
  supplier: string | undefined,
  validNames: Set<string>,
): { field: 'supplier'; message: string } | null {
  const name = supplier?.trim() ?? '';
  if (!name) {
    return { field: 'supplier', message: 'Supplier Name is required before saving.' };
  }
  if (!isValidPurchaseSupplierName(name, validNames)) {
    return { field: 'supplier', message: 'Please select a valid supplier from the list.' };
  }
  return null;
}
