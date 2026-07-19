using System.Collections.ObjectModel;
using System.Globalization;
using System.Windows;
using System.Windows.Input;
using System.Windows.Threading;
using IMS.Models;
using IMS.Resources;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;
using IMS.ViewModels.SubPages;
using IMS.Views;

namespace IMS.ViewModels;

public sealed partial class SalesOrdersViewModel : ViewModelBase, IPageViewLoadAware, IStandardListViewModel
{
    private readonly MainViewModel _host;
    private readonly SalesEntryDefinition _definition;
    private CancellationTokenSource? _searchDebounce;
    private int _currentPage = 1;
    private int _pageSize = 25;
    private int _totalCount;
    private bool _isLoading;
    private bool _hasPresentedContent;
    private string _searchText = string.Empty;
    private string? _statusFilter = "(All)";
    private string _sortField = "soNo";
    private string _sortDir = "desc";
    private string _statusMessage = string.Empty;
    private bool _isExporting;
    private IReadOnlyList<string> _visibleColumnKeys = SalesOrderListColumnCatalog.DefaultVisibleKeys;

    public SalesOrdersViewModel(MainViewModel host)
    {
        _host = host;
        _definition = SalesEntryCatalog.Get(SalesEntryType.SalesOrder);
        Rows = new ObservableCollection<SalesOrderListRow>();
        GridRows = new ObservableCollection<StandardListRow>();
        Stats = new ObservableCollection<MockStat>(PlaceholderStats(_definition.Stats));

        RefreshCommand = new RelayCommand(() => _ = ReloadSalesOrdersAsync(), () => !IsListBusy);
        ClearFiltersCommand = new RelayCommand(ClearFilters, () => !IsListBusy);
        ManageColumnsCommand = new RelayCommand(ManageColumns, () => !IsListBusy);
        ExportDataCommand = new RelayCommand(
            p => _ = ExportDataAsync(p?.ToString() ?? string.Empty),
            _ => CanExportData);
        EditRowCommand = CreateEditRowCommand(EditRow);
        DeleteRowCommand = new RelayCommand(p => _ = DeleteRowAsync(ResolveRow(p)), static p => ResolveRow(p) is not null);
        PrintRowCommand = new RelayCommand(p => _ = PrintRowAsync(ResolveRow(p)), static p => ResolveRow(p) is not null);

        FirstPageCommand = new RelayCommand(() => CurrentPage = 1, () => CurrentPage > 1);
        PreviousPageCommand = new RelayCommand(() => CurrentPage--, () => CurrentPage > 1);
        NextPageCommand = new RelayCommand(() => CurrentPage++, () => CurrentPage < TotalPages);
        LastPageCommand = new RelayCommand(() => CurrentPage = TotalPages, () => CurrentPage < TotalPages);

        SortColumnCommand = new RelayCommand(
            p =>
            {
                if (p is string field && !string.IsNullOrWhiteSpace(field))
                    ToggleSort(field.Trim());
            },
            static p => p is string s && !string.IsNullOrWhiteSpace(s));

        SubPageActions =
        [
            SubPageActionsFactory.OpenSalesOrderWorkspace(host, _definition.AddActionTitle, "\uE710")
        ];

        LoadColumnPreferences();
    }

    public string PageTitle => _definition.ListPageTitle;
    public string PageDescription => _definition.ListDescription;
    public string IconGlyph => _definition.IconGlyph;

    public ObservableCollection<SalesOrderListRow> Rows { get; }
    public ObservableCollection<StandardListRow> GridRows { get; }
    public ObservableCollection<MockStat> Stats { get; }
    public IReadOnlyList<SubPageAction> SubPageActions { get; }

    public string ModuleKey => SalesOrderListColumnCatalog.ModuleKey;
    public IReadOnlyList<ListColumnDef> AllColumns => SalesOrderListColumnCatalog.All;
    public IReadOnlyList<string> VisibleColumnKeys => _visibleColumnKeys;
    public IReadOnlyList<string> StatusFilterOptions { get; } =
    [
        "(All)", "Open", "Partially Delivered", "Fully Delivered",
        "Confirmed", "Picking", "Shipped", "Closed", "Cancelled", "Draft"
    ];
    public string? SearchToolTip => "Search SO no, customer, salesman…";
    public string EmptyStateMessage => "No sales orders found.";
    public string LoadingSubtitle => "Fetching sales orders from the database";

