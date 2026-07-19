using System.Collections.ObjectModel;
using System.Windows.Input;
using IMS.Models;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels;

public sealed class MasterPickViewModel : ViewModelBase
{
    private static readonly TimeSpan SearchDelay = TimeSpan.FromMilliseconds(350);

    private readonly Func<int, int, string?, CancellationToken, Task<PagedResponse<MasterPickRow>>> _loadPage;
    private CancellationTokenSource? _searchCts;
    private string _searchText = string.Empty;
    private int _currentPage = 1;
    private int _pageSize = 25;
    private int _totalRecords;
    private bool _isBusy;
    private string _statusMessage = string.Empty;
    private MasterPickRow? _selectedRow;

    public MasterPickViewModel(
        string title,
        string codeColumnHeader,
        string helpText,
        Func<int, int, string?, CancellationToken, Task<PagedResponse<MasterPickRow>>> loadPage)
    {
        Title = title;
        CodeColumnHeader = codeColumnHeader;
        HelpText = helpText;
        _loadPage = loadPage;
        Rows = new ObservableCollection<MasterPickRow>();

        SelectCommand = new RelayCommand(ConfirmSelect, () => SelectedRow is not null);
        CancelCommand = new RelayCommand(() => RequestClose?.Invoke(false));
        SearchCommand = new AsyncRelayCommand(() => ReloadFromSearchAsync());
        FirstPageCommand = new RelayCommand(() => CurrentPage = 1, () => CurrentPage > 1 && !IsBusy);
        PreviousPageCommand = new RelayCommand(() => CurrentPage--, () => CurrentPage > 1 && !IsBusy);
        NextPageCommand = new RelayCommand(() => CurrentPage++, () => CurrentPage < TotalPages && !IsBusy);
        LastPageCommand = new RelayCommand(() => CurrentPage = TotalPages, () => CurrentPage < TotalPages && !IsBusy);
    }

    public Action<bool>? RequestClose { get; set; }

    public MasterPickRow? Result { get; private set; }

    public string Title { get; }
    public string CodeColumnHeader { get; }
    public string HelpText { get; }

    public ObservableCollection<MasterPickRow> Rows { get; }

    public IReadOnlyList<int> PageSizeOptions { get; } = [10, 25, 50, 100];

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
            : $"Page {CurrentPage} of {TotalPages}  •  {TotalRecords:N0} records  •  {SelectedPageSize} per page";

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
        }
    }

    public string StatusMessage
    {
        get => _statusMessage;
        private set => SetProperty(ref _statusMessage, value);
    }

    public MasterPickRow? SelectedRow
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
    public ICommand FirstPageCommand { get; }
    public ICommand PreviousPageCommand { get; }
    public ICommand NextPageCommand { get; }
    public ICommand LastPageCommand { get; }

    public async Task LoadInitialAsync() => await LoadPageAsync();

    public void ConfirmSelect()
    {
        if (SelectedRow is null)
            return;

        Result = SelectedRow;
        RequestClose?.Invoke(true);
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
            var response = await _loadPage(CurrentPage, SelectedPageSize, SearchText, cancellationToken);
            Rows.Clear();
            var start = (CurrentPage - 1) * SelectedPageSize;
            var index = 1;
            foreach (var row in response.Items)
            {
                row.RowNumber = start + index++;
                Rows.Add(row);
            }

            TotalRecords = response.Total;
            OnPropertyChanged(nameof(PageInfo));
            RaisePagingCanExecute();

            if (Rows.Count == 0)
                StatusMessage = string.IsNullOrWhiteSpace(SearchText)
                    ? "No records found."
                    : "No records match your search.";
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            Rows.Clear();
            TotalRecords = 0;
            StatusMessage = $"Could not load records: {ex.Message}";
        }
        finally
        {
            IsBusy = false;
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
