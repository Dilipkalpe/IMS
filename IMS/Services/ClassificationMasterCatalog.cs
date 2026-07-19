using IMS.Resources;
using IMS.Models;

using IMS.ViewModels;
using IMS.ViewModels.SubPages;

namespace IMS.Services;

public sealed record ClassificationMasterDefinition(
    ClassificationMasterKind Kind,
    string NavTitle,
    string PageTitle,
    string PageDescription,
    string IconGlyph,
    string Col1Header,
    string Col2Header,
    string Col3Header,
    string Col4Header,
    IReadOnlyList<MockStat> Stats,
    IReadOnlyList<MockRow> SeedRows,
    string AddActionTitle,
    Func<MainViewModel, SubPageViewModelBase> CreateAddPage);

public static class ClassificationMasterCatalog
{
    private static readonly IReadOnlyDictionary<ClassificationMasterKind, ClassificationMasterDefinition> Definitions =
        new Dictionary<ClassificationMasterKind, ClassificationMasterDefinition>
        {
            [ClassificationMasterKind.ProductType] = new(
                ClassificationMasterKind.ProductType,
                "Product Types",
                "Product Type Master",
                "Define product types — raw material, component, finished good, etc.",
                "\uE8FD",
                "Type Code", "Type Name", "Description", "Status",
                [new("Total Types", "4", "\uE8FD", ThemeColors.Primary), new("Active", "4", "\uE73E", ThemeColors.Success), new("Used in Products", "1,248", "\uE7B8", ThemeColors.Slate), new("Last Updated", "Today", "\uE823", ThemeColors.Warning)],
                [
                    new() { Col1 = "PT-RM", Col2 = "Raw Material", Col3 = "Purchased inputs", Col4 = "Active", Status = "Active" },
                    new() { Col1 = "PT-CP", Col2 = "Component", Col3 = "Manufactured parts", Col4 = "Active", Status = "Active" },
                    new() { Col1 = "PT-FG", Col2 = "Finished Good", Col3 = "Sellable products", Col4 = "Active", Status = "Active" },
                    new() { Col1 = "PT-CV", Col2 = "Consumable", Col3 = "Shop floor supplies", Col4 = "Active", Status = "Active" }
                ],
                "Add Product Type",
                h => new AddClassificationViewModel(h, ClassificationMasterKind.ProductType)),

            [ClassificationMasterKind.ProductMainGroup] = new(
                ClassificationMasterKind.ProductMainGroup,
                "Main Groups",
                "Product Main Group Master",
                "Top-level product classification groups.",
                "\uE8B7",
                "Group Code", "Group Name", "Description", "Status",
                [new("Main Groups", "5", "\uE8B7", ThemeColors.Primary), new("Active", "5", "\uE73E", ThemeColors.Success), new("Sub Groups", "12", "\uE8FD", ThemeColors.Purple), new("Products", "486", "\uE7B8", ThemeColors.Slate)],
                [
                    new() { Col1 = "MG-MTL", Col2 = "Metals", Col3 = "Metal stock and parts", Col4 = "Active", Status = "Active" },
                    new() { Col1 = "MG-PLS", Col2 = "Plastics", Col3 = "Polymer materials", Col4 = "Active", Status = "Active" },
                    new() { Col1 = "MG-ELC", Col2 = "Electrical", Col3 = "Electrical components", Col4 = "Active", Status = "Active" },
                    new() { Col1 = "MG-MCH", Col2 = "Mechanical", Col3 = "Mechanical assemblies", Col4 = "Active", Status = "Active" },
                    new() { Col1 = "MG-GEN", Col2 = "General", Col3 = "Miscellaneous", Col4 = "Active", Status = "Active" }
                ],
                "Add Main Group",
                h => new AddClassificationViewModel(h, ClassificationMasterKind.ProductMainGroup)),

            [ClassificationMasterKind.ProductSubGroup] = new(
                ClassificationMasterKind.ProductSubGroup,
                "Sub Groups",
                "Product Sub Group Master",
                "Sub-classification linked to a main group.",
                "\uE8B7",
                "Sub Code", "Sub Name", "Main Group", "Status",
                [new("Sub Groups", "12", "\uE8B7", ThemeColors.Purple), new("Active", "11", "\uE73E", ThemeColors.Success), new("Main Groups", "5", "\uE8FD", ThemeColors.Primary), new("Unmapped", "1", "\uE7BA", ThemeColors.Warning)],
                [
                    new() { Col1 = "SG-SHT", Col2 = "Sheet", Col3 = "Metals", Col4 = "Active", Status = "Active" },
                    new() { Col1 = "SG-ROD", Col2 = "Rod", Col3 = "Metals", Col4 = "Active", Status = "Active" },
                    new() { Col1 = "SG-HSG", Col2 = "Housing", Col3 = "Mechanical", Col4 = "Active", Status = "Active" },
                    new() { Col1 = "SG-FST", Col2 = "Fastener", Col3 = "General", Col4 = "Active", Status = "Active" },
                    new() { Col1 = "SG-OTH", Col2 = "Other", Col3 = "General", Col4 = "Draft", Status = "Draft" }
                ],
                "Add Sub Group",
                h => new AddClassificationViewModel(h, ClassificationMasterKind.ProductSubGroup)),

            [ClassificationMasterKind.AssemblyType] = new(
                ClassificationMasterKind.AssemblyType,
                "Assembly Types",
                "Assembly Type Master",
                "Assembly classification for BOM and production.",
                "\uE8F1",
                "Assembly Code", "Assembly Name", "Description", "Status",
                [new("Types", "3", "\uE8F1", ThemeColors.Purple), new("Active", "3", "\uE73E", ThemeColors.Success), new("BOM Lines", "186", "\uE8FD", ThemeColors.Primary), new("MOs Using", "12", "\uE912", ThemeColors.Warning)],
                [
                    new() { Col1 = "AT-NON", Col2 = "None", Col3 = "No assembly", Col4 = "Active", Status = "Active" },
                    new() { Col1 = "AT-SUB", Col2 = "Sub-Assembly", Col3 = "Partial assembly", Col4 = "Active", Status = "Active" },
                    new() { Col1 = "AT-FIN", Col2 = "Final Assembly", Col3 = "Finished assembly", Col4 = "Active", Status = "Active" }
                ],
                "Add Assembly Type",
                h => new AddClassificationViewModel(h, ClassificationMasterKind.AssemblyType)),

            [ClassificationMasterKind.SaleUom] = new(
                ClassificationMasterKind.SaleUom,
                "Sale UOM",
                "Sale Unit of Measure Master",
                "Units used for sales and customer orders.",
                "\uE7C5",
                "UOM Code", "UOM Name", "Decimals", "Status",
                [new("Sale UOMs", "6", "\uE7C5", ThemeColors.Primary), new("Active", "6", "\uE73E", ThemeColors.Success), new("Default", "EA", "\uE8A1", ThemeColors.Warning), new("Products", "892", "\uE7B8", ThemeColors.Slate)],
                [
                    new() { Col1 = "UOM-EA", Col2 = "Each", Col3 = "0", Col4 = "Active", Status = "Active" },
                    new() { Col1 = "UOM-KG", Col2 = "Kilogram", Col3 = "2", Col4 = "Active", Status = "Active" },
                    new() { Col1 = "UOM-LTR", Col2 = "Litre", Col3 = "2", Col4 = "Active", Status = "Active" },
                    new() { Col1 = "UOM-MTR", Col2 = "Metre", Col3 = "2", Col4 = "Active", Status = "Active" },
                    new() { Col1 = "UOM-BOX", Col2 = "Box", Col3 = "0", Col4 = "Active", Status = "Active" },
                    new() { Col1 = "UOM-SET", Col2 = "Set", Col3 = "0", Col4 = "Active", Status = "Active" }
                ],
                "Add Sale UOM",
                h => new AddClassificationViewModel(h, ClassificationMasterKind.SaleUom)),

            [ClassificationMasterKind.PurchaseUom] = new(
                ClassificationMasterKind.PurchaseUom,
                "Purchase UOM",
                "Purchase Unit of Measure Master",
                "Units used for procurement and supplier orders.",
                "\uE7C5",
                "UOM Code", "UOM Name", "Decimals", "Status",
                [new("Purchase UOMs", "6", "\uE7C5", ThemeColors.Primary), new("Active", "6", "\uE73E", ThemeColors.Success), new("Default", "KG", "\uE719", ThemeColors.Warning), new("PO Lines", "412", "\uE8A5", ThemeColors.Slate)],
                [
                    new() { Col1 = "UOM-EA", Col2 = "Each", Col3 = "0", Col4 = "Active", Status = "Active" },
                    new() { Col1 = "UOM-KG", Col2 = "Kilogram", Col3 = "2", Col4 = "Active", Status = "Active" },
                    new() { Col1 = "UOM-LTR", Col2 = "Litre", Col3 = "2", Col4 = "Active", Status = "Active" },
                    new() { Col1 = "UOM-MTR", Col2 = "Metre", Col3 = "2", Col4 = "Active", Status = "Active" },
                    new() { Col1 = "UOM-BOX", Col2 = "Box", Col3 = "0", Col4 = "Active", Status = "Active" },
                    new() { Col1 = "UOM-SET", Col2 = "Set", Col3 = "0", Col4 = "Active", Status = "Active" }
                ],
                "Add Purchase UOM",
                h => new AddClassificationViewModel(h, ClassificationMasterKind.PurchaseUom))
        };

