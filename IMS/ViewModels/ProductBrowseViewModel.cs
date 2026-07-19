using System.Collections.ObjectModel;
using System.Windows.Input;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels;

public sealed class ProductBrowseViewModel : ViewModelBase
{
    private static readonly TimeSpan SearchDelay = TimeSpan.FromMilliseconds(350);

    private readonly bool _forPurchase;
    private readonly Dictionary<string, SalesProductInfo> _selectedByCode = new(StringComparer.OrdinalIgnoreCase);
    private CancellationTokenSource? _searchCts;
    private string _searchText = string.Empty;
    private int _currentPage = 1;
    private int _pageSize = 25;
    private int _totalRecords;
    private bool _isBusy;
    private string _statusMessage = string.Empty;
    private ProductBrowseRow? _selectedRow;
    private bool _isMultiSelectMode;

    public ProductBrowseViewModel(bool forPurchase)
    {
        _forPurchase = forPurchase;
        RateColumnHeader = forPurchase ? "Purchase rate" : "Sale rate";
        Rows = new ObservableCollection<ProductBrowseRow>();

        SelectCommand = new RelayCommand(ConfirmSelect, CanConfirmSelect);
        CancelCommand = new RelayCommand(() => RequestClose?.Invoke(false));
        SearchCommand = new AsyncRelayCommand(() => ReloadFromSearchAsync());
        SelectAllOnPageCommand = new RelayCommand(SelectAllOnPage, () => IsMultiSelectMode && Rows.Count > 0 && !IsBusy);
        ClearSelectionCommand = new RelayCommand(ClearSelection, () => IsMultiSelectMode && SelectedCount > 0);
        FirstPageCommand = new RelayCommand(() => CurrentPage = 1, () => CurrentPage > 1 && !IsBusy);
        PreviousPageCommand = new RelayCommand(() => CurrentPage--, () => CurrentPage > 1 && !IsBusy);
        NextPageCommand = new RelayCommand(() => CurrentPage++, () => CurrentPage < TotalPages && !IsBusy);
        LastPageCommand = new RelayCommand(() => CurrentPage = TotalPages, () => CurrentPage < TotalPages && !IsBusy);
    }

    public Action<bool>? RequestClose { get; set; }

    public SalesProductInfo? Result => Results.Count > 0 ? Results[0] : null;

    public List<SalesProductInfo> Results { get; private set; } = [];

    public string RateColumnHeader { get; }

    public ObservableCollection<ProductBrowseRow> Rows { get; }

    public IReadOnlyList<int> PageSizeOptions { get; } = [10, 25, 50, 100];

    public bool IsMultiSelectMode
    {
        get => _isMultiSelectMode;
        set
        {
            if (!SetProperty(ref _isMultiSelectMode, value))
                return;

            if (!value)
                ClearSelection();

            OnPropertyChanged(nameof(SelectionHelpText));
            OnPropertyChanged(nameof(SelectButtonText));
            (SelectCommand as RelayCommand)?.RaiseCanExecuteChanged();
            (SelectAllOnPageCommand as RelayCommand)?.RaiseCanExecuteChanged();
            (ClearSelectionCommand as RelayCommand)?.RaiseCanExecuteChanged();
        }
    }

    public int SelectedCount => _selectedByCode.Count;

    public string SelectButtonText =>
        IsMultiSelectMode
            ? SelectedCount > 0 ? $"Add selected ({SelectedCount})" : "Add selected"
            : "Select";

    public string SelectionHelpText =>
        IsMultiSelectMode
            ? "Check products on any page, then click Add selected. Selections are kept when you change pages."
            : "Click a row and Select, or double-click a row to add one product.";

    public string SearchText
    {
        get => _searchText;
        set
        {
            if (!SetProperty(ref _searchText, value))
                return;

            QueueDebouncedSearch();
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

            GoToPage(1);
            _ = LoadPageAsync();
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

            _ = LoadPageAsync();
        }
    }

    public int TotalPages => Math.Max(1, (int)Math.Ceiling(_totalRecords / (double)SelectedPageSize));

