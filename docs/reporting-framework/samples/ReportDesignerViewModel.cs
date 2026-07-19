// Designer ViewModel sketch — ERP.Reporting.Designer/ViewModels/

using System.Collections.ObjectModel;
using System.Windows.Input;
using ERP.Reporting.Core;
using ERP.Reporting.Core.Layout;

namespace ERP.Reporting.Designer.ViewModels;

public sealed class ReportDesignerViewModel : ViewModelBase
{
    private readonly IReportFormatRepository _formats;
    private LayoutElement? _selected;

    public ReportDesignerViewModel(IReportFormatRepository formats)
    {
        _formats = formats;
        Elements = new ObservableCollection<LayoutElementViewModel>();
        AddTextCommand = new RelayCommand(() => AddElement("text"));
        AddImageCommand = new RelayCommand(() => AddElement("image"));
        AddLineCommand = new RelayCommand(() => AddElement("line"));
        AddRectangleCommand = new RelayCommand(() => AddElement("rectangle"));
        AddTableCommand = new RelayCommand(() => AddElement("table"));
        AddBarcodeCommand = new RelayCommand(() => AddElement("barcode"));
        AddQrCodeCommand = new RelayCommand(() => AddElement("qrcode"));
        SaveCommand = new AsyncRelayCommand(SaveAsync);
    }

    public ObservableCollection<LayoutElementViewModel> Elements { get; }
    public ReportLayoutDocument Document { get; private set; } = new();
    public double Zoom { get; set; } = 1.0;
    public string EntryTypeKey { get; set; } = "sales_invoice";

    public LayoutElementViewModel? SelectedElement
    {
        get => _selected is null ? null : Elements.FirstOrDefault(e => e.Model.Id == _selected.Id);
        set => SetProperty(ref _selected, value?.Model);
    }

    public ICommand AddTextCommand { get; }
    public ICommand AddImageCommand { get; }
    public ICommand AddLineCommand { get; }
    public ICommand AddRectangleCommand { get; }
    public ICommand AddTableCommand { get; }
    public ICommand AddBarcodeCommand { get; }
    public ICommand AddQrCodeCommand { get; }
    public ICommand SaveCommand { get; }

    private void AddElement(string type)
    {
        var el = new LayoutElement
        {
            Type = type,
            XMm = 10,
            YMm = 10 + Elements.Count * 8,
            WidthMm = type == "table" ? 180 : 40,
            HeightMm = type == "table" ? 60 : 8
        };
        if (type == "table")
            el.Table = new TableDefinition();

        Elements.Add(new LayoutElementViewModel(el, OnElementChanged));
        Document.Elements.Add(el);
    }

    private void OnElementChanged() => OnPropertyChanged(nameof(Elements));

    private async Task SaveAsync()
    {
        var json = System.Text.Json.JsonSerializer.Serialize(Document);
        await _formats.SaveAsync(new ReportFormatSaveRequest(
            ReportFormatId: null,
            FormatCode: "CUSTOM",
            FormatName: "User format",
            EntryTypeKey,
            LayoutJson: json,
            IsDefault: false));
    }
}

public sealed class LayoutElementViewModel : ViewModelBase
{
    public LayoutElementViewModel(LayoutElement model, Action onChanged)
    {
        Model = model;
        Model.PropertyChanged += (_, _) => onChanged();
    }

    public LayoutElement Model { get; }
}

// Canvas code-behind: bind ItemsControl ItemsSource=Elements, position with Canvas.Left/Top in mm * zoom * dipPerMm.
