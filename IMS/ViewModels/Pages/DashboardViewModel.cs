using System.Collections.ObjectModel;
using System.Globalization;
using System.Text.RegularExpressions;
using System.Windows;
using System.Windows.Input;
using System.Windows.Threading;
using IMS.Models;
using IMS.Resources;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels;

public sealed class DashboardViewModel : ViewModelBase, IPageViewLoadAware
{
    private readonly MainViewModel? _host;
    private readonly object _loadGate = new();
    private Task? _loadTask;

    private string _companyName = "Inventory Management System";
    private string _lastRefreshed = "Loading…";
    private string _apiStatusMessage = string.Empty;
    private string _apiEndpoint = ApiConfiguration.BaseUrl;
    private bool _isApiConnected;
    private bool _connectivityChecked;
    private bool _isLoading;
    private bool _hasPresentedContent;
    private bool _loadedLiveData;
    private DashboardBarChartData? _salesPurchaseChart;
    private DashboardBarChartData? _inventoryStockChart;
    private DashboardPieChartData? _stockCategoryChart;

    public DashboardViewModel(MainViewModel? host = null)
    {
        _host = host;
        IconGlyph = "\uE80F";
        PageTitle = "Dashboard";
        PageDescription = "Inventory, procurement, sales, and production overview.";

        Stats = new ObservableCollection<MockStat>();
        ActivityRows = new ObservableCollection<MockRow>();
        Alerts = new ObservableCollection<DashboardAlertItem>();
        SummaryLines = new ObservableCollection<DashboardSummaryLine>();
        QuickLinks = new ObservableCollection<DashboardQuickLinkItem>(BuildQuickLinkItems());

        RefreshCommand = new RelayCommand(() => _ = EnsureLoadedAsync(force: true), () => !IsLoading);
        NavigateQuickLinkCommand = new RelayCommand(NavigateQuickLink);
    }

    public string PageTitle { get; }
    public string PageDescription { get; }
    public string IconGlyph { get; }
    public string WelcomeDate => DateTime.Now.ToString("dddd, dd MMMM yyyy", CultureInfo.InvariantCulture);

    public string MetaLine =>
        $"{PageDescription}  •  {CompanyName}  •  {WelcomeDate}";

    public string CompanyName
    {
        get => _companyName;
        private set => SetProperty(ref _companyName, value);
    }

    public string LastRefreshed
    {
        get => _lastRefreshed;
        private set => SetProperty(ref _lastRefreshed, value);
    }

    public bool IsApiConnected
    {
        get => _isApiConnected;
        private set
        {
            if (!SetProperty(ref _isApiConnected, value))
                return;
            OnPropertyChanged(nameof(ShowApiOfflineBanner));
        }
    }

    /// <summary>Only show the offline banner after the first connectivity check (avoids flash on load).</summary>
    public bool ShowApiOfflineBanner => _connectivityChecked && !IsApiConnected;

    public string ApiStatusMessage
    {
        get => _apiStatusMessage;
        private set => SetProperty(ref _apiStatusMessage, value);
    }

    public string ApiEndpoint
    {
        get => _apiEndpoint;
        private set => SetProperty(ref _apiEndpoint, value);
    }

    public bool IsLoading
    {
        get => _isLoading;
        private set
        {
            if (!SetProperty(ref _isLoading, value))
                return;
            OnPropertyChanged(nameof(ShowLoadingOverlay));
            (RefreshCommand as RelayCommand)?.RaiseCanExecuteChanged();
        }
    }

    /// <summary>Full-screen loader on first paint only; refresh keeps widgets visible (no grid overlay).</summary>
    public bool ShowLoadingOverlay => IsLoading && !HasPresentedContent;

    public bool HasPresentedContent
    {
        get => _hasPresentedContent;
        private set
        {
            if (!SetProperty(ref _hasPresentedContent, value))
                return;
            OnPropertyChanged(nameof(ShowDashboardContent));
            OnPropertyChanged(nameof(ShowLoadingOverlay));
        }
    }

    public bool ShowDashboardContent => HasPresentedContent;

    public ObservableCollection<MockStat> Stats { get; }
    public ObservableCollection<MockRow> ActivityRows { get; }
    public ObservableCollection<DashboardAlertItem> Alerts { get; }
    public ObservableCollection<DashboardSummaryLine> SummaryLines { get; }
    public ObservableCollection<DashboardQuickLinkItem> QuickLinks { get; }

    public DashboardBarChartData? SalesPurchaseChart
    {
        get => _salesPurchaseChart;
        private set => SetProperty(ref _salesPurchaseChart, value);
    }

    public DashboardBarChartData? InventoryStockChart
    {
        get => _inventoryStockChart;
        private set => SetProperty(ref _inventoryStockChart, value);
    }

