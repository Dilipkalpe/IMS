using System.Collections.ObjectModel;
using System.Globalization;
using System.Windows.Input;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels;

public sealed class TrialBalanceReportViewModel : ViewModelBase, IPageViewLoadAware, IStandardReportViewModel
{
    public string PageTitle => "Trial Balance";
    private DateTime? _dateFrom;
    private DateTime? _dateTo;
    private bool _includeZeroAccounts;
    private string _statusMessage = "Select dates and click Show.";
    private bool _isBusy;
    private string _dateFromLabel = string.Empty;
    private string _dateToLabel = string.Empty;
    private decimal _totalDr;
    private decimal _totalCr;
    private bool _isBalanced = true;
    private int _loadGeneration;

    public TrialBalanceReportViewModel()
    {
        var today = DateTime.Today;
        var fyStartYear = today.Month >= 4 ? today.Year : today.Year - 1;
        _dateFrom = new DateTime(fyStartYear, 4, 1);
        _dateTo = new DateTime(fyStartYear + 1, 3, 31);

        Rows = new ObservableCollection<TrialBalanceRow>();

        ShowCommand = new RelayCommand(() => _ = LoadReportAsync(), () => !IsBusy);
        PrintCommand = new RelayCommand(PrintReport, () => !IsBusy && Rows.Count > 0);
    }

    public ObservableCollection<TrialBalanceRow> Rows { get; }

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

    public bool IncludeZeroAccounts
    {
        get => _includeZeroAccounts;
        set => SetProperty(ref _includeZeroAccounts, value);
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

    public string DateFromLabel
    {
        get => _dateFromLabel;
        private set => SetProperty(ref _dateFromLabel, value);
    }

    public string DateToLabel
    {
        get => _dateToLabel;
        private set => SetProperty(ref _dateToLabel, value);
    }

    public decimal TotalDr
    {
        get => _totalDr;
        private set
        {
            if (!SetProperty(ref _totalDr, value))
                return;
            OnPropertyChanged(nameof(TotalDrDisplay));
        }
    }

    public decimal TotalCr
    {
        get => _totalCr;
        private set
        {
            if (!SetProperty(ref _totalCr, value))
                return;
            OnPropertyChanged(nameof(TotalCrDisplay));
        }
    }

    public bool IsBalanced
    {
        get => _isBalanced;
        private set => SetProperty(ref _isBalanced, value);
    }

    public string TotalDrDisplay => FormatMoney(TotalDr);

    public string TotalCrDisplay => FormatMoney(TotalCr);

    public string SummaryText =>
        Rows.Count == 0
            ? StatusMessage
            : $"{DateFromLabel} to {DateToLabel}  •  {Rows.Count(r => !r.IsTotal)} account(s)"
              + (IsBalanced ? "  •  Totals match" : "  •  Dr/Cr totals differ");

    public ICommand ShowCommand { get; }

    public ICommand PrintCommand { get; }

    public void OnPageViewLoaded() => _ = LoadReportAsync();

    private async Task LoadReportAsync()
    {
        if (!DateFrom.HasValue || !DateTo.HasValue)
        {
            StatusMessage = "Please select both from and to dates.";
            return;
        }

        if (DateFrom.Value.Date > DateTo.Value.Date)
        {
            StatusMessage = "From date cannot be after to date.";
            return;
        }

        var generation = ++_loadGeneration;
        IsBusy = true;
        StatusMessage = "Loading…";

        try
        {
            await ApiUiHelper.RunWithApiAsync(async () =>
            {
                var report = await ImsApiClient.GetTrialBalanceReportAsync(
                    DateFrom,
                    DateTo,
                    IncludeZeroAccounts);
                if (generation != _loadGeneration)
                    return;
                ApplyReport(report);
            }, "Trial Balance");
        }
        finally
        {
            if (generation == _loadGeneration)
                IsBusy = false;
        }
    }

    private void ApplyReport(TrialBalanceReportDto? report)
    {
        Rows.Clear();

        if (report is null)
        {
            TotalDr = 0;
            TotalCr = 0;
            DateFromLabel = string.Empty;
            DateToLabel = string.Empty;
            IsBalanced = true;
            StatusMessage = "No data returned from API.";
            OnPropertyChanged(nameof(SummaryText));
            (PrintCommand as RelayCommand)?.RaiseCanExecuteChanged();
            return;
        }

        DateFromLabel = report.DateFromLabel;
        DateToLabel = report.DateToLabel;
        TotalDr = report.TotalDr;
        TotalCr = report.TotalCr;
        IsBalanced = report.IsBalanced;

        foreach (var row in report.Rows)
        {
            Rows.Add(new TrialBalanceRow
            {
                SerialNo = row.SerialNo,
                AccountCode = row.AccountCode,
                AccountName = row.AccountName,
                DrDisplay = row.DrDisplay,
                CrDisplay = row.CrDisplay
            });
        }

        Rows.Add(new TrialBalanceRow
        {
            SerialNo = 0,
            AccountCode = string.Empty,
            AccountName = "Total :",
            DrDisplay = report.TotalDrDisplay,
            CrDisplay = report.TotalCrDisplay
        });

        StatusMessage = report.AccountCount == 0
            ? "No accounts with balances in this period."
            : "Report ready.";
        OnPropertyChanged(nameof(SummaryText));
        (PrintCommand as RelayCommand)?.RaiseCanExecuteChanged();
    }

    private void PrintReport() =>
        TrialBalancePrintService.ShowPreview(
            Rows.Where(r => !r.IsTotal).ToList(),
            DateFromLabel,
            DateToLabel,
            TotalDr,
            TotalCr);

    private static string FormatMoney(decimal value) =>
        value.ToString("N2", CultureInfo.CurrentCulture);
}
