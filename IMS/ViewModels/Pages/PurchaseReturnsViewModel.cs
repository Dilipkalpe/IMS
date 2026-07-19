using IMS.Models;
using IMS.Services;

namespace IMS.ViewModels;

public sealed class PurchaseReturnsViewModel : PurchaseDocumentListViewModelBase
{
    public PurchaseReturnsViewModel(MainViewModel host) : base(host, PurchaseEntryType.PurchaseReturn) { }

    protected override IReadOnlyList<SubPageAction> CreateActions(MainViewModel host, PurchaseEntryDefinition def) =>
    [
        SubPageActionsFactory.OpenPurchaseReturnWorkspace(host, def.AddActionTitle, "\uE710")
    ];
}
