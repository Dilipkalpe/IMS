import { memo } from 'react';
import {
  buildGstTotalsFields,
  TransactionTotalsRail,
  type TransactionDisplayTotals,
} from '../../components/transaction/TransactionTotalsRail';

export interface SalesInvoiceTotalsRailProps {
  displayTotals: TransactionDisplayTotals;
  isPartialPayment?: boolean;
  partialPaidAmount?: number;
  onPartialPaidChange?: (value: string) => void;
}

function SalesInvoiceTotalsRailInner({
  displayTotals,
  isPartialPayment = false,
  partialPaidAmount = 0,
  onPartialPaidChange,
}: SalesInvoiceTotalsRailProps) {
  const paidValue = isPartialPayment ? String(partialPaidAmount) : displayTotals.paidAmountDisplay;
  const fields = buildGstTotalsFields(displayTotals, {
    totalLabel: 'Invoice Total',
    paidDisplay: paidValue,
    editablePaid: isPartialPayment,
  });

  return (
    <TransactionTotalsRail
      highlighted
      fields={fields}
      onFieldChange={onPartialPaidChange ? (_label, value) => onPartialPaidChange(value) : undefined}
    />
  );
}

export const SalesInvoiceTotalsRail = memo(SalesInvoiceTotalsRailInner);
