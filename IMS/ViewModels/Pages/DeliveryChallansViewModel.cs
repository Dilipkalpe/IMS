using IMS.Models;
using IMS.Services;
namespace IMS.ViewModels;

public sealed class DeliveryChallansViewModel : SalesDocumentListViewModelBase
{
    public DeliveryChallansViewModel(MainViewModel host) : base(host, SalesEntryType.DeliveryChallan) { }

    protected override IReadOnlyList<SubPageAction> CreateActions(MainViewModel host, SalesEntryDefinition def) =>
    [
        SubPageActionsFactory.OpenDeliveryChallanWorkspace(host, def.AddActionTitle, "\uE710")
    ];

}
