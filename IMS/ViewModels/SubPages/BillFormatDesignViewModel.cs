using System.Collections.ObjectModel;
using System.IO;
using System.Windows;
using System.Windows.Input;
using IMS.Helpers;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;
using IMS.ViewModels;

namespace IMS.ViewModels.SubPages;

public sealed class BillFormatDesignViewModel : SubPageViewModelBase, IPageViewLoadAware
{
    private readonly string _templateId;
    private SalesBillTemplateDto? _selectedTemplate;
    private SalesBillLayoutDefinition _layout = new();
    private DesignerSectionViewModel? _selectedSection;
    private string _statusMessage = "Loading format…";
    private bool _isBusy;
    private bool _isSaving;
    private bool _suppressSave;
    private BillFormatCatalogDto? _catalog;
    private string _filterTransactionType = "sales_invoice";
    private string _formatCode = string.Empty;
    private string _formatName = string.Empty;
    private string _formatDescription = string.Empty;
    private bool _formatActive = true;
    private bool _formatIsDefault;
    private string _selectedPaperPresetKey = "A4_PORTRAIT";
    private BillFormatVisibilityRules _visibility = new();
    private BillFormatPrintSettings _printSettings = new();

    public BillFormatDesignViewModel(MainViewModel host, string templateId) : base(
        host,
        parentTitle: "Bill Format Master",
        pageTitle: "Report Designer",
        pageDescription: "Crystal-style bill layout designer.",
        iconGlyph: "\uE8A5")
    {
        _templateId = templateId;
        DesignerSections = [];
        Bands = new ObservableCollection<BillFormatBandViewModel>(
            BillFormatBands.All.Select(b => new BillFormatBandViewModel(b)));
        ExplorerRoots = [];
        ItemColumns = [];
        PaperPresets = [];
        WatermarkTypes = [];
        ZoomOptions = ["50%", "75%", "100%", "125%"];
        _selectedZoom = "100%";
        AlignOptions = ["left", "center", "right"];

        PreviewCommand = new RelayCommand(() => _ = PreviewAsync(), () => _selectedTemplate is not null && !IsBusy);
        ExportPdfCommand = new RelayCommand(() => _ = ExportPdfAsync(), () => _selectedTemplate is not null && !IsBusy);
        ExportJsonCommand = new RelayCommand(() => _ = ExportJsonAsync(), () => _selectedTemplate is not null && !IsBusy);
        ImportJsonCommand = new RelayCommand(() => _ = ImportJsonAsync(), () => !IsBusy);
        SaveNowCommand = new RelayCommand(() => _ = SaveMetadataAndLayoutAsync(goBack: true), () => _selectedTemplate is not null && !IsBusy);
        AddQuickBlockCommand = new RelayCommand(p => AddQuickBlock(p as string), static p => p is string);

        QuickBlocks =
        [
            new BillFormatQuickBlock("Bill title", "header"),
            new BillFormatQuickBlock("Company details", "companyDetails"),
            new BillFormatQuickBlock("Logo", "companyLogo"),
            new BillFormatQuickBlock("Party details", "customerDetails"),
            new BillFormatQuickBlock("Item details", "itemTable"),
            new BillFormatQuickBlock("Tax & totals", "taxDetails"),
            new BillFormatQuickBlock("Terms", "termsAndConditions"),
            new BillFormatQuickBlock("Footer", "footer")
        ];

        RemoveSectionCommand = new RelayCommand(
            () => RemoveSelectedSection(),
            () => SelectedSection is not null);

        InsertExplorerCommand = new RelayCommand(p => InsertExplorerItem(p as BillFormatExplorerNodeViewModel));
        AddItemDetailsCommand = new RelayCommand(() => AddQuickBlock("itemTable"));

        SaveCommand = new RelayCommand(() => _ = SaveMetadataAndLayoutAsync(goBack: false));
        CancelCommand = new RelayCommand(() => Host.GoBack());
    }

    private string _selectedZoom = "100%";

