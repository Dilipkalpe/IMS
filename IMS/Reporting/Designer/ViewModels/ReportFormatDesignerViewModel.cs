using System.Collections.ObjectModel;
using System.Text.Json;
using System.Windows;
using System.Windows.Input;
using System.Windows.Threading;
using IMS.Reporting.Data;
using IMS.Reporting.Designer.Services;
using IMS.Reporting.Models;
using IMS.Reporting.Services;
using IMS.Services.Api;
using IMS.ViewModels;
using IMS.ViewModels.SubPages;

namespace IMS.Reporting.Designer.ViewModels;

public sealed class ReportFormatDesignerViewModel : SubPageViewModelBase, IPageViewLoadAware
{
    private readonly string _formatId;
    private ReportLayoutDocument _layout = new();
    private readonly DesignerHistory<string> _history = new();

    private string _formatName = string.Empty;
    private string _transactionType = "sales_invoice";
    private string _statusMessage = "Loading layout…";
    private double _zoom = 1.0;
    private DesignElementViewModel? _selectedElement;
    private bool _layoutLoaded;
    private readonly List<ReportPaperSizeDto> _paperCatalog = [];
    private string _selectedPaperSizeKey = "A4_PORTRAIT";
    private bool _useCustomPaper;
    private double _customWidthMm = 210;
    private double _customHeightMm = 297;
    private double _marginTopMm = 10;
    private double _marginRightMm = 10;
    private double _marginBottomMm = 10;
    private double _marginLeftMm = 10;
    private double _designCanvasWidth = 794;
    private double _designCanvasHeight = 1123;

    public ReportFormatDesignerViewModel(MainViewModel host, string formatId) : base(
        host,
        parentTitle: "Report formats (canvas)",
        pageTitle: "Canvas designer",
        pageDescription: "Drag-and-drop layout stored in MongoDB (schema v2).",
        iconGlyph: "\uE8A5")
    {
        _formatId = formatId;
        Elements = new ObservableCollection<DesignElementViewModel>();
        FieldExplorer = new ObservableCollection<ReportFieldRegistryEntryDto>();
        PaperSizes = new ObservableCollection<ReportPaperSizeDto>();

        SaveCommand = new RelayCommand(() => _ = SaveAsync());
        AddTextCommand = new RelayCommand(() => AddElement("text", "Static text"));
        AddDynamicTextCommand = new RelayCommand(() => AddElement("dynamicText", "Dynamic field"));
        AddTableCommand = new RelayCommand(AddTable);
        AddLineCommand = new RelayCommand(() => AddElement("line", "Line"));
        AddRectangleCommand = new RelayCommand(() => AddElement("rectangle", "Box"));
        UndoCommand = new RelayCommand(Undo, () => _history.CanUndo);
        RedoCommand = new RelayCommand(Redo, () => _history.CanRedo);
        DeleteSelectedCommand = new RelayCommand(DeleteSelected, () => SelectedElement is not null);
        InsertFieldCommand = new RelayCommand(p => InsertField(p as ReportFieldRegistryEntryDto));
        ResetStandardLayoutCommand = new RelayCommand(ResetStandardLayout);
    }

    public ObservableCollection<DesignElementViewModel> Elements { get; }
    public ObservableCollection<ReportFieldRegistryEntryDto> FieldExplorer { get; }
    public ObservableCollection<ReportPaperSizeDto> PaperSizes { get; }

    public string SelectedPaperSizeKey
    {
        get => _selectedPaperSizeKey;
        set
        {
            if (!SetProperty(ref _selectedPaperSizeKey, value))
                return;
            ApplyPaperSize();
        }
    }

    /// <summary>Override preset dimensions (optional).</summary>
    public bool UseCustomPaper
    {
        get => _useCustomPaper;
        set
        {
            if (!SetProperty(ref _useCustomPaper, value))
                return;
            ApplyPaperSize();
        }
    }

    public double CustomWidthMm
    {
        get => _customWidthMm;
        set
        {
            if (!SetProperty(ref _customWidthMm, value))
                return;
            if (UseCustomPaper)
                ApplyPaperSize();
        }
    }

