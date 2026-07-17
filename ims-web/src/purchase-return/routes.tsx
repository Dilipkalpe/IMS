import { lazy, Suspense } from 'react';

const LazyPurchaseReturnList = lazy(() =>
  import('./PurchaseReturnListScreen').then((m) => ({ default: m.PurchaseReturnListScreen })),
);
const LazyPurchaseReturnWorkspace = lazy(() =>
  import('./PurchaseReturnWorkspaceScreen').then((m) => ({ default: m.PurchaseReturnWorkspaceScreen })),
);

function listRoute() {
  return function PurchaseReturnListRoute() {
    return (
      <Suspense fallback={<div className="si-list-toolbar__status">Loading purchase returns…</div>}>
        <LazyPurchaseReturnList />
      </Suspense>
    );
  };
}

function workspaceRoute() {
  return function PurchaseReturnWorkspaceRoute() {
    return (
      <Suspense fallback={<div className="si-list-toolbar__status">Loading workspace…</div>}>
        <LazyPurchaseReturnWorkspace />
      </Suspense>
    );
  };
}

export const PurchaseReturnListRouteScreen = listRoute();
export const PurchaseReturnWorkspaceRouteScreen = workspaceRoute();
