using System.Collections.ObjectModel;
using System.Globalization;
using System.Net.Http;
using System.Windows;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels.SubPages;

public abstract class PurchaseDocumentEntryViewModelBase : PurchaseEntryFormViewModelBase, IPurchaseEntryPrefixSupport
{
    private readonly bool _isEdit;
    private readonly int _originalDocNo;
    private string _originalDocPrefix;
    private string _entryDocPrefix;
    private string? _lastPreviewPrefix;
    private string? _savedDocumentId;
    private bool _loaded;
    private HashSet<string> _validSupplierNames = new(StringComparer.OrdinalIgnoreCase);

    private static readonly string[] InvalidSupplierNames = ["— Select —", "Select"];

    protected PurchaseDocumentEntryViewModelBase(
        MainViewModel host,
        PurchaseEntryWorkspaceViewModelBase workspace,
        int docNo,
        bool forEdit = false)
        : base(host, workspace, docNo, forEdit)
    {
        _isEdit = forEdit;
        _originalDocNo = docNo;
        _entryDocPrefix = workspace.Definition.DocPrefix;
        _originalDocPrefix = _entryDocPrefix;
        UpdateValidSuppliers(Suppliers);

        if (forEdit)
            PageTitle = $"Edit {workspace.Definition.NavTitle}";
        else
        {
            PageTitle = $"Add {workspace.Definition.NavTitle}";
            _ = InitializeNewDocumentAsync();
        }
    }

    public bool IsEdit => _isEdit;
    internal string? SavedDocumentId => _savedDocumentId;
    public bool IsBillNoReadOnly => true;
    public bool IsPrefixReadOnly => _isEdit;
    public bool IsEntryPrefixReadOnly => IsPrefixReadOnly;
    public string PrefixFieldLabel => "Prefix";

    public string EntryDocPrefix
    {
        get => _entryDocPrefix;
        set
        {
            var normalized = NormalizeDocPrefix(value);
            if (!SetProperty(ref _entryDocPrefix, normalized))
                return;
            OnPropertyChanged(nameof(DocPrefix));
            OnPropertyChanged(nameof(FormattedDocNo));
            if (!string.Equals(_lastPreviewPrefix, normalized, StringComparison.OrdinalIgnoreCase))
                _lastPreviewPrefix = null;
        }
    }

    public new string DocPrefix => EntryDocPrefix;

    public new string FormattedDocNo => string.IsNullOrWhiteSpace(BillNo)
        ? EntryDocPrefix
        : $"{EntryDocPrefix}-{BillNo}";

    public async Task CommitPrefixAsync() => await CommitEntryPrefixAsync();

