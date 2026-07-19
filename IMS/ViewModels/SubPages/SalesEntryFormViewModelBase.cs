using System.Collections.ObjectModel;
using System.Collections.Specialized;
using System.ComponentModel;
using System.Net.Http;
using System.Windows;
using System.Windows.Input;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;

namespace IMS.ViewModels.SubPages;

public abstract class SalesEntryFormViewModelBase : SubPageViewModelBase, IProductScanPickerHost
{
    private readonly SalesEntryWorkspaceViewModelBase _workspace;
    private readonly SalesEntryDefinition _definition;
    private string? _savedDocumentId;
    private IReadOnlyList<string> _customers;
    private string _billNo = string.Empty;
    private string _billDate = "19/05/2026";
    private string _salesMan = string.Empty;
    private string _customer = "Walk In";
    private string _customerDetails = string.Empty;
    private string _barcodeOrProduct = string.Empty;
    private string _barCode = string.Empty;
    private string _productName = string.Empty;
    private string _quickQty = string.Empty;
    private string _mrp = string.Empty;
    private string _quickRate = string.Empty;
    private string _customerReturn = "0.00";
    private string _receivableToCustomer = "0.00";
    private string _narration = string.Empty;
    private string _totQty = "0";
    private string _gross = "0.00";
    private string _discount = "0.00";
    private string _spDiscount = "0.00";
    private string _addOther = "0.00";
    private string _net = "0.00";
    private string _saleAmount = "0.00";
    private string? _selectedProduct;
    private string _productSearchText = string.Empty;
    private bool _suppressProductAutoAdd;
    private string _customerGstin = string.Empty;
    private string _placeOfSupply = string.Empty;
    private string _sellerGstin = string.Empty;
    private string _paymentType = InvoicePaymentOptions.DefaultPaymentType;
    private string _paymentMode = InvoicePaymentOptions.DefaultPaymentMode;
    private string _paidAmountDisplay = "0.00";

    protected readonly ProductPickerSupport ProductPicker = new();

    protected SalesEntryFormViewModelBase(
        MainViewModel host,
        SalesEntryWorkspaceViewModelBase workspace,
        int docNo)
        : base(
            host,
            workspace.Definition.NavTitle,
            $"{workspace.Definition.CounterLabel} — new entry",
            string.Empty,
            workspace.Definition.IconGlyph)
    {
        _workspace = workspace;
        _definition = workspace.Definition;
        EntryType = workspace.EntryType;
        BillNo = docNo.ToString();

        SalesMen = ["— Select —", "Rahul Sharma", "Priya Patel", "Amit Kumar"];
        _customers = ["Walk In", "North Industries", "Delta Manufacturing", "Pacific Utilities", "Summit Corp"];

        LineItems = new ObservableCollection<SalesLineItem>();
        LineItems.CollectionChanged += OnLineItemsCollectionChanged;
        if (UseSampleLineItems)
            SeedLineItems();

        RecalculateTotals();

        PropertyChanged += (_, e) =>
        {
            if (e.PropertyName is nameof(Net) or nameof(SaleAmount) or nameof(Discount) or nameof(SpDiscount)
                or nameof(PaymentType) or nameof(Customer) or nameof(PlaceOfSupply))
                RefreshGstSummaryProperties();
        };
        _ = LoadCompanyTaxDefaultsAsync();

        SaveCommand = new AsyncRelayCommand(SaveAndCloseAsync);
        SaveAndNextCommand = new AsyncRelayCommand(SaveAndNextAsync);
        CancelCommand = new RelayCommand(() => workspace.CloseOrder(this));
        _ = LoadLookupsAsyncInternal();
        CloseCommand = CancelCommand;
        NewBillCommand = new RelayCommand(workspace.AddNewTab);
        NewCustomerCommand = new RelayCommand(() => CustomerDetails = "New customer (mock)");
        AddLineCommand = new RelayCommand(AddLineFromScan);
        AddLineFromScanCommand = AddLineCommand;
        DeleteLineCommand = new RelayCommand(p => _ = DeleteLineAsync(p), static p => p is SalesLineItem);
        PrintCommand = new AsyncRelayCommand(PrintBillAsync);
        PrintSaveNextCommand = new AsyncRelayCommand(SavePrintAndNextAsync);
        PrintPreviousCommand = new RelayCommand(workspace.PrintPrevious, () => workspace.CanPrintPrevious);
        BrowseProductsCommand = new RelayCommand(BrowseProducts, () => ShowProductPicker);
    }

