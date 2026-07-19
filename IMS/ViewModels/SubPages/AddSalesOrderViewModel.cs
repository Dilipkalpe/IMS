using System.Collections.ObjectModel;
using System.Globalization;
using System.Net.Http;
using System.Windows;
using System.Windows.Threading;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels.SubPages;

public sealed class AddSalesOrderViewModel : SalesEntryFormViewModelBase, ISalesEntryPrefixSupport
{
    private readonly bool _isEdit;
    private readonly int _originalDocNo;
    private string _originalSoPrefix = "SO";
    private string _soPrefix = "SO";
    private string? _lastPreviewPrefix;
    private string? _savedSalesOrderId;
    private string _paymentTerms = string.Empty;
    private string? _deliveryPriority;
    private string _billingAddress = string.Empty;
    private string _shippingAddress = string.Empty;
    private DateTime? _soDate = DateTime.Today;
    private bool _loaded;
    private HashSet<string> _validCustomerNames = new(StringComparer.OrdinalIgnoreCase);

    private static readonly string[] InvalidCustomerNames = ["Walk In", "— Select —", "Select"];

    public AddSalesOrderViewModel(MainViewModel host, SalesOrderWorkspaceViewModel workspace, int docNo)
        : this(host, workspace, docNo, forEdit: false)
    {
    }

    public AddSalesOrderViewModel(MainViewModel host, SalesOrderWorkspaceViewModel workspace, int docNo, bool forEdit)
        : base(host, workspace, docNo)
    {
        _isEdit = forEdit;
        _originalDocNo = docNo;
        DeliveryPriorities = ["Select", "Normal", "Urgent", "Express"];
        _deliveryPriority = DeliveryPriorities[0];
        UpdateValidCustomers(Customers);

        if (forEdit)
        {
            PageTitle = "Edit Sales Order";
        }
        else
        {
            PageTitle = "Add Sales Order";
            _ = InitializeNewOrderAsync();
        }
    }

    public bool IsEdit => _isEdit;

    internal string? SavedOrderId => _savedSalesOrderId;

    public bool IsBillNoReadOnly => true;

    public bool IsSoPrefixReadOnly => _isEdit;
    public bool IsPrefixReadOnly => IsSoPrefixReadOnly;
    public string PrefixFieldLabel => "SO Prefix";

    public string SoPrefix
    {
        get => _soPrefix;
        set
        {
            var normalized = NormalizeSoPrefix(value);
            if (!SetProperty(ref _soPrefix, normalized))
                return;
            OnPropertyChanged(nameof(DocPrefix));
            OnPropertyChanged(nameof(FormattedDocNo));
            if (!string.Equals(_lastPreviewPrefix, normalized, StringComparison.OrdinalIgnoreCase))
                _lastPreviewPrefix = null;
        }
    }

    public async Task CommitPrefixAsync() => await CommitSoPrefixAsync();

