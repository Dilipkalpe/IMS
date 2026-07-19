using System.Collections.ObjectModel;
using System.Windows.Input;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels;

public sealed class SalesAnalysisReportViewModel : ViewModelBase, IPageViewLoadAware, IStandardReportViewModel
{
    public string PageTitle => "Sales Analysis Report";
    private string _filterProductCode = string.Empty;
    private string _filterProductName = string.Empty;
    private string _filterCustomer = string.Empty;
    private string? _filterMainName = "(All)";
    private DateTime? _dateFrom;
    private DateTime? _dateTo;
    private bool _isBusy;
    private string _statusMessage = "Click Show to generate the report.";
    private SalesAnalysisRow? _totalsRow;
    private string _periodLabel = string.Empty;

    public SalesAnalysisReportViewModel()
    {
        var today = DateTime.Today;
        var fyStartYear = today.Month >= 4 ? today.Year : today.Year - 1;
        _dateFrom = new DateTime(fyStartYear, 4, 1);
        _dateTo = DateTime.Today;

        Rows = new ObservableCollection<SalesAnalysisRow>();
        MainGroupOptions = new ObservableCollection<string> { "(All)" };
        ShowCommand = new RelayCommand(() => _ = LoadReportAsync(), () => !IsBusy);
        PrintCommand = new RelayCommand(() => { }, () => !IsBusy && Rows.Count > 0);
    }

    public void OnPageViewLoaded() => _ = InitializeFiltersAsync();

    public ObservableCollection<SalesAnalysisRow> Rows { get; }
    public ObservableCollection<string> MainGroupOptions { get; }

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

    public string FilterCustomer
    {
        get => _filterCustomer;
        set => SetProperty(ref _filterCustomer, value);
    }

    public string? FilterMainName
    {
        get => _filterMainName;
        set => SetProperty(ref _filterMainName, value);
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

    public string StatusMessage
    {
        get => _statusMessage;
        private set => SetProperty(ref _statusMessage, value);
    }

    public SalesAnalysisRow? TotalsRow
    {
        get => _totalsRow;
        private set => SetProperty(ref _totalsRow, value);
    }

    public string PeriodLabel
    {
        get => _periodLabel;
        private set => SetProperty(ref _periodLabel, value);
    }

    public string SummaryText =>
        Rows.Count == 0
            ? StatusMessage
            : $"{Rows.Count} product(s)  •  {PeriodLabel}  •  Revenue: {TotalsRow?.RevenueDisplay ?? "0"}";

    public ICommand ShowCommand { get; }
    public ICommand PrintCommand { get; }

    private async Task InitializeFiltersAsync()
    {
        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            var mainGroups = await ImsApiClient.GetProductMainGroupsAsync();
            MainGroupOptions.Clear();
            MainGroupOptions.Add("(All)");
            foreach (var g in mainGroups.Select(m => m.Name).Where(n => !string.IsNullOrWhiteSpace(n)).Distinct(StringComparer.OrdinalIgnoreCase).OrderBy(n => n))
                MainGroupOptions.Add(g);

            await LoadReportAsync();
        }, "Sales Analysis");
    }

    private async Task LoadReportAsync()
    {
        if (DateFrom.HasValue && DateTo.HasValue && DateFrom.Value.Date > DateTo.Value.Date)
        {
            StatusMessage = "From date cannot be after to date.";
            return;
        }

        IsBusy = true;
        StatusMessage = "Loading…";
        try
        {
            await ApiUiHelper.RunWithApiAsync(async () =>
            {
                var report = await ImsApiClient.GetSalesAnalysisReportAsync(
                    FilterProductCode,
                    FilterProductName,
                    FilterMainName,
                    FilterCustomer,
                    DateFrom,
                    DateTo);
                ApplyReport(report);
            }, "Sales Analysis Report");
        }
        finally
        {
            IsBusy = false;
        }
    }

    private void ApplyReport(SalesAnalysisReportDto? report)
    {
        Rows.Clear();
        TotalsRow = null;

        if (report is null)
        {
            PeriodLabel = string.Empty;
            StatusMessage = "No data returned from API.";
            OnPropertyChanged(nameof(SummaryText));
            return;
        }

        PeriodLabel = $"{report.DateFromLabel} to {report.DateToLabel}";

        foreach (var row in report.Rows)
        {
            Rows.Add(new SalesAnalysisRow
            {
                SerialNo = row.SerialNo,
                ProductId = row.ProductId,
                ProductName = row.ProductName,
                MainGroup = row.MainGroup,
                Customer = row.Customer,
                Qty = row.Qty,
                Revenue = row.Revenue,
                Discount = row.Discount,
                Cogs = row.Cogs,
                GrossProfit = row.GrossProfit,
                MarginPct = row.MarginPct,
                InvoiceCount = row.InvoiceCount
            });
        }

        if (report.Totals is not null)
        {
            TotalsRow = new SalesAnalysisRow
            {
                ProductName = "Total :",
                Qty = report.Totals.Qty,
                Revenue = report.Totals.Revenue,
                Discount = report.Totals.Discount,
                Cogs = report.Totals.Cogs,
                GrossProfit = report.Totals.GrossProfit,
                MarginPct = report.Totals.MarginPct,
                InvoiceCount = report.Totals.InvoiceCount
            };
            Rows.Add(TotalsRow);
        }

        StatusMessage = report.Count == 0 ? "No rows match the filters." : "Report ready.";
        OnPropertyChanged(nameof(SummaryText));
    }
}
