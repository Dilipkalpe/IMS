export { hubRouteScreens, getHubRouteScreen } from '../hub/routes';

import { NavKeys } from '../navigation/navKeys';
import { getHubRouteScreen } from '../hub/routes';

/** @deprecated Use getHubRouteScreen(NavKeys.Sales) from hub/routes */
export const SalesHubRouteScreen = getHubRouteScreen(NavKeys.Sales)!;
