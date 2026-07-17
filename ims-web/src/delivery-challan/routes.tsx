import { lazy, Suspense } from 'react';

const LazyDeliveryChallanList = lazy(() => import('./DeliveryChallanListScreen').then((m) => ({ default: m.DeliveryChallanListScreen })));
const LazyDeliveryChallanWorkspace = lazy(() =>
  import('./DeliveryChallanWorkspaceScreen').then((m) => ({ default: m.DeliveryChallanWorkspaceScreen })),
);

function listRoute() {
  return function DeliveryChallanListRoute() {
    return (
      <Suspense fallback={<div className="si-list-toolbar__status">Loading DCs…</div>}>
        <LazyDeliveryChallanList />
      </Suspense>
    );
  };
}

function workspaceRoute() {
  return function DeliveryChallanWorkspaceRoute() {
    return (
      <Suspense fallback={<div className="si-list-toolbar__status">Loading workspace…</div>}>
        <LazyDeliveryChallanWorkspace />
      </Suspense>
    );
  };
}

export const DeliveryChallanListRouteScreen = listRoute();
export const DeliveryChallanWorkspaceRouteScreen = workspaceRoute();
