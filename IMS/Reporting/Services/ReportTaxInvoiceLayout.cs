using IMS.Reporting.Models;

namespace IMS.Reporting.Services;

/// <summary>Full-page tax invoice canvas matching Raj Cloth Center sample layout.</summary>
public static class ReportTaxInvoiceLayout
{
    public const string PrimaryMaroon = ReportLayoutElements.PrimaryBrand;
    public const string LogoBlue = "#1e3a8a";
    public const double W = ReportStandardLayouts.ContentWidthMm;

    private const double TableY = 76;
    private const double TableH = 118;
    private const double FooterY = 198;

    public static List<ReportElementDefinition> BuildElements() =>
    [
        Logo("el_logo", W - 38, 2, 36, 24),
        Dynamic("el_co", "Company", "companyName", 0, 2, 120, 9, 16, "bold"),
        Dynamic("el_addr", "Address", "companyAddress", 0, 11, 120, 11, 9),
        Dynamic("el_phone", "Phone", "companyPhoneFormatted", 0, 22, 120, 5, 9),
        Dynamic("el_gst", "GSTIN / State", "companyGstState", 0, 28, 120, 6, 9),
        HLine("el_rule1", 0, 34, W),
        Dynamic("el_title", "Document title", "documentTitle", 0, 36, W, 10, 22, "bold", "center", PrimaryMaroon),
        HLine("el_rule2", 0, 47, W),
        Label("el_h_bill", "Bill To", 0, 49, 58, 5, "bold"),
        Dynamic("el_customer", "Customer", "customerName", 0, 54, 58, 7, 12, "bold"),
        Label("el_l_contact", "Contact No. :", 0, 61, 28, 4),
        Dynamic("el_contact", "Contact", "customerContact", 28, 61, 30, 5, 9),
        Label("el_h_trans", "Transportation Details", 60, 49, 58, 5, "bold"),
        Label("el_l_trans", "Transport Name:", 60, 54, 58, 4),
        Dynamic("el_trans", "Transport", "transportName", 60, 58, 58, 6, 9),
        Label("el_l_del", "Delivery Location:", 60, 64, 58, 4),
        Dynamic("el_del", "Delivery", "deliveryLocation", 60, 68, 58, 10, 9),
        Label("el_h_inv", "Invoice Details", 122, 49, 68, 5, "bold"),
        Label("el_l_invno", "Invoice No. :", 122, 54, 34, 4),
        Dynamic("el_invno", "Invoice No", "invoiceNo", 156, 54, 34, 6, 10, "bold", "right"),
        Label("el_l_date", "Date :", 122, 60, 34, 4),
        Dynamic("el_date", "Date", "invoiceDate", 156, 60, 34, 6, 10, "normal", "right"),
        Label("el_l_pos", "Place of supply:", 122, 66, 34, 4),
        Dynamic("el_pos", "Place of supply", "placeOfSupply", 156, 66, 34, 5, 9, "normal", "right"),
        HLine("el_rule3", 0, 74, W),
        TaxInvoiceTable("el_items", 0, TableY, W, TableH),
        Label("el_l_words", "Invoice Amount in Words", 0, FooterY, 98, 5, "bold"),
        Dynamic("el_words", "Amount in words", "amountInWords", 0, FooterY + 5, 98, 8, 9, "normal", "italic"),
        Label("el_h_terms", "Terms and Conditions", 0, FooterY + 14, 98, 5, "bold"),
        Dynamic("el_terms", "Terms", "termsAndConditions", 0, FooterY + 19, 98, 28, 8),
        Label("el_h_bank", "Bank Details", 0, FooterY + 48, 98, 5, "bold"),
        Dynamic("el_bank", "Bank", "bankDetailsFormatted", 0, FooterY + 53, 98, 22, 9),
        Box("el_summary_box", 104, FooterY - 1, 86, 56, "#ffffff"),
        Label("el_l_sub", "Sub Total", 108, FooterY, 42, 5),
        Dynamic("el_sub", "Sub Total", "subTotal", 150, FooterY, 40, 6, 10, "normal", "right"),
        Dynamic("el_l_disc", "Discount label", "discountLabel", 108, FooterY + 6, 42, 5, 9),
        Dynamic("el_disc", "Discount", "discountAmount", 150, FooterY + 6, 40, 6, 10, "normal", "right"),
        Label("el_l_net", "Total", 108, FooterY + 12, 42, 6, "bold"),
        Dynamic("el_net", "Total", "grandTotal", 150, FooterY + 12, 40, 8, 12, "bold", "right"),
        Label("el_l_recv", "Received", 108, FooterY + 19, 42, 5),
        Dynamic("el_recv", "Received", "receivedAmount", 150, FooterY + 19, 40, 6, 10, "normal", "right"),
        Label("el_l_bal", "Balance", 108, FooterY + 25, 42, 5),
        Dynamic("el_bal", "Balance", "balanceAmount", 150, FooterY + 25, 40, 6, 10, "normal", "right"),
        Label("el_l_pbal", "Previous Balance", 108, FooterY + 31, 42, 5),
        Dynamic("el_pbal", "Previous Balance", "previousBalance", 150, FooterY + 31, 40, 6, 10, "normal", "right"),
        Label("el_l_cbal", "Current Balance", 108, FooterY + 37, 42, 5),
        Dynamic("el_cbal", "Current Balance", "currentBalance", 150, FooterY + 37, 40, 6, 10, "normal", "right"),
        Label("el_l_ep", "Earned Points", 108, FooterY + 43, 42, 5),
        Dynamic("el_ep", "Earned Points", "earnedPoints", 150, FooterY + 43, 40, 6, 10, "normal", "right"),
        Label("el_l_ap", "Available Points", 108, FooterY + 49, 42, 5),
        Dynamic("el_ap", "Available Points", "availablePoints", 150, FooterY + 49, 40, 6, 10, "normal", "right")
    ];

