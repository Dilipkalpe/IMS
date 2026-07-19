using System.Collections.ObjectModel;
using System.Collections.Generic;
using System.Windows;
using System.Windows.Input;
using IMS.Helpers;
using IMS.Models;
using IMS.Services;

namespace IMS.ViewModels;

public partial class MockPageViewModel : ViewModelBase, IPageViewLoadAware, IStandardListViewModel
{
    private readonly List<MockRow> _allRows;
    private readonly object _loadGate = new();
    private readonly object _serverPageGate = new();
    private Task? _loadTask;
    private Task? _serverPageTask;
    private int _currentPage = 1;
    private int _pageSize = 5;
    private int _serverTotalCount;
    private MockRow? _selectedRow;
    private bool _isLoading;
    private bool _hasPresentedContent;
    private bool _loadedFromApi;
    private bool _serverPagingEnabled;
    private Func<int, int, CancellationToken, Task<(IReadOnlyList<MockRow> Rows, int Total)>>? _serverPageLoader;

    public static IReadOnlyList<int> DefaultPageSizeOptions { get; } = [10, 25, 50, 100, 200];
    public static IReadOnlyList<int> LargeListPageSizeOptions { get; } = [10, 25, 50, 100, 200, 500];

    public IReadOnlyList<SubPageAction> SubPageActions { get; protected init; } = [];

    public string PageTitle { get; }
    public string PageDescription { get; }
    public string IconGlyph { get; }
    public string Col1Header { get; }
    public string Col2Header { get; }
    public string Col3Header { get; }
    public string Col4Header { get; }
    public string Col5Header { get; }
    public bool ShowCol5Column => !string.IsNullOrEmpty(Col5Header);
    public ObservableCollection<MockRow> PagedRows { get; }
    public IEnumerable<MockStat> Stats => StatsList;
    protected ObservableCollection<MockStat> StatsList { get; }

    public bool ShowDeleteActions { get; }
    public ICommand? DeleteSelectedCommand { get; }
    public ICommand? DeleteRowCommand { get; }
    public ICommand? EditRowCommand { get; protected set; }
    public ICommand? DesignRowCommand { get; protected set; }
    public ICommand? PrintRowCommand { get; protected set; }

    public MockRow? SelectedRow
    {
        get => _selectedRow;
        set
        {
            if (!SetProperty(ref _selectedRow, value))
                return;
            (DeleteSelectedCommand as RelayCommand)?.RaiseCanExecuteChanged();
        }
    }

    protected IReadOnlyList<MockRow> AllRows => _allRows;

    public IReadOnlyList<int> PageSizeOptions { get; }

    public int SelectedPageSize
    {
        get => _pageSize;
        set
        {
            if (!PageSizeOptions.Contains(value))
                return;

            if (!SetProperty(ref _pageSize, value))
                return;

            OnPropertyChanged(nameof(PageSize));
            CurrentPage = 1;
            _ = ApplyPagingChangeAsync();
        }
    }

    public int PageSize => SelectedPageSize;

    public int CurrentPage
    {
        get => _currentPage;
        set
        {
            var page = Math.Clamp(value, 1, TotalPages);
            if (!SetProperty(ref _currentPage, page))
                return;
            _ = ApplyPagingChangeAsync();
        }
    }

    public int TotalPages => Math.Max(1, (int)Math.Ceiling(TotalRecords / (double)PageSize));

    public int TotalRecords => _serverPagingEnabled ? _serverTotalCount : FilterRowsForDisplay(_allRows).Count();

    public string PageInfo => $"Page {CurrentPage} of {TotalPages}  •  {TotalRecords} records  •  {PageSize} per page";

    public bool IsLoading
    {
        get => _isLoading;
        private set
        {
            if (!SetProperty(ref _isLoading, value))
                return;
            NotifyListLoadingBindings();
        }
    }

    public bool IsListBusy => IsLoading || IsExporting;

    /// <summary>Full-screen loader on first paint (same pattern as Dashboard).</summary>
    public bool ShowLoadingOverlay => IsLoading && !HasPresentedContent;

    public bool ShowInitialLoadingOverlay => ShowLoadingOverlay;

    public bool ShowBusyOverlay => false;

    public virtual string BusyLoadingSubtitle =>
        IsExporting ? "Preparing export…" : "Updating list…";

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

    public ICommand FirstPageCommand { get; }
    public ICommand PreviousPageCommand { get; }
    public ICommand NextPageCommand { get; }
    public ICommand LastPageCommand { get; }