    public SalesEntryType EntryType { get; }
    public string DocNoLabel => _definition.DocNoLabel;
    public string NewDocButtonText => _definition.NewDocButtonText;
    public string AmountTotalLabel => _definition.AmountTotalLabel;
    public string PrintPreviousLabel => SalesEntryCatalog.GetPrintPreviousButtonLabel(EntryType);
    public string DocPrefix => _definition.DocPrefix;
    public string FormattedDocNo => $"{DocPrefix}-{BillNo}";

    public IReadOnlyList<string> SalesMen { get; }
    public IReadOnlyList<string> Customers => _customers;
    public ObservableCollection<SalesLineItem> LineItems { get; }

    public IReadOnlyList<string> LineQtyOptions => SalesLineItemOptions.Qty;
    public IReadOnlyList<string> LineRateOptions => SalesLineItemOptions.Rate;
    public IReadOnlyList<string> LineDiscPercentOptions => SalesLineItemOptions.DiscPercent;
    public IReadOnlyList<string> LineDiscValueOptions => SalesLineItemOptions.DiscValue;
    public IReadOnlyList<string> LineTaxTypeOptions => SalesLineItemOptions.TaxType;
    public IReadOnlyList<string> LineTaxPercentOptions => SalesLineItemOptions.TaxPercent;

    protected virtual bool UseSampleLineItems => true;

    public virtual bool ShowProductPicker => false;

    public ObservableCollection<string> ProductOptions => ProductPicker.Options;

    public string ProductSearchText
    {
        get => _productSearchText;
        set
        {
            if (!SetProperty(ref _productSearchText, value))
                return;

            ProductPicker.SearchText = value;
            OnPropertyChanged(nameof(ProductSearchStatus));
            OnPropertyChanged(nameof(IsProductSearchBusy));
            QueueProductSearch();
        }
    }

    public string ProductSearchStatus => ProductPicker.StatusHint;

    public bool IsProductSearchBusy => ProductPicker.IsSearching;

    public string? SelectedProduct
    {
        get => _selectedProduct;
        set
        {
            if (!SetProperty(ref _selectedProduct, value))
                return;

            if (_suppressProductAutoAdd || string.IsNullOrWhiteSpace(value))
                return;

            if (!ProductPicker.TryResolveSelection(value, out var product) || product is null)
            {
                var code = ProductPickerSupport.ParseCode(value);
                if (!string.IsNullOrWhiteSpace(code))
                    _ = PickProductFromPickerAsync(code);
                return;
            }

            AddProductLine(product);
        }
    }

    public ICommand CloseCommand { get; }
    public ICommand NewBillCommand { get; }
    public ICommand NewCustomerCommand { get; }
    public ICommand AddLineCommand { get; }
    public ICommand AddLineFromScanCommand { get; }
    public ICommand BrowseProductsCommand { get; }
    public ICommand DeleteLineCommand { get; }
    public ICommand PrintCommand { get; }
    public ICommand SaveAndNextCommand { get; }
    public ICommand PrintSaveNextCommand { get; protected set; }
    public ICommand PrintPreviousCommand { get; }

    public ICommand RecordPaymentCommand { get; } = new RelayCommand(() => { });

    protected SalesEntryWorkspaceViewModelBase Workspace => _workspace;

