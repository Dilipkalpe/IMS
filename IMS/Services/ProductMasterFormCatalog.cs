using IMS.Models;

namespace IMS.Services;

public static class ProductMasterFormCatalog
{
    public static IReadOnlyList<FormFieldDefinition> All { get; } = Build();

    private static IReadOnlyList<FormFieldDefinition> Build() =>
    [
        new("product_name", "Product Name", FormFieldKind.Text, IsRequired: true,
            Placeholder: "Enter product name", Section: "Basic information",
            ToolTip: "Display name on documents and lists"),
        new("product_code", "Product Code", FormFieldKind.Text, IsRequired: true,
            Placeholder: "e.g. FG-5001", Section: "Basic information",
            ToolTip: "Unique SKU / item code"),
        new("hsn_code", "HSN Code", FormFieldKind.Text, IsOptional: true,
            Placeholder: "e.g. 8479", Section: "Basic information",
            ToolTip: "Harmonized System of Nomenclature code for GST"),
        new("size", "Size", FormFieldKind.Text, IsOptional: true, Section: "Basic information"),
        new("length", "Length", FormFieldKind.Text, IsOptional: true, Section: "Basic information"),
        new("manufactured_brand", "Manufactured Brand", FormFieldKind.Text, IsOptional: true,
            Section: "Basic information"),

        new("sale_price", "Sale Price", FormFieldKind.Number, IsOptional: true,
            Placeholder: "0.00", Section: "Pricing, quantity & tax"),
        new("purchase_price", "Purchase Price", FormFieldKind.Number, IsOptional: true,
            Placeholder: "0.00", Section: "Pricing, quantity & tax"),
        new("reorder_qty", "Reorder Qty", FormFieldKind.Number, IsOptional: true,
            Placeholder: "0", Section: "Pricing, quantity & tax"),
        new("min_order_qty", "Min Order Qty", FormFieldKind.Number, IsOptional: true,
            Placeholder: "0", Section: "Pricing, quantity & tax"),
        new("cgst", "CGST %", FormFieldKind.Number, IsOptional: true, Placeholder: "0",
            Section: "Pricing, quantity & tax"),
        new("sgst", "SGST %", FormFieldKind.Number, IsOptional: true, Placeholder: "0",
            Section: "Pricing, quantity & tax"),
        new("igst", "IGST %", FormFieldKind.Number, IsOptional: true, Placeholder: "0",
            Section: "Pricing, quantity & tax"),

        new("product_type", "Product Type", FormFieldKind.Combo, IsOptional: true,
            Options: ClassificationMasterCatalog.ProductTypeNames, Section: "Classification & UOM"),
        new("product_main_group", "Main Group", FormFieldKind.Combo, IsOptional: true,
            Options: ClassificationMasterCatalog.MainGroupNames, Section: "Classification & UOM"),
        new("product_sub_group", "Sub Group", FormFieldKind.Combo, IsOptional: true,
            Options: ClassificationMasterCatalog.SubGroupNames, Section: "Classification & UOM"),
        new("assembly_type", "Assembly Type", FormFieldKind.Combo, IsOptional: true,
            Options: ClassificationMasterCatalog.AssemblyTypeNames, Section: "Classification & UOM"),
        new("sale_uom", "Sale UOM", FormFieldKind.Combo, IsOptional: true,
            Options: ClassificationMasterCatalog.SaleUomNames, Section: "Classification & UOM"),
        new("purchase_uom", "Purchase UOM", FormFieldKind.Combo, IsOptional: true,
            Options: ClassificationMasterCatalog.PurchaseUomNames, Section: "Classification & UOM"),

        new("product_image", "Product Image", FormFieldKind.FilePath, IsOptional: true,
            Placeholder: "Image file path", Section: "Image & options", HasBrowseButton: true),
        new("serial_applicable", "Serial Applicable", FormFieldKind.Boolean, IsOptional: true,
            Section: "Image & options", DefaultValue: "false"),
        new("gst_exempt", "GST Exempt", FormFieldKind.Boolean, IsOptional: true,
            Section: "Image & options", DefaultValue: "false"),
        new("active_status", "Active", FormFieldKind.Boolean, IsOptional: true,
            Section: "Image & options", DefaultValue: "true",
            ToolTip: "Inactive products are hidden from selection lists")
    ];
}
