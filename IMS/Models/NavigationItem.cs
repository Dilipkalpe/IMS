using IMS.ViewModels;

namespace IMS.Models;

public sealed class NavigationItem : ViewModelBase
{
    private bool _isPinned;

    public required string Key { get; init; }
    public required string Title { get; init; }
    public required string IconGlyph { get; init; }
    public required string Section { get; init; }
    public string Description { get; init; } = string.Empty;
    public required Func<MainViewModel, object> CreateViewModel { get; init; }

    public bool IsPinned
    {
        get => _isPinned;
        set => SetProperty(ref _isPinned, value);
    }
}