    public IReadOnlyList<string> ZoomOptions { get; }
    public IReadOnlyList<string> AlignOptions { get; }

    public string SelectedZoom
    {
        get => _selectedZoom;
        set
        {
            if (!SetProperty(ref _selectedZoom, value))
                return;
            OnPropertyChanged(nameof(ZoomScale));
            OnPropertyChanged(nameof(DesignPageWidth));
            OnPropertyChanged(nameof(DesignPageHeight));
        }
    }

    public double ZoomScale => _selectedZoom switch
    {
        "50%" => 0.5,
        "75%" => 0.75,
        "125%" => 1.25,
        _ => 1.0
    };

    public double DesignPageWidth => Layout.Page.WidthMm / 25.4 * 96 * ZoomScale;

    public double DesignPageHeight => Layout.Page.HeightMm / 25.4 * 96 * ZoomScale;

    public ObservableCollection<BillFormatBandViewModel> Bands { get; }
    public ObservableCollection<BillFormatExplorerNodeViewModel> ExplorerRoots { get; }

    public string FormatSummary =>
        _selectedTemplate is null
            ? "Loading…"
            : $"{FormatName}  ·  {DocumentTypeLabel}  ·  Code {FormatCode}";

    public string EditDetailsHint =>
        "To change format name, code, or default flag, use Edit on Bill Format Master.";

    public string FormatContextLine { get; private set; } = string.Empty;

    public IReadOnlyList<BillFormatQuickBlock> QuickBlocks { get; }

    public ObservableCollection<DesignerSectionViewModel> DesignerSections { get; }
    public ObservableCollection<SalesBillItemColumnDefinition> ItemColumns { get; }
    public ObservableCollection<BillFormatPaperPreset> PaperPresets { get; }
    public ObservableCollection<string> WatermarkTypes { get; }

    public string DocumentTypeLabel =>
        _catalog?.TransactionTypes.FirstOrDefault(t => t.Key == FilterTransactionType)?.Label ?? "Document";

    public string DefaultFormatCheckboxText => $"Use as default for {DocumentTypeLabel}";

    public string FormatCode
    {
        get => _formatCode;
        set => SetProperty(ref _formatCode, value);
    }

    public string FormatName
    {
        get => _formatName;
        set => SetProperty(ref _formatName, value);
    }

    public string FormatDescription
    {
        get => _formatDescription;
        set => SetProperty(ref _formatDescription, value);
    }

    public bool FormatActive
    {
        get => _formatActive;
        set => SetProperty(ref _formatActive, value);
    }

    public bool FormatIsDefault
    {
        get => _formatIsDefault;
        set => SetProperty(ref _formatIsDefault, value);
    }

    public string FilterTransactionType
    {
        get => _filterTransactionType;
        private set => SetProperty(ref _filterTransactionType, value);
    }

    public string SelectedPaperPresetKey
    {
        get => _selectedPaperPresetKey;
        set
        {
            if (!SetProperty(ref _selectedPaperPresetKey, value))
                return;
            ApplyPaperPreset();
        }
    }

    public BillFormatVisibilityRules Visibility
    {
        get => _visibility;
        set => SetProperty(ref _visibility, value);
    }

    public BillFormatPrintSettings PrintSettings
    {
        get => _printSettings;
        set => SetProperty(ref _printSettings, value);
    }

    public bool HasSelectedTemplate => _selectedTemplate is not null;

    public DesignerSectionViewModel? SelectedSection
    {
        get => _selectedSection;
        set
        {
            if (!SetProperty(ref _selectedSection, value))
                return;
            OnPropertyChanged(nameof(HasSelectedSection));
            (RemoveSectionCommand as RelayCommand)?.RaiseCanExecuteChanged();
        }
    }

    public bool HasSelectedSection => SelectedSection is not null;

    public SalesBillLayoutDefinition Layout
    {
        get => _layout;
        private set => SetProperty(ref _layout, value);
    }

    public string StatusMessage
    {
        get => _statusMessage;
        private set => SetProperty(ref _statusMessage, value);
    }

