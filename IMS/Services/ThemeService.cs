using System.Windows;
using IMS.Models;

namespace IMS.Services;

public sealed class ThemeService
{
    private static readonly Lazy<ThemeService> Lazy = new(() => new ThemeService());
    public static ThemeService Instance => Lazy.Value;

    private ResourceDictionary? _activeThemeDictionary;

    public static IReadOnlyList<ThemeDefinition> AllThemes { get; } =
    [
        new()
        {
            Id = AppThemeId.Corporate,
            DisplayName = "Corporate Navy",
            BadgeText = "CORPORATE",
            Description = "Classic navy sidebar with professional blue accents.",
            ResourceFile = "Themes/CorporateTheme.xaml",
            Palette = new ThemePalette
            {
                Primary = "#006B9E",
                Secondary = "#0C2340",
                Teal = "#00857A",
                Slate = "#5A6B7D",
                Success = "#0D7A55",
                Warning = "#B8860B",
                Danger = "#B42318",
                Purple = "#5B4B8A",
                Gold = "#9A7B4F"
            }
        },
        new()
        {
            Id = AppThemeId.MidnightIndigo,
            DisplayName = "Midnight Indigo",
            BadgeText = "MIDNIGHT INDIGO",
            Description = "Deep violet navigation with indigo highlights and cool lavender surfaces.",
            ResourceFile = "Themes/MidnightIndigoTheme.xaml",
            Palette = new ThemePalette
            {
                Primary = "#6366F1",
                Secondary = "#1E1B4B",
                Teal = "#14B8A6",
                Slate = "#64748B",
                Success = "#059669",
                Warning = "#D97706",
                Danger = "#DC2626",
                Purple = "#A855F7",
                Gold = "#F59E0B"
            }
        },
        new()
        {
            Id = AppThemeId.EmeraldForest,
            DisplayName = "Emerald Forest",
            BadgeText = "EMERALD FOREST",
            Description = "Forest-green sidebar with emerald accents and mint-tinted content areas.",
            ResourceFile = "Themes/EmeraldForestTheme.xaml",
            Palette = new ThemePalette
            {
                Primary = "#10B981",
                Secondary = "#14532D",
                Teal = "#0D9488",
                Slate = "#6B7280",
                Success = "#047857",
                Warning = "#CA8A04",
                Danger = "#DC2626",
                Purple = "#7C3AED",
                Gold = "#A16207"
            }
        },
        new()
        {
            Id = AppThemeId.BlueWhiteBlack,
            DisplayName = "Blue, White & Black",
            BadgeText = "BLUE WHITE",
            Description = "Black navigation bar, clean white workspaces, and bold blue accents throughout.",
            ResourceFile = "Themes/BlueWhiteBlackTheme.xaml",
            Palette = new ThemePalette
            {
                Primary = "#2563EB",
                Secondary = "#111827",
                Teal = "#0EA5E9",
                Slate = "#6B7280",
                Success = "#16A34A",
                Warning = "#CA8A04",
                Danger = "#DC2626",
                Purple = "#4F46E5",
                Gold = "#78716C"
            }
        }
    ];

    private ThemeService()
    {
        Current = AllThemes.First(t => t.Id == AppThemeId.Corporate);
    }

    public ThemeDefinition Current { get; private set; }

    public ThemePalette Palette => Current.Palette;

    public event EventHandler? ThemeChanged;

    public static void Initialize()
    {
        var saved = Instance.LoadSavedThemeId();
        Instance.ApplyTheme(saved, persist: false);
    }

    public void ApplyTheme(AppThemeId themeId, bool persist = true)
    {
        var definition = AllThemes.FirstOrDefault(t => t.Id == themeId)
                         ?? AllThemes.First(t => t.Id == AppThemeId.Corporate);

        if (definition.Id == Current.Id && _activeThemeDictionary is not null)
            return;

        var appResources = GetAppResourcesDictionary();
        var newTheme = new ResourceDictionary
        {
            Source = new Uri($"pack://application:,,,/Resources/{definition.ResourceFile}", UriKind.Absolute)
        };

        if (_activeThemeDictionary is not null)
            appResources.MergedDictionaries.Remove(_activeThemeDictionary);

        appResources.MergedDictionaries.Insert(0, newTheme);
        _activeThemeDictionary = newTheme;
        Current = definition;

        if (persist)
            SaveThemeId(definition.Id);

        ThemeChanged?.Invoke(this, EventArgs.Empty);
    }

    private AppThemeId LoadSavedThemeId()
    {
        var settings = SettingsStore.Load();
        if (Enum.TryParse<AppThemeId>(settings.ThemeId, ignoreCase: true, out var id))
            return id;
        return AppThemeId.Corporate;
    }

    private void SaveThemeId(AppThemeId themeId) =>
        SettingsStore.Update(s => s.ThemeId = themeId.ToString());

    private static ResourceDictionary GetAppResourcesDictionary()
    {
        if (Application.Current?.Resources.MergedDictionaries.FirstOrDefault() is ResourceDictionary appResources)
            return appResources;

        throw new InvalidOperationException("Application resources are not initialized.");
    }
}