    public string BillNo { get => _billNo; set => SetProperty(ref _billNo, value); }
    public string BillDate { get => _billDate; set => SetProperty(ref _billDate, value); }
    public string SalesMan { get => _salesMan; set => SetProperty(ref _salesMan, value); }
    public string Customer { get => _customer; set => SetProperty(ref _customer, value); }
    public string CustomerDetails { get => _customerDetails; set => SetProperty(ref _customerDetails, value); }
    public string BarcodeOrProduct
    {
        get => _barcodeOrProduct;
        set => SetProperty(ref _barcodeOrProduct, value);
    }

    public string BarCode { get => _barCode; set => SetProperty(ref _barCode, value); }
    public string ProductName { get => _productName; set => SetProperty(ref _productName, value); }
    public string QuickQty { get => _quickQty; set => SetProperty(ref _quickQty, value); }
    public string Mrp { get => _mrp; set => SetProperty(ref _mrp, value); }
    public string QuickRate { get => _quickRate; set => SetProperty(ref _quickRate, value); }
    public string CustomerReturn { get => _customerReturn; set => SetProperty(ref _customerReturn, value); }
    public string ReceivableToCustomer { get => _receivableToCustomer; set => SetProperty(ref _receivableToCustomer, value); }
    public string Narration { get => _narration; set => SetProperty(ref _narration, value); }
    public string TotQty { get => _totQty; set => SetProperty(ref _totQty, value); }
    public string Gross { get => _gross; set => SetProperty(ref _gross, value); }
    public string Discount
    {
        get => _discount;
        set
        {
            if (SetProperty(ref _discount, value))
                RecalculateTotals();
        }
    }

    public string SpDiscount
    {
        get => _spDiscount;
        set
        {
            if (SetProperty(ref _spDiscount, value))
                RecalculateTotals();
        }
    }
    public string AddOther { get => _addOther; set => SetProperty(ref _addOther, value); }
    public string Net { get => _net; set => SetProperty(ref _net, value); }
    public string SaleAmount { get => _saleAmount; set => SetProperty(ref _saleAmount, value); }

    public virtual bool ShowRecordPaymentAction => false;

    public virtual bool ShowPrintPreviousAction => false;

    public virtual string DocumentTotalLabel => AmountTotalLabel;

    public IReadOnlyList<string> PaymentTypeOptions => InvoicePaymentOptions.PaymentTypes;

    public IReadOnlyList<string> PaymentModeOptions => InvoicePaymentOptions.PaymentModes;

    public IReadOnlyList<string> PlaceOfSupplyOptions => IndianStates.StateOptions;

    public string CustomerGstin
    {
        get => _customerGstin;
        set => SetProperty(ref _customerGstin, value);
    }

    public string PlaceOfSupply
    {
        get => _placeOfSupply;
        set
        {
            if (!SetProperty(ref _placeOfSupply, value))
                return;
            OnPropertyChanged(nameof(IsInterStateTax));
            NotifyLineItemsTaxChanged();
            RefreshGstSummaryProperties();
        }
    }

    public string SellerGstin => _sellerGstin;

    public bool IsInterStateTax => GstEntrySummarySupport.IsInterState(PlaceOfSupply);

    public string PaymentType
    {
        get => _paymentType;
        set
        {
            if (!SetProperty(ref _paymentType, value))
                return;
            OnPropertyChanged(nameof(IsPaymentModeEnabled));
        }
    }

    public string PaymentMode
    {
        get => _paymentMode;
        set => SetProperty(ref _paymentMode, value);
    }

    public bool IsPaymentModeEnabled =>
        !string.Equals(PaymentType, "Credit", StringComparison.OrdinalIgnoreCase);

    public string PaidAmountDisplay
    {
        get => _paidAmountDisplay;
        protected set => SetProperty(ref _paidAmountDisplay, value);
    }

    public string TotalTaxableDisplay => GstEntrySummarySupport.TotalTaxable(LineItems);

    public string TotalCgstDisplay => GstEntrySummarySupport.TotalCgst(LineItems, IsInterStateTax);

    public string TotalSgstDisplay => GstEntrySummarySupport.TotalSgst(LineItems, IsInterStateTax);

    public string TotalIgstDisplay => GstEntrySummarySupport.TotalIgst(LineItems, IsInterStateTax);