    public double CustomHeightMm
    {
        get => _customHeightMm;
        set
        {
            if (!SetProperty(ref _customHeightMm, value))
                return;
            if (UseCustomPaper)
                ApplyPaperSize();
        }
    }

    public double MarginTopMm
    {
        get => _marginTopMm;
        set
        {
            if (!SetProperty(ref _marginTopMm, value))
                return;
            if (UseCustomPaper)
                ApplyPaperSize();
        }
    }

    public double MarginRightMm
    {
        get => _marginRightMm;
        set
        {
            if (!SetProperty(ref _marginRightMm, value))
                return;
            if (UseCustomPaper)
                ApplyPaperSize();
        }
    }

    public double MarginBottomMm
    {
        get => _marginBottomMm;
        set
        {
            if (!SetProperty(ref _marginBottomMm, value))
                return;
            if (UseCustomPaper)
                ApplyPaperSize();
        }
    }

    public double MarginLeftMm
    {
        get => _marginLeftMm;
        set
        {
            if (!SetProperty(ref _marginLeftMm, value))
                return;
            if (UseCustomPaper)
                ApplyPaperSize();
        }
    }

    public double DesignCanvasWidth
    {
        get => _designCanvasWidth;
        private set => SetProperty(ref _designCanvasWidth, value);
    }

    public double DesignCanvasHeight
    {
        get => _designCanvasHeight;
        private set => SetProperty(ref _designCanvasHeight, value);
    }

    public string PageSizeLabel =>
        $"{_layout.Page.WidthMm:0} × {_layout.Page.HeightMm:0} mm";

    public string FormatName
    {
        get => _formatName;
        set => SetProperty(ref _formatName, value);
    }

    public string TransactionType
    {
        get => _transactionType;
        private set => SetProperty(ref _transactionType, value);
    }

    public string StatusMessage
    {
        get => _statusMessage;
        private set => SetProperty(ref _statusMessage, value);
    }

    public double Zoom
    {
        get => _zoom;
        set => SetProperty(ref _zoom, value);
    }

    public bool HasSelectedElement => SelectedElement is not null;

    public DesignElementViewModel? SelectedElement
    {
        get => _selectedElement;
        set
        {
            if (!SetProperty(ref _selectedElement, value))
                return;
            foreach (var el in Elements)
                el.IsSelected = el == value;
            value?.SyncFromModel();
            OnPropertyChanged(nameof(HasSelectedElement));
            (DeleteSelectedCommand as RelayCommand)?.RaiseCanExecuteChanged();
        }
    }

    public new ICommand SaveCommand { get; }
    public ICommand CloseCommand => CancelCommand;
    public ICommand AddTextCommand { get; }
    public ICommand AddDynamicTextCommand { get; }
    public ICommand AddTableCommand { get; }
    public ICommand AddLineCommand { get; }
    public ICommand AddRectangleCommand { get; }
    public ICommand UndoCommand { get; }
    public ICommand RedoCommand { get; }
    public ICommand DeleteSelectedCommand { get; }
    public ICommand InsertFieldCommand { get; }
    public ICommand ResetStandardLayoutCommand { get; }

    public event Action? LayoutElementsChanged;
    public event Action? CanvasPageSizeChanged;

    public void OnPageViewLoaded() => _ = LoadAsync();

