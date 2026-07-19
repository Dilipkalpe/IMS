using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Threading;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.Services;

/// <summary>
/// Type-to-search product picker — avoids loading thousands of items into a ComboBox.
/// </summary>
public sealed class ProductPickerSupport
{
    private const int DefaultLimit = 40;
    private const int MinSearchLength = 2;
    private static readonly TimeSpan SearchDelay = TimeSpan.FromMilliseconds(320);

    private CancellationTokenSource? _searchCts;
    private readonly Dictionary<string, SalesProductInfo> _products =
        new(StringComparer.OrdinalIgnoreCase);

    private string _searchText = string.Empty;
    private string? _selectedOption;
    private bool _isSearching;
    private string _statusHint = "Type 2+ characters or scan barcode";
    private bool _forPurchase;

    public ObservableCollection<string> Options { get; } = new();

    public bool ForPurchase
    {
        get => _forPurchase;
        set => _forPurchase = value;
    }

    public string SearchText
    {
        get => _searchText;
        set => _searchText = value ?? string.Empty;
    }

    public string? SelectedOption
    {
        get => _selectedOption;
        set => _selectedOption = value;
    }

    public bool IsSearching
    {
        get => _isSearching;
        private set => _isSearching = value;
    }

    public string StatusHint
    {
        get => _statusHint;
        private set => _statusHint = value;
    }

    public void QueueSearch(Func<Task> runOnUi, Action notify)
    {
        _searchCts?.Cancel();
        _searchCts = new CancellationTokenSource();
        var token = _searchCts.Token;
        _ = DebouncedSearchAsync(token, runOnUi, notify);
    }

    private async Task DebouncedSearchAsync(CancellationToken token, Func<Task> runOnUi, Action notify)
    {
        try
        {
            await Task.Delay(SearchDelay, token);
            await RunSearchAsync(token);
            await runOnUi();
            notify();
        }
        catch (OperationCanceledException)
        {
            // superseded by newer keystroke
        }
    }

    public async Task RunSearchAsync(CancellationToken cancellationToken = default)
    {
        var term = SearchText.Trim();
        if (term.Length < MinSearchLength)
        {
            RunOnUi(Options.Clear);
            StatusHint = term.Length == 0
                ? "Type 2+ characters or scan barcode"
                : "Type at least 2 characters to search";
            return;
        }

        IsSearching = true;
        StatusHint = "Searching products…";

        try
        {
            if (!await ImsApiClient.CheckHealthAsync())
            {
                ApplyFallbackSearch(term);
                StatusHint = $"Showing sample matches ({Options.Count}) — API offline";
                return;
            }

            var results = await ImsApiClient.SearchProductsAsync(term, DefaultLimit, cancellationToken);
            RunOnUi(() =>
            {
                Options.Clear();
                foreach (var dto in results)
                {
                    Cache(dto, ForPurchase);
                    Options.Add(FormatOption(dto.Code, dto.Name));
                }
            });

            StatusHint = results.Count > 0
                ? $"Showing {results.Count} match(es) — type more to narrow"
                : "No products found — try code or name";
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch
        {
            ApplyFallbackSearch(term);
            StatusHint = $"Sample matches ({Options.Count}) — search failed";
        }
        finally
        {
            IsSearching = false;
        }
    }

    private void ApplyFallbackSearch(string term)
    {
        RunOnUi(() =>
        {
            Options.Clear();
            foreach (var p in SalesProductLookup.SearchFallback(term, DefaultLimit))
            {
                _products[p.Code] = p;
                Options.Add(FormatOption(p.Code, p.Name));
            }
        });
    }

    public bool TryResolveSelection(string? option, out SalesProductInfo? product)
    {
        product = null;
        if (string.IsNullOrWhiteSpace(option))
            return false;

        var code = ParseCode(option);
        if (string.IsNullOrWhiteSpace(code))
            return false;

        return TryGetByCode(code, out product);
    }

    public bool TryGetByCode(string code, out SalesProductInfo? product)
    {
        if (_products.TryGetValue(code, out var cached))
        {
            product = cached;
            return true;
        }

        product = SalesProductLookup.FindLocal(code);
        if (product is not null)
        {
            _products[code] = product;
            return true;
        }

        return false;
    }

    public async Task<SalesProductInfo?> ResolveCodeAsync(string code, bool forPurchase = false)
    {
        if (TryGetByCode(code, out var cached))
            return cached;

        if (!await ImsApiClient.CheckHealthAsync())
            return SalesProductLookup.FindLocal(code);

        try
        {
            var lookup = await ImsApiClient.LookupProductAsync(code);
            if (lookup is not null)
            {
                Cache(lookup, forPurchase);
                return _products[code];
            }

            var full = await ImsApiClient.GetProductByCodeAsync(code);
            if (full is not null)
            {
                var info = forPurchase
                    ? SalesProductLookup.FromDtoForPurchase(full)
                    : SalesProductLookup.FromDto(full);
                _products[info.Code] = info;
                return info;
            }
        }
        catch
        {
            // fall through
        }

        return SalesProductLookup.FindLocal(code);
    }

    public void Cache(ProductLookupDto dto, bool forPurchase)
    {
        var info = forPurchase
            ? new SalesProductInfo(dto.Code, dto.Name, dto.Rate, dto.TaxType, dto.TaxPercent)
            : SalesProductLookup.FromLookupDto(dto);
        _products[info.Code] = info;
    }

    public void Cache(SalesProductInfo info) => _products[info.Code] = info;

    public void ClearSelection()
    {
        SelectedOption = null;
        SearchText = string.Empty;
        Options.Clear();
        StatusHint = "Type 2+ characters or scan barcode";
    }

    public static string FormatOption(string code, string name) => $"{code} — {name}";

    public static string? ParseCode(string? option)
    {
        if (string.IsNullOrWhiteSpace(option))
            return null;

        var sep = option.IndexOf('—', StringComparison.Ordinal);
        return sep > 0 ? option[..sep].Trim() : option.Trim();
    }

    private static void RunOnUi(Action action)
    {
        var dispatcher = Application.Current?.Dispatcher;
        if (dispatcher is null || dispatcher.CheckAccess())
            action();
        else
            dispatcher.Invoke(action, DispatcherPriority.Normal);
    }
}
