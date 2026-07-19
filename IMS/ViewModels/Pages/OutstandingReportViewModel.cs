using System.Collections.ObjectModel;
using System.Windows.Input;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels;

public sealed class OutstandingReportViewModel : ViewModelBase, IPageViewLoadAware, IStandardReportViewModel
{
    public string PageTitle => "Outstanding Report";
    private DateTime? _asOnDate = DateTime.Today;
    private string _partyName = string.Empty;
    private string? _selectedType = "(All)";
    private bool _isBusy;
    private string _statusMessage = "Click Show to generate the report.";
    private OutstandingRow? _totalsRow;
    private string _asOnDateLabel = string.Empty;

    public OutstandingReportViewModel()
    {
        Rows = new ObservableCollection<OutstandingRow>();
        TypeOptions = new ObservableCollection<string> { "(All)", "Receivable", "Payable" };
        ShowCommand = new RelayCommand(() => _ = LoadReportAsync(), () => !IsBusy);
        PrintCommand = new RelayCommand(() => { }, () => !IsBusy && Rows.Count > 0);
    }

    public void OnPageViewLoaded() => _ = LoadReportAsync();

    public ObservableCollection<OutstandingRow> Rows { get; }
    public ObservableCollection<string> TypeOptions { get; }
    public DateTime? AsOnDate { get => _asOnDate; set => SetProperty(ref _asOnDate, value); }
    public string PartyName { get => _partyName; set => SetProperty(ref _partyName, value); }
    public string? SelectedType { get => _selectedType; set => SetProperty(ref _selectedType, value); }
    public string AsOnDateLabel { get => _asOnDateLabel; private set => SetProperty(ref _asOnDateLabel, value); }
    public string StatusMessage { get => _statusMessage; private set => SetProperty(ref _statusMessage, value); }
    public OutstandingRow? TotalsRow { get => _totalsRow; private set => SetProperty(ref _totalsRow, value); }

    public bool IsBusy
    {
        get => _isBusy;
        private set
        {
            if (!SetProperty(ref _isBusy, value)) return;
            (ShowCommand as RelayCommand)?.RaiseCanExecuteChanged();
            (PrintCommand as RelayCommand)?.RaiseCanExecuteChanged();
        }
    }

    public string SummaryText =>
        Rows.Count == 0 ? StatusMessage : $"{Rows.Count} row(s)  •  As On: {AsOnDateLabel}  •  Balance: {TotalsRow?.BalanceDueDisplay ?? "0"}";

    public ICommand ShowCommand { get; }
    public ICommand PrintCommand { get; }

    private async Task LoadReportAsync()
    {
        IsBusy = true;
        StatusMessage = "Loading…";
        try
        {
            await ApiUiHelper.RunWithApiAsync(async () =>
            {
                var report = await ImsApiClient.GetOutstandingReportAsync(AsOnDate, SelectedType, PartyName);
                ApplyReport(report);
            }, "Outstanding Report");
        }
        finally
        {
            IsBusy = false;
        }
    }

    private void ApplyReport(OutstandingReportDto? report)
    {
        Rows.Clear();
        TotalsRow = null;
        if (report is null)
        {
            AsOnDateLabel = string.Empty;
            StatusMessage = "No data returned from API.";
            OnPropertyChanged(nameof(SummaryText));
            return;
        }

        AsOnDateLabel = report.AsOnDateLabel;
        foreach (var row in report.Rows)
        {
            Rows.Add(new OutstandingRow
            {
                SerialNo = row.SerialNo,
                PartyType = row.PartyType,
                PartyName = row.PartyName,
                DocNo = row.DocNo,
                InvoiceDate = row.InvoiceDate,
                DueDate = row.DueDate,
                BillAmount = row.BillAmount,
                PaidAmount = row.PaidAmount,
                BalanceDue = row.BalanceDue,
                AgeDays = row.AgeDays,
                DueDays = row.DueDays,
                DueStatus = row.DueStatus
            });
        }

        if (report.Totals is not null)
        {
            TotalsRow = new OutstandingRow
            {
                PartyName = "Total :",
                BillAmount = report.Totals.TotalReceivable,
                PaidAmount = report.Totals.TotalPayable,
                BalanceDue = report.Totals.TotalBalance
            };
            Rows.Add(TotalsRow);
        }

        StatusMessage = report.Count == 0 ? "No rows match the filters." : "Report ready.";
        OnPropertyChanged(nameof(SummaryText));
    }
}
