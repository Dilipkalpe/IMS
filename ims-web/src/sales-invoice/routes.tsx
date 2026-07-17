import { lazy, Suspense, type ComponentType } from 'react';
import { PageLoadingFallback } from '../components/loading';

const LazySalesInvoiceList = lazy(() =>
  import('./SalesInvoiceListScreen').then((m) => ({ default: m.SalesInvoiceListScreen })),
);
const LazySalesInvoiceWorkspace = lazy(() =>
  import('./SalesInvoiceWorkspaceScreen').then((m) => ({ default: m.SalesInvoiceWorkspaceScreen })),
);

function listRoute(): ComponentType {
  function SalesInvoiceListRoute() {
    return (
      <Suspense fallback={<PageLoadingFallback title="Loading Sales Invoice list…" />}>
        <LazySalesInvoiceList />
      </Suspense>
    );
  }
  return SalesInvoiceListRoute;
}

function workspaceRoute(): ComponentType {
  function SalesInvoiceWorkspaceRoute() {
    return (
      <Suspense fallback={<PageLoadingFallback title="Loading Sales Invoice workspace…" />}>
        <LazySalesInvoiceWorkspace />
      </Suspense>
    );
  }
  return SalesInvoiceWorkspaceRoute;
}

export const SalesInvoiceListRouteScreen = listRoute();
export const SalesInvoiceWorkspaceRouteScreen = workspaceRoute();
