using System.Collections.ObjectModel;
using System.Windows.Input;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels;

public sealed class StockMovementReportViewModel : ViewModelBase, IPageViewLoadAware, IStandardReportViewModel
{
    public string PageTitle => "Stock Movement Report";

    private DateTime? _dateFrom;
    private DateTime? _dateTo;
    private string _productCode = string.Empty;
    private string _godown = string.Empty;
    private string _movementType = "All";
    private string _statusMessage = "Select filters and click Show.";
    private bool _isBusy;
    private decimal _totalInQty;
    private decimal _totalOutQty;

    public StockMovementReportViewModel()
    {
        var today = DateTime.Today;
        var fyStartYear = today.Month >= 4 ? today.Year : today.Year - 1;
        _dateFrom = new DateTime(fyStartYear, 4, 1);
        _dateTo = today;
        Rows = new ObservableCollection<StockMovementReportRow>();
        MovementTypeOptions = new ObservableCollection<string>
        {
            "All", "Issue", "Receipt", "Transfer", "Production Issue", "Production Receipt"
        };
        ShowCommand = new RelayCommand(() => _ = LoadReportAsync(), () => !IsBusy);
        PrintCommand = null;
    }

    public ObservableCollection<StockMovementReportRow> Rows { get; }
    public ObservableCollection<string> MovementTypeOptions { get; }

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

    public string ProductCode
    {
        get => _productCode;
        set => SetProperty(ref _productCode, value);
    }

    public string Godown
    {
        get => _godown;
        set => SetProperty(ref _godown, value);
    }

    public string MovementType
    {
        get => _movementType;
        set => SetProperty(ref _movementType, value);
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
        }
    }

    public decimal TotalInQty
    {
        get => _totalInQty;
        private set
        {
            if (!SetProperty(ref _totalInQty, value))
                return;
            OnPropertyChanged(nameof(TotalInQtyDisplay));
        }
    }

    public decimal TotalOutQty
    {
        get => _totalOutQty;
        private set
        {
            if (!SetProperty(ref _totalOutQty, value))
                return;
            OnPropertyChanged(nameof(TotalOutQtyDisplay));
        }
    }

    public string TotalInQtyDisplay => TotalInQty.ToString("N2");
    public string TotalOutQtyDisplay => TotalOutQty.ToString("N2");

    public string SummaryText =>
        Rows.Count == 0
            ? StatusMessage
            : $"{Rows.Count} movement row(s)  •  In: {TotalInQtyDisplay}  •  Out: {TotalOutQtyDisplay}";

    public ICommand ShowCommand { get; }
    public ICommand? PrintCommand { get; }

    public void OnPageViewLoaded()
    {
        if (StockReportNavigationContext.TryConsume(out var from, out var to, out var productCode, out var movementType))
        {
            if (from.HasValue)
                DateFrom = from;
            if (to.HasValue)
                DateTo = to;
            if (!string.IsNullOrWhiteSpace(productCode))
                ProductCode = productCode;
            if (!string.IsNullOrWhiteSpace(movementType))
                MovementType = movementType;
        }

        _ = LoadReportAsync();
    }

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

        IsBusy = true;
        StatusMessage = "Loading…";

        try
        {
            await ApiUiHelper.RunWithApiAsync(async () =>
            {
                var report = await ImsApiClient.GetStockMovementReportAsync(
                    DateFrom,
                    DateTo,
                    ProductCode,
                    Godown,
                    MovementType);
                ApplyRows(report);
            }, "Stock Movement Report");
        }
        finally
        {
            IsBusy = false;
        }
    }

    private void ApplyRows(StockMovementReportDto? report)
    {
        Rows.Clear();
        TotalInQty = 0;
        TotalOutQty = 0;

        if (report is null)
        {
            StatusMessage = "No data returned from API.";
            OnPropertyChanged(nameof(SummaryText));
            return;
        }

        for (var i = 0; i < report.Rows.Count; i++)
        {
            var row = report.Rows[i];
            Rows.Add(new StockMovementReportRow
            {
                SerialNo = row.SerialNo,
                Date = row.Date,
                EntryNo = row.EntryNo,
                MovementType = row.MovementType,
                FromGodown = row.FromGodown,
                ToGodown = row.ToGodown,
                ProductCode = row.ProductCode,
                ProductName = row.ProductName,
                BatchNo = row.BatchNo,
                InQty = row.InQty,
                OutQty = row.OutQty,
                Unit = row.Unit
            });
        }
        TotalInQty = report.TotalInQty;
        TotalOutQty = report.TotalOutQty;

        StatusMessage = Rows.Count == 0 ? "No movement rows match the filters." : "Report ready.";
        OnPropertyChanged(nameof(SummaryText));
    }
}
