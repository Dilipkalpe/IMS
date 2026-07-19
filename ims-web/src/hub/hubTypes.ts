export interface HubTab {
  key: string;
  title: string;
  iconGlyph: string;
  description: string;
}

export interface HubDefinition {
  hubNavKey: string;
  sectionName: string;
  sidebarTitle: string;
  sidebarIconGlyph: string;
  sidebarDescription: string;
  defaultTabKey: string;
  tabs: HubTab[];
  wpfSource: string;
}