    public string BusyLoadingSubtitle =>
        IsExporting ? "Preparing export…" : "Updating sales orders…";
    public bool ShowStatusFilter => true;
    public bool ShowViewAction => false;
    public bool ShowPrintAction => true;
    public bool ShowEditAction => true;
    public bool ShowDesignLayoutAction => false;
    public bool ShowDeleteAction => true;
    public bool ShowBomAction => false;
    public bool ShowBarcodeLabelAction => false;
    public ICommand? BomRowCommand => null;
    public ICommand? BarcodeLabelRowCommand => null;

    public IReadOnlyList<int> PageSizeOptions { get; } = MockPageViewModel.LargeListPageSizeOptions;

    public string SearchText
    {
        get => _searchText;
        set
        {
            if (!SetProperty(ref _searchText, value))
                return;
            DebounceReload();
        }
    }

    public string? StatusFilter
    {
        get => _statusFilter;
        set
        {
            if (!SetProperty(ref _statusFilter, value))
                return;
            CurrentPage = 1;
            _ = ReloadSalesOrdersAsync();
        }
    }

    public int SelectedPageSize
    {
        get => _pageSize;
        set
        {
            if (!PageSizeOptions.Contains(value))
                return;
            if (!SetProperty(ref _pageSize, value))
                return;
            CurrentPage = 1;
            _ = ReloadSalesOrdersAsync();
        }
    }

    public int CurrentPage
    {
        get => _currentPage;
        set
        {
            var page = Math.Clamp(value, 1, TotalPages);
            if (!SetProperty(ref _currentPage, page))
                return;
            _ = ReloadSalesOrdersAsync();
        }
    }

    public int TotalPages => Math.Max(1, (int)Math.Ceiling(_totalCount / (double)_pageSize));
    public int TotalRecords => _totalCount;
    public string PageInfo => $"Page {CurrentPage} of {TotalPages}  •  {TotalRecords:N0} records  •  {_pageSize} per page";

    public bool IsLoading
    {
        get => _isLoading;
        private set
        {
            if (!SetProperty(ref _isLoading, value))
                return;
            NotifyListLoadingBindings();
            RaiseCommandStates();
        }
    }

    public bool IsListBusy => IsLoading || IsExporting;

    /// <summary>Full-screen loader on first paint (same pattern as Dashboard).</summary>
    public bool ShowLoadingOverlay => IsLoading && !HasPresentedContent;

    public bool ShowInitialLoadingOverlay => ShowLoadingOverlay;

    public bool ShowBusyOverlay => false;

    public bool HasPresentedContent
    {
        get => _hasPresentedContent;
        private set
        {
            if (!SetProperty(ref _hasPresentedContent, value))
                return;
            OnPropertyChanged(nameof(ShowListContent));
            NotifyListLoadingBindings();
        }
    }

    public bool ShowListContent => HasPresentedContent;
    public bool ShowEmptyState => HasPresentedContent && !IsListBusy && Rows.Count == 0;

    public string StatusMessage
    {
        get => _statusMessage;
        private set => SetProperty(ref _statusMessage, value);
    }

    public string CurrentSortField => _sortField;
    public string CurrentSortDir => _sortDir;

    public bool ShowColumnSoNo => IsColumnVisible("soNo");
    public bool ShowColumnSoDate => IsColumnVisible("soDate");
    public bool ShowColumnCustomer => IsColumnVisible("customer");
    public bool ShowColumnTotalTaxable => IsColumnVisible("totalTaxable");
    public bool ShowColumnTotalCgst => IsColumnVisible("totalCgst");
    public bool ShowColumnTotalSgst => IsColumnVisible("totalSgst");
    public bool ShowColumnTotalIgst => IsColumnVisible("totalIgst");
    public bool ShowColumnTotalDiscount => IsColumnVisible("totalDiscount");
    public bool ShowColumnSalesAmt => IsColumnVisible("salesAmt");
    public bool ShowColumnPaidAmt => IsColumnVisible("paidAmt");
    public bool ShowColumnBalance => IsColumnVisible("balance");
    public bool ShowColumnStatus => IsColumnVisible("status");

    public bool CanExportData => !IsListBusy && (TotalRecords > 0 || Rows.Count > 0);