    public bool IsBusy
    {
        get => _isBusy;
        private set
        {
            if (!SetProperty(ref _isBusy, value))
                return;
            RaiseCommandStates();
        }
    }

    public bool IsSaving
    {
        get => _isSaving;
        private set => SetProperty(ref _isSaving, value);
    }

    public string PageSizeLabel =>
        $"{Layout.Page.SizeKey} — {Layout.Page.WidthMm:0.#} × {Layout.Page.HeightMm:0.#} mm";

    public ICommand PreviewCommand { get; }
    public ICommand ExportPdfCommand { get; }
    public ICommand ExportJsonCommand { get; }
    public ICommand ImportJsonCommand { get; }
    public ICommand SaveNowCommand { get; }
    public ICommand AddQuickBlockCommand { get; }
    public ICommand RemoveSectionCommand { get; }
    public ICommand InsertExplorerCommand { get; }
    public ICommand AddItemDetailsCommand { get; }

    public bool HasItemColumns => ItemColumns.Count > 0;

    public bool HasItemTableSection =>
        DesignerSections.Any(s => string.Equals(s.Type, "itemTable", StringComparison.OrdinalIgnoreCase));

    public void OnPageViewLoaded() => _ = LoadAsync();

    public void NotifyLayoutChanged()
    {
        if (_suppressSave || _selectedTemplate is null)
            return;
        SyncLayoutFromDesigner();
        StatusMessage = "You have unsaved changes. Click Save when finished.";
    }

    public void UpdateSectionPosition(string sectionId, double x, double y)
    {
        var section = Layout.Sections.FirstOrDefault(s => s.Id == sectionId);
        if (section is null)
            return;
        section.X = Math.Clamp(x, 0, 95);
        section.Y = Math.Clamp(y, 0, 95);
        var vm = DesignerSections.FirstOrDefault(s => s.Id == sectionId);
        if (vm is not null)
        {
            vm.X = section.X;
            vm.Y = section.Y;
        }
        NotifyLayoutChanged();
    }

    private void ApplyTemplate(SalesBillTemplateDto? template)
    {
        DesignerSections.Clear();
        ItemColumns.Clear();
        _selectedTemplate = template;
        OnPropertyChanged(nameof(HasSelectedTemplate));

        if (template is null)
        {
            Layout = new SalesBillLayoutDefinition();
            return;
        }

        PageTitle = "Report Designer";
        FormatContextLine = $"How «{template.Name}» will look when printed.";
        FilterTransactionType = template.TransactionType;
        OnPropertyChanged(nameof(FormatSummary));
        OnPropertyChanged(nameof(EditDetailsHint));
        OnPropertyChanged(nameof(FormatContextLine));
        Layout = template.ParseLayout() ?? new SalesBillLayoutDefinition();
        FormatCode = string.IsNullOrWhiteSpace(template.FormatCode)
            ? template.TemplateKey.ToUpperInvariant()
            : template.FormatCode;
        FormatName = template.Name;
        FormatDescription = template.Description;
        FormatActive = template.IsActive;
        FormatIsDefault = template.IsDefault;
        Visibility = template.VisibilityRules ?? Layout.Visibility ?? new BillFormatVisibilityRules();
        PrintSettings = template.PrintSettings ?? Layout.PrintSettings ?? new BillFormatPrintSettings();
        Layout.Visibility = Visibility;
        Layout.PrintSettings = PrintSettings;

        BillFormatLayoutBootstrap.EnsureItemTableSection(Layout, FilterTransactionType);

        foreach (var section in Layout.Sections.OrderBy(s => s.Order))
            DesignerSections.Add(new DesignerSectionViewModel(section, OnSectionPropertyChanged));

        foreach (var col in Layout.ItemTable.Columns)
            ItemColumns.Add(col);

        OnPropertyChanged(nameof(HasItemColumns));
        OnPropertyChanged(nameof(HasItemTableSection));

        SelectedPaperPresetKey = PaperPresets.FirstOrDefault(p =>
            string.Equals(p.SizeKey, Layout.Page.SizeKey, StringComparison.OrdinalIgnoreCase))?.Key ?? "A4_PORTRAIT";
        OnPropertyChanged(nameof(PageSizeLabel));
        OnPropertyChanged(nameof(DocumentTypeLabel));
        OnPropertyChanged(nameof(DefaultFormatCheckboxText));
        RebuildBands();
        BuildFieldExplorer();
        RaiseCommandStates();
    }

