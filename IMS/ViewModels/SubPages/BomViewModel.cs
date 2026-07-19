using System.Collections.ObjectModel;
using System.Collections.Specialized;
using System.Globalization;
using System.Windows;
using System.Windows.Input;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;
using ApiException = IMS.Services.Api.ApiException;

namespace IMS.ViewModels.SubPages;

public sealed class BomViewModel : SubPageViewModelBase, IProductScanPickerHost
{
    private readonly MainViewModel _host;
    private readonly string _productCode;
    private readonly ProductPickerSupport _productPicker = new();
    private string? _bomId;
    private bool _isEditMode;
    private string _productId = string.Empty;
    private string _productName = string.Empty;
    private string _revision = "Rev A";
    private DateTime? _effectiveFrom = DateTime.Today;
    private string _standardQty = "1";
    private string _barcodeOrProduct = string.Empty;
    private string? _selectedProduct;
    private string _productSearchText = string.Empty;
    private bool _suppressProductAutoAdd;
    private string _consumableScan = string.Empty;
    private string _rawMaterialAmount = "0.00";
    private string _productionAmount = "0";
    private int _nextRawSr = 1;
    private int _nextConsumableSr = 1;

    public BomViewModel(
        MainViewModel host,
        string productId,
        string productCode,
        string productName) : base(
        host,
        parentTitle: "Product / Item Master",
        pageTitle: "Bill of Material (BOM)",
        pageDescription: "Bill of material — components, quantities, and consumables.",
        iconGlyph: "\uE8F1")
    {
        _host = host;
        _productCode = productCode.Trim().ToUpperInvariant();
        ProductId = productId;
        ProductCode = _productCode;
        ProductName = productName;

        RawMaterials = new ObservableCollection<BomRawMaterialLine>();
        Consumables = new ObservableCollection<BomConsumableLine>();
        RawMaterials.CollectionChanged += OnRawMaterialsChanged;
        Consumables.CollectionChanged += OnConsumablesChanged;

        RevisionOptions = ["Rev A", "Rev B", "Rev C"];
        DeleteRawLineCommand = new RelayCommand(p => DeleteRawLine(p));
        DeleteConsumableLineCommand = new RelayCommand(p => DeleteConsumableLine(p));
        AddConsumableLineCommand = new RelayCommand(AddConsumableFromScan);
        BrowseProductsCommand = new RelayCommand(BrowseProducts, () => ShowProductBrowse);
        SaveCommand = new AsyncRelayCommand(SaveAsync);
    }

    public bool IsEditMode
    {
        get => _isEditMode;
        private set => SetProperty(ref _isEditMode, value);
    }

    public bool IsProductHeaderReadOnly => !string.IsNullOrWhiteSpace(_productCode);

    public string ProductId
    {
        get => _productId;
        set => SetProperty(ref _productId, value);
    }

    public string ProductCode { get; }

    public string ProductName
    {
        get => _productName;
        set => SetProperty(ref _productName, value);
    }

    public string Revision
    {
        get => _revision;
        set => SetProperty(ref _revision, value);
    }

    public IReadOnlyList<string> RevisionOptions { get; }

    public DateTime? EffectiveFrom
    {
        get => _effectiveFrom;
        set => SetProperty(ref _effectiveFrom, value);
    }

    public string StandardQty
    {
        get => _standardQty;
        set => SetProperty(ref _standardQty, value);
    }

    public bool ShowProductPicker => false;

    public bool ShowProductBrowse => true;

    public ObservableCollection<string> ProductOptions => _productPicker.Options;

    public string BarcodeOrProduct
    {
        get => _barcodeOrProduct;
        set => SetProperty(ref _barcodeOrProduct, value);
    }

    public string ProductSearchText
    {
        get => _productSearchText;
        set
        {
            if (!SetProperty(ref _productSearchText, value))
                return;

            _productPicker.SearchText = value;
            OnPropertyChanged(nameof(ProductSearchStatus));
            OnPropertyChanged(nameof(IsProductSearchBusy));
            QueueProductSearch();
        }
    }

