using IMS.Models;
using IMS.Services;
using IMS.Services.Api;

namespace IMS.ViewModels;

public abstract class PurchaseEntryListViewModelBase : MockPageViewModel
{
    private readonly PurchaseEntryDefinition _definition;
    private readonly PurchaseEntryType _entryType;

    protected PurchaseEntryListViewModelBase(MainViewModel host, PurchaseEntryType entryType)
        : this(host, PurchaseEntryCatalog.Get(entryType), entryType) { }

    private PurchaseEntryListViewModelBase(MainViewModel host, PurchaseEntryDefinition def, PurchaseEntryType entryType) : base(
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
        SubPageActions =
        [
            SubPageActionsFactory.OpenPurchaseWorkspace(host, entryType, def.AddActionTitle, "\uE710"),
            SubPageActionsFactory.OpenPurchaseWorkspace(host, entryType, $"Open Another {def.DocPrefix}", "\uE710")
        ];
    }

    protected override void TryLoadFromApi() =>
        ApiListLoader.RefreshPurchaseList(this, _entryType);
}