    private void OnSectionPropertyChanged()
    {
        SyncLayoutFromDesigner();
        NotifyLayoutChanged();
    }

    private void SyncLayoutFromDesigner()
    {
        var order = 0;
        foreach (var band in Bands)
        {
            foreach (var section in band.Sections)
                section.ToDefinition().Order = order++;
        }

        Layout.Sections = DesignerSections.Select(d => d.ToDefinition()).ToList();
        Layout.ItemTable.Columns = ItemColumns.ToList();
        Layout.Visibility = Visibility;
        Layout.PrintSettings = PrintSettings;
    }

    private void RebuildBands()
    {
        var sections = DesignerSections.ToList();
        Bands.Clear();
        foreach (var definition in BillFormatBands.All)
        {
            var band = new BillFormatBandViewModel(definition);
            foreach (var section in sections)
            {
                if (BillFormatBands.GetBandKeyForSectionType(section.Type) == definition.Key)
                    band.Sections.Add(section);
            }

            Bands.Add(band);
        }

        OnPropertyChanged(nameof(Bands));
        OnPropertyChanged(nameof(HasItemTableSection));
    }

    private void BuildFieldExplorer()
    {
        ExplorerRoots.Clear();
        var insert = InsertExplorerCommand;

        var sections = new BillFormatExplorerNodeViewModel("Bill Sections", isCategory: true);
        foreach (var block in QuickBlocks)
        {
            sections.Children.Add(new BillFormatExplorerNodeViewModel(
                block.Label,
                sectionType: block.SectionType,
                insertCommand: insert));
        }

        ExplorerRoots.Add(sections);

        var itemDetails = new BillFormatExplorerNodeViewModel("Item / detail columns", isCategory: true);
        itemDetails.Children.Add(new BillFormatExplorerNodeViewModel(
            "Item details (line table)",
            sectionType: "itemTable",
            insertCommand: insert));
        foreach (var col in ItemColumns)
        {
            itemDetails.Children.Add(new BillFormatExplorerNodeViewModel(
                col.Header,
                columnKey: col.Key,
                insertCommand: insert));
        }

        ExplorerRoots.Add(itemDetails);

        if (_catalog is not null)
        {
            AddControlGroup("Header Fields", _catalog.HeaderControls, insert);
            AddControlGroup("Document Fields", _catalog.DocumentControls, insert);
            AddControlGroup("Footer Fields", _catalog.FooterControls, insert);
        }

        var printOpts = new BillFormatExplorerNodeViewModel("Print Options", isCategory: true);
        ExplorerRoots.Add(printOpts);
    }

    private void AddControlGroup(string title, List<BillFormatControlInfo> controls, ICommand insert)
    {
        if (controls.Count == 0)
            return;

        var group = new BillFormatExplorerNodeViewModel(title, isCategory: true);
        foreach (var c in controls)
        {
            var token = string.IsNullOrWhiteSpace(c.Token) ? $"{{{{{c.Key}}}}}" : c.Token!;
            group.Children.Add(new BillFormatExplorerNodeViewModel(
                c.Label,
                sectionType: c.Type,
                fieldToken: token,
                insertCommand: insert));
        }

        ExplorerRoots.Add(group);
    }