    public string ProductSearchStatus => _productPicker.StatusHint;

    public bool IsProductSearchBusy => _productPicker.IsSearching;

    public string? SelectedProduct
    {
        get => _selectedProduct;
        set
        {
            if (!SetProperty(ref _selectedProduct, value))
                return;

            if (_suppressProductAutoAdd || string.IsNullOrWhiteSpace(value))
                return;

            if (!_productPicker.TryResolveSelection(value, out var product) || product is null)
            {
                var code = ProductPickerSupport.ParseCode(value);
                if (!string.IsNullOrWhiteSpace(code))
                    _ = PickProductFromPickerAsync(code);
                return;
            }

            _ = AddRawMaterialFromProductAsync(product);
        }
    }

    public string ConsumableScan
    {
        get => _consumableScan;
        set => SetProperty(ref _consumableScan, value);
    }

    public string RawMaterialAmount
    {
        get => _rawMaterialAmount;
        private set => SetProperty(ref _rawMaterialAmount, value);
    }

    public string ProductionAmount
    {
        get => _productionAmount;
        private set => SetProperty(ref _productionAmount, value);
    }

    public ObservableCollection<BomRawMaterialLine> RawMaterials { get; }
    public ObservableCollection<BomConsumableLine> Consumables { get; }

    public ICommand BrowseProductsCommand { get; }
    public ICommand DeleteRawLineCommand { get; }
    public ICommand DeleteConsumableLineCommand { get; }
    public ICommand AddConsumableLineCommand { get; }

    public void AddLineFromScan() => _ = AddLineFromScanAsync();

    public Task RefreshProductSearchAsync()
    {
        _productPicker.ForPurchase = true;
        return _productPicker.RunSearchAsync();
    }

    public async Task ReloadFromApiAsync()
    {
        if (string.IsNullOrWhiteSpace(_productCode))
            return;

        if (!await ImsApiClient.CheckHealthAsync())
            return;

        try
        {
            var bom = await ImsApiClient.GetBomByProductCodeAsync(_productCode);
            if (bom is not null)
                ApplyFromDto(bom, isEdit: true);
        }
        catch (ApiException ex) when (ex.Message.StartsWith("404", StringComparison.Ordinal))
        {
            // No saved BOM for this product yet
        }
        catch (Exception ex)
        {
            MessageBox.Show(ex.Message, "BOM", MessageBoxButton.OK, MessageBoxImage.Warning);
        }
    }

    private void ApplyFromDto(BomDto dto, bool isEdit)
    {
        _bomId = dto.Id;
        IsEditMode = isEdit;
        if (!string.IsNullOrWhiteSpace(dto.ProductId))
            ProductId = dto.ProductId;
        if (!string.IsNullOrWhiteSpace(dto.ProductName))
            ProductName = dto.ProductName!;
        Revision = string.IsNullOrWhiteSpace(dto.Revision) ? "Rev A" : dto.Revision;
        EffectiveFrom = dto.EffectiveFrom ?? DateTime.Today;
        StandardQty = dto.StandardQty.ToString("N0", CultureInfo.InvariantCulture);

        RawMaterials.Clear();
        foreach (var line in (dto.RawMaterials ?? []).OrderBy(x => x.SrNo))
        {
            var row = new BomRawMaterialLine
            {
                SrNo = line.SrNo,
                ItemId = line.ItemId ?? string.Empty,
                ItemCode = line.ItemCode ?? string.Empty,
                ItemName = line.ItemName ?? string.Empty,
                Unit = line.Unit ?? "EA",
                Qty = line.Qty.ToString("N0", CultureInfo.InvariantCulture),
                ScrapPercent = line.ScrapPercent.ToString("N0", CultureInfo.InvariantCulture),
                Rate = line.Rate.ToString("N0", CultureInfo.InvariantCulture)
            };
            row.RecalculateAmount();
            RawMaterials.Add(row);
        }

        Consumables.Clear();
        foreach (var line in (dto.Consumables ?? []).OrderBy(x => x.SrNo))
        {
            var row = new BomConsumableLine
            {
                SrNo = line.SrNo,
                Material = line.Material ?? string.Empty,
                Qty = line.Qty.ToString("N0", CultureInfo.InvariantCulture),
                Rate = line.Rate.ToString("N0", CultureInfo.InvariantCulture)
            };
            row.RecalculateAmount();
            Consumables.Add(row);
        }

        _nextRawSr = RawMaterials.Count > 0 ? RawMaterials.Max(x => x.SrNo) + 1 : 1;
        _nextConsumableSr = Consumables.Count > 0 ? Consumables.Max(x => x.SrNo) + 1 : 1;
        RecalculateTotals();
        PageTitle = IsEditMode ? "Edit Bill of Material (BOM)" : PageTitle;
    }

