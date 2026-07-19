using System.Collections.ObjectModel;
using System.Windows.Input;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels;

public sealed class ClosingStockReportViewModel : ViewModelBase, IPageViewLoadAware, IStandardReportViewModel
{
    public string PageTitle => "Closing Stock Report";
    private string _filterProductCode = string.Empty;
    private string _filterProductName = string.Empty;
    private string _filterItemDescription = string.Empty;
    private string? _filterMainName = "(All)";
    private string? _filterProductType = "(All)";
    private string? _filterGodown = "ALL";
    private string _filterBatchNo = string.Empty;
    private DateTime? _dateFrom;
    private DateTime? _dateTo;
    private string _statusMessage = "Click Show to generate the report.";
    private bool _isBusy;
    private string _periodLabel = string.Empty;
    private ClosingStockRow? _totalsRow;

    public ClosingStockReportViewModel()
    {
        var today = DateTime.Today;
        var fyStartYear = today.Month >= 4 ? today.Year : today.Year - 1;
        _dateFrom = new DateTime(fyStartYear, 4, 1);
        _dateTo = DateTime.Today;

        Rows = new ObservableCollection<ClosingStockRow>();
        MainGroupOptions = new ObservableCollection<string> { "(All)" };
        ProductTypeOptions = new ObservableCollection<string> { "(All)" };
        GodownOptions = new ObservableCollection<string> { "ALL" };

        ShowCommand = new RelayCommand(() => _ = LoadReportAsync(), () => !IsBusy);
        PrintCommand = new RelayCommand(PrintReport, () => !IsBusy && Rows.Count > 0);
    }

    public void OnPageViewLoaded() => _ = InitializeFiltersAsync();

    public ObservableCollection<ClosingStockRow> Rows { get; }

    public ObservableCollection<string> MainGroupOptions { get; }

    public ObservableCollection<string> ProductTypeOptions { get; }

    public ObservableCollection<string> GodownOptions { get; }

    public ClosingStockRow? TotalsRow
    {
        get => _totalsRow;
        private set => SetProperty(ref _totalsRow, value);
    }

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

    public string FilterItemDescription
    {
        get => _filterItemDescription;
        set => SetProperty(ref _filterItemDescription, value);
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

    public string? FilterGodown
    {
        get => _filterGodown;
        set => SetProperty(ref _filterGodown, value);
    }

    public string FilterBatchNo
    {
        get => _filterBatchNo;
        set => SetProperty(ref _filterBatchNo, value);
    }

    public DateTime? DateFrom
    {
        get => _dateFrom;
        set => SetProperty(ref _dateFrom, value);
    }

    public DateTime? DateTo
    {
        get => _dateTo;
        set => SetProperty(ref _dateTo, value);
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
            (ShowCommand as RelayCommand)?.RaiseCanExecuteChanged();
            (PrintCommand as RelayCommand)?.RaiseCanExecuteChanged();
        }
    }

    public string PeriodLabel
    {
        get => _periodLabel;
        private set => SetProperty(ref _periodLabel, value);
    }

    public string SummaryText =>
        Rows.Count == 0
            ? StatusMessage
            : $"{Rows.Count} item(s)  •  {PeriodLabel}  •  Total valuation: {TotalsRow?.ValuationDisplay ?? "0"}";

    public ICommand ShowCommand { get; }

    public ICommand PrintCommand { get; }

    private async Task InitializeFiltersAsync()
    {
        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            var mainGroups = await ImsApiClient.GetProductMainGroupsAsync();
            var types = await ImsApiClient.GetProductTypesAsync();
            var warehouses = await ImsApiClient.GetWarehouseNamesAsync();

            MainGroupOptions.Clear();
            MainGroupOptions.Add("(All)");
            foreach (var g in mainGroups.Select(m => m.Name).Where(n => !string.IsNullOrWhiteSpace(n)).Distinct(StringComparer.OrdinalIgnoreCase).OrderBy(n => n))
                MainGroupOptions.Add(g);

            ProductTypeOptions.Clear();
            ProductTypeOptions.Add("(All)");
            foreach (var t in types.Select(x => x.Name).Where(n => !string.IsNullOrWhiteSpace(n)).Distinct(StringComparer.OrdinalIgnoreCase).OrderBy(n => n))
                ProductTypeOptions.Add(t);

            GodownOptions.Clear();
            GodownOptions.Add("ALL");
            foreach (var w in warehouses.Where(n => !string.IsNullOrWhiteSpace(n)).Distinct(StringComparer.OrdinalIgnoreCase).OrderBy(n => n))
                GodownOptions.Add(w);

            await LoadReportAsync();
        }, "Closing Stock");
    }

    private async Task LoadReportAsync()
    {
        IsBusy = true;
        StatusMessage = "Loading…";

        try
        {
            await ApiUiHelper.RunWithApiAsync(async () =>
            {
                var report = await ImsApiClient.GetClosingStockReportAsync(
                    FilterProductCode,
                    FilterProductName,
                    FilterItemDescription,
                    FilterMainName,
                    FilterProductType,
                    FilterGodown,
                    FilterBatchNo,
                    DateFrom,
                    DateTo);

                ApplyReport(report);
            }, "Closing Stock Report");
        }
        finally
        {
            IsBusy = false;
        }
    }

    private void ApplyReport(ClosingStockReportDto? report)
    {
        Rows.Clear();
        TotalsRow = null;

        if (report is null)
        {
            PeriodLabel = string.Empty;
            StatusMessage = "No data returned from API.";
            OnPropertyChanged(nameof(SummaryText));
            (PrintCommand as RelayCommand)?.RaiseCanExecuteChanged();
            return;
        }

        PeriodLabel = $"{report.DateFromLabel} to {report.DateToLabel}";

        foreach (var row in report.Rows)
        {
            Rows.Add(new ClosingStockRow
            {
                SerialNo = row.SerialNo,
                ProductId = row.ProductId,
                ProductName = row.ProductName,
                Unit = row.Unit,
                OpStock = row.OpStock,
                Inward = row.Inward,
                Outward = row.Outward,
                ClosingStock = row.ClosingStock,
                AvgRate = row.AvgRate,
                Valuation = row.Valuation,
                ReorderLevel = row.ReorderLevel
            });
        }

        if (report.Totals is not null)
        {
            TotalsRow = new ClosingStockRow
            {
                ProductName = "Total :",
                OpStock = report.Totals.OpStock,
                Inward = report.Totals.Inward,
                Outward = report.Totals.Outward,
                ClosingStock = report.Totals.ClosingStock,
                Valuation = report.Totals.Valuation
            };
            Rows.Add(TotalsRow);
        }

        StatusMessage = Rows.Count == 0 ? "No rows match the filters." : "Report ready.";
        OnPropertyChanged(nameof(SummaryText));
        (PrintCommand as RelayCommand)?.RaiseCanExecuteChanged();
    }

    private void PrintReport() =>
        ClosingStockPrintService.ShowPreview(
            Rows.ToList(),
            TotalsRow,
            PeriodLabel,
            FilterProductCode,
            FilterProductName,
            FilterMainName,
            FilterProductType,
            FilterGodown);
}
