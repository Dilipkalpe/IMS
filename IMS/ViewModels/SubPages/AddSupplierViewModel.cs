using IMS.Models;

namespace IMS.ViewModels.SubPages;

public sealed class AddSupplierViewModel : FormSubPageViewModel
{
    public AddSupplierViewModel(MainViewModel host) : base(
        host,
        parentTitle: "Suppliers",
        pageTitle: "Add Supplier",
        pageDescription: "Register a new vendor in the supplier master.",
        iconGlyph: "\uE716",
        fields:
        [
            new("Supplier Code *", FormFieldKind.Text, "e.g. SUP-040"),
            new("Company Name *", FormFieldKind.Text, "Legal business name"),
            new("Contact Person", FormFieldKind.Text, "Primary contact"),
            new("Email", FormFieldKind.Text, "vendor@example.com"),
            new("Phone", FormFieldKind.Text, "+1 000 000 0000"),
            new("Lead Time (days)", FormFieldKind.Number, "7"),
            new("Payment Terms", FormFieldKind.Combo, options: ["Net 30", "Net 45", "Net 60", "COD"]),
            new("Address", FormFieldKind.Multiline, "Street, city, country...")
        ])
    { }
}
