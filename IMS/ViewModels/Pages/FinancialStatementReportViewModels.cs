using System.Collections.ObjectModel;
using System.Globalization;
using System.Windows.Input;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels;

public abstract class FinancialStatementReportViewModelBase : ViewModelBase, IPageViewLoadAware, IStandardReportViewModel
{
    private readonly Func<DateTime?, DateTime?, Task<FinancialStatementReportDto?>> _loadAsync;
    private readonly string _title;
    private DateTime? _dateFrom;
    private DateTime? _dateTo;
    private bool _isBusy;
    private string _statusMessage = "Select period and click Show.";
    private string _dateFromLabel = string.Empty;
    private string _dateToLabel = string.Empty;
    private decimal _totalDebit;
    private decimal _totalCredit;
    private decimal _netAmount;
    private string _netAmountLabel = string.Empty;
    private int _loadGeneration;

    protected FinancialStatementReportViewModelBase(
        string title,
        Func<DateTime?, DateTime?, Task<FinancialStatementReportDto?>> loadAsync)
    {
        _title = title;
        _loadAsync = loadAsync;
        var today = DateTime.Today;
        var fyStartYear = today.Month >= 4 ? today.Year : today.Year - 1;
        _dateFrom = new DateTime(fyStartYear, 4, 1);
        _dateTo = new DateTime(fyStartYear + 1, 3, 31);
        Rows = new ObservableCollection<FinancialStatementRow>();
        ShowCommand = new RelayCommand(() => _ = LoadReportAsync(), () => !IsBusy);
        PrintCommand = new RelayCommand(() => { }, () => false);
    }

    public string PageTitle => _title;
    public ObservableCollection<FinancialStatementRow> Rows { get; }

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
        }
    }

    public string StatusMessage
    {
        get => _statusMessage;
        private set => SetProperty(ref _statusMessage, value);
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

    public decimal TotalDebit
    {
        get => _totalDebit;
        private set
        {
            if (!SetProperty(ref _totalDebit, value))
                return;
            OnPropertyChanged(nameof(TotalDebitDisplay));
        }
    }

    public decimal TotalCredit
    {
        get => _totalCredit;
        private set
        {
            if (!SetProperty(ref _totalCredit, value))
                return;
            OnPropertyChanged(nameof(TotalCreditDisplay));
        }
    }

    public decimal NetAmount
    {
        get => _netAmount;
        private set
        {
            if (!SetProperty(ref _netAmount, value))
                return;
            OnPropertyChanged(nameof(NetAmountDisplay));
        }
    }

    public string NetAmountLabel
    {
        get => _netAmountLabel;
        private set => SetProperty(ref _netAmountLabel, value);
    }

    public string TotalDebitDisplay => FormatMoney(TotalDebit);
    public string TotalCreditDisplay => FormatMoney(TotalCredit);
    public string NetAmountDisplay => FormatMoney(NetAmount);
    public string SummaryText =>
        Rows.Count == 0
            ? StatusMessage
            : $"{DateFromLabel} to {DateToLabel}  •  {Rows.Count} row(s)  •  {NetAmountLabel}: {NetAmountDisplay}";

    public ICommand ShowCommand { get; }
    public ICommand? PrintCommand { get; }

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
                var report = await _loadAsync(DateFrom, DateTo);
                if (generation != _loadGeneration)
                    return;
                ApplyReport(report);
            }, PageTitle);
        }
        finally
        {
            if (generation == _loadGeneration)
                IsBusy = false;
        }
    }

    private void ApplyReport(FinancialStatementReportDto? report)
    {
        Rows.Clear();
        if (report is null)
        {
            DateFromLabel = string.Empty;
            DateToLabel = string.Empty;
            TotalDebit = 0;
            TotalCredit = 0;
            NetAmount = 0;
            NetAmountLabel = string.Empty;
            StatusMessage = "No data returned from API.";
            OnPropertyChanged(nameof(SummaryText));
            return;
        }

        DateFromLabel = report.DateFromLabel;
        DateToLabel = report.DateToLabel;
        TotalDebit = report.DebitTotal;
        TotalCredit = report.CreditTotal;
        NetAmount = Math.Abs(report.NetAmount);
        NetAmountLabel = report.NetAmountLabel;

        foreach (var row in report.Rows)
        {
            Rows.Add(new FinancialStatementRow
            {
                SerialNo = row.SerialNo,
                Section = row.Section,
                Particular = row.Particular,
                Debit = row.Debit,
                Credit = row.Credit,
                DebitDisplay = row.DebitDisplay,
                CreditDisplay = row.CreditDisplay
            });
        }

        Rows.Add(new FinancialStatementRow
        {
            Particular = "Total :",
            Debit = report.DebitTotal,
            Credit = report.CreditTotal,
            DebitDisplay = FormatMoney(report.DebitTotal),
            CreditDisplay = FormatMoney(report.CreditTotal)
        });

        StatusMessage = report.Count == 0 ? "No rows in selected period." : "Report ready.";
        OnPropertyChanged(nameof(SummaryText));
    }

    private static string FormatMoney(decimal value) =>
        value.ToString("N2", CultureInfo.CurrentCulture);
}

public sealed class TradingAccountReportViewModel : FinancialStatementReportViewModelBase
{
    public TradingAccountReportViewModel()
        : base("Trading Statement", ImsApiClient.GetTradingAccountReportAsync)
    {
    }
}

public sealed class ProfitLossReportViewModel : FinancialStatementReportViewModelBase
{
    public ProfitLossReportViewModel()
        : base("Income Statement", ImsApiClient.GetProfitLossReportAsync)
    {
    }
}

public sealed class ProfitLossWithTradingReportViewModel : FinancialStatementReportViewModelBase
{
    public ProfitLossWithTradingReportViewModel()
        : base("Income Statement (Full)", ImsApiClient.GetProfitLossWithTradingReportAsync)
    {
    }
}

public sealed class BalanceSheetReportViewModel : FinancialStatementReportViewModelBase
{
    public BalanceSheetReportViewModel()
        : base("Balance Sheet", ImsApiClient.GetBalanceSheetReportAsync)
    {
    }
}