    public string TotalDiscountDisplay => GstEntrySummarySupport.TotalDiscount(Discount, SpDiscount);

    public string InvoiceTotalDisplay => Net;

    public string BalanceDueDisplay => GstEntrySummarySupport.BalanceDue(Net, PaidAmountDisplay);

    public string RoundOffDisplay => GstEntrySummarySupport.RoundOff(Net);

    private async Task PrintBillAsync()
    {
        if (await SalesOrderPrintService.PrintAsync(this).ConfigureAwait(true))
            _workspace.RegisterPrinted(this);
    }

    protected virtual async Task SavePrintAndNextAsync()
    {
        if (!await TryPersistAsync())
            return;

        if (!await SalesOrderPrintService.PrintAsync(this).ConfigureAwait(true))
            return;

        _workspace.RegisterPrinted(this);
        await RunOnUiThreadAsync(() => _ = _workspace.ContinueWithNextBillAsync(this));
    }

    private void SeedLineItems()
    {
        AddOrIncrementLine("10001", "Sample Product A", 150.00m, "2", "0", "0.00");
        var line2 = new SalesLineItem
        {
            Sr = 2,
            ProductRetailCode = "10002",
            ItemDescription = "Sample Product B",
            Qty = "1",
            Rate = "320.00",
            DiscPercent = "5",
            DiscValue = "16.00",
            TaxType = "GST",
            TaxPercent = "18"
        };
        line2.RecalculateAmount();
        LineItems.Add(line2);
        AttachLineItem(line2);
    }

    public virtual void AddLineFromScan() => _ = AddLineFromScanAsync();

    protected void BrowseProducts()
    {
        if (!ShowProductPicker)
            return;

        var products = ProductBrowseService.PickProducts(ProductSearchUsesPurchaseRates);
        if (products is null || products.Count == 0)
            return;

        foreach (var product in products)
            AddProductLine(product);
    }

    protected async Task AddLineFromScanAsync()
    {
        var input = BarcodeOrProduct?.Trim();
        if (string.IsNullOrWhiteSpace(input))
            return;

        var product = ResolveProduct(input)
            ?? (ShowProductPicker
                ? await ProductPicker.ResolveCodeAsync(input, ProductSearchUsesPurchaseRates)
                : null)
            ?? await SalesProductLookup.FindAsync(input);
        if (product is not null)
        {
            AddProductLine(product);
            return;
        }

        var sr = LineItems.Count + 1;
        AddOrIncrementLine($"P{sr:D4}", input, 0m, "1", "0", "0.00");
        ClearScanEntryFields();
        RecalculateTotals();
    }

    protected virtual SalesProductInfo? ResolveProduct(string code) =>
        ProductPicker.TryGetByCode(code, out var product) ? product : SalesProductLookup.FindLocal(code);

    protected void QueueProductSearch()
    {
        if (!ShowProductPicker)
            return;

        ProductPicker.ForPurchase = ProductSearchUsesPurchaseRates;
        ProductPicker.QueueSearch(
            async () => await RunOnUiThreadAsync(() => OnPropertyChanged(nameof(ProductOptions))),
            () =>
            {
                OnPropertyChanged(nameof(ProductSearchStatus));
                OnPropertyChanged(nameof(IsProductSearchBusy));
            });
    }

    public Task RefreshProductSearchAsync()
    {
        ProductPicker.ForPurchase = ProductSearchUsesPurchaseRates;
        return ProductPicker.RunSearchAsync();
    }

    protected virtual bool ProductSearchUsesPurchaseRates => false;

    protected virtual async Task PickProductFromPickerAsync(string code)
    {
        if (_suppressProductAutoAdd || string.IsNullOrWhiteSpace(code))
            return;

        var product = ProductPicker.TryGetByCode(code, out var cached)
            ? cached
            : await ProductPicker.ResolveCodeAsync(code, ProductSearchUsesPurchaseRates);

        if (product is not null)
            AddProductLine(product);
    }

