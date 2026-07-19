using IMS.Models;

namespace IMS.ViewModels.SubPages;

public sealed class AddProductionOrderViewModel : FormSubPageViewModel
{
    public AddProductionOrderViewModel(MainViewModel host) : base(
        host,
        parentTitle: "Production Orders",
        pageTitle: "Add Production Order",
        pageDescription: "Create a manufacturing order from BOM and demand.",
        iconGlyph: "\uE912",
        fields:
        [
            new("Product to Manufacture *", FormFieldKind.Combo, options: ["FG-5001 — Industrial Pump A1", "CP-2040 — Motor Housing", "CP-2088 — Impeller Blade"]),
            new("BOM Revision *", FormFieldKind.Combo, options: ["Rev A", "Rev B", "Rev C"]),
            new("Planned Quantity *", FormFieldKind.Number, "100"),
            new("Planned Start *", FormFieldKind.Date, defaultValue: "2026-05-20"),
            new("Planned End *", FormFieldKind.Date, defaultValue: "2026-05-27"),
            new("Work Center *", FormFieldKind.Combo, options: ["WC-ASM — Assembly Line 1", "WC-CUT — CNC Cutting", "WC-WLD — Welding Station"]),
            new("Linked Sales Order", FormFieldKind.Text, "Optional SO-#####"),
            new("Instructions", FormFieldKind.Multiline, "Batch notes, quality requirements...")
        ])
    { }
}
