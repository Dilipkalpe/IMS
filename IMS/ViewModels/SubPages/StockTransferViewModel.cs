using System.Collections.ObjectModel;
using System.Collections.Specialized;
using System.Windows;
using System.Windows.Input;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels.SubPages;

public sealed class StockTransferViewModel : SubPageViewModelBase
{
    private const decimal StartingStock = 70m;
    private readonly MainViewModel _host;
    private IReadOnlyList<string> _godowns = ["Counter", "Main"];
    private int _nextSrNo = 1;
    private decimal _currentStock = StartingStock;
    private string _entryNo = "1";
    private string? _fromGodown = "Counter";
    private string? _toGodown = "Counter";
    private string _remark = string.Empty;
    private DateTime? _transferDate = new DateTime(2026, 1, 10);
    private string _barcodeOrProduct = string.Empty;

    public StockTransferViewModel(MainViewModel host) : base(
        host,
        parentTitle: "Stock Transfer",
        pageTitle: "Stock Transfer",
        pageDescription: "Inter-godown stock transfer entry.",
        iconGlyph: "\uE8AB")
    {
        _host = host;
        LineItems = new ObservableCollection<StockTransferLineItem>();
        LineItems.CollectionChanged += OnLineItemsCollectionChanged;
        AddLineCommand = new RelayCommand(AddLineFromScan);
        AddLineFromScanCommand = AddLineCommand;
        DeleteLineCommand = new RelayCommand(p => _ = DeleteLineAsync(p), static p => p is StockTransferLineItem);
        SaveCommand = new AsyncRelayCommand(SaveTransferAsync);
        _ = InitializeAsync();
    }

    public IReadOnlyList<string> Godowns => _godowns;
    public ObservableCollection<StockTransferLineItem> LineItems { get; }

    public string CurrentStockDisplay => _currentStock.ToString("N0");

    public string EntryNo
    {
        get => _entryNo;
        set => SetProperty(ref _entryNo, value);
    }

    public string? FromGodown
    {
        get => _fromGodown;
        set => SetProperty(ref _fromGodown, value);
    }

    public string? ToGodown
    {
        get => _toGodown;
        set => SetProperty(ref _toGodown, value);
    }

    public string Remark
    {
        get => _remark;
        set => SetProperty(ref _remark, value);
    }

    public DateTime? TransferDate
    {
        get => _transferDate;
        set => SetProperty(ref _transferDate, value);
    }

    public string BarcodeOrProduct
    {
        get => _barcodeOrProduct;
        set => SetProperty(ref _barcodeOrProduct, value);
    }

    public ICommand AddLineCommand { get; }
    public ICommand AddLineFromScanCommand { get; }
    public ICommand DeleteLineCommand { get; }

    private void AddLineFromScan()
    {
        var input = BarcodeOrProduct?.Trim();
        if (string.IsNullOrWhiteSpace(input))
            return;

        var product = SalesProductLookup.FindLocal(input);
        if (product is not null)
        {
            AddOrIncrementLine(
                product.Code,
                product.Code,
                string.Empty,
                product.Name,
                "8471",
                "B001",
                string.Empty,
                "1",
                "PCS");
        }
        else
        {
            var code = $"ST{LineItems.Count + 1:D4}";
            AddOrIncrementLine(code, code, string.Empty, input, string.Empty, string.Empty, string.Empty, "1", "PCS");
        }

        BarcodeOrProduct = string.Empty;
    }