    public ICommand RefreshCommand { get; }
    public ICommand ClearFiltersCommand { get; }
    public ICommand ManageColumnsCommand { get; }
    public ICommand ExportDataCommand { get; }
    public ICommand EditRowCommand { get; }
    public ICommand DeleteRowCommand { get; }
    public ICommand PrintRowCommand { get; }
    public ICommand? ViewRowCommand => null;
    public ICommand FirstPageCommand { get; }
    public ICommand PreviousPageCommand { get; }
    public ICommand NextPageCommand { get; }
    public ICommand LastPageCommand { get; }
    public ICommand SortColumnCommand { get; }

    public event EventHandler? ColumnVisibilityChanged;

    public void OnPageViewLoaded() => _ = ReloadSalesOrdersAsync();

    public void RefreshFromApi() => _ = ReloadSalesOrdersAsync();

    public Task EnsureApiLoadAsync(bool force = false) => ReloadSalesOrdersAsync();

    internal async Task ReloadSalesOrdersAsync()
    {
        IsLoading = true;

        try
        {
            if (!await ImsApiClient.CheckHealthAsync())
            {
                await Application.Current.Dispatcher.InvokeAsync(() =>
                {
                    Rows.Clear();
                    SyncGridRows();
                    StatusMessage = "API is not available. Start the API server (npm run dev:once) and click Refresh.";
                    HasPresentedContent = true;
                    OnPropertyChanged(nameof(ShowEmptyState));
                });
                return;
            }
            var status = MapStatusFilter(StatusFilter);

            var (items, total) = await ImsApiClient.GetSalesOrdersPageAsync(
                string.IsNullOrWhiteSpace(SearchText) ? null : SearchText.Trim(),
                status,
                CurrentPage,
                _pageSize,
                _sortField,
                _sortDir);

            _totalCount = total;
            var start = (CurrentPage - 1) * _pageSize;
            await Application.Current.Dispatcher.InvokeAsync(() =>
            {
                Rows.Clear();
                for (var i = 0; i < items.Count; i++)
                    Rows.Add(SalesOrderListMapper.ToRow(items[i], start + i + 1));

                SyncGridRows();

                if (CurrentPage > TotalPages)
                    _currentPage = TotalPages;

                StatusMessage = Rows.Count == 0
                    ? "No sales orders match your filters."
                    : $"{TotalRecords:N0} sales order(s) found.";

                OnPropertyChanged(nameof(PageInfo));
                OnPropertyChanged(nameof(TotalPages));
                OnPropertyChanged(nameof(TotalRecords));
                OnPropertyChanged(nameof(CurrentPage));
                OnPropertyChanged(nameof(ShowEmptyState));
                OnPropertyChanged(nameof(CanExportData));
                HasPresentedContent = true;
                RaisePagingCommands();
                RaiseCommandStates();
            }, DispatcherPriority.Normal);

            var stats = await ImsApiClient.GetSalesOrderStatsAsync();
            if (stats is not null)
            {
                await Application.Current.Dispatcher.InvokeAsync(() => RefreshStats(stats), DispatcherPriority.Normal);
            }
        }
        catch (Exception ex)
        {
            await Application.Current.Dispatcher.InvokeAsync(() =>
            {
                StatusMessage = $"Could not load sales orders: {ex.Message}";
                HasPresentedContent = true;
                OnPropertyChanged(nameof(ShowEmptyState));
            });
        }
        finally
        {
            IsLoading = false;
        }
    }

    private void DebounceReload()
    {
        _searchDebounce?.Cancel();
        _searchDebounce = new CancellationTokenSource();
        var token = _searchDebounce.Token;
        _ = Task.Run(async () =>
        {
            try
            {
                await Task.Delay(350, token);
                await Application.Current.Dispatcher.InvokeAsync(() =>
                {
                    _currentPage = 1;
                    OnPropertyChanged(nameof(CurrentPage));
                    OnPropertyChanged(nameof(PageInfo));
                    _ = ReloadSalesOrdersAsync();
                });
            }
            catch (TaskCanceledException)
            {
            }
        }, token);
    }

    public void ApplySort(string field) => ToggleSort(NormalizeSortField(field));

    private static string NormalizeSortField(string field) =>
        string.Equals(field, "sr", StringComparison.OrdinalIgnoreCase) ? "soNo" : field;

