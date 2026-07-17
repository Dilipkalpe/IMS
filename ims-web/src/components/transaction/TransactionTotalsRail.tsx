import { memo } from 'react';

export interface TransactionDisplayTotals {
  totalTaxableDisplay: string;
  totalCgstDisplay: string;
  totalSgstDisplay: string;
  totalIgstDisplay: string;
  totalDiscountDisplay: string;
  invoiceTotalDisplay: string;
  paidAmountDisplay: string;
  balanceDueDisplay: string;
  roundOffDisplay: string;
}

export interface TransactionTotalsField {
  label: string;
  value: string;
  highlight?: boolean;
  paymentSection?: boolean;
  editable?: boolean;
}

export interface TransactionTotalsRailProps {
  title?: string;
  fields: TransactionTotalsField[];
  onFieldChange?: (label: string, value: string) => void;
  /** Sales Invoice: extra visual emphasis for totals + payment */
  highlighted?: boolean;
}

export function buildGstTotalsFields(
  displayTotals: TransactionDisplayTotals,
  options: {
    totalLabel: string;
    paidDisplay?: string;
    editablePaid?: boolean;
  },
): TransactionTotalsField[] {
  const paid = options.paidDisplay ?? displayTotals.paidAmountDisplay;
  return [
    { label: 'Total Taxable Value', value: displayTotals.totalTaxableDisplay },
    { label: 'Total CGST', value: displayTotals.totalCgstDisplay },
    { label: 'Total SGST', value: displayTotals.totalSgstDisplay },
    { label: 'Total IGST', value: displayTotals.totalIgstDisplay },
    { label: 'Total Discount', value: displayTotals.totalDiscountDisplay, highlight: true },
    {
      label: options.totalLabel,
      value: displayTotals.invoiceTotalDisplay,
      highlight: true,
      paymentSection: true,
    },
    { label: 'Paid', value: paid, editable: options.editablePaid },
    { label: 'Balance', value: displayTotals.balanceDueDisplay, highlight: true },
    { label: 'Round Off', value: displayTotals.roundOffDisplay },
  ];
}

function TransactionTotalsRailInner({
  title = 'Totals + Payment',
  fields,
  onFieldChange,
  highlighted = false,
}: TransactionTotalsRailProps) {
  return (
    <aside
      className={`si-totals-rail si-totals-rail--prominent${highlighted ? ' si-totals-rail--highlighted' : ''}`}
      aria-label="Totals and payment"
    >
      <h3 className="si-totals-rail__title">{title}</h3>
      {fields.map((field) => (
        <label
          key={field.label}
          className={`si-totals-field${field.highlight ? ' si-totals-field--key' : ''}${field.paymentSection ? ' si-totals-field--payment-start' : ''}`}
        >
          <span className={`si-totals-field__label${field.highlight ? ' si-totals-field__label--emphasis' : ''}`}>
            {field.label}
          </span>
          <input
            className={`wpf-sales-compact-input si-totals-field__input${field.highlight ? ' si-totals-field__input--highlight' : ''}${field.editable ? '' : ' si-readonly'}`}
            value={field.value}
            readOnly={!field.editable}
            tabIndex={field.editable ? 0 : -1}
            inputMode={field.editable ? 'decimal' : undefined}
            aria-label={field.label}
            onChange={
              field.editable && onFieldChange
                ? (e) => onFieldChange(field.label, e.target.value)
                : undefined
            }
          />
        </label>
      ))}
    </aside>
  );
}

export const TransactionTotalsRail = memo(TransactionTotalsRailInner);