    public void InsertExplorerItem(BillFormatExplorerNodeViewModel? node)
    {
        if (node is null)
            return;

        if (!string.IsNullOrWhiteSpace(node.ColumnKey))
        {
            ToggleItemColumn(node.ColumnKey);
            return;
        }

        if (!string.IsNullOrWhiteSpace(node.SectionType) && node.SectionType != "field")
        {
            if (Layout.Sections.Any(s => string.Equals(s.Type, node.SectionType, StringComparison.OrdinalIgnoreCase)))
            {
                if (!string.IsNullOrWhiteSpace(node.FieldToken))
                {
                    AddField(node.Title, node.FieldToken);
                    return;
                }

                StatusMessage = $"{node.Title} is already on the layout.";
                SelectedSection = DesignerSections.FirstOrDefault(s =>
                    string.Equals(s.Type, node.SectionType, StringComparison.OrdinalIgnoreCase));
                RebuildBands();
                return;
            }

            AddQuickBlock(node.SectionType);
            return;
        }

        if (!string.IsNullOrWhiteSpace(node.FieldToken))
            AddField(node.Title, node.FieldToken);
    }

    private void ToggleItemColumn(string columnKey)
    {
        var col = ItemColumns.FirstOrDefault(c => string.Equals(c.Key, columnKey, StringComparison.OrdinalIgnoreCase));
        if (col is null)
        {
            var info = _catalog?.ItemColumns.FirstOrDefault(c =>
                string.Equals(c.Key, columnKey, StringComparison.OrdinalIgnoreCase));
            col = new SalesBillItemColumnDefinition
            {
                Key = columnKey,
                Header = info?.Header ?? columnKey,
                Visible = true,
                Width = info?.Width ?? 60,
                Align = info?.Align ?? "left"
            };
            ItemColumns.Add(col);
            StatusMessage = $"Added column «{col.Header}» to item details.";
        }
        else
        {
            col.Visible = !col.Visible;
            StatusMessage = col.Visible
                ? $"Column «{col.Header}» will print."
                : $"Column «{col.Header}» hidden from print.";
            OnPropertyChanged(nameof(ItemColumns));
        }

        Layout.ItemTable.Columns = ItemColumns.ToList();
        OnPropertyChanged(nameof(HasItemColumns));
        BuildFieldExplorer();
        NotifyLayoutChanged();
    }

    private void AddField(string label, string token)
    {
        var id = $"field_{Guid.NewGuid():N}"[..24];
        var section = new SalesBillSectionDefinition
        {
            Id = id,
            Type = "field",
            Label = label,
            Text = token,
            Visible = true,
            Order = Layout.Sections.Count,
            X = 8,
            Y = 5 + Layout.Sections.Count * 3,
            Width = 40,
            Height = 6,
            FontSizePt = 10
        };
        Layout.Sections.Add(section);
        var vm = new DesignerSectionViewModel(section, OnSectionPropertyChanged);
        DesignerSections.Add(vm);
        SelectedSection = vm;
        RebuildBands();
        NotifyLayoutChanged();
        (RemoveSectionCommand as RelayCommand)?.RaiseCanExecuteChanged();
    }

    private void ApplyPaperPreset()
    {
        if (_selectedTemplate is null)
            return;
        var preset = BillFormatPaperCatalog.FindPreset(_catalog, SelectedPaperPresetKey);
        if (preset is null)
            return;
        BillFormatPaperCatalog.ApplyPreset(Layout, preset);
        OnPropertyChanged(nameof(PageSizeLabel));
        OnPropertyChanged(nameof(DesignPageWidth));
        OnPropertyChanged(nameof(DesignPageHeight));
        NotifyLayoutChanged();
    }

    private void AddQuickBlock(string? sectionType)
    {
        if (string.IsNullOrWhiteSpace(sectionType))
            return;
        var type = sectionType;
        if (type == "customerDetails" && IsPurchaseDocumentType())
            type = "supplierDetails";
        var label = QuickBlocks.FirstOrDefault(b => b.SectionType == sectionType)?.Label ?? type;
        AddSection(type, label);
    }

    private bool IsPurchaseDocumentType() =>
        FilterTransactionType.StartsWith("purchase", StringComparison.OrdinalIgnoreCase) ||
        FilterTransactionType is "grn";

