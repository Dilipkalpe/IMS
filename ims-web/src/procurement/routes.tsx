export { hubRouteScreens, getHubRouteScreen } from '../hub/routes';

import { NavKeys } from '../navigation/navKeys';
import { getHubRouteScreen } from '../hub/routes';

/** @deprecated Use getHubRouteScreen(NavKeys.Procurement) from hub/routes */
export const ProcurementHubRouteScreen = getHubRouteScreen(NavKeys.Procurement)!;
