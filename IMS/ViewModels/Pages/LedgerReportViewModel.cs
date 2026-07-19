using System.Collections.ObjectModel;
using System.Globalization;
using System.Windows.Input;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels;

public sealed class LedgerReportViewModel : ViewModelBase, IPageViewLoadAware, IStandardReportViewModel
{
    public string PageTitle => "Ledger Report";
    private DateTime? _dateFrom;
    private DateTime? _dateTo;
    private string _accountCode = "3";
    private string _accountName = string.Empty;
    private LedgerAccountOptionDto? _selectedAccount;
    private string _statusMessage = "Select account and dates, then click Show.";
    private bool _isBusy;
    private decimal _footerDebit;
    private decimal _footerCredit;
    private string _dateFromLabel = string.Empty;
    private string _dateToLabel = string.Empty;

    public LedgerReportViewModel()
    {
        var today = DateTime.Today;
        var fyStartYear = today.Month >= 4 ? today.Year : today.Year - 1;
        _dateFrom = new DateTime(fyStartYear, 4, 1);
        _dateTo = new DateTime(fyStartYear + 1, 3, 31);

        Rows = new ObservableCollection<LedgerReportRow>();
        AccountOptions = new ObservableCollection<LedgerAccountOptionDto>();

        ShowCommand = new RelayCommand(() => _ = LoadReportAsync(), () => !IsBusy && SelectedAccount is not null);
        PrintCommand = new RelayCommand(PrintReport, () => !IsBusy && Rows.Count > 0);
    }

    public void OnPageViewLoaded() => _ = InitializeAsync();

    public ObservableCollection<LedgerReportRow> Rows { get; }

    public ObservableCollection<LedgerAccountOptionDto> AccountOptions { get; }

    public LedgerAccountOptionDto? SelectedAccount
    {
        get => _selectedAccount;
        set
        {
            if (!SetProperty(ref _selectedAccount, value))
                return;
            AccountCode = value?.Code ?? string.Empty;
            AccountName = value?.Name ?? string.Empty;
            (ShowCommand as RelayCommand)?.RaiseCanExecuteChanged();
        }
    }

    public string AccountCode
    {
        get => _accountCode;
        set => SetProperty(ref _accountCode, value);
    }

    public string AccountName
    {
        get => _accountName;
        private set => SetProperty(ref _accountName, value);
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

    public decimal FooterDebit
    {
        get => _footerDebit;
        private set
        {
            if (!SetProperty(ref _footerDebit, value))
                return;
            OnPropertyChanged(nameof(FooterDebitDisplay));
        }
    }

    public decimal FooterCredit
    {
        get => _footerCredit;
        private set
        {
            if (!SetProperty(ref _footerCredit, value))
                return;
            OnPropertyChanged(nameof(FooterCreditDisplay));
        }
    }

    public string FooterDebitDisplay => FormatMoney(FooterDebit);

    public string FooterCreditDisplay => FormatMoney(FooterCredit);

    public string SummaryText =>
        Rows.Count == 0
            ? StatusMessage
            : $"{AccountCode} — {AccountName}  •  {DateFromLabel} to {DateToLabel}  •  {Rows.Count(r => !r.IsSpecial)} transaction(s)";

    public ICommand ShowCommand { get; }

    public ICommand PrintCommand { get; }

    private async Task InitializeAsync()
    {
        if (!ImsApiClient.IsAvailable)
        {
            StatusMessage = "API is not available. Start the API to load ledger accounts.";
            return;
        }

        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            var accounts = await ImsApiClient.GetLedgerAccountsAsync();
            AccountOptions.Clear();
            foreach (var a in accounts)
                AccountOptions.Add(a);

            SelectedAccount =
                AccountOptions.FirstOrDefault(a => string.Equals(a.Code, "3", StringComparison.OrdinalIgnoreCase))
                ?? AccountOptions.FirstOrDefault();
        }, "Ledger Report");
    }

    private async Task LoadReportAsync()
    {
        if (SelectedAccount is null || string.IsNullOrWhiteSpace(SelectedAccount.Code))
        {
            StatusMessage = "Please select an account.";
            return;
        }

        if (!DateFrom.HasValue || !DateTo.HasValue)
        {
            StatusMessage = "Please select both from and to dates.";
            return;
        }

        IsBusy = true;
        StatusMessage = "Loading…";

        try
        {
            await ApiUiHelper.RunWithApiAsync(async () =>
            {
                var report = await ImsApiClient.GetLedgerReportAsync(
                    SelectedAccount.Code,
                    DateFrom,
                    DateTo);
                ApplyReport(report);
            }, "Ledger Report");
        }
        finally
        {
            IsBusy = false;
        }
    }

    private void ApplyReport(LedgerReportDto? report)
    {
        Rows.Clear();

        if (report is null)
        {
            FooterDebit = 0;
            FooterCredit = 0;
            DateFromLabel = string.Empty;
            DateToLabel = string.Empty;
            StatusMessage = "No data returned from API.";
            OnPropertyChanged(nameof(SummaryText));
            (PrintCommand as RelayCommand)?.RaiseCanExecuteChanged();
            return;
        }

        AccountCode = report.AccountCode;
        AccountName = report.AccountName;
        DateFromLabel = report.DateFromLabel;
        DateToLabel = report.DateToLabel;
        FooterDebit = report.FooterDebit;
        FooterCredit = report.FooterCredit;

        foreach (var row in report.Rows)
        {
            Rows.Add(new LedgerReportRow
            {
                RowType = row.RowType,
                EntryDate = row.EntryDate,
                EntryType = row.EntryType,
                EntryNo = row.EntryNo,
                Particular = row.Particular,
                DrDisplay = row.DrDisplay,
                CrDisplay = row.CrDisplay,
                ManualNo = row.ManualNo
            });
        }

        StatusMessage = report.TransactionCount == 0
            ? "No transactions in this period."
            : "Report ready.";
        OnPropertyChanged(nameof(SummaryText));
        (PrintCommand as RelayCommand)?.RaiseCanExecuteChanged();
    }

    private void PrintReport() =>
        LedgerReportPrintService.ShowPreview(
            Rows.ToList(),
            AccountCode,
            AccountName,
            DateFromLabel,
            DateToLabel,
            FooterDebit,
            FooterCredit);

    private static string FormatMoney(decimal value) =>
        value.ToString("N2", CultureInfo.CurrentCulture);
}
