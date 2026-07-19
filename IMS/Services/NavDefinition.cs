using IMS.Models;
using IMS.ViewModels;

namespace IMS.Services;

internal sealed record NavDefinition(
    string Key,
    string Title,
    string Section,
    string IconGlyph,
    string Description,
    string Col1,
    string Col2,
    string Col3,
    string Col4,
    IReadOnlyList<MockStat>? Stats = null,
    IReadOnlyList<MockRow>? SeedRows = null);
