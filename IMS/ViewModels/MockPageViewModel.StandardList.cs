using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Input;
using System.Windows.Threading;
using IMS.Models;
using IMS.Services;
using IMS.Views;

using AuthSession = IMS.Services.AuthSession;

namespace IMS.ViewModels;

public partial class MockPageViewModel
{
    ObservableCollection<MockStat> IStandardListViewModel.Stats => StatsList;
    private CancellationTokenSource? _standardSearchDebounce;
    private string _standardSearchText = string.Empty;
    private string? _standardStatusFilter = "(All)";
    private string _standardStatusMessage = string.Empty;
    private string _sortField = "col1";
    private string _sortDir = "desc";
    private string? _defaultSortField;
    private string? _defaultSortDir;
    private bool _isExporting;

    private bool IsExporting
    {
        get => _isExporting;
        set
        {
            if (!SetProperty(ref _isExporting, value))
                return;
            NotifyListLoadingBindings();
        }
    }
    private IReadOnlyList<string> _visibleColumnKeys = [];
    private IReadOnlyList<ListColumnDef> _listColumns = [];

    public ObservableCollection<StandardListRow> GridRows { get; } = new();

    public virtual string ModuleKey => $"list_{PageTitle.ToLowerInvariant().Replace(' ', '_')}";

    public virtual IReadOnlyList<ListColumnDef> AllColumns =>
        _listColumns.Count > 0 ? _listColumns : BuildDefaultColumns();

    public IReadOnlyList<string> VisibleColumnKeys => _visibleColumnKeys;

    public virtual IReadOnlyList<string>? StatusFilterOptions { get; protected set; }

    public string SearchText
    {
        get => _standardSearchText;
        set
        {
            if (!SetProperty(ref _standardSearchText, value))
                return;
            DebounceStandardReload();
        }
    }

    public string? StatusFilter
    {
        get => _standardStatusFilter;
        set
        {
            if (!SetProperty(ref _standardStatusFilter, value))
                return;
            CurrentPage = 1;
            _ = ApplyPagingChangeAsync();
        }
    }

    public string StatusMessage
    {
        get => _standardStatusMessage;
        protected set => SetProperty(ref _standardStatusMessage, value);
    }

    public string CurrentSortField => _sortField;
    public string CurrentSortDir => _sortDir;

    public bool ShowEmptyState => HasPresentedContent && !IsListBusy && GridRows.Count == 0;
    public bool CanExportData => !IsListBusy && (TotalRecords > 0 || GridRows.Count > 0);
    public virtual string? SearchToolTip => $"Search {PageTitle.ToLowerInvariant()}…";
    public virtual string EmptyStateMessage => $"No {PageTitle.ToLowerInvariant()} found.";
    public virtual string LoadingSubtitle => $"Fetching {PageTitle.ToLowerInvariant()} from the database";

    public virtual bool ShowStatusFilter => StatusFilterOptions is { Count: > 0 };
    public virtual bool ShowViewAction => false;
    public virtual bool ShowPrintAction => PrintRowCommand is not null;
    public virtual bool ShowEditAction => EditRowCommand is not null;
    public virtual bool ShowDesignLayoutAction => DesignRowCommand is not null;
    public virtual bool ShowDeleteAction => DeleteRowCommand is not null;

    public virtual bool ShowBomAction => BomRowCommand is not null && AuthSession.CanManageBom;

    public virtual bool ShowBarcodeLabelAction =>
        BarcodeLabelRowCommand is not null && AuthSession.CanPrintBarcodeLabels;

    public ICommand? BomRowCommand { get; protected set; }

    public ICommand? BarcodeLabelRowCommand { get; protected set; }

    public ICommand RefreshCommand { get; private set; } = null!;
    public ICommand ManageColumnsCommand { get; private set; } = null!;
    public ICommand ExportDataCommand { get; private set; } = null!;
    public ICommand SortColumnCommand { get; private set; } = null!;
    public ICommand ClearFiltersCommand { get; private set; } = null!;
    public ICommand? ViewRowCommand => null;

    public event EventHandler? ColumnVisibilityChanged;

