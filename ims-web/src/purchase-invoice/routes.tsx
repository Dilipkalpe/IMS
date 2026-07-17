import { lazy, Suspense, type ComponentType } from 'react';
import { PageLoadingFallback } from '../components/loading';

const LazyPurchaseInvoiceList = lazy(() =>
  import('./PurchaseInvoiceListScreen').then((m) => ({ default: m.PurchaseInvoiceListScreen })),
);
const LazyPurchaseInvoiceWorkspace = lazy(() =>
  import('./PurchaseInvoiceWorkspaceScreen').then((m) => ({ default: m.PurchaseInvoiceWorkspaceScreen })),
);

function listRoute(): ComponentType {
  return function PurchaseInvoiceListRoute() {
    return (
      <Suspense fallback={<PageLoadingFallback title="Loading Purchase Invoice list…" />}>
        <LazyPurchaseInvoiceList />
      </Suspense>
    );
  };
}

function workspaceRoute(): ComponentType {
  return function PurchaseInvoiceWorkspaceRoute() {
    return (
      <Suspense fallback={<PageLoadingFallback title="Loading Purchase Invoice workspace…" />}>
        <LazyPurchaseInvoiceWorkspace />
      </Suspense>
    );
  };
}

export const PurchaseInvoiceListRouteScreen = listRoute();
export const PurchaseInvoiceWorkspaceRouteScreen = workspaceRoute();
