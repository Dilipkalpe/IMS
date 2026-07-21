import type { ComponentType } from 'react';
import { NavKeys } from '../navigation/navKeys';
import { SalesHubScreen } from '../sales/SalesHubScreen';
import { HUB_DEFINITIONS } from './hubRegistry';
import { HubScreen } from './HubScreen';
import './hub.scss';

/** Dedicated hub shells — lazy-loaded list panels and shared hub tab state via HubContext. */
const CUSTOM_HUB_SCREENS: Partial<Record<string, ComponentType>> = {
  [NavKeys.Sales]: SalesHubScreen,
};

function createHubRouteScreen(hubNavKey: string): ComponentType {
  const custom = CUSTOM_HUB_SCREENS[hubNavKey];
  if (custom) return custom;
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
