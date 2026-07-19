using IMS.Models;
using IMS.Services;
namespace IMS.ViewModels;

public sealed class SalesInvoicesViewModel : SalesDocumentListViewModelBase
{
    public SalesInvoicesViewModel(MainViewModel host) : base(host, SalesEntryType.SalesInvoice) { }

    protected override void LoadStandardPagePreferences()
    {
        ApplyDefaultListSort("col4", "desc");
        base.LoadStandardPagePreferences();

        // Legacy default was invoice number (col1); show newest transaction dates first.
        if (string.Equals(CurrentSortField, "col1", StringComparison.OrdinalIgnoreCase)
            && string.Equals(CurrentSortDir, "desc", StringComparison.OrdinalIgnoreCase))
        {
            SetListSort("col4", "desc");
        }
    }

    protected override IReadOnlyList<SubPageAction> CreateActions(MainViewModel host, SalesEntryDefinition def) =>
    [
        SubPageActionsFactory.OpenSalesInvoiceWorkspace(host, def.AddActionTitle, "\uE710")
    ];
}
