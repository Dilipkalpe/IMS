import { useMemo } from 'react';
import type { InvoicePaymentLink } from '../../types/invoicePaymentLink';
import './invoice-payment-history.scss';

function formatMoney(value: number): string {
  return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value?: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-IN');
}

function voucherLabel(link: InvoicePaymentLink): string {
  const type = (link.voucherType || 'payment').toLowerCase();
  const prefix = type.includes('receipt') ? 'RV' : 'PV';
  return `${prefix}-${link.voucherNo}`;
}

export interface InvoicePaymentHistoryPanelProps {
  billAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentLinks: InvoicePaymentLink[];
  voucherKind: 'receipt' | 'payment';
  onOpenVoucher?: (voucherNo: number, voucherType: string) => void;
}

export function InvoicePaymentHistoryPanel({
  billAmount,
  paidAmount,
  balanceDue,
  paymentLinks,
  voucherKind,
  onOpenVoucher,
}: InvoicePaymentHistoryPanelProps) {
  const rows = useMemo(() => {
    let runningPaid = 0;
    return paymentLinks.map((link) => {
      runningPaid += link.amount;
      return {
        ...link,
        runningBalance: Math.max(0, billAmount - runningPaid),
      };
    });
  }, [billAmount, paymentLinks]);

  if (paymentLinks.length === 0 && paidAmount <= 0) {
    return (
      <section className="pay-history" aria-label="Payment history">
        <div className="pay-history__title">Payment history</div>
        <p className="pay-history__empty">No payments recorded yet.</p>
      </section>
    );
  }

  return (
    <section className="pay-history" aria-label="Payment history">
      <div className="pay-history__title">Payment history</div>
      <div className="pay-history__totals">
        <span>Invoice total: {formatMoney(billAmount)}</span>
        <span>Total paid: {formatMoney(paidAmount)}</span>
        <span>Outstanding: {formatMoney(balanceDue)}</span>
      </div>
      <table className="pay-history__table">
        <thead>
          <tr>
            <th>Voucher</th>
            <th>Date</th>
            <th className="pay-history__num">Allocated</th>
            <th className="pay-history__num">Running balance</th>
            <th>Method</th>
            <th>Reference</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.voucherNo}-${index}`}>
              <td>
                {onOpenVoucher ? (
                  <button
                    type="button"
                    className="pay-history__link"
                    onClick={() => onOpenVoucher(row.voucherNo, row.voucherType || voucherKind)}
                  >
                    {voucherLabel(row)}
                  </button>
                ) : (
                  voucherLabel(row)
                )}
              </td>
              <td>{formatDate(row.voucherDate)}</td>
              <td className="pay-history__num">{formatMoney(row.amount)}</td>
              <td className="pay-history__num">{formatMoney(row.runningBalance)}</td>
              <td>{row.cashBank || '—'}</td>
              <td>{row.refNo || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