    private void AddSection(string? type, string? friendlyLabel = null)
    {
        if (string.IsNullOrWhiteSpace(type))
            return;
        if (type != "field" && Layout.Sections.Any(s => string.Equals(s.Type, type, StringComparison.OrdinalIgnoreCase)))
        {
            StatusMessage = $"{friendlyLabel ?? type} is already on the layout.";
            return;
        }

        var id = $"{type}_{Guid.NewGuid():N}"[..24];
        var section = new SalesBillSectionDefinition
        {
            Id = id,
            Type = type,
            Label = friendlyLabel ?? type,
            Visible = true,
            Order = Layout.Sections.Count,
            X = 5,
            Y = 5 + Layout.Sections.Count * 4,
            Width = 90,
            Height = 10
        };
        if (type == "header")
            section.Text = "{{documentTitle}}";
        if (string.Equals(type, "itemTable", StringComparison.OrdinalIgnoreCase))
        {
            section.Label = friendlyLabel ?? "Item details";
            section.Height = 28;
            section.Width = 94;
            section.Text = "Line items table";
            Layout.ItemTable.Visible = true;
            Layout.ItemTable.ShowHeader = true;
            _ = SyncItemColumnsFromOrganizationDefaultsAsync();
        }

        Layout.Sections.Add(section);
        var vm = new DesignerSectionViewModel(section, OnSectionPropertyChanged);
        DesignerSections.Add(vm);
        SelectedSection = vm;
        StatusMessage = $"Added «{section.Label}» to the layout.";
        RebuildBands();
        BuildFieldExplorer();
        NotifyLayoutChanged();
        (RemoveSectionCommand as RelayCommand)?.RaiseCanExecuteChanged();
    }

    private void RemoveSelectedSection()
    {
        if (SelectedSection is null)
            return;
        var id = SelectedSection.Id;
        Layout.Sections.RemoveAll(s => s.Id == id);
        var vm = DesignerSections.FirstOrDefault(s => s.Id == id);
        if (vm is not null)
            DesignerSections.Remove(vm);
        SelectedSection = DesignerSections.FirstOrDefault();
        RebuildBands();
        NotifyLayoutChanged();
        (RemoveSectionCommand as RelayCommand)?.RaiseCanExecuteChanged();
    }

    private async Task SyncItemColumnsFromOrganizationDefaultsAsync()
    {
        await BillFormatGridColumnSync.ApplyOrganizationColumnsToLayoutAsync(Layout, _catalog, FilterTransactionType)
            .ConfigureAwait(true);

        ItemColumns.Clear();
        foreach (var col in Layout.ItemTable.Columns)
            ItemColumns.Add(col);

        OnPropertyChanged(nameof(HasItemColumns));
        BuildFieldExplorer();
    }

    private async Task LoadAsync()
    {
        if (!AuthSession.IsAdministrator)
        {
            StatusMessage = "Administrator login is required to design bill formats.";
            return;
        }

        IsBusy = true;
        try
        {
            if (!await ImsApiClient.CheckHealthAsync())
            {
                StatusMessage = "API is offline. Start the API service first.";
                return;
            }

            _catalog = await ImsApiClient.GetBillFormatCatalogAsync();
            PaperPresets.Clear();
            WatermarkTypes.Clear();
            if (_catalog is not null)
            {
                foreach (var p in _catalog.PaperPresets)
                    PaperPresets.Add(p);
                foreach (var w in _catalog.WatermarkTypes)
                    WatermarkTypes.Add(w);
            }

            var template = await ImsApiClient.GetSalesBillTemplateAsync(_templateId);
            _suppressSave = true;
            try
            {
                ApplyTemplate(template);
                await SyncItemColumnsFromOrganizationDefaultsAsync();
            }
            finally
            {
                _suppressSave = false;
            }

            StatusMessage = template is null
                ? "Format not found."
                : $"Editing {template.Name}. Item columns follow Settings → Manage columns (organization default for {DocumentTypeLabel}).";
        }
        catch (Exception ex)
        {
            StatusMessage = ex.Message;
        }
        finally
        {
            IsBusy = false;
        }
    }

