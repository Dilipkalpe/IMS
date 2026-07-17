import { lazy, Suspense, type ComponentType } from 'react';
import { PageLoadingFallback } from '../components/loading';
import { PaymentVoucherEntryRouteScreen as LinkedPaymentEntryRouteScreen } from '../payment-voucher/routes';
import {
  BANK_ENTRY_CONFIG,
  CREDIT_NOTE_CONFIG,
  DEBIT_NOTE_CONFIG,
  PAYMENT_VOUCHER_CONFIG,
  RECEIPT_VOUCHER_CONFIG,
  type VoucherModuleConfig,
} from './voucherConfigs';

function lazyVoucherList(config: VoucherModuleConfig): ComponentType {
  const LazyList = lazy(() =>
    import('./VoucherListScreen').then((m) => ({
      default: () => <m.VoucherListScreen config={config} />,
    })),
  );
  function Route() {
    return (
      <Suspense fallback={<PageLoadingFallback />}>
        <LazyList />
      </Suspense>
    );
  }
  return Route;
}

function lazyVoucherEntry(config: VoucherModuleConfig): ComponentType {
  const LazyEntry = lazy(() =>
    import('./GenericVoucherEntryScreen').then((m) => ({
      default: () => <m.GenericVoucherEntryScreen config={config} />,
    })),
  );
  function Route() {
    return (
      <Suspense fallback={<PageLoadingFallback />}>
        <LazyEntry />
      </Suspense>
    );
  }
  return Route;
}

const LazyPettyCashList = lazy(() =>
  import('./PettyCashListScreen').then((m) => ({ default: m.PettyCashListScreen })),
);
const LazyPettyCashEntry = lazy(() =>
  import('./PettyCashEntryScreen').then((m) => ({ default: m.PettyCashEntryScreen })),
);

export const PaymentVoucherListRouteScreen = lazyVoucherList(PAYMENT_VOUCHER_CONFIG);
export const PaymentVoucherEntryRouteScreen = LinkedPaymentEntryRouteScreen;
export const ReceiptVoucherListRouteScreen = lazyVoucherList(RECEIPT_VOUCHER_CONFIG);
export const CreditNoteListRouteScreen = lazyVoucherList(CREDIT_NOTE_CONFIG);
export const CreditNoteEntryRouteScreen = lazyVoucherEntry(CREDIT_NOTE_CONFIG);
export const DebitNoteListRouteScreen = lazyVoucherList(DEBIT_NOTE_CONFIG);
export const DebitNoteEntryRouteScreen = lazyVoucherEntry(DEBIT_NOTE_CONFIG);
export const BankEntryListRouteScreen = lazyVoucherList(BANK_ENTRY_CONFIG);
export const BankEntryEntryRouteScreen = lazyVoucherEntry(BANK_ENTRY_CONFIG);

export function PettyCashListRouteScreen() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <LazyPettyCashList />
    </Suspense>
  );
}

export function PettyCashEntryRouteScreen() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <LazyPettyCashEntry />
    </Suspense>
  );
}
