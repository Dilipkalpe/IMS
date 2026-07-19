namespace IMS.ViewModels;

public sealed class DashboardQuickLinkItem
{
    public DashboardQuickLinkItem(
        string navKey,
        string title,
        string subtitle,
        string iconGlyph,
        string accentColor)
    {
        NavKey = navKey;
        Title = title;
        Subtitle = subtitle;
        IconGlyph = iconGlyph;
        AccentColor = accentColor;
    }

    public string NavKey { get; }
    public string Title { get; }
    public string Subtitle { get; }
    public string IconGlyph { get; }
    public string AccentColor { get; }
}
