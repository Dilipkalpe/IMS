using IMS.Models;
using IMS.Services;

namespace IMS.ViewModels;

public sealed class PurchaseOrdersViewModel : PurchaseDocumentListViewModelBase
{
    public PurchaseOrdersViewModel(MainViewModel host) : base(host, PurchaseEntryType.PurchaseOrder) { }

    protected override IReadOnlyList<SubPageAction> CreateActions(MainViewModel host, PurchaseEntryDefinition def) =>
    [
        SubPageActionsFactory.OpenPurchaseOrderWorkspace(host, def.AddActionTitle, "\uE710")
    ];
}
