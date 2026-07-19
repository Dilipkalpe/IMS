using System.Collections.ObjectModel;
using System.Windows.Input;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;

namespace IMS.ViewModels;

public sealed class StockDetailsSummaryReportViewModel : ViewModelBase, IPageViewLoadAware, IStandardReportViewModel
{
    private string _filterProductCode = string.Empty;
    private string _filterProductName = string.Empty;
    private string? _filterMainName = "(All)";
    private string? _filterProductType = "(All)";
    private bool _includeZero;
    private string _statusMessage = "Click Show to generate the report.";
    private bool _isBusy;
    private decimal _totalOnHand;
    private decimal _totalStockValue;
    private decimal _totalShortageQty;
    private int _belowReorderCount;

    public StockDetailsSummaryReportViewModel()
    {
        Rows = new ObservableCollection<StockDetailsSummaryRow>();
        MainGroupOptions = new ObservableCollection<string> { "(All)" };
        ProductTypeOptions = new ObservableCollection<string> { "(All)" };
        ShowCommand = new RelayCommand(() => _ = LoadReportAsync(), () => !IsBusy);
        PrintCommand = null;
    }

    public string PageTitle => "Stock Detailed Summary";
    public ObservableCollection<StockDetailsSummaryRow> Rows { get; }
    public ObservableCollection<string> MainGroupOptions { get; }
    public ObservableCollection<string> ProductTypeOptions { get; }

    public string FilterProductCode
    {
        get => _filterProductCode;
        set => SetProperty(ref _filterProductCode, value);
    }

    public string FilterProductName
    {
        get => _filterProductName;
        set => SetProperty(ref _filterProductName, value);
    }

    public string? FilterMainName
    {
        get => _filterMainName;
        set => SetProperty(ref _filterMainName, value);
    }

    public string? FilterProductType
    {
        get => _filterProductType;
        set => SetProperty(ref _filterProductType, value);
    }

    public bool IncludeZero
    {
        get => _includeZero;
        set => SetProperty(ref _includeZero, value);
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
            if (!SetProperty(ref _isBusy, value)) return;
            (ShowCommand as RelayCommand)?.RaiseCanExecuteChanged();
        }
    }

    public decimal TotalOnHand
    {
        get => _totalOnHand;
        private set => SetProperty(ref _totalOnHand, value);
    }

    public decimal TotalStockValue
    {
        get => _totalStockValue;
        private set => SetProperty(ref _totalStockValue, value);
    }

    public decimal TotalShortageQty
    {
        get => _totalShortageQty;
        private set => SetProperty(ref _totalShortageQty, value);
    }

    public int BelowReorderCount
    {
        get => _belowReorderCount;
        private set => SetProperty(ref _belowReorderCount, value);
    }

    public string SummaryText =>
        Rows.Count == 0
            ? StatusMessage
            : $"{Rows.Count} item(s)  •  On Hand: {Fmt(TotalOnHand)}  •  Value: {Fmt(TotalStockValue)}  •  Shortage: {Fmt(TotalShortageQty)}  •  Below Reorder: {BelowReorderCount}";

    public ICommand ShowCommand { get; }
    public ICommand? PrintCommand { get; }

    public void OnPageViewLoaded() => _ = InitializeFiltersAsync();

    private async Task InitializeFiltersAsync()
    {
        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            var mainGroups = await ImsApiClient.GetProductMainGroupsAsync();
            var types = await ImsApiClient.GetProductTypesAsync();

            MainGroupOptions.Clear();
            MainGroupOptions.Add("(All)");
            foreach (var g in mainGroups.Select(m => m.Name).Where(n => !string.IsNullOrWhiteSpace(n)).Distinct(StringComparer.OrdinalIgnoreCase).OrderBy(n => n))
                MainGroupOptions.Add(g);

            ProductTypeOptions.Clear();
            ProductTypeOptions.Add("(All)");
            foreach (var t in types.Select(x => x.Name).Where(n => !string.IsNullOrWhiteSpace(n)).Distinct(StringComparer.OrdinalIgnoreCase).OrderBy(n => n))
                ProductTypeOptions.Add(t);

            StatusMessage = "Filters loaded. Click Show to generate the report.";
        }, "Stock Summary");
    }

    private async Task LoadReportAsync()
    {
        IsBusy = true;
        StatusMessage = "Loading…";
        try
        {
            await ApiUiHelper.RunWithApiAsync(async () =>
            {
                var report = await ImsApiClient.GetStockDetailsSummaryReportAsync(
                    FilterProductCode,
                    FilterProductName,
                    FilterMainName,
                    FilterProductType,
                    IncludeZero);
                ApplyReport(report);
            }, "Stock Summary");
        }
        finally
        {
            IsBusy = false;
        }
    }

    private void ApplyReport(Services.Api.Dtos.StockDetailsSummaryReportDto? report)
    {
        Rows.Clear();
        if (report is null)
        {
            TotalOnHand = 0;
            TotalStockValue = 0;
            TotalShortageQty = 0;
            BelowReorderCount = 0;
            StatusMessage = "No data returned from API.";
            OnPropertyChanged(nameof(SummaryText));
            return;
        }

        foreach (var row in report.Rows)
        {
            Rows.Add(new StockDetailsSummaryRow
            {
                SerialNo = row.SerialNo,
                ProductCode = row.ProductCode,
                ProductName = row.ProductName,
                MainGroup = row.MainGroup,
                ProductType = row.ProductType,
                Unit = row.Unit,
                OnHandQty = row.OnHandQty,
                PurchaseRate = row.PurchaseRate,
                StockValue = row.StockValue,
                ReorderLevel = row.ReorderLevel,
                ShortageQty = row.ShortageQty,
                Status = row.Status
            });
        }

        TotalOnHand = report.TotalOnHand;
        TotalStockValue = report.TotalStockValue;
        TotalShortageQty = report.TotalShortageQty;
        BelowReorderCount = report.BelowReorderCount;
        StatusMessage = Rows.Count == 0 ? "No stock rows match the filters." : "Report ready.";
        OnPropertyChanged(nameof(SummaryText));
    }

    private static string Fmt(decimal v) => v % 1 == 0 ? v.ToString("N0") : v.ToString("N2");
}