    private void ToggleSort(string field)
    {
        if (string.Equals(_sortField, field, StringComparison.OrdinalIgnoreCase))
            _sortDir = _sortDir == "asc" ? "desc" : "asc";
        else
        {
            _sortField = field;
            _sortDir = "asc";
        }

        OnPropertyChanged(nameof(CurrentSortField));
        OnPropertyChanged(nameof(CurrentSortDir));
        CurrentPage = 1;
        _ = ReloadSalesOrdersAsync();
    }

    private void ManageColumns()
    {
        var dlg = new ListColumnSettingsWindow(
            SalesOrderListColumnCatalog.ModuleKey,
            SalesOrderListColumnCatalog.All,
            _visibleColumnKeys,
            SalesOrderListColumnCatalog.DefaultVisibleKeys)
        {
            Owner = Application.Current?.MainWindow
        };
        if (dlg.ShowDialog() != true || dlg.ResultKeys is null)
            return;

        ApplyColumnPreferences(dlg.ResultKeys);
        ListColumnPreferenceStore.Save(
            ModuleKey,
            _visibleColumnKeys,
            SalesOrderListColumnCatalog.All,
            SalesOrderListColumnCatalog.DefaultVisibleKeys);
    }

    private void LoadColumnPreferences()
    {
        var keys = ListColumnPreferenceStore.Load(
            SalesOrderListColumnCatalog.ModuleKey,
            SalesOrderListColumnCatalog.All,
            SalesOrderListColumnCatalog.DefaultVisibleKeys);
        ApplyColumnPreferences(keys);
    }

    private void ApplyColumnPreferences(IReadOnlyList<string> keys)
    {
        _visibleColumnKeys = SalesOrderListColumnCatalog.NormalizeVisibleKeys(keys);
        OnPropertyChanged(nameof(ShowColumnSoNo));
        OnPropertyChanged(nameof(ShowColumnSoDate));
        OnPropertyChanged(nameof(ShowColumnCustomer));
        OnPropertyChanged(nameof(ShowColumnTotalTaxable));
        OnPropertyChanged(nameof(ShowColumnTotalCgst));
        OnPropertyChanged(nameof(ShowColumnTotalSgst));
        OnPropertyChanged(nameof(ShowColumnTotalIgst));
        OnPropertyChanged(nameof(ShowColumnTotalDiscount));
        OnPropertyChanged(nameof(ShowColumnSalesAmt));
        OnPropertyChanged(nameof(ShowColumnPaidAmt));
        OnPropertyChanged(nameof(ShowColumnBalance));
        OnPropertyChanged(nameof(ShowColumnStatus));
        ColumnVisibilityChanged?.Invoke(this, EventArgs.Empty);
    }

    public bool IsColumnVisible(string key) =>
        _visibleColumnKeys.Contains(key, StringComparer.OrdinalIgnoreCase);

    private void SyncGridRows()
    {
        GridRows.Clear();
        foreach (var row in Rows)
            GridRows.Add(StandardListRow.FromSalesOrderRow(row));
        OnPropertyChanged(nameof(ShowEmptyState));
        OnPropertyChanged(nameof(CanExportData));
    }

    private void ClearFilters()
    {
        _searchText = string.Empty;
        _statusFilter = "(All)";
        OnPropertyChanged(nameof(SearchText));
        OnPropertyChanged(nameof(StatusFilter));
        CurrentPage = 1;
        _ = ReloadSalesOrdersAsync();
    }

    private static SalesOrderListRow? ResolveRow(object? parameter) =>
        parameter switch
        {
            SalesOrderListRow row => row,
            StandardListRow grid when grid.Tag is SalesOrderListRow row => row,
            _ => null
        };

    public async Task ExportDataAsync(string format)
    {
        if (IsLoading)
        {
            MessageBox.Show("Please wait until loading finishes.", "Export Data",
                MessageBoxButton.OK, MessageBoxImage.Information);
            return;
        }

        if (TotalRecords <= 0 && Rows.Count == 0)
        {
            MessageBox.Show("No sales orders to export for the current filters.", "Export Data",
                MessageBoxButton.OK, MessageBoxImage.Information);
            return;
        }

        if (IsExporting)
            return;

        try
        {
            IsExporting = true;
            StatusMessage = "Preparing export…";
            await RunExportDataAsync(format);
        }
        catch (Exception ex)
        {
            MessageBox.Show(ex.Message, "Export Data", MessageBoxButton.OK, MessageBoxImage.Error);
        }
        finally
        {
            IsExporting = false;
            if (!IsLoading)
                StatusMessage = Rows.Count == 0
                    ? "No sales orders match your filters."
                    : $"{TotalRecords:N0} sales order(s) found.";
        }
    }

