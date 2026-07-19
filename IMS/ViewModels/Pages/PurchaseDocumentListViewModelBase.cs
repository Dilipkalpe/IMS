using System.Globalization;
using System.Windows;
using System.Windows.Threading;
using IMS.Models;
using IMS.Resources;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels;

public abstract class PurchaseDocumentListViewModelBase : MockPageViewModel
{
    private readonly MainViewModel _host;
    private readonly PurchaseEntryDefinition _definition;
    private readonly PurchaseEntryType _entryType;

    protected PurchaseDocumentListViewModelBase(MainViewModel host, PurchaseEntryType entryType) : base(
        PurchaseEntryCatalog.Get(entryType).ListPageTitle,
        PurchaseEntryCatalog.Get(entryType).ListDescription,
        PurchaseEntryCatalog.Get(entryType).IconGlyph,
        PurchaseEntryCatalog.Get(entryType).Col1Header,
        PurchaseEntryCatalog.Get(entryType).Col2Header,
        PurchaseEntryCatalog.Get(entryType).Col3Header,
        PurchaseEntryCatalog.Get(entryType).Col4Header,
        PlaceholderStats(PurchaseEntryCatalog.Get(entryType).Stats),
        [],
        enableDelete: true,
        expandRows: false,
        pageSize: 25,
        pageSizeOptions: LargeListPageSizeOptions)
    {
        _host = host;
        _definition = PurchaseEntryCatalog.Get(entryType);
        _entryType = entryType;
        EditRowCommand = CreateEditRowCommand(EditRow);
        PrintRowCommand = new RelayCommand(PrintRowFromParameter, static p => p is MockRow);
        SubPageActions = CreateActions(host, _definition);
        EnableServerPaging(LoadPurchaseDocumentPageAsync);
        ConfigureStandardListColumns(
            DocumentListColumnCatalog.ForPurchase(_entryType),
            ["(All)", "Open", "Confirmed", "Picking", "Shipped", "Closed", "Cancelled", "Draft"]);
    }

    public override string ModuleKey => DocumentListColumnCatalog.ModuleKey(_entryType);

    public PurchaseEntryType EntryType => _entryType;

    protected override async Task LoadFromApiAsync() => await ReloadPurchaseDocumentsAsync();

    internal async Task ReloadPurchaseDocumentsAsync()
    {
        if (!await ImsApiClient.CheckHealthAsync())
            return;

        await ReloadServerPageAsync();

        var stats = await ImsApiClient.GetPurchaseDocumentStatsAsync(_entryType);
        if (stats is not null)
            await Application.Current.Dispatcher.InvokeAsync(() => RefreshStats(stats));
    }

    private async Task<(IReadOnlyList<MockRow> Rows, int Total)> LoadPurchaseDocumentPageAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        if (!await ImsApiClient.CheckHealthAsync())
            return ([], 0);

        var (items, total) = await ImsApiClient.GetPurchaseDocumentsPageAsync(
            _entryType,
            ResolveSearchParam(),
            ResolveStatusFilterParam(),
            page: page,
            limit: pageSize);

