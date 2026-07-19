namespace IMS.Models;

public sealed record HubTabDefinition(
    string Key,
    string Title,
    string IconGlyph,
    string Description);

public sealed record HubDefinition(
    string HubNavKey,
    string SectionName,
    string SidebarTitle,
    string SidebarIconGlyph,
    string SidebarDescription,
    string DefaultTabKey,
    IReadOnlyList<HubTabDefinition> Tabs);