    private bool IsExporting
    {
        get => _isExporting;
        set
        {
            if (!SetProperty(ref _isExporting, value))
                return;
            NotifyListLoadingBindings();
            RaiseCommandStates();
        }
    }

    private async Task RunExportDataAsync(string? format)
    {
        switch (format?.Trim().ToLowerInvariant())
        {
            case "excel":
                await ExportExcelAsync();
                break;
            case "pdf":
                await ExportPdfAsync();
                break;
            case "print":
                await PrintListAsync();
                break;
        }
    }

    private async Task<IReadOnlyList<SalesOrderListRow>> FetchAllFilteredRowsAsync() =>
        await SalesOrderListExportService.FetchAllFilteredAsync(
            string.IsNullOrWhiteSpace(SearchText) ? null : SearchText.Trim(),
            MapStatusFilter(StatusFilter),
            _sortField,
            _sortDir);

    private async Task<IReadOnlyList<SalesOrderListRow>> ResolveExportRowsAsync()
    {
        const int exportAllThreshold = 2500;
        if (TotalRecords <= exportAllThreshold)
            return await FetchAllFilteredRowsAsync();

        var choice = MessageBox.Show(
            $"{TotalRecords:N0} sales orders match your filters.\n\n" +
            $"Yes — export all (may take several minutes)\n" +
            $"No — export current page only ({Rows.Count} row(s))\n" +
            "Cancel — stop",
            "Export Data",
            MessageBoxButton.YesNoCancel,
            MessageBoxImage.Question);

        return choice switch
        {
            MessageBoxResult.Yes => await FetchAllFilteredRowsAsync(),
            MessageBoxResult.No => Rows.ToList(),
            _ => []
        };
    }

    private static async Task RunOnUiThreadAsync(Action action)
    {
        var dispatcher = Application.Current?.Dispatcher
            ?? throw new InvalidOperationException("UI thread is not available.");
        if (dispatcher.CheckAccess())
            action();
        else
            await dispatcher.InvokeAsync(action);
    }

    private static async Task RunOnUiThreadAsync(Func<Task> action)
    {
        var dispatcher = Application.Current?.Dispatcher
            ?? throw new InvalidOperationException("UI thread is not available.");
        if (dispatcher.CheckAccess())
            await action();
        else
            await dispatcher.InvokeAsync(action);
    }