    protected void InitializeStandardList()
    {
        RefreshCommand = new RelayCommand(() => ReloadFromApi(), () => !IsLoading);
        ManageColumnsCommand = new RelayCommand(OpenManageColumns, () => !IsLoading);
        ExportDataCommand = new RelayCommand(
            p => _ = ExportStandardAsync(p?.ToString() ?? string.Empty),
            _ => CanExportData);
        SortColumnCommand = new RelayCommand(
            p =>
            {
                if (p is string field && !string.IsNullOrWhiteSpace(field))
                    ApplySort(field.Trim());
            },
            static p => p is string s && !string.IsNullOrWhiteSpace(s));
        ClearFiltersCommand = new RelayCommand(ClearStandardFilters, () => !IsListBusy);
        LoadStandardPagePreferences();
    }

    protected void EnsureStandardListColumnsInitialized()
    {
        if (_listColumns.Count > 0)
            return;

        _listColumns = BuildDefaultColumns();
        _visibleColumnKeys = ListColumnPreferenceStore.Load(
            ModuleKey,
            AllColumns,
            DocumentListColumnCatalog.DefaultKeys(AllColumns));
        NotifyColumnVisibility();
    }

    protected void ConfigureStandardListColumns(IReadOnlyList<ListColumnDef> columns, IReadOnlyList<string>? statusOptions = null)
    {
        _listColumns = columns;
        StatusFilterOptions = statusOptions;
        _visibleColumnKeys = ListColumnPreferenceStore.Load(
            ModuleKey,
            AllColumns,
            DocumentListColumnCatalog.DefaultKeys(AllColumns));
        OnPropertyChanged(nameof(AllColumns));
        OnPropertyChanged(nameof(ShowStatusFilter));
        NotifyColumnVisibility();
    }

    private IReadOnlyList<ListColumnDef> BuildDefaultColumns()
    {
        var cols = new List<ListColumnDef>
        {
            new("col1", Col1Header, true),
            new("col2", Col2Header, true),
            new("col3", Col3Header, true),
            new("col4", Col4Header, true)
        };
        if (ShowCol5Column)
            cols.Add(new ListColumnDef("col5", Col5Header));
        cols.Add(new ListColumnDef("status", "Status", true));
        return cols;
    }

    protected void SyncGridRowsFromPagedRows()
    {
        GridRows.Clear();
        var keys = VisibleColumnKeys.ToList();
        foreach (var row in PagedRows)
            GridRows.Add(StandardListRow.FromMockRow(row, row.RowNumber, keys));
        OnPropertyChanged(nameof(ShowEmptyState));
        OnPropertyChanged(nameof(CanExportData));
    }

    protected void AfterStandardRowsRefreshed()
    {
        if (_listColumns.Count == 0)
            EnsureStandardListColumnsInitialized();
        SyncGridRowsFromPagedRows();
        StatusMessage = GridRows.Count == 0
            ? $"No {PageTitle.ToLowerInvariant()} match your filters."
            : $"{TotalRecords:N0} record(s) found.";
    }

    public void ApplySort(string field)
    {
        if (string.Equals(field, "sr", StringComparison.OrdinalIgnoreCase))
            field = _listColumns.Count > 0 ? _listColumns[0].Key : "col1";

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
        _ = ApplyPagingChangeAsync();
    }

    public bool IsColumnVisible(string key) =>
        _visibleColumnKeys.Contains(key, StringComparer.OrdinalIgnoreCase);

    private void OpenManageColumns()
    {
        var dlg = new ListColumnSettingsWindow(
            ModuleKey,
            AllColumns,
            _visibleColumnKeys,
            DocumentListColumnCatalog.DefaultKeys(AllColumns))
        {
            Owner = Application.Current?.MainWindow
        };
        if (dlg.ShowDialog() != true || dlg.ResultKeys is null)
            return;

        _visibleColumnKeys = ListColumnCatalog.NormalizeVisibleKeys(
            AllColumns,
            dlg.ResultKeys,
            DocumentListColumnCatalog.DefaultKeys(AllColumns));
        NotifyColumnVisibility();
        SaveStandardPagePreferences();
    }

    private void NotifyColumnVisibility()
    {
        OnPropertyChanged(nameof(VisibleColumnKeys));
        ColumnVisibilityChanged?.Invoke(this, EventArgs.Empty);
    }

