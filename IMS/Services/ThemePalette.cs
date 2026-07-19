using IMS.Models;

namespace IMS.Services;

public sealed class ThemePalette
{
    public required string Primary { get; init; }
    public required string Secondary { get; init; }
    public required string Teal { get; init; }
    public required string Slate { get; init; }
    public required string Success { get; init; }
    public required string Warning { get; init; }
    public required string Danger { get; init; }
    public required string Purple { get; init; }
    public required string Gold { get; init; }
}

public sealed class ThemeDefinition
{
    public required AppThemeId Id { get; init; }
    public required string DisplayName { get; init; }
    public required string BadgeText { get; init; }
    public required string Description { get; init; }
    public required string ResourceFile { get; init; }
    public required ThemePalette Palette { get; init; }
}