    public async Task CommitEntryPrefixAsync()
    {
        if (_isEdit)
            return;

        var prefix = EffectiveDocPrefix();
        if (string.IsNullOrWhiteSpace(prefix))
        {
            MessageBox.Show("Enter a document prefix, then press Tab or Enter to generate the number.",
                "Prefix Required", MessageBoxButton.OK, MessageBoxImage.Information);
            return;
        }

        EntryDocPrefix = prefix;

        if (string.Equals(_lastPreviewPrefix, prefix, StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(BillNo))
            return;

        await RefreshNextBillNoAsync();
        _lastPreviewPrefix = prefix;
    }

    public string EffectiveDocPrefix()
    {
        var normalized = NormalizeDocPrefix(EntryDocPrefix);
        return string.IsNullOrWhiteSpace(normalized) ? string.Empty : normalized;
    }

    protected override bool UseSampleLineItems => false;

    public override bool ShowProductPicker => true;

    public async Task EnsureLoadedAsync(string? formattedDocNo = null)
    {
        if (_loaded || !_isEdit)
            return;

        await LoadLookupsAsync();
        if (!string.IsNullOrWhiteSpace(formattedDocNo))
            await LoadByFormattedAsync(formattedDocNo);
        else if (_originalDocNo > 0)
            await LoadByDocNoAsync(_originalDocNo);
        _loaded = true;
    }

    public void ApplyFromDto(NumberedPurchaseDocumentDto dto)
    {
        _savedDocumentId = dto.Id;
        EntryDocPrefix = string.IsNullOrWhiteSpace(dto.DocPrefix) ? Workspace.Definition.DocPrefix : dto.DocPrefix;
        _originalDocPrefix = EntryDocPrefix;
        BillNo = dto.DocNo.ToString(CultureInfo.InvariantCulture);
        BillDate = dto.BillDate ?? string.Empty;
        Buyer = dto.Buyer ?? string.Empty;
        Supplier = dto.Supplier ?? string.Empty;
        SupplierDetails = dto.SupplierDetails ?? string.Empty;
        Narration = dto.Narration ?? string.Empty;
        ApplyModuleFromDto(dto);
        ApplyTotalsFromDto(dto.Totals);
        ClearLineItems();
        foreach (var line in dto.Lines.OrderBy(l => l.Sr))
            LineItems.Add(MapDtoToLine(line));
    }

    protected virtual SalesLineItem MapDtoToLine(SalesOrderLineDto line)
    {
        var item = new SalesLineItem
        {
            Sr = line.Sr,
            ProductRetailCode = line.ProductRetailCode ?? string.Empty,
            ItemDescription = line.ItemDescription ?? string.Empty,
            Qty = line.Qty ?? "0",
            Rate = line.Rate ?? "0",
            SalesRate = line.SalesRate ?? "0",
            DiscPercent = line.DiscPercent ?? "0",
            DiscValue = line.DiscValue ?? "0",
            TaxType = line.TaxType ?? "GST",
            TaxPercent = line.TaxPercent ?? "0",
            Amount = line.Amount ?? "0"
        };

        if (!string.IsNullOrWhiteSpace(line.PoFormattedDocNo))
            SalesLineItemSourceMapper.ApplyPurchaseOrderSource(item, line);
        if (!string.IsNullOrWhiteSpace(line.GrnFormattedDocNo))
            SalesLineItemSourceMapper.ApplyGrnSource(item, line);

        return item;
    }

    protected override async Task LoadLookupsAsync()
    {
        await base.LoadLookupsAsync();
        UpdateValidSuppliers(Suppliers);
    }

    protected abstract void InitializeModuleDefaults();
    protected abstract void ApplyModuleFromDto(NumberedPurchaseDocumentDto dto);
    public abstract void MapModuleToDto(NumberedPurchaseDocumentDto dto);

    protected override async Task SaveAndCloseAsync()
    {
        if (!await TrySaveDocumentAsync())
            return;
        CloseEntry();
    }

    protected override async Task SaveAndNextAsync()
    {
        if (!await TrySaveDocumentAsync())
            return;
        await AfterSaveGoNextAsync();
    }

    protected override async Task SavePrintAndNextAsync()
    {
        if (!await TrySaveDocumentAsync())
            return;

        if (!await PurchaseOrderPrintService.PrintAsync(this).ConfigureAwait(true))
            return;

        Workspace.RegisterPrinted(this);
        await AfterSaveGoNextAsync();
    }

    protected override Task AfterSaveGoNextAsync() =>
        _isEdit
            ? base.AfterSaveGoNextAsync()
            : RunOnUiThreadAsync(() => _ = PrepareFreshBillAsync());

    protected override Task<bool> TryPersistAsync() => TrySaveDocumentAsync();

    private async Task InitializeNewDocumentAsync()
    {
        ClearLineItems();
        Buyer = string.Empty;
        Supplier = string.Empty;
        BillDate = DateTime.Today.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture);
        ResetTotals();
        InitializeModuleDefaults();
        await LoadLookupsAsync();
        BillNo = string.Empty;
        _lastPreviewPrefix = null;
        OnPropertyChanged(nameof(FormattedDocNo));
    }

    protected virtual Task AfterDocumentSavedAsync() => Task.CompletedTask;

