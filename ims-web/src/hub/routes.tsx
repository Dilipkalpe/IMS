import type { ComponentType } from 'react';
import { HUB_DEFINITIONS } from './hubRegistry';
import { HubScreen } from './HubScreen';
import './hub.scss';

function createHubRouteScreen(hubNavKey: string): ComponentType {
  return function HubRouteScreen() {
    return <HubScreen hubNavKey={hubNavKey} />;
  };
}

/** Route screen components keyed by hub nav key. */
export const hubRouteScreens: Record<string, ComponentType> = Object.fromEntries(
  HUB_DEFINITIONS.map((hub) => [hub.hubNavKey, createHubRouteScreen(hub.hubNavKey)]),
);

export function getHubRouteScreen(hubNavKey: string): ComponentType | undefined {
  return hubRouteScreens[hubNavKey];
}
