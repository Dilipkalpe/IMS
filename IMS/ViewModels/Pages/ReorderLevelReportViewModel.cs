using System.Collections.ObjectModel;
using System.Globalization;
using System.Windows.Input;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels;

public sealed class ReorderLevelReportViewModel : ViewModelBase, IPageViewLoadAware, IStandardReportViewModel
{
    public string PageTitle => "Reorder Level Report";
    private string _filterProductCode = string.Empty;
    private string _filterProductName = string.Empty;
    private bool _includeZero;
    private bool _isBusy;
    private string _statusMessage = "Click Show to generate the report.";
    private decimal _totalOnHand;
    private decimal _totalReorder;
    private decimal _totalShortage;

    public ReorderLevelReportViewModel()
    {
        Rows = new ObservableCollection<ReorderLevelRow>();
        ShowCommand = new RelayCommand(() => _ = LoadReportAsync(), () => !IsBusy);
        PrintCommand = new RelayCommand(PrintReport, () => !IsBusy && Rows.Count > 0);
    }

    public ObservableCollection<ReorderLevelRow> Rows { get; }

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

    public bool IncludeZero
    {
        get => _includeZero;
        set => SetProperty(ref _includeZero, value);
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

    public decimal TotalOnHand
    {
        get => _totalOnHand;
        private set
        {
            if (!SetProperty(ref _totalOnHand, value))
                return;
            OnPropertyChanged(nameof(TotalOnHandDisplay));
        }
    }

    public decimal TotalReorder
    {
        get => _totalReorder;
        private set
        {
            if (!SetProperty(ref _totalReorder, value))
                return;
            OnPropertyChanged(nameof(TotalReorderDisplay));
        }
    }

    public decimal TotalShortage
    {
        get => _totalShortage;
        private set
        {
            if (!SetProperty(ref _totalShortage, value))
                return;
            OnPropertyChanged(nameof(TotalShortageDisplay));
        }
    }

    public string TotalOnHandDisplay => FormatQty(TotalOnHand);
    public string TotalReorderDisplay => FormatQty(TotalReorder);
    public string TotalShortageDisplay => FormatQty(TotalShortage);

    public string SummaryText =>
        Rows.Count == 0
            ? StatusMessage
            : $"{Rows.Count(r => !r.IsTotal)} item(s)  •  Below reorder: {Rows.Count(r => !r.IsTotal && r.Shortage > 0)}";

    public ICommand ShowCommand { get; }
    public ICommand PrintCommand { get; }

    public void OnPageViewLoaded() => _ = LoadReportAsync();

    private async Task LoadReportAsync()
    {
        IsBusy = true;
        StatusMessage = "Loading…";

        try
        {
            await ApiUiHelper.RunWithApiAsync(async () =>
            {
                var report = await ImsApiClient.GetReorderLevelReportAsync(
                    FilterProductCode,
                    FilterProductName,
                    IncludeZero);
                ApplyReport(report);
            }, "Reorder Level Report");
        }
        finally
        {
            IsBusy = false;
        }
    }

    private void ApplyReport(ReorderLevelReportDto? report)
    {
        Rows.Clear();

        if (report is null)
        {
            TotalOnHand = 0;
            TotalReorder = 0;
            TotalShortage = 0;
            StatusMessage = "No data returned from API.";
            OnPropertyChanged(nameof(SummaryText));
            (PrintCommand as RelayCommand)?.RaiseCanExecuteChanged();
            return;
        }

        foreach (var row in report.Rows)
        {
            Rows.Add(new ReorderLevelRow
            {
                SerialNo = row.SerialNo,
                ProductId = row.ProductId,
                ProductName = row.ProductName,
                Unit = row.Unit,
                OnHand = row.OnHand,
                ReorderLevel = row.ReorderLevel,
                Shortage = row.Shortage,
                Status = row.Status
            });
        }

        Rows.Add(new ReorderLevelRow
        {
            ProductName = "Total :",
            OnHand = report.TotalOnHand,
            ReorderLevel = report.TotalReorder,
            Shortage = report.TotalShortage
        });

        TotalOnHand = report.TotalOnHand;
        TotalReorder = report.TotalReorder;
        TotalShortage = report.TotalShortage;
        StatusMessage = report.Count == 0 ? "No items match the filters." : "Report ready.";
        OnPropertyChanged(nameof(SummaryText));
        (PrintCommand as RelayCommand)?.RaiseCanExecuteChanged();
    }

    private void PrintReport() =>
        ReorderLevelPrintService.ShowPreview(
            Rows.Where(r => !r.IsTotal).ToList(),
            TotalOnHand,
            TotalReorder,
            TotalShortage,
            FilterProductCode,
            FilterProductName);

    private static string FormatQty(decimal value) =>
        value % 1 == 0 ? value.ToString("N0", CultureInfo.CurrentCulture) : value.ToString("N2", CultureInfo.CurrentCulture);
}