    protected void AddProductLine(SalesProductInfo product)
    {
        if (EntryType == SalesEntryType.SalesInvoice)
        {
            _ = AddSalesInvoiceProductLineAsync(product);
            return;
        }

        AddProductLineWithRate(product, product.Rate);
    }

    private async Task AddSalesInvoiceProductLineAsync(SalesProductInfo product)
    {
        var resolution = await SalesRateResolver.ResolveForSalesInvoiceAsync(product.Code, product);
        var rate = resolution.Rate > 0 ? resolution.Rate : product.Rate;

        if (!string.IsNullOrWhiteSpace(resolution.WarningMessage))
        {
            await RunOnUiThreadAsync(() =>
                MessageBox.Show(
                    Application.Current?.MainWindow,
                    resolution.WarningMessage,
                    "Sales rate",
                    MessageBoxButton.OK,
                    MessageBoxImage.Information));
        }

        await RunOnUiThreadAsync(() => AddProductLineWithRate(product, rate));
    }

    private void AddProductLineWithRate(SalesProductInfo product, decimal rate)
    {
        ProductPicker.Cache(product);
        AddOrIncrementLine(product.Code, product.Name, rate, "1", "0", "0.00", product.TaxType, product.TaxPercent);
        ClearScanEntryFields();
        RecalculateTotals();
    }

    protected virtual void ClearScanEntryFields()
    {
        BarcodeOrProduct = string.Empty;
        _suppressProductAutoAdd = true;
        ProductPicker.ClearSelection();
        _productSearchText = string.Empty;
        _selectedProduct = null;
        OnPropertyChanged(nameof(ProductSearchText));
        OnPropertyChanged(nameof(SelectedProduct));
        OnPropertyChanged(nameof(ProductSearchStatus));
        _suppressProductAutoAdd = false;
    }

    protected void TryAddProductLine(string? codeOrTerm, bool showNotFoundMessage = false)
    {
        var input = codeOrTerm?.Trim();
        if (string.IsNullOrWhiteSpace(input))
            return;

        var product = ResolveProduct(input) ?? SalesProductLookup.FindLocal(input);
        if (product is not null)
        {
            AddProductLine(product);
            return;
        }

        if (showNotFoundMessage)
        {
            _ = AddLineFromScanAsync();
        }
    }

    protected void AddOrIncrementLine(
        string code,
        string name,
        decimal rate,
        string qty,
        string discPercent,
        string discValue,
        string taxType = "GST",
        string taxPercent = "18")
    {
        var existing = LineItems.FirstOrDefault(l =>
            string.Equals(l.ProductRetailCode, code, StringComparison.OrdinalIgnoreCase));

        if (existing is not null)
        {
            if (decimal.TryParse(existing.Qty, out var q))
                existing.Qty = (q + 1).ToString("N0");
            existing.RecalculateAmount();
            RecalculateTotals();
            return;
        }

        var line = new SalesLineItem
        {
            Sr = LineItems.Count + 1,
            ProductRetailCode = code,
            ItemDescription = name,
            Qty = qty,
            Rate = rate.ToString("N2"),
            DiscPercent = discPercent,
            DiscValue = discValue,
            TaxType = taxType,
            TaxPercent = taxPercent
        };
        line.RecalculateAmount();
        LineItems.Add(line);
    }

    private void OnLineItemsCollectionChanged(object? sender, NotifyCollectionChangedEventArgs e)
    {
        if (e.NewItems is null)
            return;
        foreach (SalesLineItem line in e.NewItems)
            AttachLineItem(line);
    }

    private void AttachLineItem(SalesLineItem line) =>
        line.PropertyChanged += (_, e) =>
        {
            if (e.PropertyName is nameof(SalesLineItem.Qty) or nameof(SalesLineItem.Rate)
                or nameof(SalesLineItem.DiscPercent) or nameof(SalesLineItem.DiscValue)
                or nameof(SalesLineItem.TaxPercent) or nameof(SalesLineItem.Amount))
                RecalculateTotals();
        };

