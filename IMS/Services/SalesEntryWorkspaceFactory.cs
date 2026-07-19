using IMS.Models;
using IMS.ViewModels;
using IMS.ViewModels.SubPages;

namespace IMS.Services;

internal static class SalesEntryWorkspaceFactory
{
    public static SalesEntryWorkspaceViewModelBase Create(MainViewModel host, SalesEntryType entryType) =>
        entryType switch
        {
            SalesEntryType.SalesOrder => new SalesOrderWorkspaceViewModel(host),
            SalesEntryType.DeliveryChallan => new DeliveryChallanWorkspaceViewModel(host),
            SalesEntryType.SalesInvoice => new SalesInvoiceWorkspaceViewModel(host),
            SalesEntryType.SalesReturn => new SalesReturnWorkspaceViewModel(host),
            _ => new SalesOrderWorkspaceViewModel(host)
        };
}