    internal MockPageViewModel(
        string pageTitle,
        string pageDescription,
        string iconGlyph,
        string col1, string col2, string col3, string col4,
        IEnumerable<MockStat> stats,
        IEnumerable<MockRow> rows,
        bool enableDelete = false,
        int pageSize = 10,
        bool expandRows = true,
        IReadOnlyList<int>? pageSizeOptions = null,
        string? col5 = null)
    {
        PageTitle = pageTitle;
        PageDescription = pageDescription;
        IconGlyph = iconGlyph;
        Col1Header = col1;
        Col2Header = col2;
        Col3Header = col3;
        Col4Header = col4;
        Col5Header = col5 ?? string.Empty;
        StatsList = new ObservableCollection<MockStat>(stats);
        PageSizeOptions = pageSizeOptions ?? DefaultPageSizeOptions;
        _pageSize = PageSizeOptions.Contains(pageSize) ? pageSize : PageSizeOptions[0];
        ShowDeleteActions = enableDelete;
        _allRows = expandRows ? MockRowFactory.Expand(rows) : rows.ToList();
        PagedRows = new ObservableCollection<MockRow>();

        if (enableDelete)
        {
            DeleteSelectedCommand = new RelayCommand(DeleteSelected, () => SelectedRow is not null);
            DeleteRowCommand = new RelayCommand(DeleteRowFromParameter);
        }

        FirstPageCommand = new RelayCommand(() => CurrentPage = 1, () => CurrentPage > 1);
        PreviousPageCommand = new RelayCommand(() => CurrentPage--, () => CurrentPage > 1);
        NextPageCommand = new RelayCommand(() => CurrentPage++, () => CurrentPage < TotalPages);
        LastPageCommand = new RelayCommand(() => CurrentPage = TotalPages, () => CurrentPage < TotalPages);

        if (_allRows.Count > 0)
        {
            RefreshPagedRows();
            HasPresentedContent = true;
        }

        InitializeStandardList();
    }

    protected static IReadOnlyList<MockStat> PlaceholderStats(IEnumerable<MockStat> template) =>
        template.Select(s => new MockStat(s.Label, "—", s.IconGlyph, s.AccentColor)).ToList();

    protected void EnableServerPaging(
        Func<int, int, CancellationToken, Task<(IReadOnlyList<MockRow> Rows, int Total)>> pageLoader)
    {
        _serverPagingEnabled = true;
        _serverPageLoader = pageLoader;
    }

    protected bool UsesServerPaging => _serverPagingEnabled;

    public Task ReloadServerPageAsync() => LoadServerPageAsync();

    protected virtual Task LoadFromApiAsync()
    {
        TryLoadFromApi();
        return Task.CompletedTask;
    }

    protected virtual void TryLoadFromApi()
    {
    }

    public Task EnsureApiLoadAsync(bool force = false)
    {
        if (!IsUiAvailable)
            return Task.CompletedTask;

        lock (_loadGate)
        {
            if (!force && _loadTask is { IsCompleted: false } inFlight)
                return inFlight;

            if (!force && _loadedFromApi && HasPresentedContent)
                return _loadTask ?? Task.CompletedTask;

            return _loadTask = LoadFromApiCoreAsync(force);
        }
    }

    private async Task LoadFromApiCoreAsync(bool force)
    {
        var firstPaint = !HasPresentedContent;
        if (firstPaint || force)
            IsLoading = true;

        try
        {
            await LoadFromApiAsync();
        }
        finally
        {
            if (!HasPresentedContent && !_serverPagingEnabled)
            {
                HasPresentedContent = true;
                RefreshPagedRows();
            }

            IsLoading = false;
        }
    }

    public void ReloadFromApi()
    {
        if (!_loadedFromApi || !HasPresentedContent)
            _ = EnsureApiLoadAsync();
        else
            _ = EnsureApiLoadAsync(force: true);
    }

    void IPageViewLoadAware.OnPageViewLoaded() => _ = EnsureApiLoadAsync();

    public void ReplaceAllRows(IEnumerable<MockRow> rows)
    {
        _allRows.Clear();
        _allRows.AddRange(rows);
        CurrentPage = 1;
        RefreshPagedRows();
        MarkApiContentPresented();
        AfterStandardRowsRefreshed();
    }

    public void ReplaceStats(IEnumerable<MockStat> stats)
    {
        StatsList.Clear();
        foreach (var stat in stats)
            StatsList.Add(stat);
    }

    protected void MarkApiContentPresented()
    {
        HasPresentedContent = true;
        _loadedFromApi = true;
        IsLoading = false;
        AfterStandardRowsRefreshed();
    }

    private Task ApplyPagingChangeAsync() =>
        _serverPagingEnabled ? LoadServerPageAsync() : RunOnUiAsync(RefreshPagedRows);

    private async Task LoadServerPageAsync()
    {
        if (!_serverPagingEnabled || _serverPageLoader is null || !IsUiAvailable)
            return;

        Task loadTask;
        lock (_serverPageGate)
        {
            if (_serverPageTask is { IsCompleted: false } inFlight)
            {
                loadTask = inFlight;
            }
            else
            {
                loadTask = _serverPageTask = LoadServerPageCoreAsync();
            }
        }

        await loadTask;
    }