    public DashboardPieChartData? StockCategoryChart
    {
        get => _stockCategoryChart;
        private set => SetProperty(ref _stockCategoryChart, value);
    }

    public ICommand RefreshCommand { get; }
    public ICommand NavigateQuickLinkCommand { get; }

    public void ReloadFromApi()
    {
        if (!_loadedLiveData || !HasPresentedContent)
            _ = EnsureLoadedAsync();
    }

    public void OnPageViewLoaded() => _ = EnsureLoadedAsync();

    public Task EnsureLoadedAsync(bool force = false)
    {
        if (!IsUiAvailable)
            return Task.CompletedTask;

        lock (_loadGate)
        {
            if (!force && _loadTask is { IsCompleted: false } inFlight)
                return inFlight;

            if (!force && HasPresentedContent && _loadedLiveData)
                return _loadTask ?? Task.CompletedTask;

            return _loadTask = LoadFromApiAsync(force);
        }
    }

    private async Task LoadFromApiAsync(bool forceRefresh)
    {
        if (!IsUiAvailable)
            return;

        var firstPaint = !HasPresentedContent;
        if (firstPaint || forceRefresh)
            IsLoading = true;

        try
        {
            ApiEndpoint = ApiConfiguration.BaseUrl;

            if (!forceRefresh)
            {
                await CompanyProfileService.RefreshAsync();
                if (!string.IsNullOrWhiteSpace(CompanyProfileService.Current.BusinessName))
                    CompanyName = CompanyProfileService.Current.BusinessName;
            }

            var apiOnline = await ImsApiClient.CheckHealthAsync();
            _connectivityChecked = true;
            IsApiConnected = apiOnline;

            if (!apiOnline)
            {
                ApiStatusMessage =
                    $"Cannot connect to the API at {ApiEndpoint}. " +
                    "Start IMS: run START-IMS.bat from the IMS folder (as Administrator), or npm run dev in the api folder. " +
                    "Dashboard KPIs and charts below are sample data only.";
                LastRefreshed = "API not connected — sample data";
                _loadedLiveData = false;
                RunOnUi(() => ApplySampleData());
                return;
            }

            ApiStatusMessage = string.Empty;

            var dashboard = await ImsApiClient.GetDashboardAsync();
            if (dashboard is null)
            {
                IsApiConnected = false;
                ApiStatusMessage = $"API at {ApiEndpoint} did not return dashboard data.";
                LastRefreshed = "No response from API — sample data";
                _loadedLiveData = false;
                RunOnUi(() => ApplySampleData());
                return;
            }

            _loadedLiveData = true;
            RunOnUi(() => ApplyDashboard(dashboard));
            LastRefreshed = $"Live data • updated {DateTime.Now:HH:mm:ss}";
        }
        catch
        {
            _connectivityChecked = true;
            IsApiConnected = false;
            ApiStatusMessage =
                $"Lost connection to {ApiEndpoint}. Check that the API is running, then click Refresh.";
            LastRefreshed = "Refresh failed — sample data shown";
            _loadedLiveData = false;
            RunOnUi(() => ApplySampleData());
        }
        finally
        {
            if (IsUiAvailable)
                IsLoading = false;
        }
    }

    private static void RunOnUi(Action action)
    {
        var dispatcher = Application.Current?.Dispatcher;
        if (dispatcher is null || dispatcher.HasShutdownStarted)
            return;

        if (dispatcher.CheckAccess())
            action();
        else
            dispatcher.Invoke(action, DispatcherPriority.DataBind);
    }

    private void ApplySampleData()
    {
        ApplyDashboard(BuildSampleDashboard());
        HasPresentedContent = true;
    }

    internal void ApplyDashboard(DashboardDto dashboard)
    {
        ReplaceCollection(Stats, dashboard.Stats.Take(4).Select(s =>
            new MockStat(s.Label, s.Value, s.IconGlyph, s.AccentColor)));

        ReplaceCollection(ActivityRows, dashboard.Rows.Take(6).Select(r => new MockRow
        {
            Col1 = r.Col1,
            Col2 = r.Col2,
            Col3 = r.Col3,
            Col4 = r.Col4,
            Status = r.Status
        }));

        if (dashboard.Alerts is { Count: > 0 })
        {
            ReplaceCollection(Alerts, dashboard.Alerts.Select(a => new DashboardAlertItem
            {
                Title = a.Title,
                Detail = a.Detail,
                Severity = a.Severity,
                IconGlyph = a.IconGlyph
            }));
        }

        if (dashboard.SummaryLines is { Count: > 0 })
        {
            ReplaceCollection(SummaryLines, dashboard.SummaryLines.Select(line => new DashboardSummaryLine
            {
                Label = line.Label,
                Value = line.Value,
                IconGlyph = line.IconGlyph
            }));
        }

        if (dashboard.Charts is not null)
            ApplyCharts(dashboard.Charts);

        SyncInventoryStockChart(dashboard.Charts);
        PadIndexedSlots();
        HasPresentedContent = true;
    }

