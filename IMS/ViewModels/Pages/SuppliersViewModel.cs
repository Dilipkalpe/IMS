using IMS.Resources;

using IMS.ViewModels.SubPages;

namespace IMS.ViewModels;

public sealed class SuppliersViewModel : MockPageViewModel
{
    public SuppliersViewModel(MainViewModel host) : base(
        "Suppliers",
        "Vendor master and supplier performance.",
        "\uE716",
        "Code", "Supplier", "Lead Time", "Rating",
        [
            new("Active Vendors", "86", "\uE716", ThemeColors.Primary),
            new("Preferred", "24", "\uE734", ThemeColors.Success),
            new("On Hold", "3", "\uE7BA", ThemeColors.Danger),
            new("Avg Lead Time", "9 days", "\uE823", ThemeColors.Warning)
        ],
        [
            new() { Col1 = "SUP-001", Col2 = "Acme Metals Ltd", Col3 = "7 days", Col4 = "A", Status = "Active" },
            new() { Col1 = "SUP-014", Col2 = "Precision Parts Co", Col3 = "12 days", Col4 = "B+", Status = "Active" },
            new() { Col1 = "SUP-022", Col2 = "Global Polymers", Col3 = "5 days", Col4 = "A-", Status = "Active" },
            new() { Col1 = "SUP-031", Col2 = "Fastener World", Col3 = "14 days", Col4 = "C", Status = "Review" }
        ])
    {
        SubPageActions =
        [
            SubPageActionsFactory.Add(host, "Add Supplier", "\uE710", () => new AddSupplierViewModel(host))
        ];
    }
}
