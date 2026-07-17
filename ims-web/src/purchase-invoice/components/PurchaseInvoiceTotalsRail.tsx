import { memo } from 'react';
import {
  buildGstTotalsFields,
  TransactionTotalsRail,
  type TransactionDisplayTotals,
} from '../../components/transaction/TransactionTotalsRail';

export interface PurchaseInvoiceTotalsRailProps {
  displayTotals: TransactionDisplayTotals;
}

function PurchaseInvoiceTotalsRailInner({ displayTotals }: PurchaseInvoiceTotalsRailProps) {
  return (
    <TransactionTotalsRail
      highlighted
      fields={buildGstTotalsFields(displayTotals, { totalLabel: 'Invoice Total' })}
    />
  );
}

export const PurchaseInvoiceTotalsRail = memo(PurchaseInvoiceTotalsRailInner);