    private async Task SaveMetadataAndLayoutAsync(bool goBack = false)
    {
        if (_selectedTemplate is null || _suppressSave)
            return;

        SyncLayoutFromDesigner();
        IsSaving = true;
        StatusMessage = "Saving format…";
        try
        {
            var updated = await ImsApiClient.UpdateSalesBillTemplateAsync(
                _selectedTemplate.Id,
                new SalesBillTemplateUpdateRequest
                {
                    FormatCode = FormatCode,
                    TransactionType = FilterTransactionType,
                    Name = FormatName,
                    Description = FormatDescription,
                    IsActive = FormatActive,
                    IsDefault = FormatIsDefault ? true : null,
                    AppliesToDocTypes = [FilterTransactionType],
                    PrintSettings = PrintSettings,
                    VisibilityRules = Visibility,
                    LayoutJson = Layout
                });
            if (updated is not null)
            {
                _suppressSave = true;
                try
                {
                    ApplyTemplate(updated);
                }
                finally
                {
                    _suppressSave = false;
                }

                StatusMessage = $"Saved at {DateTime.Now:HH:mm:ss}";
                BillFormatTemplateService.InvalidateCache();
                SalesBillTemplateService.InvalidateCache();

                if (PrintSettings.PrintPreview)
                    await ShowPrintPreviewAsync();

                if (goBack)
                    Host.GoBack();
            }
        }
        catch (Exception ex)
        {
            StatusMessage = $"Save failed: {ex.Message}";
        }
        finally
        {
            IsSaving = false;
        }
    }

    private async Task ExportJsonAsync()
    {
        if (_selectedTemplate is null)
            return;
        try
        {
            var exported = await ImsApiClient.ExportBillFormatAsync(_selectedTemplate.Id) ?? _selectedTemplate;
            var dlg = new Microsoft.Win32.SaveFileDialog
            {
                Filter = "JSON (*.json)|*.json",
                FileName = $"{exported.TemplateKey}.json"
            };
            if (dlg.ShowDialog() != true)
                return;
            var json = System.Text.Json.JsonSerializer.Serialize(exported, ImsApiClient.SerializerOptions);
            await File.WriteAllTextAsync(dlg.FileName, json);
            StatusMessage = "Format exported.";
        }
        catch (Exception ex)
        {
            StatusMessage = ex.Message;
        }
    }

    private async Task ImportJsonAsync()
    {
        try
        {
            var dlg = new Microsoft.Win32.OpenFileDialog { Filter = "JSON (*.json)|*.json" };
            if (dlg.ShowDialog() != true)
                return;
            var json = await File.ReadAllTextAsync(dlg.FileName);
            var payload = System.Text.Json.JsonSerializer.Deserialize<SalesBillTemplateUpdateRequest>(
                json,
                ImsApiClient.SerializerOptions);
            if (payload is null)
            {
                StatusMessage = "Invalid format JSON.";
                return;
            }

            await ImsApiClient.UpdateSalesBillTemplateAsync(_templateId, payload);
            await LoadAsync();
            StatusMessage = "Format imported.";
        }
        catch (Exception ex)
        {
            StatusMessage = ex.Message;
        }
    }

    private async Task PreviewAsync() => await ShowPrintPreviewAsync();

    private async Task ShowPrintPreviewAsync()
    {
        if (_selectedTemplate is null)
            return;

        SyncLayoutFromDesigner();
        var printLayout = BillFormatLayoutMerger.PrepareForPrint(Layout, Visibility, PrintSettings);
        await BillFormatGridColumnSync.ApplyOrganizationColumnVisibilityForPrintAsync(
            printLayout, FilterTransactionType).ConfigureAwait(true);

        if (printLayout.Sections.Count == 0)
        {
            StatusMessage = "Nothing to preview — add at least one section.";
            return;
        }

        await CompanyProfileService.RefreshAsync();
        var sample = IsPurchaseDocumentType()
            ? SalesBillSampleData.CreateSamplePurchaseOrder(FilterTransactionType)
            : SalesBillSampleData.CreateSampleOrder();
        SalesEntryType? entryType = IsPurchaseDocumentType() ? null : EntryTypeForTransaction();
        SalesBillFlowDocumentRenderer.ShowPreview(sample, printLayout, entryType);
    }

