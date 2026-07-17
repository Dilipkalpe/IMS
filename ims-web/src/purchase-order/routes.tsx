import { lazy, Suspense } from 'react';

const LazyPurchaseOrderList = lazy(() =>
  import('./PurchaseOrderListScreen').then((m) => ({ default: m.PurchaseOrderListScreen })),
);
const LazyPurchaseOrderWorkspace = lazy(() =>
  import('./PurchaseOrderWorkspaceScreen').then((m) => ({ default: m.PurchaseOrderWorkspaceScreen })),
);

function listRoute() {
  return function PurchaseOrderListRoute() {
    return (
      <Suspense fallback={<div className="si-list-toolbar__status">Loading purchase orders…</div>}>
        <LazyPurchaseOrderList />
      </Suspense>
    );
  };
}

function workspaceRoute() {
  return function PurchaseOrderWorkspaceRoute() {
    return (
      <Suspense fallback={<div className="si-list-toolbar__status">Loading workspace…</div>}>
        <LazyPurchaseOrderWorkspace />
      </Suspense>
    );
  };
}

export const PurchaseOrderListRouteScreen = listRoute();
export const PurchaseOrderWorkspaceRouteScreen = workspaceRoute();
