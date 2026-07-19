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

public abstract class PurchaseEntryFormViewModelBase : SubPageViewModelBase, IProductScanPickerHost
{
    private readonly PurchaseEntryWorkspaceViewModelBase _workspace;
    private readonly PurchaseEntryDefinition _definition;
    private string? _savedDocumentId;
    private IReadOnlyList<string> _suppliers;
    private string _billNo = string.Empty;
    private string _billDate = "19/05/2026";
    private string _buyer = string.Empty;
    private string _supplier = "— Select —";
    private string _supplierDetails = string.Empty;
    private string _barcodeOrProduct = string.Empty;
    private string _barCode = string.Empty;
    private string _productName = string.Empty;
    private string _quickQty = string.Empty;
    private string _mrp = string.Empty;
    private string _quickRate = string.Empty;
    private string _supplierReturn = "0.00";
    private string _payableToSupplier = "0.00";
    private string _narration = string.Empty;
    private string _totQty = "0";
    private string _gross = "0.00";
    private string _discount = "0.00";
    private string _spDiscount = "0.00";
    private string _addOther = "0.00";
    private string _net = "0.00";
    private string _orderAmount = "0.00";
    private string? _selectedProduct;
    private string _productSearchText = string.Empty;
    private bool _suppressProductAutoAdd;
    private string _supplierGstin = string.Empty;
    private string _placeOfSupply = string.Empty;
    private string _sellerGstin = string.Empty;
    private string _paymentType = InvoicePaymentOptions.DefaultPaymentType;
    private string _paymentMode = InvoicePaymentOptions.DefaultPaymentMode;
    private string _paidAmountDisplay = "0.00";

    protected readonly ProductPickerSupport ProductPicker = new();

    protected PurchaseEntryFormViewModelBase(
        MainViewModel host,
        PurchaseEntryWorkspaceViewModelBase workspace,
        int docNo,
        bool forEdit = false)
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

        Buyers = ["— Select —", "Rahul Sharma", "Priya Patel", "Amit Kumar"];
        _suppliers = ["— Select —", "Acme Metals Ltd", "Precision Parts Co", "Global Polymers", "Fastener World"];

        LineItems = new ObservableCollection<SalesLineItem>();
        LineItems.CollectionChanged += OnLineItemsCollectionChanged;
        if (UseSampleLineItems)
            SeedLineItems();

        RecalculateTotals();

        PropertyChanged += (_, e) =>
        {
            if (e.PropertyName is nameof(Net) or nameof(OrderAmount) or nameof(Discount) or nameof(SpDiscount)
                or nameof(PaymentType) or nameof(Supplier) or nameof(PlaceOfSupply))
                RefreshGstSummaryProperties();
        };
        _ = LoadCompanyTaxDefaultsAsync();

