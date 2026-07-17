/** WPF InvalidCustomerNames — not allowed for save (SalesDocumentEntryViewModelBase). */
export const INVALID_SALES_CUSTOMER_NAMES = ['Walk In', '— Select —', 'Select'] as const;

/** WPF fallback when API names call fails. */
export const OFFLINE_CUSTOMER_NAMES_FALLBACK: readonly string[] = ['— Select —', 'Walk In'];

export const DEFAULT_NEW_DOCUMENT_CUSTOMER = '— Select —';

function isInvalidCustomerLabel(name: string): boolean {
  const trimmed = name.trim();
  return INVALID_SALES_CUSTOMER_NAMES.some(
    (bad) => bad.localeCompare(trimmed, undefined, { sensitivity: 'accent' }) === 0,
  );
}

/** Names that pass WPF HasValidCustomer() — case-insensitive match. */
export function buildValidCustomerNameSet(names: readonly string[]): Set<string> {
  const valid = names.filter((n) => n.trim() && !isInvalidCustomerLabel(n));
  return new Set(valid);
}

export function isValidSalesCustomerName(customer: string | undefined, validNames: Set<string>): boolean {
  const name = customer?.trim() ?? '';
  if (!name) return false;
  for (const candidate of validNames) {
    if (candidate.localeCompare(name, undefined, { sensitivity: 'accent' }) === 0) {
      return true;
    }
  }
  return false;
}

/** WPF validation messages for save. */
export function getSalesCustomerFieldError(
  customer: string | undefined,
  validNames: Set<string>,
): { field: 'customer'; message: string } | null {
  const name = customer?.trim() ?? '';
  if (!name) {
    return { field: 'customer', message: 'Customer Name is required before saving.' };
  }
  if (!isValidSalesCustomerName(name, validNames)) {
    return { field: 'customer', message: 'Please select a valid customer from the list.' };
  }
  return null;
}
