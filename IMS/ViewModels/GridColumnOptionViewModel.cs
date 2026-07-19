namespace IMS.ViewModels;

public sealed class GridColumnModuleChoice
{
    public GridColumnModuleChoice(string key, string title)
    {
        Key = key;
        Title = title;
    }

    public string Key { get; }
    public string Title { get; }
}

public sealed class GridColumnOptionViewModel : ViewModelBase
{
    private bool _isVisible;
    private readonly Action<GridColumnOptionViewModel>? _onVisibilityChanged;

    public GridColumnOptionViewModel(
        string key,
        string header,
        bool isMandatory,
        bool isVisible,
        Action<GridColumnOptionViewModel>? onVisibilityChanged = null)
    {
        Key = key;
        Header = header;
        IsMandatory = isMandatory;
        _isVisible = isVisible;
        _onVisibilityChanged = onVisibilityChanged;
    }

    public string Key { get; }

    public string Header { get; }

    public bool IsMandatory { get; }

    public bool IsVisible
    {
        get => _isVisible;
        set
        {
            if (IsMandatory && !value)
                return;

            if (!SetProperty(ref _isVisible, value))
                return;

            _onVisibilityChanged?.Invoke(this);
        }
    }
}
