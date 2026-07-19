using IMS.Models;

namespace IMS.ViewModels.SubPages;

public sealed class AddStockMovementViewModel : FormSubPageViewModel
{
    public AddStockMovementViewModel(MainViewModel host) : base(
        host,
        parentTitle: "Stock Movements",
        pageTitle: "Add Stock Movement",
        pageDescription: "Record a receipt, issue, transfer, or adjustment.",
        iconGlyph: "\uE8AB",
        fields:
        [
            new("Movement Type *", FormFieldKind.Combo, options: ["Receipt", "Issue", "Transfer", "Adjustment"]),
            new("SKU *", FormFieldKind.Combo, options: ["FG-5001", "RM-1001", "CP-2040", "CP-2088"]),
            new("Quantity *", FormFieldKind.Number, "1"),
            new("From Warehouse", FormFieldKind.Combo, options: ["—", "WH-MAIN", "WH-RAW", "WH-ASM"]),
            new("To Warehouse", FormFieldKind.Combo, options: ["WH-MAIN", "WH-RAW", "WH-ASM", "WH-QC"]),
            new("Reference No", FormFieldKind.Text, "PO / MO / SO reference"),
            new("Movement Date *", FormFieldKind.Date, defaultValue: "2026-05-19"),
            new("Reason / Notes", FormFieldKind.Multiline, "Document reason for adjustment...")
        ])
    { }
}