    private static ReportElementDefinition Logo(string id, double x, double y, double w, double h) =>
        new()
        {
            Id = id,
            Name = "Company logo",
            Type = "companyLogo",
            XMm = x,
            YMm = y,
            WidthMm = w,
            HeightMm = h,
            ZIndex = 4,
            Style = new ReportElementStyle
            {
                FontSizePt = 20,
                Background = LogoBlue,
                Foreground = "#ffffff"
            }
        };

    private static ReportElementDefinition Label(
        string id, string text, double x, double y, double w, double h, string weight = "normal") =>
        ReportLayoutElements.Label(id, text, x, y, w, h, weight);

    private static ReportElementDefinition Dynamic(
        string id, string name, string fieldKey, double x, double y, double w, double h,
        double fontPt, string weight = "normal", string align = "left", string? foreground = null, string? fontStyle = null)
    {
        var el = ReportLayoutElements.Dynamic(id, name, fieldKey, x, y, w, h, fontPt, weight, align, foreground);
        if (!string.IsNullOrWhiteSpace(fontStyle))
            el.Style.FontWeight = fontStyle == "italic" ? "normal" : el.Style.FontWeight;
        return el;
    }

    private static ReportElementDefinition HLine(string id, double x, double y, double w) =>
        ReportLayoutElements.HLine(id, x, y, w);

    private static ReportElementDefinition Box(string id, double x, double y, double w, double h, string bg) =>
        new()
        {
            Id = id,
            Name = "Summary panel",
            Type = "rectangle",
            XMm = x,
            YMm = y,
            WidthMm = w,
            HeightMm = h,
            ZIndex = 1,
            Style = new ReportElementStyle
            {
                BorderThicknessMm = 0.35,
                Background = bg,
                BorderColor = "#0f172a"
            }
        };

    private static ReportElementDefinition TaxInvoiceTable(string id, double x, double y, double w, double h) =>
        ReportLayoutElements.DataTable(id, x, y, w, h,
        [
            ReportLayoutElements.Col("srNo", "#", 8, "center"),
            ReportLayoutElements.Col("description", "Item name", 42),
            ReportLayoutElements.Col("hsnCode", "HSN/ SAC", 15),
            ReportLayoutElements.Col("colour", "COLOUR", 13),
            ReportLayoutElements.Col("size", "Size", 11),
            ReportLayoutElements.Col("qty", "Quantity", 14, "right"),
            ReportLayoutElements.Col("unit", "Unit", 10, "center"),
            ReportLayoutElements.Col("rate", "Price/ Unit", 19, "right"),
            ReportLayoutElements.Col("amount", "Amount", 22, "right")
        ], showTotalsRow: true);
}
