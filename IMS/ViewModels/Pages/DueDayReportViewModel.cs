using System.Collections.ObjectModel;
using System.Windows.Input;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels;

public sealed class DueDayReportViewModel : ViewModelBase, IPageViewLoadAware, IStandardReportViewModel
{
    public string PageTitle => "Due Report (Day-wise)";
    private DateTime? _asOnDate = DateTime.Today;
    private string _partyName = string.Empty;
    private string? _selectedType = "(All)";
    private bool _isBusy;
    private string _statusMessage = "Click Show to generate the report.";
    private DueDayRow? _totalsRow;
    private string _asOnDateLabel = string.Empty;

    public DueDayReportViewModel()
    {
        Rows = new ObservableCollection<DueDayRow>();
        TypeOptions = new ObservableCollection<string> { "(All)", "Receivable", "Payable" };
        ShowCommand = new RelayCommand(() => _ = LoadReportAsync(), () => !IsBusy);
        PrintCommand = new RelayCommand(() => { }, () => !IsBusy && Rows.Count > 0);
    }

    public void OnPageViewLoaded() => _ = LoadReportAsync();

    public ObservableCollection<DueDayRow> Rows { get; }
    public ObservableCollection<string> TypeOptions { get; }
    public DateTime? AsOnDate { get => _asOnDate; set => SetProperty(ref _asOnDate, value); }
    public string PartyName { get => _partyName; set => SetProperty(ref _partyName, value); }
    public string? SelectedType { get => _selectedType; set => SetProperty(ref _selectedType, value); }
    public string AsOnDateLabel { get => _asOnDateLabel; private set => SetProperty(ref _asOnDateLabel, value); }
    public string StatusMessage { get => _statusMessage; private set => SetProperty(ref _statusMessage, value); }
    public DueDayRow? TotalsRow { get => _totalsRow; private set => SetProperty(ref _totalsRow, value); }

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
        Rows.Count == 0 ? StatusMessage : $"{Rows.Count} row(s)  •  As On: {AsOnDateLabel}  •  Due: {TotalsRow?.BalanceDueDisplay ?? "0"}";

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
                var report = await ImsApiClient.GetDueDayReportAsync(AsOnDate, SelectedType, PartyName);
                ApplyReport(report);
            }, "Due Report Day-wise");
        }
        finally
        {
            IsBusy = false;
        }
    }

    private void ApplyReport(DueDayReportDto? report)
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
            Rows.Add(new DueDayRow
            {
                SerialNo = row.SerialNo,
                PartyType = row.PartyType,
                PartyName = row.PartyName,
                DocNo = row.DocNo,
                DueDate = row.DueDate,
                DueDays = row.DueDays,
                DueBucket = row.DueBucket,
                BalanceDue = row.BalanceDue
            });
        }

        if (report.Totals is not null)
        {
            TotalsRow = new DueDayRow
            {
                PartyName = "Total :",
                BalanceDue = report.Totals.TotalAmount
            };
            Rows.Add(TotalsRow);
        }

        StatusMessage = report.Count == 0 ? "No rows match the filters." : "Report ready.";
        OnPropertyChanged(nameof(SummaryText));
    }
}