    public static ClassificationMasterDefinition Get(ClassificationMasterKind kind) => Definitions[kind];

    public static IEnumerable<ClassificationMasterDefinition> All => Definitions.Values;

    private static List<string> _productTypeNames = GetNames(ClassificationMasterKind.ProductType, r => r.Col2).ToList();
    private static List<string> _mainGroupNames = GetNames(ClassificationMasterKind.ProductMainGroup, r => r.Col2).ToList();
    private static List<string> _subGroupNames = GetNames(ClassificationMasterKind.ProductSubGroup, r => r.Col2).ToList();
    private static List<string> _assemblyTypeNames = GetNames(ClassificationMasterKind.AssemblyType, r => r.Col2).ToList();
    private static List<string> _saleUomNames = GetNames(ClassificationMasterKind.SaleUom, r => r.Col2).ToList();

    public static IReadOnlyList<string> ProductTypeNames => _productTypeNames;

    public static void SetProductTypeNames(IEnumerable<string> names)
    {
        var list = names.Where(n => !string.IsNullOrWhiteSpace(n)).Distinct().ToList();
        if (list.Count == 0)
            return;
        _productTypeNames = list;
    }

    public static IReadOnlyList<string> MainGroupNames => _mainGroupNames;

    public static void SetMainGroupNames(IEnumerable<string> names)
    {
        var list = names.Where(n => !string.IsNullOrWhiteSpace(n)).Distinct().ToList();
        if (list.Count == 0)
            return;
        _mainGroupNames = list;
    }

