using IMS.Models;
using IMS.ViewModels.SubPages;

namespace IMS.ViewModels;

internal static class SubPageActionsFactory
{
    public static SubPageAction Add(MainViewModel host, string title, string icon, Func<SubPageViewModelBase> create) =>
        new()
        {
            Title = title,
            IconGlyph = icon,
            Command = new RelayCommand(() => host.NavigateToSubPage(create()))
        };

    public static SubPageAction OpenSalesOrderWorkspace(MainViewModel host, string title, string icon) =>
        CreateWorkspaceAction(host, title, icon, host.OpenSalesOrderWorkspace);

    public static SubPageAction OpenDeliveryChallanWorkspace(MainViewModel host, string title, string icon) =>
        CreateWorkspaceAction(host, title, icon, host.OpenDeliveryChallanWorkspace);

    public static SubPageAction OpenSalesInvoiceWorkspace(MainViewModel host, string title, string icon) =>
        CreateWorkspaceAction(host, title, icon, host.OpenSalesInvoiceWorkspace);

    public static SubPageAction OpenSalesReturnWorkspace(MainViewModel host, string title, string icon) =>
        CreateWorkspaceAction(host, title, icon, host.OpenSalesReturnWorkspace);

    public static SubPageAction OpenPurchaseOrderWorkspace(MainViewModel host, string title, string icon) =>
        OpenPurchaseWorkspace(host, PurchaseEntryType.PurchaseOrder, title, icon);

    public static SubPageAction OpenGrnWorkspace(MainViewModel host, string title, string icon) =>
        OpenPurchaseWorkspace(host, PurchaseEntryType.Grn, title, icon);

    public static SubPageAction OpenPurchaseInvoiceWorkspace(MainViewModel host, string title, string icon) =>
        OpenPurchaseWorkspace(host, PurchaseEntryType.PurchaseInvoice, title, icon);

    public static SubPageAction OpenPurchaseReturnWorkspace(MainViewModel host, string title, string icon) =>
        OpenPurchaseWorkspace(host, PurchaseEntryType.PurchaseReturn, title, icon);

    public static SubPageAction OpenPurchaseWorkspace(MainViewModel host, PurchaseEntryType entryType, string title, string icon) =>
        CreateWorkspaceAction(host, title, icon, () => host.OpenPurchaseWorkspace(entryType));

    private static SubPageAction CreateWorkspaceAction(MainViewModel host, string title, string icon, Action open) =>
        new()
        {
            Title = title,
            IconGlyph = icon,
            Command = new RelayCommand(open)
        };
}
