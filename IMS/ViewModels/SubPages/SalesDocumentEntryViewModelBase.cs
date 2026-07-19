using System.Collections.ObjectModel;
using System.Globalization;
using System.Net.Http;
using System.Windows;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels.SubPages;

public abstract class SalesDocumentEntryViewModelBase : SalesEntryFormViewModelBase, ISalesEntryPrefixSupport
{
    private readonly bool _isEdit;
    private readonly int _originalDocNo;
    private string _originalDocPrefix;
    private string _entryDocPrefix;
    private string? _lastPreviewPrefix;
    private string? _savedDocumentId;
    private bool _loaded;
    private HashSet<string> _validCustomerNames = new(StringComparer.OrdinalIgnoreCase);

    private static readonly string[] InvalidCustomerNames = ["Walk In", "— Select —", "Select"];

    protected SalesDocumentEntryViewModelBase(
        MainViewModel host,
        SalesEntryWorkspaceViewModelBase workspace,
        int docNo,
        bool forEdit = false)
        : base(host, workspace, docNo)
    {
        _isEdit = forEdit;
        _originalDocNo = docNo;
        _entryDocPrefix = workspace.Definition.DocPrefix;
        _originalDocPrefix = _entryDocPrefix;
        UpdateValidCustomers(Customers);

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

    protected override bool UseSampleLineItems => false;
    public override bool ShowProductPicker => true;

    public async Task EnsureLoadedAsync(string? formattedDocNo = null)
    {
        if (_loaded || !_isEdit)
            return;

        if (!string.IsNullOrWhiteSpace(formattedDocNo))
            await LoadByFormattedAsync(formattedDocNo);
        else if (_originalDocNo > 0)
            await LoadByDocNoAsync(_originalDocNo);
        _loaded = true;
    }

    private async Task InitializeNewDocumentAsync()
    {
        ClearLineItems();
        Customer = string.Empty;
        BillDate = DateTime.Today.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture);
        ResetTotals();
        InitializeModuleDefaults();
        await LoadLookupsAsync();
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
            var next = await ImsApiClient.GetNextSalesDocumentNoAsync(EntryType, prefix);
            if (!string.IsNullOrWhiteSpace(next.DocPrefix))
                EntryDocPrefix = next.DocPrefix;
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
            var doc = await ImsApiClient.GetSalesDocumentByNoAsync(EntryType, docNo, _originalDocPrefix);
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
            var doc = await ImsApiClient.GetSalesDocumentByFormattedAsync(EntryType, formattedDocNo);
            if (doc is not null)
                ApplyFromDto(doc);
        });
    }

    public void ApplyFromDto(NumberedSalesDocumentDto dto)
    {
        _savedDocumentId = dto.Id;
        EntryDocPrefix = string.IsNullOrWhiteSpace(dto.DocPrefix) ? Workspace.Definition.DocPrefix : dto.DocPrefix;
        _originalDocPrefix = EntryDocPrefix;
        BillNo = dto.DocNo.ToString(CultureInfo.InvariantCulture);
        BillDate = dto.BillDate ?? string.Empty;
        SalesMan = dto.SalesMan ?? string.Empty;
        Customer = dto.Customer ?? string.Empty;
        CustomerDetails = dto.CustomerDetails ?? string.Empty;
        Narration = dto.Narration ?? string.Empty;
        ApplyModuleFromDto(dto);
        ApplyTotalsFromDto(dto.Totals);
        ClearLineItems();
        foreach (var line in dto.Lines.OrderBy(l => l.Sr))
            LineItems.Add(MapDtoToLine(line));
    }

    protected virtual SalesLineItem MapDtoToLine(SalesOrderLineDto line) => new()
    {
        Sr = line.Sr,
        ProductRetailCode = line.ProductRetailCode ?? string.Empty,
        ItemDescription = line.ItemDescription ?? string.Empty,
        Qty = line.Qty ?? "0",
        Rate = line.Rate ?? "0",
        DiscPercent = line.DiscPercent ?? "0",
        DiscValue = line.DiscValue ?? "0",
        TaxType = line.TaxType ?? "GST",
        TaxPercent = line.TaxPercent ?? "0",
        Amount = line.Amount ?? "0"
    };

    protected abstract void InitializeModuleDefaults();
    protected abstract void ApplyModuleFromDto(NumberedSalesDocumentDto dto);
    protected abstract void MapModuleToDto(NumberedSalesDocumentDto dto);

    protected override async Task LoadLookupsAsync()
    {
        await base.LoadLookupsAsync();
        var filtered = Customers
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .Where(n => !InvalidCustomerNames.Contains(n.Trim(), StringComparer.OrdinalIgnoreCase))
            .ToList();
        if (filtered.Count > 0)
            SetCustomers(filtered);
        UpdateValidCustomers(Customers);
    }

    protected override async Task SaveAndCloseAsync()
    {
        if (!await TrySaveDocumentAsync())
            return;
        await RunOnUiThreadAsync(CloseEntry);
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

        if (!await SalesOrderPrintService.PrintAsync(this).ConfigureAwait(true))
            return;

        Workspace.RegisterPrinted(this);
        await AfterSaveGoNextAsync();
    }

    private Task AfterSaveGoNextAsync() =>
        _isEdit
            ? RunOnUiThreadAsync(() => _ = Workspace.ContinueWithNextBillAsync(this))
            : RunOnUiThreadAsync(() => _ = PrepareFreshBillAsync());

    protected virtual async Task AfterDocumentSavedAsync()
    {
        if (!ImsApiClient.IsAvailable)
            return;

        var printDto = ApiDocumentMapper.NumberedSalesDocumentToSalesOrderDto(BuildDto());
        await SalesOrderPrintService.RunAfterSavePrintActionsAsync(printDto, EntryType).ConfigureAwait(true);
    }

    protected virtual async Task PrepareFreshBillAsync()
    {
        _savedDocumentId = null;
        Narration = string.Empty;
        SalesMan = string.Empty;
        CustomerDetails = string.Empty;
        Customer = string.Empty;
        ClearLineItems();
        ResetTotals();
        ClearScanEntryFields();
        InitializeModuleDefaults();
        BillDate = DateTime.Today.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture);
        EntryDocPrefix = Workspace.Definition.DocPrefix;
        _lastPreviewPrefix = null;
        await RefreshNextBillNoAsync();
    }

    protected override async Task<bool> TryPersistAsync() => await TrySaveDocumentAsync();

    public Task<bool> EnsureSavedAsync() => TrySaveDocumentAsync();

    private async Task<bool> TrySaveDocumentAsync()
    {
        if (!_isEdit && string.IsNullOrWhiteSpace(BillNo))
        {
            MessageBox.Show(
                "Document number is not set. Enter your prefix and press Tab or Enter to generate the number.",
                "Validation",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
            return false;
        }

        if (!HasValidCustomer())
        {
            var message = string.IsNullOrWhiteSpace(Customer?.Trim())
                ? "Customer Name is required before saving."
                : "Please select a valid customer from the list.";
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
            var dto = BuildDto();
            NumberedSalesDocumentDto saved;
            if (_isEdit)
            {
                if (!string.IsNullOrEmpty(_savedDocumentId))
                    saved = await ImsApiClient.UpdateSalesDocumentByIdAsync(EntryType, _savedDocumentId, dto);
                else
                    saved = await ImsApiClient.UpdateSalesDocumentByNoAsync(EntryType, _originalDocNo, dto, _originalDocPrefix);
            }
            else
                saved = await ImsApiClient.CreateSalesDocumentAsync(EntryType, dto);

            _savedDocumentId = saved.Id;
            if (saved.DocNo > 0)
                BillNo = saved.DocNo.ToString(CultureInfo.InvariantCulture);

            if (!string.IsNullOrWhiteSpace(saved.DocPrefix))
                EntryDocPrefix = saved.DocPrefix;

            Host.RefreshSalesDocumentList(EntryType);
            await AfterDocumentSavedAsync();
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

    private NumberedSalesDocumentDto BuildDto()
    {
        if (!int.TryParse(BillNo, out var docNo))
            docNo = 0;

        var dto = new NumberedSalesDocumentDto
        {
            Id = _savedDocumentId,
            DocPrefix = EffectiveDocPrefix(),
            DocNo = docNo,
            FormattedDocNo = FormattedDocNo,
            BillDate = BillDate,
            SalesMan = SalesMan,
            Customer = Customer,
            CustomerDetails = CustomerDetails,
            Narration = Narration?.Trim(),
            Status = "open",
            Lines = LineItems.Select(MapLineToDto).ToList(),
            Totals = new SalesOrderTotalsDto
            {
                TotQty = TotQty,
                Gross = Gross,
                Discount = Discount,
                SpDiscount = SpDiscount,
                AddOther = AddOther,
                Net = Net,
                SaleAmount = SaleAmount,
                OrderAmount = SaleAmount,
                CustomerReturn = CustomerReturn,
                ReceivableToCustomer = ReceivableToCustomer
            }
        };
        MapModuleToDto(dto);
        return dto;
    }

    protected virtual SalesOrderLineDto MapLineToDto(SalesLineItem line) => new()
    {
        Sr = line.Sr,
        ProductRetailCode = line.ProductRetailCode,
        ItemDescription = line.ItemDescription,
        Qty = line.Qty,
        Rate = line.Rate,
        DiscPercent = line.DiscPercent,
        DiscValue = line.DiscValue,
        TaxType = line.TaxType,
        TaxPercent = line.TaxPercent,
        Amount = line.Amount
    };

    private void ApplyTotalsFromDto(SalesOrderTotalsDto? totals)
    {
        if (totals is null)
        {
            ResetTotals();
            return;
        }
        CustomerReturn = totals.CustomerReturn ?? "0.00";
        ReceivableToCustomer = totals.ReceivableToCustomer ?? "0.00";
        TotQty = totals.TotQty ?? "0";
        Gross = totals.Gross ?? "0.00";
        Discount = totals.Discount ?? "0.00";
        SpDiscount = totals.SpDiscount ?? "0.00";
        AddOther = totals.AddOther ?? "0.00";
        Net = totals.Net ?? "0.00";
        SaleAmount = totals.SaleAmount ?? totals.OrderAmount ?? "0.00";
    }

    private void ResetTotals()
    {
        CustomerReturn = "0.00";
        ReceivableToCustomer = "0.00";
        TotQty = "0";
        Gross = "0.00";
        Discount = "0.00";
        SpDiscount = "0.00";
        AddOther = "0.00";
        Net = "0.00";
        SaleAmount = "0.00";
    }

    protected void ClearLineItems()
    {
        while (LineItems.Count > 0)
            LineItems.RemoveAt(0);
    }

    private void UpdateValidCustomers(IReadOnlyList<string> names)
    {
        _validCustomerNames = names
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .Where(n => !InvalidCustomerNames.Contains(n.Trim(), StringComparer.OrdinalIgnoreCase))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
    }

    protected bool HasValidCustomer()
    {
        var name = Customer?.Trim();
        return !string.IsNullOrWhiteSpace(name) && _validCustomerNames.Contains(name);
    }

    private static async Task RunOnUiThreadAsync(Action action)
    {
        var dispatcher = Application.Current?.Dispatcher;
        if (dispatcher is null || dispatcher.CheckAccess())
        {
            action();
            return;
        }
        await dispatcher.InvokeAsync(action);
    }

    public string EffectiveDocPrefix()
    {
        var normalized = NormalizeDocPrefix(EntryDocPrefix);
        return string.IsNullOrWhiteSpace(normalized) ? string.Empty : normalized;
    }

    private string NormalizeDocPrefix(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        var trimmed = value.Trim().ToUpperInvariant();
        var chars = trimmed.Where(c => char.IsLetterOrDigit(c) || c is '_' or '-').Take(12).ToArray();
        return chars.Length > 0 ? new string(chars) : string.Empty;
    }
}