    private void AddOrIncrementLine(
        string productId,
        string productCode,
        string brandName,
        string productName,
        string hsnCode,
        string batchNo,
        string expDate,
        string qty,
        string unit)
    {
        var existing = LineItems.FirstOrDefault(l =>
            string.Equals(l.ProductCode, productCode, StringComparison.OrdinalIgnoreCase));

        if (existing is not null)
        {
            if (!decimal.TryParse(existing.Qty, out var currentQty))
                currentQty = 0;

            var newQty = currentQty + 1;
            if (GetTotalTransferredQty() - currentQty + newQty > StartingStock)
            {
                MessageBox.Show("Qty exceeds current stock", "Stock Transfer", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            existing.Qty = newQty.ToString("N0");
            RecalculateCurrentStock();
            return;
        }

        if (!decimal.TryParse(qty, out var addQty) || addQty <= 0)
            addQty = 1;

        if (GetTotalTransferredQty() + addQty > StartingStock)
        {
            MessageBox.Show("Qty exceeds current stock", "Stock Transfer", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        LineItems.Add(new StockTransferLineItem
        {
            SrNo = _nextSrNo++,
            ProductId = productId,
            ProductCode = productCode,
            BrandName = brandName,
            ProductName = productName,
            HsnCode = hsnCode,
            BatchNo = batchNo,
            ExpDate = expDate,
            Qty = addQty.ToString("N0"),
            Unit = unit
        });

        RecalculateCurrentStock();
    }

    private async Task DeleteLineAsync(object? parameter)
    {
        if (parameter is not StockTransferLineItem line)
            return;

        var label = string.IsNullOrWhiteSpace(line.ProductName) ? line.ProductCode : line.ProductName;
        var recordKey = $"{EntryNo}:{line.SrNo}";
        if (!await EditDeleteGuard.AuthorizeDeleteAsync(PageTitle, recordKey, label))
            return;

        LineItems.Remove(line);
        RenumberLines();
        RecalculateCurrentStock();
    }

    private void OnLineItemsCollectionChanged(object? sender, NotifyCollectionChangedEventArgs e)
    {
        if (e.NewItems is null)
            return;
        foreach (StockTransferLineItem line in e.NewItems)
            AttachLineItem(line);
    }

    private void AttachLineItem(StockTransferLineItem line) =>
        line.PropertyChanged += (_, e) =>
        {
            if (e.PropertyName == nameof(StockTransferLineItem.Qty))
                RecalculateCurrentStock();
        };

    private void RenumberLines()
    {
        for (var i = 0; i < LineItems.Count; i++)
            LineItems[i].SrNo = i + 1;
        _nextSrNo = LineItems.Count + 1;
    }

    private decimal GetTotalTransferredQty()
    {
        decimal total = 0;
        foreach (var line in LineItems)
        {
            if (decimal.TryParse(line.Qty, out var q))
                total += q;
        }

        return total;
    }

    private void RecalculateCurrentStock()
    {
        _currentStock = Math.Max(0, StartingStock - GetTotalTransferredQty());
        OnPropertyChanged(nameof(CurrentStockDisplay));
    }

    private async Task InitializeAsync()
    {
        if (!ImsApiClient.IsAvailable)
            return;

        try
        {
            var godowns = await ImsApiClient.GetWarehouseNamesAsync();
            if (godowns.Count > 0)
            {
                _godowns = godowns;
                OnPropertyChanged(nameof(Godowns));
                FromGodown ??= _godowns[0];
                ToGodown ??= _godowns.Count > 1 ? _godowns[1] : _godowns[0];
            }

            _currentStock = await ImsApiClient.GetStockAvailabilityAsync(FromGodown, null);
            OnPropertyChanged(nameof(CurrentStockDisplay));
        }
        catch
        {
            // keep defaults
        }
    }

    private async Task SaveTransferAsync()
    {
        if (ImsApiClient.IsAvailable)
        {
            var ok = false;
            await ApiUiHelper.RunWithApiAsync(async () =>
            {
                var dto = new StockTransferDto
                {
                    EntryNo = EntryNo,
                    FromGodown = FromGodown,
                    ToGodown = ToGodown,
                    TransferDate = TransferDate,
                    Remark = Remark,
                    Lines = LineItems.Select(l => new StockTransferLineDto
                    {
                        SrNo = l.SrNo,
                        ProductId = l.ProductId,
                        ProductCode = l.ProductCode,
                        BrandName = l.BrandName,
                        ProductName = l.ProductName,
                        HsnCode = l.HsnCode,
                        BatchNo = l.BatchNo,
                        ExpDate = l.ExpDate,
                        Qty = l.Qty,
                        Unit = l.Unit
                    }).ToList()
                };
                await ImsApiClient.CreateStockTransferAsync(dto);
                ok = true;
            });
            if (!ok)
                return;

            MessageBox.Show("Stock transfer saved.", "Stock Transfer",
                MessageBoxButton.OK, MessageBoxImage.Information);
        }
        else
        {
            MessageBox.Show("Stock Transfer Saved (offline mode)", "Stock Transfer",
                MessageBoxButton.OK, MessageBoxImage.Information);
        }

        _host.GoBack();
    }
}