    /// <summary>Keeps four slots for index bindings so layout height stays stable.</summary>
    private void PadIndexedSlots()
    {
        PadCollection(ActivityRows, () => new MockRow { Col1 = "—", Col2 = "—", Col3 = "—", Col4 = "—", Col5 = "—" });
        PadCollection(SummaryLines, () => new DashboardSummaryLine { Label = "—", Value = "—" });
        PadCollection(Alerts, () => new DashboardAlertItem { Title = "—", Detail = "—" });
    }

    private static void PadCollection<T>(ObservableCollection<T> collection, Func<T> factory)
    {
        while (collection.Count < 4)
            collection.Add(factory());
    }

    private static void ReplaceCollection<T>(ObservableCollection<T> collection, IEnumerable<T> items)
    {
        var list = items as IList<T> ?? items.ToList();
        collection.Clear();
        foreach (var item in list)
            collection.Add(item);
    }

    private void ApplyCharts(DashboardChartsDto charts)
    {
        if (charts.SalesVsPurchase is not null)
            SalesPurchaseChart = MapBarChart(charts.SalesVsPurchase);

        if (charts.StockByCategory is not null)
        {
            StockCategoryChart = new DashboardPieChartData
            {
                Title = charts.StockByCategory.Title,
                Slices = charts.StockByCategory.Slices.Select(s => new DashboardPieSlice
                {
                    Label = s.Label,
                    Value = s.Value,
                    Color = s.Color
                }).ToList()
            };
        }
    }

    private static DashboardBarChartData MapBarChart(DashboardBarChartDto bar) => new()
    {
        Title = bar.Title,
        Series1Name = bar.Series1Name,
        Series2Name = bar.Series2Name,
        Series1Color = bar.Series1Color,
        Series2Color = bar.Series2Color,
        Labels = bar.Labels,
        Series1Values = bar.Series1,
        Series2Values = bar.Series2
    };

    private void SyncInventoryStockChart(DashboardChartsDto? charts)
    {
        if (charts?.StockByType is { Labels.Count: > 0 } stockByType)
        {
            InventoryStockChart = MapBarChart(stockByType);
            return;
        }

        var fromSummary = BuildInventoryStockChartFromSummaryLines();
        if (fromSummary is not null)
            InventoryStockChart = fromSummary;
    }

    private DashboardBarChartData? BuildInventoryStockChartFromSummaryLines()
    {
        if (SummaryLines.Count == 0)
            return null;

        var labels = new List<string>();
        var qtyValues = new List<double>();
        var productCounts = new List<double>();

        foreach (var line in SummaryLines.Take(4))
        {
            if (line.Label is "—" or null || line.Value is "—")
                continue;

            labels.Add(ExtractShortLabel(line.Label));
            qtyValues.Add(ParseDashboardNumber(line.Value));
            productCounts.Add(ExtractCountFromLabel(line.Label));
        }

        if (labels.Count == 0)
            return null;

        return new DashboardBarChartData
        {
            Title = "Inventory trend by type",
            Series1Name = "Qty on hand",
            Series2Name = "Products",
            Series1Color = ThemeColors.Primary,
            Series2Color = ThemeColors.Teal,
            Labels = labels,
            Series1Values = qtyValues,
            Series2Values = productCounts
        };
    }

    private static string ExtractShortLabel(string label)
    {
        var trimmed = label.Trim();
        var paren = trimmed.IndexOf('(');
        return paren > 0 ? trimmed[..paren].Trim() : trimmed;
    }

    private static double ExtractCountFromLabel(string label)
    {
        var match = Regex.Match(label, @"\((\d+)\)");
        return match.Success && double.TryParse(match.Groups[1].Value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var count)
            ? count
            : 0;
    }

    private static double ParseDashboardNumber(string value)
    {
        var cleaned = value.Trim().Replace(",", string.Empty);
        return double.TryParse(cleaned, NumberStyles.Number, CultureInfo.InvariantCulture, out var number)
            ? number
            : 0;
    }

    private void NavigateQuickLink(object? parameter)
    {
        if (parameter is DashboardQuickLinkItem item)
        {
            _host?.NavigateByKey(item.NavKey);
            return;
        }

        if (parameter is string key && _host is not null)
            _host.NavigateByKey(key);
    }