        SaveCommand = new AsyncRelayCommand(SaveAndCloseAsync);
        SaveAndNextCommand = new AsyncRelayCommand(SaveAndNextAsync);
        CancelCommand = new RelayCommand(() => _workspace.CloseOrder(this));
        _ = LoadLookupsAsync();
        CloseCommand = CancelCommand;
        NewBillCommand = new RelayCommand(_workspace.AddNewTab);
        NewSupplierCommand = new RelayCommand(() => SupplierDetails = "New supplier (mock)");
        AddLineCommand = new RelayCommand(AddLineFromScan);
        AddLineFromScanCommand = AddLineCommand;
        DeleteLineCommand = new RelayCommand(p => _ = DeleteLineAsync(p), static p => p is SalesLineItem);
        PrintCommand = new AsyncRelayCommand(PrintBillAsync);
        PrintSaveNextCommand = new AsyncRelayCommand(SavePrintAndNextAsync);
        PrintPreviousCommand = new RelayCommand(_workspace.PrintPrevious, () => _workspace.CanPrintPrevious);
        BrowseProductsCommand = new RelayCommand(BrowseProducts, () => ShowProductPicker);
    }

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

    protected virtual bool ProductSearchUsesPurchaseRates => true;

    protected PurchaseEntryWorkspaceViewModelBase Workspace => _workspace;

    protected void CloseEntry() => _workspace.CloseOrder(this);

    public string PrintPreviousLabel => PurchaseEntryCatalog.GetPrintPreviousButtonLabel(EntryType);

    public PurchaseEntryType EntryType { get; }
    public string DocNoLabel => _definition.DocNoLabel;
    public string NewDocButtonText => _definition.NewDocButtonText;
    public string AmountTotalLabel => _definition.AmountTotalLabel;
    public string DocPrefix => _definition.DocPrefix;
    public string FormattedDocNo => $"{DocPrefix}-{BillNo}";

    public IReadOnlyList<string> Buyers { get; }
    public IReadOnlyList<string> Suppliers => _suppliers;
    public ObservableCollection<SalesLineItem> LineItems { get; }

    public IReadOnlyList<string> LineQtyOptions => SalesLineItemOptions.Qty;
    public IReadOnlyList<string> LineRateOptions => SalesLineItemOptions.Rate;
    public IReadOnlyList<string> LineDiscPercentOptions => SalesLineItemOptions.DiscPercent;
    public IReadOnlyList<string> LineDiscValueOptions => SalesLineItemOptions.DiscValue;
    public IReadOnlyList<string> LineTaxTypeOptions => SalesLineItemOptions.TaxType;
    public IReadOnlyList<string> LineTaxPercentOptions => SalesLineItemOptions.TaxPercent;

    public ICommand CloseCommand { get; }
    public ICommand NewBillCommand { get; }
    public ICommand NewSupplierCommand { get; }
    public ICommand AddLineCommand { get; }
    public ICommand AddLineFromScanCommand { get; }
    public ICommand BrowseProductsCommand { get; }
    public ICommand DeleteLineCommand { get; }
    public ICommand PrintCommand { get; }
    public ICommand SaveAndNextCommand { get; }
    public ICommand PrintSaveNextCommand { get; }
    public ICommand PrintPreviousCommand { get; }

    public ICommand RecordPaymentCommand { get; } = new RelayCommand(() => { });

    public string BillNo { get => _billNo; set => SetProperty(ref _billNo, value); }
    public string BillDate { get => _billDate; set => SetProperty(ref _billDate, value); }
    public string Buyer { get => _buyer; set => SetProperty(ref _buyer, value); }
    public string Supplier { get => _supplier; set => SetProperty(ref _supplier, value); }
    public string SupplierDetails { get => _supplierDetails; set => SetProperty(ref _supplierDetails, value); }
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
    public string SupplierReturn { get => _supplierReturn; set => SetProperty(ref _supplierReturn, value); }
    public string PayableToSupplier { get => _payableToSupplier; set => SetProperty(ref _payableToSupplier, value); }
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
    public string OrderAmount { get => _orderAmount; set => SetProperty(ref _orderAmount, value); }

    public virtual bool ShowRecordPaymentAction => false;

    public virtual bool ShowPrintPreviousAction => false;

    public virtual string DocumentTotalLabel => AmountTotalLabel;

    public IReadOnlyList<string> PaymentTypeOptions => InvoicePaymentOptions.PaymentTypes;

    public IReadOnlyList<string> PaymentModeOptions => InvoicePaymentOptions.PaymentModes;

    public IReadOnlyList<string> PlaceOfSupplyOptions => IndianStates.StateOptions;

    public string SupplierGstin
    {
        get => _supplierGstin;
        set => SetProperty(ref _supplierGstin, value);
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

    protected virtual async Task PrintBillAsync()
    {
        if (await PurchaseOrderPrintService.PrintAsync(this).ConfigureAwait(true))
            _workspace.RegisterPrinted(this);
    }

    protected virtual async Task SaveAndCloseAsync()
    {
        if (!await TryPersistAsync())
            return;
        _workspace.CloseOrder(this);
    }

    protected virtual async Task SaveAndNextAsync()
    {
        if (!await TryPersistAsync())
            return;
        await AfterSaveGoNextAsync();
    }

    protected virtual async Task SavePrintAndNextAsync()
    {
        if (!await TryPersistAsync())
            return;

        if (!await PurchaseOrderPrintService.PrintAsync(this).ConfigureAwait(true))
            return;

        _workspace.RegisterPrinted(this);
        await AfterSaveGoNextAsync();
    }

    protected virtual Task AfterSaveGoNextAsync() =>
        RunOnUiThreadAsync(() => _workspace.ContinueWithNextBillAsync(this));

    protected virtual Task<bool> TryPersistAsync() => Task.FromResult(true);

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

    private void SeedLineItems()
    {
        var poLine1 = new SalesLineItem
        {
            Sr = 1,
            ProductRetailCode = "RM-1001",
            ItemDescription = "Steel Sheet 2mm",
            Qty = "10",
            Rate = "85.00",
            DiscPercent = "0",
            DiscValue = "0.00",
            TaxType = "GST",
            TaxPercent = "18"
        };
        poLine1.RecalculateAmount();
        var poLine2 = new SalesLineItem
        {
            Sr = 2,
            ProductRetailCode = "CP-2040",
            ItemDescription = "Motor Housing",
            Qty = "5",
            Rate = "420.00",
            DiscPercent = "2",
            DiscValue = "42.00",
            TaxType = "GST",
            TaxPercent = "18"
        };
        poLine2.RecalculateAmount();
        LineItems.Add(poLine1);
        LineItems.Add(poLine2);
        AttachLineItem(poLine1);
        AttachLineItem(poLine2);
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

        var product = ResolveProduct(input) ?? await FindPurchaseProductAsync(input);
        if (product is not null)
        {
            AddProductLine(product);
            return;
        }

        var sr = LineItems.Count + 1;
        AddOrIncrementLine($"RM{sr:D4}", input, 0m, "1", "0", "0.00");
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

    protected virtual async Task PickProductFromPickerAsync(string code)
    {
        if (_suppressProductAutoAdd || string.IsNullOrWhiteSpace(code))
            return;

        var product = await FindPurchaseProductAsync(code);
        if (product is not null)
            AddProductLine(product);
    }

    protected virtual async Task<SalesProductInfo?> FindPurchaseProductAsync(string input)
    {
        if (ImsApiClient.IsAvailable)
        {
            try
            {
                var lookup = await ImsApiClient.LookupProductAsync(input);
                if (lookup is not null)
                {
                    var fromCatalog = ResolveProduct(lookup.Code);
                    if (fromCatalog is not null)
                        return fromCatalog;

                    var full = await ImsApiClient.GetProductByCodeAsync(lookup.Code);
                    if (full is not null)
                        return SalesProductLookup.FromDtoForPurchase(full);
                }
            }
            catch
            {
                // fall through
            }
        }

        return SalesProductLookup.FindLocal(input);
    }

    protected void AddProductLine(SalesProductInfo product)
    {
        ProductPicker.Cache(product);
        var salesRate = EntryType == PurchaseEntryType.PurchaseInvoice && product.SaleRate > 0
            ? product.SaleRate.ToString("N2")
            : "0.00";
        AddOrIncrementLine(product.Code, product.Name, product.Rate, "1", "0", "0.00", product.TaxType, product.TaxPercent, salesRate, product.StockQty);
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

    protected void AddOrIncrementLine(
        string code,
        string name,
        decimal rate,
        string qty,
        string discPercent,
        string discValue,
        string taxType = "GST",
        string taxPercent = "18",
        string salesRate = "0.00",
        decimal? balStk = null)
    {
        var existing = LineItems.FirstOrDefault(l =>
            string.Equals(l.ProductRetailCode, code, StringComparison.OrdinalIgnoreCase));

        if (existing is not null)
        {
            if (decimal.TryParse(existing.Qty, out var q))
                existing.Qty = (q + 1).ToString("N0");
            if (EntryType == PurchaseEntryType.PurchaseInvoice
                && !string.IsNullOrWhiteSpace(salesRate)
                && salesRate != "0.00")
                existing.SalesRate = salesRate;
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
            SalesRate = salesRate,
            DiscPercent = discPercent,
            DiscValue = discValue,
            TaxType = taxType,
            TaxPercent = taxPercent,
        };
        if (balStk.HasValue)
            line.BalStk = balStk.Value;
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
        OrderAmount = net.ToString("N2");
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

    protected virtual async Task LoadLookupsAsync()
    {
        if (!ImsApiClient.IsAvailable)
            return;

        try
        {
            var names = await ImsApiClient.GetAccountNamesAsync("supplier");
            if (names.Count > 0)
            {
                _suppliers = names;
                OnPropertyChanged(nameof(Suppliers));
            }
        }
        catch
        {
            // keep defaults
        }
    }

}
