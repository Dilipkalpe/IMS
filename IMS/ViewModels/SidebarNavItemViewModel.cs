namespace IMS.ViewModels;

public sealed class SidebarNavItemViewModel
{
    public required string Key { get; init; }
    public required string Title { get; init; }
    public required string IconGlyph { get; init; }
    public string Description { get; init; } = string.Empty;
    public bool IsHub { get; init; }
}
