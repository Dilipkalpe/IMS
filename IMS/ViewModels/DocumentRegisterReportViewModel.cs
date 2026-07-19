using System.Collections.ObjectModel;
using System.Globalization;
using System.Windows.Input;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels;

public sealed class DocumentRegisterReportViewModel : ViewModelBase, IPageViewLoadAware, IStandardReportViewModel
{
    public string PageTitle => ReportTitle;
    private readonly string _registerType;
    private DateTime? _dateFrom;
    private DateTime? _dateTo;
    private string _billNo = string.Empty;
    private string _statusMessage = "Select dates and click Show.";
    private bool _isBusy;
    private string _dateFromLabel = string.Empty;
    private string _dateToLabel = string.Empty;
    private decimal _totalAmount;

    public DocumentRegisterReportViewModel(string registerType, string reportTitle, string partyColumnHeader)
    {
        _registerType = registerType;
        ReportTitle = reportTitle;
        PartyColumnHeader = partyColumnHeader;

        var today = DateTime.Today;
        _dateTo = today;
        _dateFrom = new DateTime(today.Year, today.Month, 1).AddMonths(-2);

        Rows = new ObservableCollection<DocumentRegisterRow>();
        ShowCommand = new RelayCommand(() => _ = LoadReportAsync(), () => !IsBusy);
        PrintCommand = new RelayCommand(PrintReport, () => !IsBusy && Rows.Count > 0);
    }

    public string ReportTitle { get; }

    public string PartyColumnHeader { get; }

    public ObservableCollection<DocumentRegisterRow> Rows { get; }

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

    public string BillNo
    {
        get => _billNo;
        set => SetProperty(ref _billNo, value);
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

    public decimal TotalAmount
    {
        get => _totalAmount;
        private set
        {
            if (!SetProperty(ref _totalAmount, value))
                return;
            OnPropertyChanged(nameof(TotalAmountDisplay));
        }
    }

    public string TotalAmountDisplay => FormatMoney(TotalAmount);

    public string SummaryText =>
        Rows.Count == 0
            ? StatusMessage
            : $"{Rows.Count(r => !r.IsTotal)} document(s)  •  {DateFromLabel} to {DateToLabel}  •  Total: {TotalAmountDisplay}";

    public ICommand ShowCommand { get; }

    public ICommand PrintCommand { get; }

    public void OnPageViewLoaded() { }

    private async Task LoadReportAsync()
    {
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
                var report = await ImsApiClient.GetDocumentRegisterReportAsync(
                    _registerType,
                    DateFrom,
                    DateTo,
                    BillNo);
                ApplyReport(report);
            }, ReportTitle);
        }
        finally
        {
            IsBusy = false;
        }
    }

    private void ApplyReport(DocumentRegisterReportDto? report)
    {
        Rows.Clear();
        TotalAmount = 0;

        if (report is null)
        {
            DateFromLabel = string.Empty;
            DateToLabel = string.Empty;
            StatusMessage = "No data returned from API.";
            OnPropertyChanged(nameof(SummaryText));
            (PrintCommand as RelayCommand)?.RaiseCanExecuteChanged();
            return;
        }

        DateFromLabel = report.DateFromLabel;
        DateToLabel = report.DateToLabel;
        TotalAmount = report.TotalAmount;

        foreach (var row in report.Rows)
        {
            Rows.Add(new DocumentRegisterRow
            {
                SerialNo = row.SerialNo,
                BillNo = row.BillNo,
                BillDate = row.BillDate,
                Party = row.Party,
                Amount = row.Amount,
                AmountDisplay = row.AmountDisplay,
                Status = row.Status,
                Narration = row.Narration
            });
        }

        Rows.Add(new DocumentRegisterRow
        {
            BillNo = "Total",
            Amount = report.TotalAmount,
            AmountDisplay = report.TotalAmountDisplay,
            IsTotal = true
        });

        StatusMessage = report.DocumentCount == 0
            ? "No documents match the filters."
            : "Report ready.";
        OnPropertyChanged(nameof(SummaryText));
        (PrintCommand as RelayCommand)?.RaiseCanExecuteChanged();
    }

    private void PrintReport() =>
        DocumentRegisterPrintService.ShowPreview(
            ReportTitle,
            PartyColumnHeader,
            DateFromLabel,
            DateToLabel,
            BillNo,
            Rows.Where(r => !r.IsTotal).ToList(),
            TotalAmount);

    private static string FormatMoney(decimal value) =>
        value.ToString("N2", CultureInfo.CurrentCulture);
}
