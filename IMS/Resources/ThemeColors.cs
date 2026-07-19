using IMS.Services;

namespace IMS.Resources;

/// <summary>Active theme KPI accent colors (resolved from ThemeService).</summary>
public static class ThemeColors
{
    public static string Primary => ThemeService.Instance.Palette.Primary;
    public static string Secondary => ThemeService.Instance.Palette.Secondary;
    public static string Teal => ThemeService.Instance.Palette.Teal;
    public static string Slate => ThemeService.Instance.Palette.Slate;
    public static string Success => ThemeService.Instance.Palette.Success;
    public static string Warning => ThemeService.Instance.Palette.Warning;
    public static string Danger => ThemeService.Instance.Palette.Danger;
    public static string Purple => ThemeService.Instance.Palette.Purple;
    public static string Gold => ThemeService.Instance.Palette.Gold;
}
