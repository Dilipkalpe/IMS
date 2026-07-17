import { lazy, Suspense } from 'react';

const LazyQuotationList = lazy(() =>
  import('./QuotationListScreen').then((m) => ({ default: m.QuotationListScreen })),
);
const LazyQuotationWorkspace = lazy(() =>
  import('./QuotationWorkspaceScreen').then((m) => ({ default: m.QuotationWorkspaceScreen })),
);

function listRoute() {
  return function QuotationListRoute() {
    return (
      <Suspense fallback={<div className="si-list-toolbar__status">Loading quotations…</div>}>
        <LazyQuotationList />
      </Suspense>
    );
  };
}

function workspaceRoute() {
  return function QuotationWorkspaceRoute() {
    return (
      <Suspense fallback={<div className="si-list-toolbar__status">Loading workspace…</div>}>
        <LazyQuotationWorkspace />
      </Suspense>
    );
  };
}

export const QuotationListRouteScreen = listRoute();
export const QuotationWorkspaceRouteScreen = workspaceRoute();