    public int TotalRecords
    {
        get => _totalRecords;
        private set
        {
            if (!SetProperty(ref _totalRecords, value))
                return;

            OnPropertyChanged(nameof(TotalPages));
            OnPropertyChanged(nameof(PageInfo));
            RaisePagingCanExecute();
        }
    }

    public string PageInfo =>
        IsBusy
            ? "Loading…"
            : $"Page {CurrentPage} of {TotalPages}  •  {TotalRecords:N0} products  •  {SelectedPageSize} per page";

    public bool IsBusy
    {
        get => _isBusy;
        private set
        {
            if (!SetProperty(ref _isBusy, value))
                return;

            OnPropertyChanged(nameof(PageInfo));
            RaisePagingCanExecute();
            (SelectCommand as RelayCommand)?.RaiseCanExecuteChanged();
            (SelectAllOnPageCommand as RelayCommand)?.RaiseCanExecuteChanged();
        }
    }

    public string StatusMessage
    {
        get => _statusMessage;
        private set => SetProperty(ref _statusMessage, value);
    }

    public ProductBrowseRow? SelectedRow
    {
        get => _selectedRow;
        set
        {
            if (!SetProperty(ref _selectedRow, value))
                return;

            (SelectCommand as RelayCommand)?.RaiseCanExecuteChanged();
        }
    }

    public ICommand SelectCommand { get; }
    public ICommand CancelCommand { get; }
    public ICommand SearchCommand { get; }
    public ICommand SelectAllOnPageCommand { get; }
    public ICommand ClearSelectionCommand { get; }
    public ICommand FirstPageCommand { get; }
    public ICommand PreviousPageCommand { get; }
    public ICommand NextPageCommand { get; }
    public ICommand LastPageCommand { get; }

    public async Task LoadInitialAsync() => await LoadPageAsync();

    public void ConfirmSelect()
    {
        if (IsMultiSelectMode)
        {
            if (_selectedByCode.Count == 0)
                return;

            Results = _selectedByCode.Values.ToList();
        }
        else
        {
            if (SelectedRow is null)
                return;

            Results = [SelectedRow.ToProductInfo()];
        }

        RequestClose?.Invoke(true);
    }

    public void ToggleRowSelection(ProductBrowseRow row)
    {
        if (!IsMultiSelectMode)
            return;

        row.IsSelected = !row.IsSelected;
        UpdateStoredSelection(row);
    }

    public void OnRowSelectionChanged(ProductBrowseRow row) => UpdateStoredSelection(row);

    private void UpdateStoredSelection(ProductBrowseRow row)
    {
        if (row.IsSelected)
            _selectedByCode[row.Code] = row.ToProductInfo();
        else
            _selectedByCode.Remove(row.Code);

        OnPropertyChanged(nameof(SelectedCount));
        OnPropertyChanged(nameof(SelectButtonText));
        (SelectCommand as RelayCommand)?.RaiseCanExecuteChanged();
        (ClearSelectionCommand as RelayCommand)?.RaiseCanExecuteChanged();
    }

    private bool CanConfirmSelect() =>
        IsMultiSelectMode ? SelectedCount > 0 : SelectedRow is not null;

    private void SelectAllOnPage()
    {
        foreach (var row in Rows)
        {
            row.IsSelected = true;
            _selectedByCode[row.Code] = row.ToProductInfo();
        }

        OnPropertyChanged(nameof(SelectedCount));
        OnPropertyChanged(nameof(SelectButtonText));
        (SelectCommand as RelayCommand)?.RaiseCanExecuteChanged();
        (ClearSelectionCommand as RelayCommand)?.RaiseCanExecuteChanged();
    }

    private void ClearSelection()
    {
        _selectedByCode.Clear();
        foreach (var row in Rows)
            row.IsSelected = false;

        OnPropertyChanged(nameof(SelectedCount));
        OnPropertyChanged(nameof(SelectButtonText));
        (SelectCommand as RelayCommand)?.RaiseCanExecuteChanged();
        (ClearSelectionCommand as RelayCommand)?.RaiseCanExecuteChanged();
    }

    private void AttachRow(ProductBrowseRow row)
    {
        row.IsSelected = _selectedByCode.ContainsKey(row.Code);
        row.PropertyChanged += (_, e) =>
        {
            if (e.PropertyName == nameof(ProductBrowseRow.IsSelected))
                OnRowSelectionChanged(row);
        };
    }