    private async void BrowseProducts()
    {
        try
        {
            var products = ProductBrowseService.PickProducts(forPurchase: true);
            if (products is null || products.Count == 0)
                return;

            foreach (var product in products)
                await AddRawMaterialFromProductAsync(product);
        }
        catch (Exception ex)
        {
            MessageBox.Show(ex.Message, "BOM — Browse Products", MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    private async Task AddLineFromScanAsync()
    {
        try
        {
            var input = BarcodeOrProduct?.Trim();
            if (string.IsNullOrWhiteSpace(input))
                return;

            var product = ResolveProduct(input)
                ?? await _productPicker.ResolveCodeAsync(input, forPurchase: true)
                ?? await SalesProductLookup.FindAsync(input);
            if (product is not null)
            {
                await AddRawMaterialFromProductAsync(product);
                return;
            }

            MessageBox.Show(
                $"Product \"{input}\" was not found.",
                "BOM — Raw Material",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
        }
        catch (Exception ex)
        {
            MessageBox.Show(ex.Message, "BOM — Raw Material", MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    private static SalesProductInfo? ResolveProduct(string code) =>
        SalesProductLookup.FindLocal(code);

    private void QueueProductSearch()
    {
        _productPicker.ForPurchase = true;
        var dispatcher = Application.Current?.Dispatcher ?? System.Windows.Threading.Dispatcher.CurrentDispatcher;
        _productPicker.QueueSearch(
            async () =>
            {
                await dispatcher.InvokeAsync(() =>
                    OnPropertyChanged(nameof(ProductOptions)));
            },
            () =>
            {
                OnPropertyChanged(nameof(ProductSearchStatus));
                OnPropertyChanged(nameof(IsProductSearchBusy));
            });
    }

    private async Task PickProductFromPickerAsync(string code)
    {
        if (_suppressProductAutoAdd || string.IsNullOrWhiteSpace(code))
            return;

        var product = _productPicker.TryGetByCode(code, out var cached)
            ? cached
            : await _productPicker.ResolveCodeAsync(code, forPurchase: true);

        if (product is not null)
            await AddRawMaterialFromProductAsync(product);
    }

    private async Task AddRawMaterialFromProductAsync(SalesProductInfo product)
    {
        _productPicker.Cache(product);

        var unit = "EA";
        var rate = product.Rate;
        var itemId = product.Code;

        if (await ImsApiClient.CheckHealthAsync())
        {
            try
            {
                var full = await ImsApiClient.GetProductByCodeAsync(product.Code);
                if (full is not null)
                {
                    unit = full.Unit ?? "EA";
                    rate = full.PurchasePrice > 0 ? full.PurchasePrice : full.SalePrice;
                    itemId = full.Id ?? product.Code;
                }
            }
            catch
            {
                // use lookup values
            }
        }

        var existing = RawMaterials.FirstOrDefault(x =>
            string.Equals(x.ItemCode, product.Code, StringComparison.OrdinalIgnoreCase));

        if (existing is not null)
        {
            var qty = (decimal.TryParse(existing.Qty, out var q) ? q : 0) + 1;
            existing.Qty = qty.ToString("N0", CultureInfo.InvariantCulture);
        }
        else
        {
            var line = new BomRawMaterialLine
            {
                SrNo = _nextRawSr++,
                ItemId = itemId,
                ItemCode = product.Code,
                ItemName = product.Name,
                Unit = unit,
                Qty = "1",
                ScrapPercent = "0",
                Rate = rate.ToString("N0", CultureInfo.InvariantCulture)
            };
            line.RecalculateAmount();
            RawMaterials.Add(line);
        }

        ClearScanEntryFields();
        RecalculateTotals();
    }

    private void ClearScanEntryFields()
    {
        BarcodeOrProduct = string.Empty;
        _suppressProductAutoAdd = true;
        _productPicker.ClearSelection();
        _productSearchText = string.Empty;
        _selectedProduct = null;
        OnPropertyChanged(nameof(ProductSearchText));
        OnPropertyChanged(nameof(SelectedProduct));
        OnPropertyChanged(nameof(ProductSearchStatus));
        _suppressProductAutoAdd = false;
    }

    private void DeleteRawLine(object? parameter)
    {
        if (parameter is not BomRawMaterialLine line)
            return;

        var rawLabel = string.IsNullOrWhiteSpace(line.ItemName) ? line.ItemCode : line.ItemName;
        if (!EditDeleteGuard.ConfirmDelete(PageTitle, line.SrNo.ToString(), rawLabel))
            return;

        RawMaterials.Remove(line);
        RenumberRawLines();
        RecalculateTotals();
    }

    private void AddConsumableFromScan()
    {
        var input = ConsumableScan?.Trim();
        if (string.IsNullOrWhiteSpace(input))
            return;

        var materialName = input;
        var rate = 0m;
        var product = SalesProductLookup.FindLocal(input);
        if (product is not null)
            materialName = product.Name;

        var existing = Consumables.FirstOrDefault(x =>
            string.Equals(x.Material, materialName, StringComparison.OrdinalIgnoreCase));
        if (existing is not null)
        {
            var qty = (decimal.TryParse(existing.Qty, out var q) ? q : 0) + 1;
            existing.Qty = qty.ToString("N0", CultureInfo.InvariantCulture);
        }
        else
        {
            var line = new BomConsumableLine
            {
                SrNo = _nextConsumableSr++,
                Material = materialName,
                Qty = "1",
                Rate = rate.ToString("N0", CultureInfo.InvariantCulture)
            };
            line.RecalculateAmount();
            Consumables.Add(line);
        }

        ConsumableScan = string.Empty;
        RecalculateTotals();
    }

    private void DeleteConsumableLine(object? parameter)
    {
        if (parameter is not BomConsumableLine line)
            return;

        if (!EditDeleteGuard.ConfirmDelete(PageTitle, line.SrNo.ToString(), line.Material))
            return;

        Consumables.Remove(line);
        RenumberConsumableLines();
        RecalculateTotals();
    }

    private void RenumberRawLines()
    {
        var sr = 1;
        foreach (var line in RawMaterials)
            line.SrNo = sr++;
        _nextRawSr = sr;
    }

    private void RenumberConsumableLines()
    {
        var sr = 1;
        foreach (var line in Consumables)
            line.SrNo = sr++;
        _nextConsumableSr = sr;
    }

    private void OnRawMaterialsChanged(object? sender, NotifyCollectionChangedEventArgs e)
    {
        if (e.NewItems is not null)
        {
            foreach (BomRawMaterialLine raw in e.NewItems)
                raw.PropertyChanged += (_, _) => RecalculateTotals();
        }

        RecalculateTotals();
    }

    private void OnConsumablesChanged(object? sender, NotifyCollectionChangedEventArgs e)
    {
        if (e.NewItems is not null)
        {
            foreach (BomConsumableLine con in e.NewItems)
                con.PropertyChanged += (_, _) => RecalculateTotals();
        }

        RecalculateTotals();
    }

    private void RecalculateTotals()
    {
        var rawTotal = RawMaterials.Sum(x => decimal.TryParse(x.Amount, out var a) ? a : 0);
        var consumableTotal = Consumables.Sum(x => decimal.TryParse(x.Amount, out var a) ? a : 0);
        RawMaterialAmount = rawTotal.ToString("N2", CultureInfo.InvariantCulture);
        ProductionAmount = (rawTotal + consumableTotal).ToString("N0", CultureInfo.InvariantCulture);
    }

    private async Task SaveAsync()
    {
        if (string.IsNullOrWhiteSpace(ProductCode))
        {
            MessageBox.Show("Product Code is required.", "BOM", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (RawMaterials.Count == 0)
        {
            MessageBox.Show("Add at least one raw material line.", "BOM", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        var dto = BuildDto();
        if (!await ImsApiClient.CheckHealthAsync())
        {
            MessageBox.Show(
                "API is not available. Start the API server to save BOM.",
                "BOM",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
            return;
        }

        try
        {
            var saved = await ImsApiClient.UpsertBomByProductCodeAsync(ProductCode, dto);
            ApplyFromDto(saved, isEdit: true);
            MessageBox.Show(
                IsEditMode ? "BOM updated successfully." : "BOM saved successfully.",
                "Bill of Material",
                MessageBoxButton.OK,
                MessageBoxImage.Information);
            CancelCommand.Execute(null);
        }
        catch (Exception ex)
        {
            MessageBox.Show(ex.Message, "BOM save", MessageBoxButton.OK, MessageBoxImage.Warning);
        }
    }

    private BomDto BuildDto() =>
        new()
        {
            ProductId = ProductId,
            ProductCode = ProductCode,
            ProductName = ProductName,
            Revision = Revision,
            EffectiveFrom = EffectiveFrom,
            StandardQty = decimal.TryParse(StandardQty, out var sq) ? sq : 1,
            RawMaterials = RawMaterials.Select(x => new BomRawLineDto
            {
                SrNo = x.SrNo,
                ItemId = x.ItemId,
                ItemCode = x.ItemCode,
                ItemName = x.ItemName,
                Unit = x.Unit,
                Qty = decimal.TryParse(x.Qty, out var q) ? q : 0,
                ScrapPercent = decimal.TryParse(x.ScrapPercent, out var s) ? s : 0,
                Rate = decimal.TryParse(x.Rate, out var r) ? r : 0,
                Amount = decimal.TryParse(x.Amount, out var a) ? a : 0
            }).ToList(),
            Consumables = Consumables.Select(x => new BomConsumableLineDto
            {
                SrNo = x.SrNo,
                Material = x.Material,
                Qty = decimal.TryParse(x.Qty, out var q) ? q : 0,
                Rate = decimal.TryParse(x.Rate, out var r) ? r : 0,
                Amount = decimal.TryParse(x.Amount, out var a) ? a : 0
            }).ToList(),
            RawMaterialAmount = decimal.TryParse(RawMaterialAmount, out var raw) ? raw : 0,
            ProductionAmount = decimal.TryParse(ProductionAmount, out var prod) ? prod : 0,
            Status = "active"
        };

    public static async Task<BomViewModel> CreateForProductAsync(MainViewModel host, ProductDto product)
    {
        var code = product.Code.Trim().ToUpperInvariant();
        var vm = new BomViewModel(
            host,
            product.Id ?? string.Empty,
            code,
            product.Name);
        await vm.ReloadFromApiAsync();
        return vm;
    }
}
