using IMS.Models;

namespace IMS.Services;

public static class AccountMasterFormCatalog
{
    public static IReadOnlyList<FormFieldDefinition> All { get; } = Build();

    private static IReadOnlyList<FormFieldDefinition> Build() =>
    [
        new("customer_code", "Customer Code", FormFieldKind.Text, IsRequired: true,
            Placeholder: "e.g. CUS-001", Section: "Account & contact",
            ToolTip: "Unique ledger / customer code"),
        new("customer_name", "Customer Name", FormFieldKind.Text, IsRequired: true,
            Placeholder: "Legal or trading name", Section: "Account & contact"),
        new("customer_type", "Customer Type", FormFieldKind.Combo, IsOptional: true,
            Options: CustomerTypeCatalog.CustomerTypeNames, Section: "Account & contact",
            ToolTip: "Classification used in sales and reporting"),
        new("contact_person", "Contact Person", FormFieldKind.Text, IsOptional: true, Section: "Account & contact"),
        new("designation", "Designation", FormFieldKind.Text, IsOptional: true, Section: "Account & contact"),
        new("source_employee", "Source Employee", FormFieldKind.Text, IsOptional: true,
            Section: "Account & contact", ToolTip: "Sales or sourcing representative"),

        new("email", "Email", FormFieldKind.Text, IsOptional: true,
            Placeholder: "name@company.com", Section: "Communication"),
        new("mobile_no", "Mobile No.", FormFieldKind.Text, IsOptional: true, Section: "Communication"),
        new("contact_no", "Contact No.", FormFieldKind.Text, IsOptional: true, Section: "Communication"),
        new("fax", "Fax", FormFieldKind.Text, IsOptional: true, Section: "Communication"),

        new("cst_no", "CST No.", FormFieldKind.Text, IsOptional: true, Section: "Tax & registration"),
        new("tin_no", "TIN No.", FormFieldKind.Text, IsOptional: true, Section: "Tax & registration"),
        new("pan_no", "PAN No.", FormFieldKind.Text, IsOptional: true, Section: "Tax & registration",
            Placeholder: "e.g. ABCDE1234F"),
        new("gst_no", "GST No.", FormFieldKind.Text, IsOptional: true, Section: "Tax & registration",
            Placeholder: "15-character GSTIN"),
        new("excise_no", "Excise No.", FormFieldKind.Text, IsOptional: true, Section: "Tax & registration"),
        new("gst_exempt", "GST Exempt", FormFieldKind.Boolean, IsOptional: true,
            Section: "Tax & registration", DefaultValue: "false"),
        new("active_status", "Active Status", FormFieldKind.Boolean, IsOptional: true,
            Section: "Tax & registration", DefaultValue: "true",
            ToolTip: "Inactive accounts are hidden from selection lists"),

        new("address", "Address", FormFieldKind.Multiline, IsOptional: true,
            Placeholder: "Street, area, landmark…", Section: "Address & location"),
        new("city", "City", FormFieldKind.Text, IsOptional: true, Section: "Address & location"),
        new("state", "State", FormFieldKind.Text, IsOptional: true, Section: "Address & location"),
        new("country", "Country", FormFieldKind.Text, IsOptional: true, Section: "Address & location"),
        new("pincode", "Pincode", FormFieldKind.Text, IsOptional: true, Section: "Address & location"),

        new("credit_limit", "Credit Limit", FormFieldKind.Number, IsOptional: true,
            Placeholder: "0", Section: "Credit & turnover"),
        new("credit_days", "Credit Days", FormFieldKind.Number, IsOptional: true,
            Placeholder: "0", Section: "Credit & turnover"),
        new("annual_turnover", "Annual Turnover", FormFieldKind.Text, IsOptional: true,
            Section: "Credit & turnover"),

        new("bill_format_sales_invoice", "Sales Invoice Format", FormFieldKind.Text, IsOptional: true,
            Placeholder: "e.g. SI_STD or template key", Section: "Bill print formats",
            ToolTip: "Format code or template key from Bill Format Master. Leave blank to use the default format for this document type."),
        new("bill_format_sales_order", "Sales Order Format", FormFieldKind.Text, IsOptional: true,
            Placeholder: "template key", Section: "Bill print formats"),
        new("bill_format_sales_return", "Sales Return Format", FormFieldKind.Text, IsOptional: true,
            Placeholder: "template key", Section: "Bill print formats"),
        new("bill_format_delivery_challan", "Delivery Challan Format", FormFieldKind.Text, IsOptional: true,
            Placeholder: "template key", Section: "Bill print formats"),
        new("bill_format_purchase_invoice", "Purchase Invoice Format", FormFieldKind.Text, IsOptional: true,
            Placeholder: "template key", Section: "Bill print formats"),
        new("bill_format_purchase_order", "Purchase Order Format", FormFieldKind.Text, IsOptional: true,
            Placeholder: "template key", Section: "Bill print formats"),
        new("bill_format_purchase_return", "Purchase Return Format", FormFieldKind.Text, IsOptional: true,
            Placeholder: "template key", Section: "Bill print formats"),
        new("bill_format_grn", "GRN Format", FormFieldKind.Text, IsOptional: true,
            Placeholder: "template key", Section: "Bill print formats")
    ];
}
