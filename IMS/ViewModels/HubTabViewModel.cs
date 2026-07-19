namespace IMS.ViewModels;

public sealed class HubTabViewModel : ViewModelBase
{
    private bool _isSelected;

    public HubTabViewModel(string key, string title, string iconGlyph, string description)
    {
        Key = key;
        Title = title;
        IconGlyph = iconGlyph;
        Description = description;
    }

    public string Key { get; }
    public string Title { get; }
    public string IconGlyph { get; }
    public string Description { get; }

    public bool IsSelected
    {
        get => _isSelected;
        set => SetProperty(ref _isSelected, value);
    }
}