    private async Task PrepareFreshBillAsync()
    {
        _savedDocumentId = null;
        Narration = string.Empty;
        Buyer = string.Empty;
        Supplier = string.Empty;
        SupplierDetails = string.Empty;
        ClearLineItems();
        ResetTotals();
        ClearScanEntryFields();
        InitializeModuleDefaults();
        BillDate = DateTime.Today.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture);
        EntryDocPrefix = Workspace.Definition.DocPrefix;
        BillNo = string.Empty;
        _lastPreviewPrefix = null;
        OnPropertyChanged(nameof(FormattedDocNo));
    }

    internal async Task RefreshNextBillNoAsync()
    {
        if (!ImsApiClient.IsAvailable)
            return;

        var prefix = EffectiveDocPrefix();
        if (string.IsNullOrWhiteSpace(prefix))
            return;

        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            var next = await ImsApiClient.GetNextPurchaseDocumentNoAsync(EntryType, prefix);
            if (!string.IsNullOrWhiteSpace(next.DocPrefix))
                EntryDocPrefix = next.DocPrefix;
            else if (!string.IsNullOrWhiteSpace(next.PoPrefix))
                EntryDocPrefix = next.PoPrefix;
            else if (!string.IsNullOrWhiteSpace(next.SoPrefix))
                EntryDocPrefix = next.SoPrefix;
            BillNo = next.DocNo.ToString(CultureInfo.InvariantCulture);
        });
    }

    private async Task LoadByDocNoAsync(int docNo)
    {
        if (!ImsApiClient.IsAvailable)
        {
            BillNo = docNo.ToString(CultureInfo.InvariantCulture);
            return;
        }

        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            var doc = await ImsApiClient.GetPurchaseDocumentByNoAsync(EntryType, docNo, _originalDocPrefix);
            if (doc is not null)
                ApplyFromDto(doc);
        });
    }

    private async Task LoadByFormattedAsync(string formattedDocNo)
    {
        if (!ImsApiClient.IsAvailable)
            return;

        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            var doc = await ImsApiClient.GetPurchaseDocumentByFormattedAsync(EntryType, formattedDocNo);
            if (doc is not null)
                ApplyFromDto(doc);
        });
    }

    public Task<bool> EnsureSavedAsync() => TrySaveDocumentAsync();

    private async Task<bool> TrySaveDocumentAsync()
    {
        if (!_isEdit && string.IsNullOrWhiteSpace(BillNo))
        {
            MessageBox.Show(
                "Document number is not set. Enter your prefix and press Tab or Enter to generate the number.",
                "Validation", MessageBoxButton.OK, MessageBoxImage.Warning);
            return false;
        }

        if (!HasValidSupplier())
        {
            var message = string.IsNullOrWhiteSpace(Supplier?.Trim())
                ? "Supplier Name is required before saving."
                : "Please select a valid supplier from the list.";
            MessageBox.Show(message, "Validation", MessageBoxButton.OK, MessageBoxImage.Warning);
            return false;
        }

        if (LineItems.Count == 0)
        {
            MessageBox.Show("Add at least one line item.", "Validation",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return false;
        }

        if (!ImsApiClient.IsAvailable)
            return true;

        try
        {
            var dto = ApiDocumentMapper.ToPurchaseDocumentDto(this, _savedDocumentId);
            NumberedPurchaseDocumentDto saved;
            if (_isEdit)
            {
                if (!string.IsNullOrEmpty(_savedDocumentId))
                    saved = await ImsApiClient.UpdatePurchaseDocumentByIdAsync(EntryType, _savedDocumentId, dto);
                else
                    saved = await ImsApiClient.UpdatePurchaseDocumentByNoAsync(EntryType, _originalDocNo, dto, _originalDocPrefix);
            }
            else
                saved = await ImsApiClient.CreatePurchaseDocumentAsync(EntryType, dto);

            _savedDocumentId = saved.Id;
            if (saved.DocNo > 0)
                BillNo = saved.DocNo.ToString(CultureInfo.InvariantCulture);
            if (!string.IsNullOrWhiteSpace(saved.DocPrefix))
                EntryDocPrefix = saved.DocPrefix;

            Host.RefreshPurchaseDocumentList(EntryType);
            await AfterDocumentSavedAsync();
            await PurchaseOrderPrintService.RunAfterSavePrintActionsAsync(
                ApiDocumentMapper.NumberedPurchaseDocumentToSalesOrderDto(saved),
                EntryType).ConfigureAwait(true);
            return true;
        }
        catch (ApiException ex)
        {
            MessageBox.Show(ex.Message, "Save Failed", MessageBoxButton.OK, MessageBoxImage.Warning);
            return false;
        }
        catch (HttpRequestException ex)
        {
            MessageBox.Show($"Cannot reach API.\n{ex.Message}", "Save Failed",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return false;
        }
    }

    private void ApplyTotalsFromDto(PurchaseOrderTotalsDto? totals)
    {
        if (totals is null)
        {
            ResetTotals();
            return;
        }
        SupplierReturn = totals.SupplierReturn ?? "0.00";
        PayableToSupplier = totals.PayableToSupplier ?? "0.00";
        TotQty = totals.TotQty ?? "0";
        Gross = totals.Gross ?? "0.00";
        Discount = totals.Discount ?? "0.00";
        SpDiscount = totals.SpDiscount ?? "0.00";
        AddOther = totals.AddOther ?? "0.00";
        Net = totals.Net ?? "0.00";
        OrderAmount = totals.OrderAmount ?? totals.SaleAmount ?? "0.00";
    }

    private void ResetTotals()
    {
        SupplierReturn = "0.00";
        PayableToSupplier = "0.00";
        TotQty = "0";
        Gross = "0.00";
        Discount = "0.00";
        SpDiscount = "0.00";
        AddOther = "0.00";
        Net = "0.00";
        OrderAmount = "0.00";
    }

    protected void ClearLineItems()
    {
        while (LineItems.Count > 0)
            LineItems.RemoveAt(0);
    }

    private void UpdateValidSuppliers(IReadOnlyList<string> names)
    {
        _validSupplierNames = names
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .Where(n => !InvalidSupplierNames.Contains(n.Trim(), StringComparer.OrdinalIgnoreCase))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
    }

    protected bool HasValidSupplier()
    {
        var name = Supplier?.Trim();
        return !string.IsNullOrWhiteSpace(name) && _validSupplierNames.Contains(name);
    }

    private string NormalizeDocPrefix(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        var trimmed = value.Trim().ToUpperInvariant();
        var chars = trimmed.Where(c => char.IsLetterOrDigit(c) || c is '_' or '-').Take(12).ToArray();
        return chars.Length > 0 ? new string(chars) : string.Empty;
    }

    private static Task RunOnUiThreadAsync(Action action)
    {
        var dispatcher = Application.Current?.Dispatcher;
        if (dispatcher is null || dispatcher.CheckAccess())
        {
            action();
            return Task.CompletedTask;
        }
        return dispatcher.InvokeAsync(action).Task;
    }
}