    private SalesEntryType EntryTypeForTransaction() => FilterTransactionType switch
    {
        "sales_order" => SalesEntryType.SalesOrder,
        "delivery_challan" => SalesEntryType.DeliveryChallan,
        "sales_return" => SalesEntryType.SalesReturn,
        _ => SalesEntryType.SalesInvoice
    };

    private async Task ExportPdfAsync()
    {
        if (_selectedTemplate is null)
            return;
        await CompanyProfileService.RefreshAsync();
        var sample = SalesBillSampleData.CreateSampleOrder();
        SalesBillPdfExporter.ExportWithSaveDialog(sample, Layout, SalesEntryType.SalesInvoice);
    }

    private void RaiseCommandStates()
    {
        (PreviewCommand as RelayCommand)?.RaiseCanExecuteChanged();
        (ExportPdfCommand as RelayCommand)?.RaiseCanExecuteChanged();
        (ExportJsonCommand as RelayCommand)?.RaiseCanExecuteChanged();
        (SaveNowCommand as RelayCommand)?.RaiseCanExecuteChanged();
        OnPropertyChanged(nameof(HasSelectedTemplate));
    }
}

public sealed record BillFormatQuickBlock(string Label, string SectionType);

public sealed class DesignerSectionViewModel : ViewModelBase
{
    private readonly Action _onChanged;
    private readonly SalesBillSectionDefinition _source;

    public DesignerSectionViewModel(SalesBillSectionDefinition source, Action onChanged)
    {
        _source = source;
        _onChanged = onChanged;
        Id = source.Id;
        Label = source.Label;
        Type = source.Type;
        X = source.X;
        Y = source.Y;
        Width = source.Width;
        Height = source.Height;
        Visible = source.Visible;
        Align = source.Align;
        FontSizePt = source.FontSizePt ?? 11;
        Color = source.Color ?? "#000000";
        Text = source.Text ?? string.Empty;
        ShowBorder = source.ShowBorder;
    }

    public string Id { get; }
    public string Type { get; }

    public string Label
    {
        get => _source.Label;
        set { _source.Label = value; OnPropertyChanged(); _onChanged(); }
    }

    public double X
    {
        get => _source.X;
        set { _source.X = value; OnPropertyChanged(); _onChanged(); }
    }

    public double Y
    {
        get => _source.Y;
        set { _source.Y = value; OnPropertyChanged(); _onChanged(); }
    }

    public double Width
    {
        get => _source.Width;
        set { _source.Width = value; OnPropertyChanged(); _onChanged(); }
    }

    public double Height
    {
        get => _source.Height;
        set { _source.Height = value; OnPropertyChanged(); _onChanged(); }
    }

    public bool Visible
    {
        get => _source.Visible;
        set { _source.Visible = value; OnPropertyChanged(); _onChanged(); }
    }

    public string Align
    {
        get => _source.Align;
        set { _source.Align = value; OnPropertyChanged(); _onChanged(); }
    }

    public double FontSizePt
    {
        get => _source.FontSizePt ?? 11;
        set { _source.FontSizePt = value; OnPropertyChanged(); _onChanged(); }
    }

    public string Color
    {
        get => _source.Color ?? "#000000";
        set { _source.Color = value; OnPropertyChanged(); _onChanged(); }
    }

    public string Text
    {
        get => _source.Text ?? string.Empty;
        set { _source.Text = value; OnPropertyChanged(); _onChanged(); }
    }

    public bool ShowBorder
    {
        get => _source.ShowBorder;
        set { _source.ShowBorder = value; OnPropertyChanged(); _onChanged(); }
    }

    public SalesBillSectionDefinition ToDefinition() => _source;
}