    private async Task ExportExcelAsync()
    {
        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            var rows = await ResolveExportRowsAsync();
            if (rows.Count == 0)
                return;

            await RunOnUiThreadAsync(async () =>
                await SalesOrderListExportService.ExportCurrentPageToExcelAsync(rows, _visibleColumnKeys));
        }, "Export");
    }

    private async Task ExportPdfAsync()
    {
        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            var rows = await ResolveExportRowsAsync();
            if (rows.Count == 0)
                return;

            var subtitle = PageInfo;
            await RunOnUiThreadAsync(() =>
                SalesOrderListPrintService.ShowPreview(rows, _visibleColumnKeys, subtitle));
        }, "Export PDF");
    }

    private async Task PrintListAsync()
    {
        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            var rows = await ResolveExportRowsAsync();
            if (rows.Count == 0)
                return;

            var subtitle = PageInfo;
            await RunOnUiThreadAsync(() =>
                SalesOrderListPrintService.Print(rows, _visibleColumnKeys, subtitle));
        }, "Print");
    }

    private void ViewRow(SalesOrderListRow? row)
    {
        if (row is null || string.IsNullOrWhiteSpace(row.SoNo))
            return;
        _host.OpenSalesOrderForEdit(row.SoNo.Trim());
    }

    private void EditRow(SalesOrderListRow row) => ViewRow(row);

    private ICommand CreateEditRowCommand(Action<SalesOrderListRow> onEdit) =>
        new RelayCommand(
            p =>
            {
                if (ResolveRow(p) is { } row)
                    _ = ExecuteEditRowAsync(row, onEdit);
            },
            static p => ResolveRow(p) is not null);

    private async Task ExecuteEditRowAsync(SalesOrderListRow row, Action<SalesOrderListRow> onEdit)
    {
        if (!await EditDeleteGuard.AuthorizeEditAsync(PageTitle, row.SoNo, row.Customer))
            return;
        onEdit(row);
    }

    private async Task DeleteRowAsync(SalesOrderListRow? row)
    {
        if (row is null || !TryParseFormattedNo(row.SoNo, out var prefix, out var docNo))
            return;

        if (!await EditDeleteGuard.AuthorizeDeleteAsync(PageTitle, row.SoNo, row.Customer))
            return;

        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            await ImsApiClient.DeleteSalesOrderByNoAsync(docNo, prefix);
            await ReloadSalesOrdersAsync();
        }, "Delete");

        MessageBox.Show(
            $"Sales order {row.SoNo} was deleted.",
            "Sales Order Deleted",
            MessageBoxButton.OK,
            MessageBoxImage.Information);
    }

    private async Task PrintRowAsync(SalesOrderListRow? row)
    {
        if (row is null || string.IsNullOrWhiteSpace(row.SoNo))
            return;

        var formattedNo = row.SoNo.Trim();

        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            var order = await ImsApiClient.GetSalesOrderByFormattedAsync(formattedNo);
            if (order is null)
            {
                MessageBox.Show($"Sales order {formattedNo} was not found.", "Print",
                    MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            await Application.Current.Dispatcher.InvokeAsync(() =>
                SalesOrderPrintService.ShowPreview(order, SalesEntryType.SalesOrder));
        }, "Print");
    }

    public void RefreshStats(SalesOrderStatsDto stats)
    {
        Stats.Clear();
        Stats.Add(new MockStat("Open Orders", stats.Open.ToString("N0"), "\uE77F", ThemeColors.Primary));
        Stats.Add(new MockStat("To Ship", stats.ToShip.ToString("N0"), "\uE7B8", ThemeColors.Warning));
        Stats.Add(new MockStat("Shipped", stats.Shipped.ToString("N0"), "\uE73E", ThemeColors.Success));
        Stats.Add(new MockStat("Cancelled", stats.Cancelled.ToString("N0"), "\uE711", ThemeColors.Danger));
    }

    private static IReadOnlyList<MockStat> PlaceholderStats(IEnumerable<MockStat> template) =>
        template.Select(s => new MockStat(s.Label, "—", s.IconGlyph, s.AccentColor)).ToList();

    private void RaisePagingCommands()
    {
        (FirstPageCommand as RelayCommand)?.RaiseCanExecuteChanged();
        (PreviousPageCommand as RelayCommand)?.RaiseCanExecuteChanged();
        (NextPageCommand as RelayCommand)?.RaiseCanExecuteChanged();
        (LastPageCommand as RelayCommand)?.RaiseCanExecuteChanged();
    }

    private void RaiseCommandStates()
    {
        (RefreshCommand as RelayCommand)?.RaiseCanExecuteChanged();
        (ClearFiltersCommand as RelayCommand)?.RaiseCanExecuteChanged();
        (ManageColumnsCommand as RelayCommand)?.RaiseCanExecuteChanged();
        (ExportDataCommand as RelayCommand)?.RaiseCanExecuteChanged();
    }

    internal static bool TryParseFormattedNo(string? formatted, out string prefix, out int docNo)
    {
        prefix = "SO";
        docNo = 0;
        if (string.IsNullOrWhiteSpace(formatted))
            return false;

        var value = formatted.Trim();
        var dash = value.LastIndexOf('-');
        if (dash > 0 && dash < value.Length - 1)
        {
            prefix = NormalizeSoPrefix(value[..dash]);
            return int.TryParse(value[(dash + 1)..], NumberStyles.Integer, CultureInfo.InvariantCulture, out docNo);
        }

        return int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out docNo);
    }

    private static string NormalizeSoPrefix(string value)
    {
        var trimmed = value.Trim().ToUpperInvariant();
        var chars = trimmed.Where(c => char.IsLetterOrDigit(c) || c is '_' or '-').Take(12).ToArray();
        return chars.Length > 0 ? new string(chars) : "SO";
    }

    private static string? MapStatusFilter(string? filter)
    {
        if (filter is "(All)" or null or "")
            return null;

        return filter.Trim().ToLowerInvariant().Replace(' ', '_');
    }
}
