using System.Globalization;
using System.Windows;
using System.Windows.Threading;
using IMS.Models;
using IMS.Resources;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels;

public abstract class SalesDocumentListViewModelBase : MockPageViewModel
{
    private readonly MainViewModel _host;
    private readonly SalesEntryDefinition _definition;
    private readonly SalesEntryType _entryType;

    protected SalesDocumentListViewModelBase(MainViewModel host, SalesEntryType entryType) : base(
        SalesEntryCatalog.Get(entryType).ListPageTitle,
        SalesEntryCatalog.Get(entryType).ListDescription,
        SalesEntryCatalog.Get(entryType).IconGlyph,
        SalesEntryCatalog.Get(entryType).Col1Header,
        SalesEntryCatalog.Get(entryType).Col2Header,
        SalesEntryCatalog.Get(entryType).Col3Header,
        SalesEntryCatalog.Get(entryType).Col4Header,
        PlaceholderStats(SalesEntryCatalog.Get(entryType).Stats),
        [],
        enableDelete: true,
        expandRows: false,
        pageSize: 25,
        pageSizeOptions: LargeListPageSizeOptions)
    {
        _host = host;
        _definition = SalesEntryCatalog.Get(entryType);
        _entryType = entryType;
        EditRowCommand = CreateEditRowCommand(EditRow);
        PrintRowCommand = new RelayCommand(PrintRowFromParameter, static p => p is MockRow);
        SubPageActions = CreateActions(host, _definition);
        EnableServerPaging(LoadSalesDocumentPageAsync);
        ConfigureStandardListColumns(
            DocumentListColumnCatalog.ForSales(_entryType),
            ["(All)", "Open", "Confirmed", "Picking", "Shipped", "Closed", "Cancelled", "Draft"]);
    }

    public SalesEntryType EntryType => _entryType;

    public override string ModuleKey => DocumentListColumnCatalog.ModuleKey(_entryType);

    protected override async Task LoadFromApiAsync() => await ReloadSalesDocumentsAsync();

    public void RefreshFromApi() => _ = EnsureApiLoadAsync(force: true);

    internal async Task ReloadSalesDocumentsAsync()
    {
        if (!await ImsApiClient.CheckHealthAsync())
            return;

        await ReloadServerPageAsync();

        var stats = await ImsApiClient.GetSalesDocumentStatsAsync(_entryType);
        if (stats is not null)
            await Application.Current.Dispatcher.InvokeAsync(() => RefreshStats(stats));
    }

    private async Task<(IReadOnlyList<MockRow> Rows, int Total)> LoadSalesDocumentPageAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        if (!await ImsApiClient.CheckHealthAsync())
            return ([], 0);

        var (items, total) = await ImsApiClient.GetSalesDocumentsPageAsync(
            _entryType,
            ResolveSearchParam(),
            ResolveStatusFilterParam(),
            page: page,
            limit: pageSize,
            sort: MapSalesListSortField(CurrentSortField),
            sortDir: CurrentSortDir);