    public async Task CommitSoPrefixAsync()
    {
        if (_isEdit)
            return;

        var prefix = SoPrefix;
        if (string.Equals(_lastPreviewPrefix, prefix, StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(BillNo))
            return;

        await RefreshNextBillNoAsync();
        _lastPreviewPrefix = prefix;
    }

    public new string DocPrefix => SoPrefix;

    public new string FormattedDocNo => string.IsNullOrWhiteSpace(BillNo)
        ? SoPrefix
        : $"{SoPrefix}-{BillNo}";

    public override bool ShowProductPicker => true;

    protected override bool UseSampleLineItems => false;

    public DateTime? SoDate
    {
        get => _soDate;
        set
        {
            if (!SetProperty(ref _soDate, value))
                return;
            BillDate = value?.ToString("dd/MM/yyyy") ?? string.Empty;
        }
    }

    public IReadOnlyList<string> DeliveryPriorities { get; }

    public string PaymentTerms
    {
        get => _paymentTerms;
        set => SetProperty(ref _paymentTerms, value);
    }

    public string? DeliveryPriority
    {
        get => _deliveryPriority;
        set => SetProperty(ref _deliveryPriority, value);
    }

    public string BillingAddress
    {
        get => _billingAddress;
        set => SetProperty(ref _billingAddress, value);
    }

    public string ShippingAddress
    {
        get => _shippingAddress;
        set => SetProperty(ref _shippingAddress, value);
    }

    public async Task EnsureLoadedAsync(string? formattedDocNo = null)
    {
        if (_loaded || !_isEdit)
            return;

        if (!string.IsNullOrWhiteSpace(formattedDocNo))
            await LoadSalesOrderByFormattedAsync(formattedDocNo);
        else
            await LoadSalesOrderAsync(_originalDocNo, _originalSoPrefix);
        _loaded = true;
    }

    private async Task InitializeNewOrderAsync()
    {
        ClearLineItems();
        Customer = string.Empty;
        SoDate = DateTime.Today;
        BillDate = SoDate.Value.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture);
        ResetTotals();
        await LoadLookupsAsync();
        await RefreshNextBillNoAsync();
    }

