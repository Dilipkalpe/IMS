import {
  collectGstFieldErrors,
  taxContextFromHeader,
} from '../../sales-invoice/calculations';
import { getSalesCustomerFieldError } from './salesCustomerPicker';

export interface SalesWorkspaceValidationInput {
  header: {
    customer: string;
    billNo: string;
    placeOfSupply?: string;
    sellerGstin?: string;
    customerGstin?: string;
  };
  lines: Array<{ id: string; qty: number; productRetailCode?: string; itemDescription?: string }>;
  validCustomerNames: Set<string>;
  billNoLabel: string;
}

export function validateSalesWorkspaceDocument(
  input: SalesWorkspaceValidationInput,
): Array<{ field: string; message: string }> {
  const next: Array<{ field: string; message: string }> = [];
  const customerError = getSalesCustomerFieldError(input.header.customer, input.validCustomerNames);
  if (customerError) next.push(customerError);
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
          sellerGstin: input.header.sellerGstin ?? '',
          customerGstin: input.header.customerGstin ?? '',
        }),
      ),
    );
  }

  return next;
}
