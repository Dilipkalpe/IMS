using IMS.Models;
using IMS.ViewModels.SubPages;

namespace IMS.Services;

public sealed record LineGridColumnContext(string ModuleKey, bool IsInterStateTax)
{
    public static LineGridColumnContext? From(object? dataContext) => dataContext switch
    {
        SalesEntryFormViewModelBase sales => new(
            SalesGridColumnCatalog.ToModuleKey(sales.EntryType),
            sales.IsInterStateTax),
        PurchaseEntryFormViewModelBase purchase => new(
            SalesGridColumnCatalog.ToModuleKey(purchase.EntryType),
            purchase.IsInterStateTax),
        _ => null
    };
}