    public async Task LoadAsync()
    {
        StatusMessage = "Loading layout…";
        _layoutLoaded = false;

        if (!ImsApiClient.IsAvailable)
        {
            StatusMessage = "API is not available. Check connection and login.";
            return;
        }

        try
        {
            var format = await ImsApiClient.GetReportFormatAsync(_formatId).ConfigureAwait(true);
            if (format is null)
            {
                StatusMessage = "Format not found on server.";
                return;
            }

            FormatName = format.FormatName;
            TransactionType = format.TransactionType;
            PageTitle = $"Canvas designer — {FormatName}";
            OnPropertyChanged(nameof(PageTitle));

            _layout = ReportPrintResolver.ParseLayout(format.LayoutJson)
                      ?? JsonSerializer.Deserialize<ReportLayoutDocument>(
                          format.LayoutJson.GetRawText(),
                          ImsApiClient.SerializerOptions)
                      ?? new ReportLayoutDocument();

            if (_layout.Elements.Count == 0)
                ReportLayoutBootstrap.EnsureElements(_layout, TransactionType);

            _paperCatalog.Clear();
            var paperList = await ImsApiClient.GetReportPaperSizesAsync().ConfigureAwait(true);
            _paperCatalog.AddRange(paperList);

            var paperKey = !string.IsNullOrWhiteSpace(format.PaperSizeKey)
                ? format.PaperSizeKey
                : _layout.Page.PaperSizeKey;
            var useCustom = format.CustomPaper?.WidthMm > 0 && format.CustomPaper.HeightMm > 0;
            var customW = useCustom ? format.CustomPaper!.WidthMm!.Value : _layout.Page.WidthMm;
            var customH = useCustom ? format.CustomPaper!.HeightMm!.Value : _layout.Page.HeightMm;
            var mTop = format.CustomPaper?.MarginsMm?.Top ?? _layout.Page.MarginsMm.Top;
            var mRight = format.CustomPaper?.MarginsMm?.Right ?? _layout.Page.MarginsMm.Right;
            var mBottom = format.CustomPaper?.MarginsMm?.Bottom ?? _layout.Page.MarginsMm.Bottom;
            var mLeft = format.CustomPaper?.MarginsMm?.Left ?? _layout.Page.MarginsMm.Left;

            var registry = await ImsApiClient.GetReportFieldRegistryAsync(TransactionType).ConfigureAwait(true);
            await RunOnUiAsync(() =>
            {
                PaperSizes.Clear();
                foreach (var p in _paperCatalog)
                    PaperSizes.Add(p);

                if (PaperSizes.Count == 0)
                {
                    PaperSizes.Add(new ReportPaperSizeDto
                    {
                        Key = "A4_PORTRAIT",
                        Name = "A4 Portrait",
                        WidthMm = 210,
                        HeightMm = 297
                    });
                }

                _selectedPaperSizeKey = PaperSizes.Any(p =>
                    string.Equals(p.Key, paperKey, StringComparison.OrdinalIgnoreCase))
                    ? paperKey
                    : PaperSizes[0].Key;
                _useCustomPaper = useCustom;
                _customWidthMm = customW;
                _customHeightMm = customH;
                _marginTopMm = mTop;
                _marginRightMm = mRight;
                _marginBottomMm = mBottom;
                _marginLeftMm = mLeft;
                OnPropertyChanged(nameof(SelectedPaperSizeKey));
                OnPropertyChanged(nameof(UseCustomPaper));
                OnPropertyChanged(nameof(CustomWidthMm));
                OnPropertyChanged(nameof(CustomHeightMm));
                OnPropertyChanged(nameof(MarginTopMm));
                OnPropertyChanged(nameof(MarginRightMm));
                OnPropertyChanged(nameof(MarginBottomMm));
                OnPropertyChanged(nameof(MarginLeftMm));

                ApplyPaperSize();

                FieldExplorer.Clear();
                if (registry?.Fields is not null)
                {
                    foreach (var f in registry.Fields.OrderBy(x => x.Category).ThenBy(x => x.DisplayLabel))
                        FieldExplorer.Add(f);
                }

                RebuildElements();
                if (!_layoutLoaded)
                {
                    Elements.CollectionChanged += (_, _) => LayoutElementsChanged?.Invoke();
                    _layoutLoaded = true;
                }

                SnapshotHistory();
                StatusMessage = $"{Elements.Count} element(s) · {FieldExplorer.Count} field(s) · {TransactionType}";
            });
        }
        catch (Exception ex)
        {
            StatusMessage = $"Load failed: {ex.Message}";
            MessageBox.Show(
                ex.Message,
                "Report designer",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
        }
    }

    private static Task RunOnUiAsync(Action action)
    {
        var dispatcher = Application.Current?.Dispatcher;
        if (dispatcher is null || dispatcher.CheckAccess())
        {
            action();
            return Task.CompletedTask;
        }

        return dispatcher.InvokeAsync(action, DispatcherPriority.Normal).Task;
    }

    private void RebuildElements()
    {
        foreach (var existing in Elements)
            existing.Changed -= OnElementChanged;

        Elements.Clear();
        foreach (var el in _layout.Elements.OrderBy(e => e.ZIndex).ThenBy(e => e.YMm))
        {
            var vm = new DesignElementViewModel(el);
            vm.Changed += OnElementChanged;
            Elements.Add(vm);
        }
        LayoutElementsChanged?.Invoke();
    }

    private void OnElementChanged() => LayoutElementsChanged?.Invoke();

    private void SnapshotHistory()
    {
        _history.Push(SerializeLayout());
        (UndoCommand as RelayCommand)?.RaiseCanExecuteChanged();
        (RedoCommand as RelayCommand)?.RaiseCanExecuteChanged();
    }

    private string SerializeLayout() =>
        JsonSerializer.Serialize(_layout, ImsApiClient.SerializerOptions);

    private void RestoreLayout(string json)
    {
        _layout = JsonSerializer.Deserialize<ReportLayoutDocument>(json, ImsApiClient.SerializerOptions)
                  ?? new ReportLayoutDocument();
        RebuildElements();
    }

    private void Undo()
    {
        var snap = _history.Undo(SerializeLayout());
        if (snap is not null)
            RestoreLayout(snap);
        (UndoCommand as RelayCommand)?.RaiseCanExecuteChanged();
        (RedoCommand as RelayCommand)?.RaiseCanExecuteChanged();
    }

    private void Redo()
    {
        var snap = _history.Redo(SerializeLayout());
        if (snap is not null)
            RestoreLayout(snap);
        (UndoCommand as RelayCommand)?.RaiseCanExecuteChanged();
        (RedoCommand as RelayCommand)?.RaiseCanExecuteChanged();
    }

    private void AddElement(string type, string name)
    {
        SnapshotHistory();
        var el = new ReportElementDefinition
        {
            Type = type,
            Name = name,
            XMm = 10,
            YMm = 10 + _layout.Elements.Count * 8,
            WidthMm = type == "line" ? 80 : 50,
            HeightMm = type == "line" ? 1 : 8,
            Binding = type == "text"
                ? new ReportElementBinding { Value = name }
                : new ReportElementBinding { FieldKey = "invoiceNo", Token = "{{invoiceNo}}" }
        };
        _layout.Elements.Add(el);
        RebuildElements();
        SelectedElement = Elements.LastOrDefault();
    }

    private void AddTable()
    {
        SnapshotHistory();
        _layout.Elements.Add(new ReportElementDefinition
        {
            Type = "table",
            Name = "Item table",
            XMm = 10,
            YMm = 60,
            WidthMm = 190,
            HeightMm = 80,
            Binding = new ReportElementBinding { FieldKey = "itemTable", DataSource = "lines" },
            Table = new ReportTableSettings
            {
                ShowHeader = true,
                Columns =
                [
                    new() { Key = "srNo", Header = "Sr", WidthMm = 12, Align = "center" },
                    new() { Key = "itemCode", Header = "Code", WidthMm = 22 },
                    new() { Key = "description", Header = "Description", WidthMm = 55 },
                    new() { Key = "qty", Header = "Qty", WidthMm = 18, Align = "right" },
                    new() { Key = "amount", Header = "Amount", WidthMm = 28, Align = "right" }
                ]
            }
        });
        RebuildElements();
    }

    private void InsertField(ReportFieldRegistryEntryDto? field)
    {
        if (field is null)
            return;
        SnapshotHistory();
        _layout.Elements.Add(new ReportElementDefinition
        {
            Type = "dynamicText",
            Name = field.DisplayLabel,
            XMm = 10,
            YMm = 10 + _layout.Elements.Count * 7,
            WidthMm = 70,
            HeightMm = 6,
            Binding = new ReportElementBinding
            {
                FieldKey = field.FieldKey,
                Token = field.Token
            }
        });
        RebuildElements();
    }

    private void ApplyPaperSize()
    {
        var preset = _paperCatalog.FirstOrDefault(p =>
            string.Equals(p.Key, SelectedPaperSizeKey, StringComparison.OrdinalIgnoreCase))
            ?? PaperSizes.FirstOrDefault();
        var orientation = preset?.Orientation ?? _layout.Page.Orientation;

        ReportPaperSizeHelper.ApplyToLayout(
            _layout,
            SelectedPaperSizeKey,
            orientation,
            _paperCatalog.Count > 0 ? _paperCatalog : PaperSizes.ToList(),
            UseCustomPaper,
            BuildCustomPaperDto());

        var (w, h) = ReportPaperSizeHelper.CanvasSizeDips(_layout);
        DesignCanvasWidth = w;
        DesignCanvasHeight = h;
        OnPropertyChanged(nameof(PageSizeLabel));
        CanvasPageSizeChanged?.Invoke();
    }

    private ReportCustomPaperDto? BuildCustomPaperDto() =>
        UseCustomPaper
            ? new ReportCustomPaperDto
            {
                WidthMm = CustomWidthMm,
                HeightMm = CustomHeightMm,
                MarginsMm = new ReportMarginsDto
                {
                    Top = MarginTopMm,
                    Right = MarginRightMm,
                    Bottom = MarginBottomMm,
                    Left = MarginLeftMm
                }
            }
            : null;

    private void ResetStandardLayout()
    {
        var layoutHint = string.Equals(TransactionType, "sales_invoice", StringComparison.OrdinalIgnoreCase)
            ? "the Tax Invoice layout (logo, Bill To, full line grid, totals, bank details)."
            : "the standard professional layout (logo, company header, styled table, totals).";
        var confirm = MessageBox.Show(
            $"Replace the current canvas with {layoutHint}\n\n" +
            "This removes all elements on the page (you can Undo once).",
            "Reset standard layout",
            MessageBoxButton.YesNo,
            MessageBoxImage.Question);
        if (confirm != MessageBoxResult.Yes)
            return;

        SnapshotHistory();
        ReportStandardLayouts.ApplyStandard(_layout, TransactionType);
        RebuildElements();
        ApplyPaperSize();
        SelectedElement = null;
        StatusMessage = $"Standard layout applied · {Elements.Count} element(s)";
    }

    private void DeleteSelected()
    {
        if (SelectedElement is null)
            return;
        SnapshotHistory();
        _layout.Elements.RemoveAll(e => e.Id == SelectedElement.Model.Id);
        SelectedElement = null;
        RebuildElements();
    }

    private async Task SaveAsync()
    {
        foreach (var vm in Elements)
            vm.ApplyToModel();

        try
        {
            ApplyPaperSize();

            await ImsApiClient.UpdateReportFormatAsync(_formatId, new ReportFormatUpdateRequest
            {
                FormatName = FormatName,
                PaperSizeKey = SelectedPaperSizeKey,
                Orientation = _layout.Page.Orientation,
                CustomPaper = BuildCustomPaperDto(),
                LayoutJson = _layout
            }).ConfigureAwait(true);

            StatusMessage = $"Saved · {Elements.Count} element(s) · print uses transaction \"{TransactionType}\"";
            MessageBox.Show(
                $"Layout saved for transaction type: {TransactionType}\n\n" +
                "Use Print on that document screen (e.g. Sales Orders → Print) to see this design.\n" +
                "Preview title should include \"(Canvas Preview)\".",
                "Report designer",
                MessageBoxButton.OK,
                MessageBoxImage.Information);
        }
        catch (Exception ex)
        {
            MessageBox.Show(ex.Message, "Save failed", MessageBoxButton.OK, MessageBoxImage.Warning);
        }
    }
}