    private void QueueDebouncedSearch()
    {
        _searchCts?.Cancel();
        _searchCts = new CancellationTokenSource();
        var token = _searchCts.Token;
        _ = DebouncedSearchAsync(token);
    }

    private async Task DebouncedSearchAsync(CancellationToken token)
    {
        try
        {
            await Task.Delay(SearchDelay, token);
            await ReloadFromSearchAsync(token);
        }
        catch (OperationCanceledException)
        {
            // superseded
        }
    }

    private async Task ReloadFromSearchAsync(CancellationToken token = default)
    {
        GoToPage(1);
        await LoadPageAsync(token);
    }

    private void GoToPage(int page)
    {
        var clamped = Math.Clamp(page, 1, TotalPages);
        if (_currentPage == clamped)
            return;

        _currentPage = clamped;
        OnPropertyChanged(nameof(CurrentPage));
        OnPropertyChanged(nameof(PageInfo));
    }

    private async Task LoadPageAsync(CancellationToken cancellationToken = default)
    {
        IsBusy = true;
        StatusMessage = string.Empty;

        try
        {
            if (!await ImsApiClient.CheckHealthAsync())
            {
                ApplyOfflinePage();
                StatusMessage = "API offline — showing sample products only.";
                return;
            }

            var response = await ImsApiClient.GetProductsPageAsync(
                CurrentPage,
                SelectedPageSize,
                SearchText,
                cancellationToken);

            Rows.Clear();
            var start = (CurrentPage - 1) * SelectedPageSize;
            var index = 1;
            foreach (var dto in response.Items)
            {
                var info = _forPurchase
                    ? SalesProductLookup.FromDtoForPurchase(dto)
                    : SalesProductLookup.FromDto(dto);

                var row = new ProductBrowseRow
                {
                    RowNumber = start + index++,
                    Code = dto.Code,
                    Name = dto.Name,
                    Category = dto.Category,
                    Unit = dto.Unit ?? dto.SaleUom,
                    Rate = info.Rate,
                    StockQty = dto.StockQty,
                    TaxType = info.TaxType,
                    TaxPercent = info.TaxPercent
                };
                AttachRow(row);
                Rows.Add(row);
            }

            TotalRecords = response.Total;
            OnPropertyChanged(nameof(PageInfo));
            RaisePagingCanExecute();
            (SelectAllOnPageCommand as RelayCommand)?.RaiseCanExecuteChanged();

            if (Rows.Count == 0)
                StatusMessage = string.IsNullOrWhiteSpace(SearchText)
                    ? "No products found."
                    : "No products match your search.";
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            Rows.Clear();
            TotalRecords = 0;
            StatusMessage = $"Could not load products: {ex.Message}";
        }
        finally
        {
            IsBusy = false;
        }
    }

    private void ApplyOfflinePage()
    {
        var term = SearchText.Trim();
        var all = string.IsNullOrEmpty(term)
            ? SalesProductLookup.BuildFallbackCatalog().Values.ToList()
            : SalesProductLookup.SearchFallback(term, 1000).ToList();

        TotalRecords = all.Count;
        var start = (CurrentPage - 1) * SelectedPageSize;
        Rows.Clear();
        foreach (var p in all.Skip(start).Take(SelectedPageSize))
        {
            var row = new ProductBrowseRow
            {
                RowNumber = start + Rows.Count + 1,
                Code = p.Code,
                Name = p.Name,
                Rate = p.Rate,
                Category = "—",
                Unit = "—",
                StockQty = 0,
                TaxType = p.TaxType,
                TaxPercent = p.TaxPercent
            };
            AttachRow(row);
            Rows.Add(row);
        }
    }

    private void RaisePagingCanExecute()
    {
        (FirstPageCommand as RelayCommand)?.RaiseCanExecuteChanged();
        (PreviousPageCommand as RelayCommand)?.RaiseCanExecuteChanged();
        (NextPageCommand as RelayCommand)?.RaiseCanExecuteChanged();
        (LastPageCommand as RelayCommand)?.RaiseCanExecuteChanged();
    }
}
