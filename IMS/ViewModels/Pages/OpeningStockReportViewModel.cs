using System.Collections.ObjectModel;
using System.Windows.Input;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels;

public sealed class OpeningStockReportViewModel : ViewModelBase, IPageViewLoadAware, IStandardReportViewModel
{
    public string PageTitle => "Opening Stock Report";
    private string _filterProductCode = string.Empty;
    private string _filterProductName = string.Empty;
    private string? _filterMainName = "(All)";
    private string? _filterProductType = "(All)";
    private DateTime? _asOnDate;
    private string _statusMessage = "Click Show to generate the report.";
    private bool _isBusy;
    private decimal _totalValuation;
    private decimal _totalQty;
    private int _rowCount;
    private string _dateLabel = string.Empty;

    public OpeningStockReportViewModel()
    {
        _asOnDate = new DateTime(DateTime.Today.Year - 1, 12, 31);
        Rows = new ObservableCollection<OpeningStockRow>();
        MainGroupOptions = new ObservableCollection<string> { "(All)" };
        ProductTypeOptions = new ObservableCollection<string> { "(All)" };

        ShowCommand = new RelayCommand(() => _ = LoadReportAsync(), () => !IsBusy);
        PrintCommand = new RelayCommand(PrintReport, () => !IsBusy && Rows.Count > 0);
    }

    public void OnPageViewLoaded() => _ = InitializeFiltersAsync();

    public ObservableCollection<OpeningStockRow> Rows { get; }

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

    public DateTime? AsOnDate
    {
        get => _asOnDate;
        set => SetProperty(ref _asOnDate, value);
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

    public decimal TotalValuation
    {
        get => _totalValuation;
        private set => SetProperty(ref _totalValuation, value);
    }

    public decimal TotalQty
    {
        get => _totalQty;
        private set => SetProperty(ref _totalQty, value);
    }

    public int RowCount
    {
        get => _rowCount;
        private set => SetProperty(ref _rowCount, value);
    }

    public string DateLabel
    {
        get => _dateLabel;
        private set => SetProperty(ref _dateLabel, value);
    }

    public string TotalValuationDisplay => FormatMoney(TotalValuation);

    public string SummaryText =>
        RowCount == 0
            ? StatusMessage
            : $"{RowCount} item(s)  •  Total Qty: {FormatQty(TotalQty)}  •  Total Valuation: {TotalValuationDisplay}  •  As on: {DateLabel}";

    public ICommand ShowCommand { get; }

    public ICommand PrintCommand { get; }

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
        }, "Opening Stock");
    }

    private async Task LoadReportAsync()
    {
        IsBusy = true;
        StatusMessage = "Loading…";

        try
        {
            await ApiUiHelper.RunWithApiAsync(async () =>
            {
                var report = await ImsApiClient.GetOpeningStockReportAsync(
                    FilterProductCode,
                    FilterProductName,
                    FilterMainName,
                    FilterProductType,
                    AsOnDate);

                ApplyReport(report);
            }, "Opening Stock Report");
        }
        finally
        {
            IsBusy = false;
        }
    }

    private void ApplyReport(OpeningStockReportDto? report)
    {
        Rows.Clear();
        if (report is null)
        {
            TotalValuation = 0;
            TotalQty = 0;
            RowCount = 0;
            DateLabel = string.Empty;
            StatusMessage = "No data returned from API.";
            OnPropertyChanged(nameof(SummaryText));
            OnPropertyChanged(nameof(TotalValuationDisplay));
            (PrintCommand as RelayCommand)?.RaiseCanExecuteChanged();
            return;
        }

        foreach (var row in report.Rows)
        {
            Rows.Add(new OpeningStockRow
            {
                SerialNo = row.SerialNo,
                ItemId = row.ItemId,
                ItemName = row.ItemName,
                Unit = row.Unit,
                Date = row.Date,
                Qty = row.Qty,
                Rate = row.Rate,
                Valuation = row.Valuation
            });
        }

        TotalValuation = report.TotalValuation;
        TotalQty = report.TotalQty;
        RowCount = report.Count;
        DateLabel = report.DateLabel;
        StatusMessage = RowCount == 0 ? "No opening stock rows match the filters." : "Report ready.";
        OnPropertyChanged(nameof(SummaryText));
        OnPropertyChanged(nameof(TotalValuationDisplay));
        (PrintCommand as RelayCommand)?.RaiseCanExecuteChanged();
    }

    private void PrintReport() =>
        OpeningStockPrintService.ShowPreview(
            Rows.ToList(),
            TotalQty,
            TotalValuation,
            DateLabel,
            FilterProductCode,
            FilterProductName,
            FilterMainName,
            FilterProductType);

    private static string FormatQty(decimal value) =>
        value % 1 == 0 ? value.ToString("N0") : value.ToString("N2");

    private static string FormatMoney(decimal value) =>
        value % 1 == 0 ? value.ToString("N0") : value.ToString("N2");
}