        var rows = items
            .Select(d => ApiDocumentMapper.SalesDocumentToMockRow(d, Col3Header))
            .ToList();
        return (rows, total);
    }

    private static string MapSalesListSortField(string field) =>
        field.Trim().ToLowerInvariant() switch
        {
            "sr" => "docNo",
            "col1" => "docNo",
            "col2" => "customer",
            "col4" => "tranDate",
            "status" => "status",
            _ => field
        };

    public void RefreshStats(SalesDocumentStatsDto stats)
    {
        var statsList = new List<MockStat>();
        if (_entryType == SalesEntryType.DeliveryChallan)
        {
            statsList.Add(new("Open D.C.", stats.Open.ToString(CultureInfo.InvariantCulture), "\uE7BF", ThemeColors.Primary));
            statsList.Add(new("Dispatched", stats.Dispatched.ToString(CultureInfo.InvariantCulture), "\uE7E7", ThemeColors.Success));
            statsList.Add(new("Active", stats.Active.ToString(CultureInfo.InvariantCulture), "\uE823", ThemeColors.Warning));
            statsList.Add(new("Cancelled", stats.Cancelled.ToString(CultureInfo.InvariantCulture), "\uE7BA", ThemeColors.Danger));
        }
        else if (_entryType == SalesEntryType.SalesInvoice)
        {
            statsList.Add(new("Draft", stats.Draft.ToString(CultureInfo.InvariantCulture), "\uE8A5", ThemeColors.Warning));
            statsList.Add(new("Posted", stats.Posted.ToString(CultureInfo.InvariantCulture), "\uE73E", ThemeColors.Success));
            statsList.Add(new("Open", stats.Open.ToString(CultureInfo.InvariantCulture), "\uE8C8", ThemeColors.Primary));
            statsList.Add(new("Cancelled", stats.Cancelled.ToString(CultureInfo.InvariantCulture), "\uE7BA", ThemeColors.Danger));
        }
        else
        {
            statsList.Add(new("Open Returns", stats.Open.ToString(CultureInfo.InvariantCulture), "\uE10F", ThemeColors.Primary));
            statsList.Add(new("Active", stats.Active.ToString(CultureInfo.InvariantCulture), "\uE8C1", ThemeColors.Teal));
            statsList.Add(new("Draft", stats.Draft.ToString(CultureInfo.InvariantCulture), "\uE823", ThemeColors.Warning));
            statsList.Add(new("Cancelled", stats.Cancelled.ToString(CultureInfo.InvariantCulture), "\uE7BA", ThemeColors.Danger));
        }
        ReplaceStats(statsList);
    }

    protected abstract IReadOnlyList<SubPageAction> CreateActions(MainViewModel host, SalesEntryDefinition def);

    protected override void OnRowDeleted(MockRow row)
    {
        if (!TryParseFormattedNo(row.Col1, out var prefix, out var docNo, _entryType))
            return;

        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            await ImsApiClient.DeleteSalesDocumentByNoAsync(_entryType, docNo, prefix);
            ApiListLoader.RefreshSalesDocuments(this, _entryType);
        });

        MessageBox.Show($"{_definition.NavTitle} {row.Col1} was deleted.", "Deleted",
            MessageBoxButton.OK, MessageBoxImage.Information);
    }

    private void EditRow(MockRow row)
    {
        if (string.IsNullOrWhiteSpace(row.Col1))
            return;
        _host.OpenSalesDocumentForEdit(_entryType, row.Col1.Trim());
    }

    private void PrintRowFromParameter(object? parameter)
    {
        if (parameter is not MockRow row
            || !TryParseFormattedNo(row.Col1, out _, out _, _entryType))
        {
            MessageBox.Show("Cannot read document number from this row.", "Print",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (!ImsApiClient.IsAvailable)
        {
            MessageBox.Show("API is not available. Start the API server to print.", "Print",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        _ = PrintRowAsync(row.Col1.Trim());
    }

    private async Task PrintRowAsync(string formattedDocNo)
    {
        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            var doc = await ImsApiClient.GetSalesDocumentByFormattedAsync(_entryType, formattedDocNo);
            if (doc is null)
            {
                MessageBox.Show($"{_definition.NavTitle} {formattedDocNo} was not found.", "Print",
                    MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            await Application.Current.Dispatcher.InvokeAsync(
                () => SalesOrderPrintService.ShowPreview(doc),
                DispatcherPriority.Normal);
        }, "Print");
    }

    private static bool TryParseFormattedNo(
        string? formatted,
        out string prefix,
        out int docNo,
        SalesEntryType entryType)
    {
        prefix = SalesEntryCatalog.Get(entryType).DocPrefix;
        docNo = 0;
        if (string.IsNullOrWhiteSpace(formatted))
            return false;

        var value = formatted.Trim();
        var dash = value.LastIndexOf('-');
        if (dash <= 0)
            return int.TryParse(value, out docNo);

        prefix = value[..dash].Trim().ToUpperInvariant();
        return int.TryParse(value[(dash + 1)..], out docNo);
    }
}
