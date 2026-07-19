using IMS.Reporting.Models;
using IMS.ViewModels;

namespace IMS.Reporting.Designer.ViewModels;

public sealed class DesignElementViewModel : ViewModelBase
{
    public event Action? Changed;
    private bool _suppressNotify;

    public DesignElementViewModel(ReportElementDefinition model)
    {
        Model = model;
        SyncFromModel();
    }

    public ReportElementDefinition Model { get; }

    public string Id => Model.Id;
    public string Type => Model.Type;
    public string Name => Model.Name;

    public bool IsTable => string.Equals(Type, "table", StringComparison.OrdinalIgnoreCase);

    public bool SupportsFieldColors =>
        Type is "text" or "dynamicText" or "companyLogo" or "rectangle";

    private double _xMm;
    public double XMm
    {
        get => _xMm;
        set { if (SetProperty(ref _xMm, value)) NotifyChanged(); }
    }

    private double _yMm;
    public double YMm
    {
        get => _yMm;
        set { if (SetProperty(ref _yMm, value)) NotifyChanged(); }
    }

    private double _widthMm;
    public double WidthMm
    {
        get => _widthMm;
        set { if (SetProperty(ref _widthMm, value)) NotifyChanged(); }
    }

    private double _heightMm;
    public double HeightMm
    {
        get => _heightMm;
        set { if (SetProperty(ref _heightMm, value)) NotifyChanged(); }
    }

    private string _textColor = string.Empty;
    public string TextColor
    {
        get => _textColor;
        set { if (SetProperty(ref _textColor, value)) NotifyChanged(); }
    }

    private string _backgroundColor = string.Empty;
    public string BackgroundColor
    {
        get => _backgroundColor;
        set { if (SetProperty(ref _backgroundColor, value)) NotifyChanged(); }
    }

    private string _headerBackgroundColor = string.Empty;
    public string HeaderBackgroundColor
    {
        get => _headerBackgroundColor;
        set { if (SetProperty(ref _headerBackgroundColor, value)) NotifyChanged(); }
    }

    private string _headerTextColor = string.Empty;
    public string HeaderTextColor
    {
        get => _headerTextColor;
        set { if (SetProperty(ref _headerTextColor, value)) NotifyChanged(); }
    }

    private double? _fontSizePt;
    public double? FontSizePt
    {
        get => _fontSizePt;
        set { if (SetProperty(ref _fontSizePt, value)) NotifyChanged(); }
    }

    private string _textAlign = "left";
    public string TextAlign
    {
        get => _textAlign;
        set { if (SetProperty(ref _textAlign, value)) NotifyChanged(); }
    }

    private bool _isSelected;
    public bool IsSelected
    {
        get => _isSelected;
        set => SetProperty(ref _isSelected, value);
    }

    public void SyncFromModel()
    {
        _suppressNotify = true;
        try
        {
            _xMm = Model.XMm;
            _yMm = Model.YMm;
            _widthMm = Model.WidthMm;
            _heightMm = Model.HeightMm;
            _textColor = Model.Style.Foreground ?? string.Empty;
            _backgroundColor = Model.Style.Background ?? string.Empty;
            _fontSizePt = Model.Style.FontSizePt;
            _textAlign = string.IsNullOrWhiteSpace(Model.Style.TextAlign) ? "left" : Model.Style.TextAlign;
            if (IsTable && Model.Table is not null)
            {
                _headerBackgroundColor = Model.Table.HeaderBackground ?? string.Empty;
                _headerTextColor = Model.Table.HeaderForeground ?? string.Empty;
            }
            else
            {
                _headerBackgroundColor = string.Empty;
                _headerTextColor = string.Empty;
            }

            OnPropertyChanged(nameof(XMm));
            OnPropertyChanged(nameof(YMm));
            OnPropertyChanged(nameof(WidthMm));
            OnPropertyChanged(nameof(HeightMm));
            OnPropertyChanged(nameof(TextColor));
            OnPropertyChanged(nameof(BackgroundColor));
            OnPropertyChanged(nameof(FontSizePt));
            OnPropertyChanged(nameof(TextAlign));
            OnPropertyChanged(nameof(HeaderBackgroundColor));
            OnPropertyChanged(nameof(HeaderTextColor));
            OnPropertyChanged(nameof(SupportsFieldColors));
            OnPropertyChanged(nameof(IsTable));
        }
        finally
        {
            _suppressNotify = false;
        }
    }

    public void ApplyToModel()
    {
        Model.XMm = XMm;
        Model.YMm = YMm;
        Model.WidthMm = WidthMm;
        Model.HeightMm = HeightMm;
        Model.Style.Foreground = NormalizeColor(TextColor);
        Model.Style.Background = NormalizeColor(BackgroundColor);
        Model.Style.FontSizePt = FontSizePt;
        Model.Style.TextAlign = string.IsNullOrWhiteSpace(TextAlign) ? "left" : TextAlign.Trim().ToLowerInvariant();

        if (IsTable)
        {
            Model.Table ??= new ReportTableSettings();
            Model.Table.HeaderBackground = NormalizeColor(HeaderBackgroundColor);
            Model.Table.HeaderForeground = NormalizeColor(HeaderTextColor);
        }
    }

    private static string? NormalizeColor(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;
        var v = value.Trim();
        if (!v.StartsWith('#'))
            v = "#" + v;
        return v.Length is 4 or 7 or 9 ? v : null;
    }

    private void NotifyChanged()
    {
        if (_suppressNotify)
            return;
        ApplyToModel();
        Changed?.Invoke();
    }
}