    private async Task RefreshNextBillNoAsync()
    {
        if (!ImsApiClient.IsAvailable)
            return;

        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            var next = await ImsApiClient.GetNextSalesOrderNoAsync(DocPrefix);
            BillNo = next.DocNo.ToString(CultureInfo.InvariantCulture);
        });
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

    private async Task LoadSalesOrderAsync(int docNo, string soPrefix)
    {
        if (!ImsApiClient.IsAvailable)
        {
            BillNo = docNo.ToString(CultureInfo.InvariantCulture);
            return;
        }

        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            var order = await ImsApiClient.GetSalesOrderByNoAsync(docNo, soPrefix);
            if (order is null)
                return;

            ApplyFromDto(order);
        });
    }

    private async Task LoadSalesOrderByFormattedAsync(string formattedDocNo)
    {
        if (!ImsApiClient.IsAvailable)
            return;

        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            var order = await ImsApiClient.GetSalesOrderByFormattedAsync(formattedDocNo);
            if (order is null)
                return;

            ApplyFromDto(order);
        });
    }

    internal void ApplyFromDto(SalesOrderDto dto)
    {
        _savedSalesOrderId = dto.Id;
        SoPrefix = dto.SoPrefix;
        _originalSoPrefix = SoPrefix;
        BillNo = dto.DocNo.ToString(CultureInfo.InvariantCulture);
        SoDate = dto.SoDate?.Date ?? ParseBillDate(dto.BillDate);
        BillDate = dto.BillDate ?? SoDate?.ToString("dd/MM/yyyy") ?? string.Empty;
        SalesMan = dto.SalesMan ?? string.Empty;
        Customer = dto.Customer ?? string.Empty;
        CustomerDetails = dto.CustomerDetails ?? string.Empty;
        PaymentTerms = dto.PaymentTerms ?? string.Empty;
        DeliveryPriority = string.IsNullOrWhiteSpace(dto.DeliveryPriority)
            ? DeliveryPriorities[0]
            : dto.DeliveryPriority;
        BillingAddress = dto.BillingAddress ?? string.Empty;
        ShippingAddress = dto.ShippingAddress ?? string.Empty;
        Narration = dto.Narration ?? string.Empty;
        CustomerReturn = dto.Totals?.CustomerReturn ?? "0.00";
        ReceivableToCustomer = dto.Totals?.ReceivableToCustomer ?? "0.00";
        TotQty = dto.Totals?.TotQty ?? "0";
        Gross = dto.Totals?.Gross ?? "0.00";
        Discount = dto.Totals?.Discount ?? "0.00";
        SpDiscount = dto.Totals?.SpDiscount ?? "0.00";
        AddOther = dto.Totals?.AddOther ?? "0.00";
        Net = dto.Totals?.Net ?? "0.00";
        SaleAmount = dto.Totals?.SaleAmount ?? dto.Totals?.OrderAmount ?? "0.00";

        ClearLineItems();
        foreach (var line in dto.Lines.OrderBy(l => l.Sr))
        {
            var item = new SalesLineItem
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
            LineItems.Add(item);
        }
    }

    private void ClearLineItems()
    {
        while (LineItems.Count > 0)
            LineItems.RemoveAt(0);
    }

    private static DateTime? ParseBillDate(string? billDate)
    {
        if (string.IsNullOrWhiteSpace(billDate))
            return null;

        if (DateTime.TryParseExact(billDate, "dd/MM/yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
            return dt;

        return DateTime.TryParse(billDate, CultureInfo.CurrentCulture, DateTimeStyles.None, out dt) ? dt : null;
    }

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
        if (!await TrySaveSalesOrderAsync())
            return;

        await RunOnUiThreadAsync(CloseEntry);
    }

    protected override async Task SaveAndNextAsync()
    {
        if (!await TrySaveSalesOrderAsync())
            return;

        await AfterSaveGoNextAsync();
    }

    protected override async Task SavePrintAndNextAsync()
    {
        if (!await TrySaveSalesOrderAsync())
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

    private async Task PrepareFreshBillAsync()
    {
        _savedSalesOrderId = null;
        PaymentTerms = string.Empty;
        DeliveryPriority = DeliveryPriorities[0];
        BillingAddress = string.Empty;
        ShippingAddress = string.Empty;
        Narration = string.Empty;
        SalesMan = string.Empty;
        CustomerDetails = string.Empty;
        Customer = string.Empty;
        ClearLineItems();
        ResetTotals();
        ClearScanEntryFields();
        SoDate = DateTime.Today;
        BillDate = SoDate.Value.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture);

        _lastPreviewPrefix = null;
        await RefreshNextBillNoAsync();
    }

    private static string NormalizeSoPrefix(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "SO";

        var trimmed = value.Trim().ToUpperInvariant();
        var chars = trimmed.Where(c => char.IsLetterOrDigit(c) || c is '_' or '-').Take(12).ToArray();
        return chars.Length > 0 ? new string(chars) : "SO";
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

    private async Task<bool> TrySaveSalesOrderAsync()
    {
        if (!HasValidCustomer())
        {
            var message = string.IsNullOrWhiteSpace(Customer?.Trim())
                ? "Customer Name is required before saving."
                : "Please select a valid customer from the list.";
            MessageBox.Show(message, "Validation",
                MessageBoxButton.OK, MessageBoxImage.Warning);
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
            var dto = ApiDocumentMapper.FromSalesOrderForm(this, _savedSalesOrderId);
            SalesOrderDto saved;
            if (_isEdit)
            {
                if (!string.IsNullOrEmpty(_savedSalesOrderId))
                    saved = await ImsApiClient.UpdateSalesOrderByIdAsync(_savedSalesOrderId, dto);
                else
                    saved = await ImsApiClient.UpdateSalesOrderByNoAsync(_originalDocNo, dto, _originalSoPrefix);
            }
            else
                saved = await ImsApiClient.CreateSalesOrderAsync(dto);

            _savedSalesOrderId = saved.Id;
            if (!string.IsNullOrWhiteSpace(saved.SoPrefix))
                SoPrefix = saved.SoPrefix;

            if (saved.DocNo > 0)
                BillNo = saved.DocNo.ToString(CultureInfo.InvariantCulture);
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

    private void UpdateValidCustomers(IReadOnlyList<string> names)
    {
        _validCustomerNames = names
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .Where(n => !InvalidCustomerNames.Contains(n.Trim(), StringComparer.OrdinalIgnoreCase))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
    }

    private bool HasValidCustomer()
    {
        var name = Customer?.Trim();
        if (string.IsNullOrWhiteSpace(name))
            return false;

        return _validCustomerNames.Contains(name);
    }
}