    private void ClearStandardFilters()
    {
        _standardSearchText = string.Empty;
        _standardStatusFilter = "(All)";
        OnPropertyChanged(nameof(SearchText));
        OnPropertyChanged(nameof(StatusFilter));
        CurrentPage = 1;
        ReloadFromApi();
    }

    private void DebounceStandardReload()
    {
        _standardSearchDebounce?.Cancel();
        _standardSearchDebounce = new CancellationTokenSource();
        var token = _standardSearchDebounce.Token;
        _ = Task.Run(async () =>
        {
            try
            {
                await Task.Delay(350, token);
                await Application.Current.Dispatcher.InvokeAsync(() =>
                {
                    CurrentPage = 1;
                    _ = ApplyPagingChangeAsync();
                });
            }
            catch (TaskCanceledException)
            {
            }
        }, token);
    }

    private async Task ExportStandardAsync(string format)
    {
        if (GridRows.Count == 0)
        {
            MessageBox.Show("No rows to export.", "Export Data", MessageBoxButton.OK, MessageBoxImage.Information);
            return;
        }

        try
        {
            IsExporting = true;
            var prefix = PageTitle.Replace(' ', '_');
            switch (format.ToLowerInvariant())
            {
                case "excel":
                    await StandardListExportService.ExportToExcelAsync(prefix, GridRows.ToList(), AllColumns, _visibleColumnKeys);
                    break;
                case "pdf":
                    StandardListPrintService.ShowPreview(
                        PageTitle,
                        GridRows.ToList(),
                        AllColumns,
                        _visibleColumnKeys,
                        PageInfo);
                    break;
                case "print":
                    StandardListPrintService.Print(
                        PageTitle,
                        GridRows.ToList(),
                        AllColumns,
                        _visibleColumnKeys,
                        PageInfo);
                    break;
            }
        }
        finally
        {
            IsExporting = false;
        }
    }

    protected void ApplyDefaultListSort(string field, string direction)
    {
        _defaultSortField = field;
        _defaultSortDir = direction;
    }

    protected void SetListSort(string field, string direction)
    {
        _sortField = field;
        _sortDir = direction;
        OnPropertyChanged(nameof(CurrentSortField));
        OnPropertyChanged(nameof(CurrentSortDir));
    }

    protected virtual void LoadStandardPagePreferences()
    {
        var prefs = ListPagePreferenceStore.Load(ModuleKey, new ListPagePreferences
        {
            PageSize = SelectedPageSize,
            SortField = _sortField,
            SortDir = _sortDir
        });
        if (PageSizeOptions.Contains(prefs.PageSize))
            SelectedPageSize = prefs.PageSize;
        _sortField = string.IsNullOrWhiteSpace(prefs.SortField) ? _defaultSortField ?? _sortField : prefs.SortField;
        _sortDir = string.IsNullOrWhiteSpace(prefs.SortDir) ? _defaultSortDir ?? _sortDir : prefs.SortDir;
    }

    protected void SaveStandardPagePreferences()
    {
        ListPagePreferenceStore.Save(ModuleKey, new ListPagePreferences
        {
            PageSize = SelectedPageSize,
            SortField = _sortField,
            SortDir = _sortDir,
            SearchText = SearchText,
            StatusFilter = StatusFilter
        });
    }

    protected string? ResolveStatusFilterParam() =>
        StatusFilter is "(All)" or null or "" ? null : StatusFilter.Trim().ToLowerInvariant();

    protected string? ResolveSearchParam() =>
        string.IsNullOrWhiteSpace(SearchText) ? null : SearchText.Trim();

    protected IEnumerable<MockRow> FilterRowsForDisplay(IEnumerable<MockRow> source)
    {
        var rows = source;
        var search = ResolveSearchParam();
        if (!string.IsNullOrWhiteSpace(search))
        {
            rows = rows.Where(r =>
                r.Col1.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                r.Col2.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                r.Col3.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                r.Col4.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                (!string.IsNullOrEmpty(r.Col5) && r.Col5.Contains(search, StringComparison.OrdinalIgnoreCase)) ||
                (r.Status ?? string.Empty).Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        if (ShowStatusFilter && !string.IsNullOrWhiteSpace(ResolveStatusFilterParam()))
        {
            var status = ResolveStatusFilterParam()!;
            rows = rows.Where(r => string.Equals(r.Status, status, StringComparison.OrdinalIgnoreCase));
        }

        return rows;
    }
}