    private async Task LoadServerPageCoreAsync()
    {
        if (_serverPageLoader is null)
            return;

        IsLoading = true;

        try
        {
            var (rows, total) = await _serverPageLoader(CurrentPage, PageSize, CancellationToken.None);
            _serverTotalCount = Math.Max(0, total);

            var startIndex = (CurrentPage - 1) * PageSize;
            var index = 0;
            foreach (var row in rows)
            {
                row.RowNumber = startIndex + index + 1;
                index++;
            }

            await RunOnUiAsync(() =>
            {
                PagedRows.Clear();
                foreach (var row in rows)
                    PagedRows.Add(row);

                if (CurrentPage > TotalPages)
                    _currentPage = TotalPages;

                OnPropertyChanged(nameof(PageInfo));
                OnPropertyChanged(nameof(TotalPages));
                OnPropertyChanged(nameof(TotalRecords));
                OnPropertyChanged(nameof(CurrentPage));
                RaisePagingCommands();
                AfterStandardRowsRefreshed();
            });

            MarkApiContentPresented();
        }
        catch
        {
            // Leave prior page visible; caller may surface errors via ApiUiHelper.
        }
        finally
        {
            IsLoading = false;
        }
    }

    private void RefreshPagedRows()
    {
        PagedRows.Clear();
        var startIndex = (CurrentPage - 1) * PageSize;
        var index = 0;
        foreach (var row in FilterRowsForDisplay(_allRows).Skip(startIndex).Take(PageSize))
        {
            row.RowNumber = startIndex + index + 1;
            index++;
            PagedRows.Add(row);
        }

        OnPropertyChanged(nameof(PageInfo));
        OnPropertyChanged(nameof(TotalPages));
        OnPropertyChanged(nameof(TotalRecords));
        OnPropertyChanged(nameof(PagedRows));
        RaisePagingCommands();
        AfterStandardRowsRefreshed();
    }

    private static Task RunOnUiAsync(Action action)
    {
        var dispatcher = Application.Current?.Dispatcher;
        if (dispatcher is null || dispatcher.CheckAccess())
        {
            action();
            return Task.CompletedTask;
        }

        return dispatcher.InvokeAsync(action).Task;
    }

    private void RaisePagingCommands()
    {
        (FirstPageCommand as RelayCommand)?.RaiseCanExecuteChanged();
        (PreviousPageCommand as RelayCommand)?.RaiseCanExecuteChanged();
        (NextPageCommand as RelayCommand)?.RaiseCanExecuteChanged();
        (LastPageCommand as RelayCommand)?.RaiseCanExecuteChanged();
    }

    private void DeleteSelected()
    {
        if (SelectedRow is not null)
            _ = DeleteRowAsync(SelectedRow);
    }

    private void DeleteRowFromParameter(object? parameter)
    {
        if (parameter is MockRow row)
            _ = DeleteRowAsync(row);
    }

    protected ICommand CreateBomRowCommand(Action<MockRow> onBom) =>
        new RelayCommand(
            p =>
            {
                if (p is MockRow row)
                    onBom(row);
            },
            static p => p is MockRow && AuthSession.CanManageBom);

    protected ICommand CreateEditRowCommand(Action<MockRow> onEdit) =>
        new RelayCommand(
            p => _ = ExecuteEditAsync(p, onEdit),
            static p => p is MockRow);

    protected ICommand CreateDesignRowCommand(Action<MockRow> onDesign) =>
        new RelayCommand(
            p =>
            {
                if (p is MockRow row)
                    onDesign(row);
            },
            static p => p is MockRow);

    protected async Task ExecuteEditAsync(object? parameter, Action<MockRow> onEdit)
    {
        if (parameter is not MockRow row)
            return;

        if (!await EditDeleteGuard.AuthorizeEditAsync(PageTitle, row.Col1, row.Col2))
            return;

        onEdit(row);
    }

    protected virtual async Task DeleteRowAsync(MockRow row)
    {
        if (!await EditDeleteGuard.AuthorizeDeleteAsync(PageTitle, row.Col1, row.Col2))
            return;

        if (!await DeleteRowCoreAsync(row))
            return;

        _allRows.Remove(row);

        if (ReferenceEquals(SelectedRow, row))
            SelectedRow = null;

        if (CurrentPage > TotalPages)
            CurrentPage = TotalPages;

        RefreshPagedRows();
        OnRowDeleted(row);
        (DeleteSelectedCommand as RelayCommand)?.RaiseCanExecuteChanged();
    }

    /// <summary>Confirm and persist delete. Return false to keep the row in the list.</summary>
    protected virtual async Task<bool> DeleteRowCoreAsync(MockRow row)
    {
        await Task.CompletedTask;
        return true;
    }

    protected virtual void OnRowDeleted(MockRow row)
    {
    }
}

public sealed record MockStat(string Label, string Value, string IconGlyph, string AccentColor);
