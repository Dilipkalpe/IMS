using IMS.Models;

namespace IMS.ViewModels.SubPages;

public sealed class AddBomViewModel : FormSubPageViewModel
{
    public AddBomViewModel(MainViewModel host) : base(
        host,
        parentTitle: "Bill of Materials",
        pageTitle: "Add BOM Entry",
        pageDescription: "Add a component line to a parent product BOM.",
        iconGlyph: "\uE8F1",
        fields:
        [
            new("Parent Product *", FormFieldKind.Combo, options: ["FG-5001 — Industrial Pump A1", "CP-2040 — Motor Housing"]),
            new("Component SKU *", FormFieldKind.Combo, options: ["CP-2040 — Motor Housing", "CP-2088 — Impeller Blade", "RM-1001 — Steel Sheet 2mm"]),
            new("Quantity *", FormFieldKind.Number, "1"),
            new("Unit", FormFieldKind.Combo, options: ["EA", "KG", "LTR"]),
            new("Revision *", FormFieldKind.Combo, options: ["Rev A", "Rev B", "Rev C"]),
            new("Scrap %", FormFieldKind.Number, "0"),
            new("Effective From", FormFieldKind.Date, defaultValue: "2026-05-19"),
            new("Notes", FormFieldKind.Multiline, "Assembly notes, alternates...")
        ])
    { }
}
