using IMS.Models;
using IMS.Services;

namespace IMS.ViewModels;

public sealed class PurchaseGrnsViewModel : PurchaseDocumentListViewModelBase
{
    public PurchaseGrnsViewModel(MainViewModel host) : base(host, PurchaseEntryType.Grn) { }

    protected override IReadOnlyList<SubPageAction> CreateActions(MainViewModel host, PurchaseEntryDefinition def) =>
    [
        SubPageActionsFactory.OpenGrnWorkspace(host, def.AddActionTitle, "\uE710")
    ];
}