    private void AddLineFromQuickEntry() => AddLineFromScan();

    private async Task DeleteLineAsync(object? parameter)
    {
        if (parameter is not SalesLineItem line)
            return;

        var recordKey = $"{BillNo}:{line.Sr}";
        if (!await EditDeleteGuard.AuthorizeDeleteAsync(_definition.NavTitle, recordKey, line.ProductRetailCode))
            return;

        LineItems.Remove(line);
        RenumberLines();
        RecalculateTotals();
    }

    private void RenumberLines()
    {
        for (var i = 0; i < LineItems.Count; i++)
            LineItems[i].Sr = i + 1;
    }

    protected void RecalculateTotals()
    {
        decimal gross = 0;
        decimal qty = 0;
        foreach (var line in LineItems)
        {
            if (decimal.TryParse(line.Qty, out var q)) qty += q;
            if (decimal.TryParse(line.Amount, out var a)) gross += a;
        }

        TotQty = qty.ToString("N0");
        Gross = gross.ToString("N2");
        if (!decimal.TryParse(Discount, out var disc)) disc = 0;
        if (!decimal.TryParse(SpDiscount, out var sp)) sp = 0;
        if (!decimal.TryParse(AddOther, out var other)) other = 0;
        var net = gross - disc - sp + other;
        Net = net.ToString("N2");
        SaleAmount = net.ToString("N2");
        RefreshGstSummaryProperties();
    }

    protected void RefreshGstSummaryProperties()
    {
        OnPropertyChanged(nameof(TotalTaxableDisplay));
        OnPropertyChanged(nameof(TotalCgstDisplay));
        OnPropertyChanged(nameof(TotalSgstDisplay));
        OnPropertyChanged(nameof(TotalIgstDisplay));
        OnPropertyChanged(nameof(TotalDiscountDisplay));
        OnPropertyChanged(nameof(InvoiceTotalDisplay));
        OnPropertyChanged(nameof(BalanceDueDisplay));
        OnPropertyChanged(nameof(RoundOffDisplay));
        OnPropertyChanged(nameof(IsInterStateTax));
    }

    protected void NotifyLineItemsTaxChanged()
    {
        foreach (var line in LineItems)
            line.NotifyTaxComputedChanged();
    }

    protected async Task LoadCompanyTaxDefaultsAsync()
    {
        await CompanyProfileService.RefreshAsync();
        _sellerGstin = CompanyProfileService.Current.Gstin;
        OnPropertyChanged(nameof(SellerGstin));

        if (string.IsNullOrWhiteSpace(PlaceOfSupply))
            PlaceOfSupply = CompanyProfileService.Current.PlaceOfSupply;
    }

    private async Task LoadLookupsAsyncInternal() => await LoadLookupsAsync();

    protected void SetCustomers(IReadOnlyList<string> names)
    {
        _customers = names;
        OnPropertyChanged(nameof(Customers));
    }

    protected virtual async Task LoadLookupsAsync()
    {
        if (!ImsApiClient.IsAvailable)
            return;

        try
        {
            var names = await ImsApiClient.GetAccountNamesAsync("customer");
            if (names.Count > 0)
                SetCustomers(names);
        }
        catch
        {
            // keep defaults
        }
    }

    protected virtual async Task SaveAndCloseAsync()
    {
        if (!await TryPersistAsync())
            return;

        await RunOnUiThreadAsync(CloseEntry);
    }

    protected virtual async Task SaveAndNextAsync()
    {
        if (!await TryPersistAsync())
            return;

        await RunOnUiThreadAsync(() => _ = Workspace.ContinueWithNextBillAsync(this));
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

    protected virtual async Task<bool> TryPersistAsync()
    {
        if (!ImsApiClient.IsAvailable)
            return true;

        try
        {
            var dto = ApiDocumentMapper.FromSalesForm(this, _savedDocumentId);
            var saved = await ImsApiClient.SaveDocumentAsync(dto);
            _savedDocumentId = saved.Id;
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

    protected void CloseEntry() => _workspace.CloseOrder(this);
}
