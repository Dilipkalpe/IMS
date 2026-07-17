import { lazy, Suspense } from 'react';

const LazySalesOrderList = lazy(() =>
  import('./SalesOrderListScreen').then((m) => ({ default: m.SalesOrderListScreen })),
);
const LazySalesOrderWorkspace = lazy(() =>
  import('./SalesOrderWorkspaceScreen').then((m) => ({ default: m.SalesOrderWorkspaceScreen })),
);

function listRoute() {
  return function SalesOrderListRoute() {
    return (
      <Suspense fallback={<div className="si-list-toolbar__status">Loading sales orders…</div>}>
        <LazySalesOrderList />
      </Suspense>
    );
  };
}

function workspaceRoute() {
  return function SalesOrderWorkspaceRoute() {
    return (
      <Suspense fallback={<div className="si-list-toolbar__status">Loading workspace…</div>}>
        <LazySalesOrderWorkspace />
      </Suspense>
    );
  };
}

export const SalesOrderListRouteScreen = listRoute();
export const SalesOrderWorkspaceRouteScreen = workspaceRoute();
