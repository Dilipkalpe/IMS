using IMS.Models;
using IMS.Services;
namespace IMS.ViewModels;

public sealed class SalesReturnsViewModel : SalesDocumentListViewModelBase
{
    public SalesReturnsViewModel(MainViewModel host) : base(host, SalesEntryType.SalesReturn) { }

    protected override IReadOnlyList<SubPageAction> CreateActions(MainViewModel host, SalesEntryDefinition def) =>
    [
        SubPageActionsFactory.OpenSalesReturnWorkspace(host, def.AddActionTitle, "\uE710")
    ];

}
