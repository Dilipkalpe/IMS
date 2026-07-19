using System.Windows;
using System.Windows.Input;
using IMS.Models;
using IMS.Services;

namespace IMS.ViewModels;

public sealed class PurchaseInvoicesViewModel : PurchaseDocumentListViewModelBase
{
    public PurchaseInvoicesViewModel(MainViewModel host) : base(host, PurchaseEntryType.PurchaseInvoice)
    {
        BarcodeLabelRowCommand = new RelayCommand(
            p => _ = OpenBarcodeLabelPrintAsync(p),
            static p => p is MockRow);
    }

    public override bool ShowBarcodeLabelAction =>
        AuthSession.CanPrintBarcodeLabels && BarcodeLabelRowCommand is not null;

    protected override IReadOnlyList<SubPageAction> CreateActions(MainViewModel host, PurchaseEntryDefinition def) =>
    [
        SubPageActionsFactory.OpenPurchaseInvoiceWorkspace(host, def.AddActionTitle, "\uE710")
    ];

    private static async Task OpenBarcodeLabelPrintAsync(object? parameter)
    {
        if (parameter is not MockRow row || string.IsNullOrWhiteSpace(row.Col1))
            return;

        await BarcodeLabelPrintService.TryPrintFromPurchaseInvoiceListAsync(row.Col1.Trim());
    }
}
