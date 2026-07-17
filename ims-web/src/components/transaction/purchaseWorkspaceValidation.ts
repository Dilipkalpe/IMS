import {
  collectGstFieldErrors,
  taxContextFromHeader,
} from '../../sales-invoice/calculations';

export interface PurchaseWorkspaceValidationInput {
  header: {
    supplier: string;
    billNo: string;
    placeOfSupply?: string;
    companyGstin?: string;
    supplierGstin?: string;
  };
  lines: Array<{ id: string; qty: number; productRetailCode?: string; itemDescription?: string }>;
  billNoLabel: string;
}

export function validatePurchaseWorkspaceDocument(
  input: PurchaseWorkspaceValidationInput,
): Array<{ field: string; message: string }> {
  const next: Array<{ field: string; message: string }> = [];
  if (!input.header.supplier?.trim()) {
    next.push({ field: 'supplier', message: 'Supplier is required.' });
  }
  if (!input.header.billNo?.trim()) {
    next.push({ field: 'billNo', message: `${input.billNoLabel} is required.` });
  }
  const touchedLines = input.lines.filter(
    (line) =>
      line.qty > 0 ||
      Boolean(line.productRetailCode?.trim()) ||
      Boolean(line.itemDescription?.trim()),
  );
  if (!touchedLines.some((line) => line.qty > 0)) {
    next.push({
      field: 'lines',
      message: 'Add at least one line item.',
    });
  }
  touchedLines.forEach((line, index) => {
    if (line.qty <= 0) {
      next.push({
        field: `qty-${line.id}`,
        message: `Line ${index + 1}: Qty must be greater than zero.`,
      });
    }
  });

  if (input.header.placeOfSupply !== undefined) {
    next.push(
      ...collectGstFieldErrors(
        taxContextFromHeader({
          placeOfSupply: input.header.placeOfSupply,
          sellerGstin: input.header.companyGstin ?? '',
          customerGstin: input.header.supplierGstin ?? '',
        }),
      ),
    );
  }

  return next;
}
