using IMS.Models;
using IMS.Services;
using IMS.Services.Api;

namespace IMS.ViewModels;

public abstract class SalesEntryListViewModelBase : MockPageViewModel
{
    private readonly SalesEntryDefinition _definition;
    private readonly SalesEntryType _entryType;

    protected SalesEntryListViewModelBase(MainViewModel host, SalesEntryType entryType)
        : this(host, SalesEntryCatalog.Get(entryType), entryType)
    {
    }

    private SalesEntryListViewModelBase(MainViewModel host, SalesEntryDefinition def, SalesEntryType entryType) : base(
        def.ListPageTitle,
        def.ListDescription,
        def.IconGlyph,
        def.Col1Header,
        def.Col2Header,
        def.Col3Header,
        def.Col4Header,
        def.Stats,
        def.SeedRows)
    {
        _definition = def;
        _entryType = entryType;
        SubPageActions = CreateActions(host, def, entryType);
    }

    protected override void TryLoadFromApi() =>
        ApiListLoader.RefreshSalesList(this, _entryType);

    protected abstract IReadOnlyList<SubPageAction> CreateActions(MainViewModel host, SalesEntryDefinition def, SalesEntryType entryType);
}