    public static IReadOnlyList<string> SubGroupNames => _subGroupNames;

    public static void SetSubGroupNames(IEnumerable<string> names)
    {
        var list = names.Where(n => !string.IsNullOrWhiteSpace(n)).Distinct().ToList();
        if (list.Count == 0)
            return;
        _subGroupNames = list;
    }

    public static IReadOnlyList<string> AssemblyTypeNames => _assemblyTypeNames;

    public static void SetAssemblyTypeNames(IEnumerable<string> names)
    {
        var list = names.Where(n => !string.IsNullOrWhiteSpace(n)).Distinct().ToList();
        if (list.Count == 0)
            return;
        _assemblyTypeNames = list;
    }

    public static IReadOnlyList<string> SaleUomNames => _saleUomNames;

    public static void SetSaleUomNames(IEnumerable<string> names)
    {
        var list = names.Where(n => !string.IsNullOrWhiteSpace(n)).Distinct().ToList();
        if (list.Count == 0)
            return;
        _saleUomNames = list;
    }

    public static IReadOnlyList<string> PurchaseUomNames =>
        GetNames(ClassificationMasterKind.PurchaseUom, r => r.Col2);

    private static IReadOnlyList<string> GetNames(ClassificationMasterKind kind, Func<MockRow, string> selector) =>
        Get(kind).SeedRows.Select(selector).Distinct().ToList();
}
