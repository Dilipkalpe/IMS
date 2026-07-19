using IMS.Models;
using IMS.ViewModels;
using IMS.ViewModels.SubPages;

namespace IMS.Services;

internal static class PurchaseEntryWorkspaceFactory
{
    public static PurchaseEntryWorkspaceViewModelBase Create(MainViewModel host, PurchaseEntryType entryType) =>
        entryType switch
        {
            PurchaseEntryType.PurchaseOrder => new PurchaseOrderWorkspaceViewModel(host),
            PurchaseEntryType.Grn => new GrnWorkspaceViewModel(host),
            PurchaseEntryType.PurchaseInvoice => new PurchaseInvoiceWorkspaceViewModel(host),
            PurchaseEntryType.PurchaseReturn => new PurchaseReturnWorkspaceViewModel(host),
            _ => new PurchaseOrderWorkspaceViewModel(host)
        };
}