    private static DashboardDto BuildSampleDashboard()
    {
        return new DashboardDto
        {
            Stats =
            [
                new DashboardStatDto { Label = "Today's Sales", Value = "₹52,000", IconGlyph = "\uE8A1", AccentColor = ThemeColors.Primary },
                new DashboardStatDto { Label = "Total Sales", Value = "₹1,25,000", IconGlyph = "\uE7B8", AccentColor = ThemeColors.Primary },
                new DashboardStatDto { Label = "Total Purchase", Value = "₹78,000", IconGlyph = "\uE73E", AccentColor = ThemeColors.Success },
                new DashboardStatDto { Label = "Income / Expenses", Value = "₹47,000", IconGlyph = "\uE719", AccentColor = ThemeColors.Warning }
            ],
            Rows =
            [
                new DashboardRowDto { Col1 = "Income (125)", Col2 = "₹ 5,20,000", Col3 = "Accounting", Col4 = "Live", Status = "Active" },
                new DashboardRowDto { Col1 = "Expenses (98)", Col2 = "₹ 3,10,000", Col3 = "Accounting", Col4 = "Live", Status = "Active" },
                new DashboardRowDto { Col1 = "Receivables (18)", Col2 = "₹ 65,000", Col3 = "Finance", Col4 = "Outstanding", Status = "Open" },
                new DashboardRowDto { Col1 = "Payables (11)", Col2 = "₹ 42,000", Col3 = "Finance", Col4 = "Outstanding", Status = "Open" }
            ],
            Alerts =
            [
                new DashboardAlertDto { Title = "Orders (25)", Detail = "25", Severity = "Active", IconGlyph = "\uE8A1" },
                new DashboardAlertDto { Title = "Progress (20)", Detail = "70%", Severity = "Good", IconGlyph = "\uE895" },
                new DashboardAlertDto { Title = "Completed (14)", Detail = "14", Severity = "Good", IconGlyph = "\uE73E" },
                new DashboardAlertDto { Title = "Delayed (3)", Detail = "3", Severity = "Warning", IconGlyph = "\uE7BA" }
            ],
            SummaryLines =
            [
                new DashboardSummaryLineDto { Label = "Raw (64)", Value = "3,200", IconGlyph = "\uE7FC" },
                new DashboardSummaryLineDto { Label = "WIP (22)", Value = "1,450", IconGlyph = "\uE9CE" },
                new DashboardSummaryLineDto { Label = "Finished (48)", Value = "5,100", IconGlyph = "\uE8A5" },
                new DashboardSummaryLineDto { Label = "Low Stock (6)", Value = "6", IconGlyph = "\uE7BA" }
            ],
            Charts = new DashboardChartsDto
            {
                SalesVsPurchase = new DashboardBarChartDto
                {
                    Title = "Accounting Overview",
                    Series1Name = "Sales",
                    Series2Name = "Purchase",
                    Series1Color = ThemeColors.Primary,
                    Series2Color = ThemeColors.Warning,
                    Labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                    Series1 = [120000, 98000, 145000, 132000, 156000, 168000],
                    Series2 = [95000, 110000, 88000, 124000, 101000, 115000]
                },
                StockByType = new DashboardBarChartDto
                {
                    Title = "Inventory trend by type",
                    Series1Name = "Qty on hand",
                    Series2Name = "Products",
                    Series1Color = ThemeColors.Primary,
                    Series2Color = ThemeColors.Teal,
                    Labels = ["Raw", "WIP", "Finished", "Low stock"],
                    Series1 = [3200, 1450, 5100, 6],
                    Series2 = [64, 22, 48, 0]
                },
                StockByCategory = new DashboardPieChartDto
                {
                    Title = "Stock value by category",
                    Slices =
                    [
                        new DashboardPieSliceDto { Label = "Finished Good", Value = 420000, Color = ThemeColors.Primary },
                        new DashboardPieSliceDto { Label = "Raw Material", Value = 280000, Color = ThemeColors.Success },
                        new DashboardPieSliceDto { Label = "Component", Value = 142000, Color = ThemeColors.Warning },
                        new DashboardPieSliceDto { Label = "General", Value = 85000, Color = ThemeColors.Purple }
                    ]
                }
            }
        };
    }

    private static IReadOnlyList<DashboardQuickLinkItem> BuildQuickLinkItems() =>
    [
        new(NavKeys.Products, "Products", "Item master", "\uE7B8", ThemeColors.Primary),
        new(NavKeys.PurchaseInvoice, "Purchase Invoice", "Inbound stock", "\uE719", ThemeColors.Warning),
        new(NavKeys.SalesInvoice, "Sales Invoice", "Outbound stock", "\uE8A1", ThemeColors.Success),
        new(NavKeys.StockTransfer, "Stock Transfer", "Move between godowns", "\uE8AB", ThemeColors.Teal),
        new(NavKeys.OpeningStock, "Opening Stock", "Period opening report", "\uE8F1", ThemeColors.Slate),
        new(NavKeys.ClosingStock, "Closing Stock", "Valuation & reorder", "\uE8F2", ThemeColors.Purple)
    ];
}