        var rows = items
            .Select(d => ApiDocumentMapper.PurchaseDocumentToMockRow(d, Col3Header))
            .ToList();
        return (rows, total);
    }

    public void RefreshStats(SalesDocumentStatsDto stats)
    {
        var statsList = new List<MockStat>();
        if (_entryType == PurchaseEntryType.Grn)
        {
            statsList.Add(new("Open GRN", stats.Open.ToString(CultureInfo.InvariantCulture), "\uE8FB", ThemeColors.Primary));
            statsList.Add(new("Posted", stats.Posted.ToString(CultureInfo.InvariantCulture), "\uE73E", ThemeColors.Success));
            statsList.Add(new("Active", stats.Active.ToString(CultureInfo.InvariantCulture), "\uE823", ThemeColors.Warning));
            statsList.Add(new("Cancelled", stats.Cancelled.ToString(CultureInfo.InvariantCulture), "\uE7BA", ThemeColors.Danger));
        }
        else if (_entryType == PurchaseEntryType.PurchaseInvoice)
        {
            statsList.Add(new("Draft", stats.Draft.ToString(CultureInfo.InvariantCulture), "\uE8A5", ThemeColors.Warning));
            statsList.Add(new("Posted", stats.Posted.ToString(CultureInfo.InvariantCulture), "\uE73E", ThemeColors.Success));
            statsList.Add(new("Open", stats.Open.ToString(CultureInfo.InvariantCulture), "\uE8C8", ThemeColors.Primary));
            statsList.Add(new("Cancelled", stats.Cancelled.ToString(CultureInfo.InvariantCulture), "\uE7BA", ThemeColors.Danger));
        }
        else if (_entryType == PurchaseEntryType.PurchaseReturn)
        {
            statsList.Add(new("Open Returns", stats.Open.ToString(CultureInfo.InvariantCulture), "\uE10F", ThemeColors.Primary));
            statsList.Add(new("Active", stats.Active.ToString(CultureInfo.InvariantCulture), "\uE8C1", ThemeColors.Teal));
            statsList.Add(new("Draft", stats.Draft.ToString(CultureInfo.InvariantCulture), "\uE823", ThemeColors.Warning));
            statsList.Add(new("Cancelled", stats.Cancelled.ToString(CultureInfo.InvariantCulture), "\uE7BA", ThemeColors.Danger));
        }
        else
        {
            statsList.Add(new("Open POs", stats.Open.ToString(CultureInfo.InvariantCulture), "\uE719", ThemeColors.Primary));
            statsList.Add(new("Draft", stats.Draft.ToString(CultureInfo.InvariantCulture), "\uE823", ThemeColors.Warning));
            statsList.Add(new("Posted", stats.Posted.ToString(CultureInfo.InvariantCulture), "\uE73E", ThemeColors.Success));
            statsList.Add(new("Cancelled", stats.Cancelled.ToString(CultureInfo.InvariantCulture), "\uE7BA", ThemeColors.Danger));
        }
        ReplaceStats(statsList);
    }

    protected abstract IReadOnlyList<SubPageAction> CreateActions(MainViewModel host, PurchaseEntryDefinition def);

    protected override void OnRowDeleted(MockRow row)
    {
        if (!TryParseFormattedNo(row.Col1, out var prefix, out var docNo, _entryType))
            return;

        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            await ImsApiClient.DeletePurchaseDocumentByNoAsync(_entryType, docNo, prefix);
            ApiListLoader.RefreshPurchaseDocuments(this, _entryType);
        });

        MessageBox.Show($"{_definition.NavTitle} {row.Col1} was deleted.", "Deleted",
            MessageBoxButton.OK, MessageBoxImage.Information);
    }

    private void EditRow(MockRow row)
    {
        if (string.IsNullOrWhiteSpace(row.Col1))
            return;
        _host.OpenPurchaseDocumentForEdit(_entryType, row.Col1.Trim());
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
            var doc = await ImsApiClient.GetPurchaseDocumentByFormattedAsync(_entryType, formattedDocNo);
            if (doc is null)
            {
                MessageBox.Show($"{_definition.NavTitle} {formattedDocNo} was not found.", "Print",
                    MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            await Application.Current.Dispatcher.InvokeAsync(
                () => PurchaseOrderPrintService.ShowPreview(ApiDocumentMapper.NumberedPurchaseDocumentToPrintDto(doc)),
                DispatcherPriority.Normal);
        }, "Print");
    }

    private static bool TryParseFormattedNo(
        string? formatted,
        out string prefix,
        out int docNo,
        PurchaseEntryType entryType)
    {
        prefix = PurchaseEntryCatalog.Get(entryType).DocPrefix;
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
