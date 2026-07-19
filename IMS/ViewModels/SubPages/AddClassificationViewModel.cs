using IMS.Models;
using IMS.Services;

namespace IMS.ViewModels.SubPages;

public sealed class AddClassificationViewModel : FormSubPageViewModel
{
    public AddClassificationViewModel(MainViewModel host, ClassificationMasterKind kind) : base(
        host,
        parentTitle: ClassificationMasterCatalog.Get(kind).NavTitle,
        pageTitle: $"Add {GetAddTitle(kind)}",
        pageDescription: GetAddDescription(kind),
        iconGlyph: ClassificationMasterCatalog.Get(kind).IconGlyph,
        fields: BuildFields(kind))
    {
        Kind = kind;
    }

    public ClassificationMasterKind Kind { get; }

    private static string GetAddTitle(ClassificationMasterKind kind) => kind switch
    {
        ClassificationMasterKind.ProductType => "Product Type",
        ClassificationMasterKind.ProductMainGroup => "Main Group",
        ClassificationMasterKind.ProductSubGroup => "Sub Group",
        ClassificationMasterKind.AssemblyType => "Assembly Type",
        ClassificationMasterKind.SaleUom => "Sale UOM",
        ClassificationMasterKind.PurchaseUom => "Purchase UOM",
        _ => "Item"
    };

    private static string GetAddDescription(ClassificationMasterKind kind) => kind switch
    {
        ClassificationMasterKind.ProductType => "Create a new product type for classification.",
        ClassificationMasterKind.ProductMainGroup => "Create a new product main group.",
        ClassificationMasterKind.ProductSubGroup => "Create a new product sub group linked to a main group.",
        ClassificationMasterKind.AssemblyType => "Create a new assembly type for BOM/production.",
        ClassificationMasterKind.SaleUom => "Create a sale unit of measure.",
        ClassificationMasterKind.PurchaseUom => "Create a purchase unit of measure.",
        _ => "Create a new master record."
    };

    private static IEnumerable<FormFieldViewModel> BuildFields(ClassificationMasterKind kind)
    {
        var activeOptions = new[] { "Active", "Inactive" };

        return kind switch
        {
            ClassificationMasterKind.ProductType =>
            [
                new("Type Code *", FormFieldKind.Text, "e.g. PT-RM"),
                new("Type Name *", FormFieldKind.Text, "e.g. Raw Material"),
                new("Description", FormFieldKind.Multiline, "Purpose of this product type"),
                new("Status", FormFieldKind.Combo, options: activeOptions)
            ],
            ClassificationMasterKind.ProductMainGroup =>
            [
                new("Group Code *", FormFieldKind.Text, "e.g. MG-MTL"),
                new("Group Name *", FormFieldKind.Text, "e.g. Metals"),
                new("Description", FormFieldKind.Multiline, "Group description"),
                new("Status", FormFieldKind.Combo, options: activeOptions)
            ],
            ClassificationMasterKind.ProductSubGroup =>
            [
                new("Sub Group Code *", FormFieldKind.Text, "e.g. SG-SHT"),
                new("Sub Group Name *", FormFieldKind.Text, "e.g. Sheet"),
                new("Main Group *", FormFieldKind.Combo, options: ClassificationMasterCatalog.MainGroupNames.ToList()),
                new("Description", FormFieldKind.Multiline, "Sub group description"),
                new("Status", FormFieldKind.Combo, options: activeOptions)
            ],
            ClassificationMasterKind.AssemblyType =>
            [
                new("Assembly Code *", FormFieldKind.Text, "e.g. AT-SUB"),
                new("Assembly Name *", FormFieldKind.Text, "e.g. Sub-Assembly"),
                new("Description", FormFieldKind.Multiline, "When to use this assembly type"),
                new("Status", FormFieldKind.Combo, options: activeOptions)
            ],
            ClassificationMasterKind.SaleUom or ClassificationMasterKind.PurchaseUom =>
            [
                new("UOM Code *", FormFieldKind.Text, "e.g. UOM-KG"),
                new("UOM Name *", FormFieldKind.Text, "e.g. Kilogram"),
                new("Decimal Places", FormFieldKind.Number, "0"),
                new("Status", FormFieldKind.Combo, options: activeOptions)
            ],
            _ => []
        };
    }
}
