import type { NavigationCatalogItem } from './navigationRouteMap';
import { NavKeys } from './navKeys';
import { HUB_DEFINITIONS } from '../hub/hubRegistry';

/** Sidebar catalog — one entry per section (hub landing pages). Overview stays a single item. */
export const navigationCatalog: NavigationCatalogItem[] = [
  {
    key: NavKeys.Dashboard,
    title: 'Overview',
    section: 'Overview',
    iconGlyph: '\uE80F',
    description: 'KPIs, charts, and operational snapshot across your organization.',
  },
  ...HUB_DEFINITIONS.map((hub) => ({
    key: hub.hubNavKey,
    title: hub.sidebarTitle,
    section: hub.sectionName,
    iconGlyph: hub.sidebarIconGlyph,
    description: hub.sidebarDescription,
  })),
];

/** Hub tab modules — searchable but not shown as sidebar submenu items. */
export const hubModuleSearchItems: NavigationCatalogItem[] = HUB_DEFINITIONS.flatMap((hub) =>
  hub.tabs.map((tab) => ({
    key: tab.key,
    title: tab.title,
    section: hub.sectionName,
    iconGlyph: tab.iconGlyph,
    description: tab.description,
  })),
);

/** Sidebar catalog + hidden hub module tabs for menu search. */
export const searchableNavigationCatalog: NavigationCatalogItem[] = [
  ...navigationCatalog,
  ...hubModuleSearchItems,
];

/** WPF NavigationCatalog section order */
const SECTION_ORDER = [
  'Overview',
  'Sales',
  'Procurement',
  'Manufacturing',
  'Payroll & HR',
  'Inventory',
  'Finance',
  'Insights',
  'AR & AP',
  'Inventory Insights',
  'Financial Reports',
  'Transaction Reports',
  'Master Data',
  'User Administration',
  'Platform',
  'Bulk Import',
] as const;

export function buildNavigationSections(): Array<{
  name: string;
  isExpanded: boolean;
  items: NavigationCatalogItem[];
}> {
  const bySection = new Map<string, NavigationCatalogItem[]>();
  for (const item of navigationCatalog) {
    if (!bySection.has(item.section)) bySection.set(item.section, []);
    bySection.get(item.section)!.push(item);
  }
  return SECTION_ORDER.filter((name) => bySection.has(name)).map((name) => ({
    name,
    isExpanded: true,
    items: bySection.get(name)!,
  }));
}
