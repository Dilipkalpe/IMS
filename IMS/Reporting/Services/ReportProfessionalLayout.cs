using IMS.Reporting.Models;

namespace IMS.Reporting.Services;

/// <summary>Professional A4 canvas layouts with logo for all transaction types (except full tax invoice).</summary>
public static class ReportProfessionalLayout
{
    private const double W = ReportStandardLayouts.ContentWidthMm;

    public static List<ReportElementDefinition> Build(string transactionType)
    {
        var profile = ResolveProfile(transactionType);
        var list = new List<ReportElementDefinition>
        {
            ReportLayoutElements.Logo("el_logo", W - 36, 2, 34, 22),
            ReportLayoutElements.Dynamic("el_co", "Company", "companyName", 0, 2, 118, 8, 15, "bold"),
            ReportLayoutElements.Dynamic("el_addr", "Address", "companyAddress", 0, 10, 118, 10, 9),
            ReportLayoutElements.Dynamic("el_phone", "Phone", "companyPhone", 0, 20, 118, 5, 9),
            ReportLayoutElements.Dynamic("el_gst", "GSTIN / State", "companyGstState", 0, 26, 118, 6, 9),
            ReportLayoutElements.HLine("el_rule1", 0, 33, W),
            ReportLayoutElements.Dynamic("el_title", "Document title", "documentTitle", 0, 35, W, 9, 20, "bold", "center",
                ReportLayoutElements.PrimaryBrand),
            ReportLayoutElements.HLine("el_rule2", 0, 45, W),
            ReportLayoutElements.Label("el_h_party", profile.PartyHeader, 0, 47, 58, 5, "bold"),
            ReportLayoutElements.Dynamic("el_party", profile.PartyHeader, profile.PartyKey, 0, 52, 58, 6, 11, "bold"),
            ReportLayoutElements.Dynamic("el_party_det", "Party details", profile.PartyDetailsKey, 0, 58, 58, 10, 9),
            ReportLayoutElements.Box("el_party_box", 0, 45, 60, 26),
            ReportLayoutElements.Label("el_h_doc", "Document Details", 122, 47, 68, 5, "bold"),
            ReportLayoutElements.Label("el_l_docno", profile.DocNoLabel, 122, 52, 32, 4),
            ReportLayoutElements.Dynamic("el_docno", "Document number", "invoiceNo", 154, 52, 36, 6, 10, "bold", "right"),
            ReportLayoutElements.Label("el_l_date", "Date :", 122, 58, 32, 4),
            ReportLayoutElements.Dynamic("el_date", "Date", "invoiceDate", 154, 58, 36, 6, 10, "normal", "right"),
            ReportLayoutElements.Label("el_l_pos", "Place of supply:", 122, 64, 32, 4),
            ReportLayoutElements.Dynamic("el_pos", "Place of supply", "placeOfSupply", 122, 68, 68, 5, 9),
            ReportLayoutElements.HLine("el_rule3", 0, 76, W),
            ReportLayoutElements.DataTable("el_items", 0, 78, W, profile.TableHeightMm, TableColumns(profile), profile.ShowTableTotals)
        };

        var footerY = 78 + profile.TableHeightMm + 4;
        if (profile.Footer == FooterKind.Full)
            list.AddRange(BuildFullFooter(footerY));
        else if (profile.Footer == FooterKind.GrandTotalOnly)
            list.AddRange(BuildGrandTotalFooter(footerY));

        return list;
    }

    private enum FooterKind { None, GrandTotalOnly, Full }

    private sealed record LayoutProfile(
        string PartyHeader,
        string PartyKey,
        string PartyDetailsKey,
        string DocNoLabel,
        bool IsGrn,
        double TableHeightMm,
        bool ShowTableTotals,
        FooterKind Footer);

    private static LayoutProfile ResolveProfile(string transactionType)
    {
        var isPurchase = transactionType.StartsWith("purchase", StringComparison.OrdinalIgnoreCase)
                         || string.Equals(transactionType, "grn", StringComparison.OrdinalIgnoreCase);
        var isGrn = string.Equals(transactionType, "grn", StringComparison.OrdinalIgnoreCase);
        var partyHeader = isPurchase ? "Supplier" : "Bill To";
        var partyKey = isPurchase ? "supplierName" : "customerName";
        var partyDetails = isPurchase ? "supplierDetails" : "customerDetails";
        var docNo = DocNoLabel(transactionType);

        if (string.Equals(transactionType, "delivery_challan", StringComparison.OrdinalIgnoreCase))
        {
            return new LayoutProfile(partyHeader, partyKey, partyDetails, docNo, false, 110, true, FooterKind.None);
        }

        if (isGrn)
        {
            return new LayoutProfile("Supplier", "supplierName", "supplierDetails", "GRN No.", true, 95, true,
                FooterKind.GrandTotalOnly);
        }

        if (transactionType is "sales_order" or "purchase_order")
        {
            return new LayoutProfile(partyHeader, partyKey, partyDetails, docNo, false, 95, true, FooterKind.GrandTotalOnly);
        }

        return new LayoutProfile(partyHeader, partyKey, partyDetails, docNo, false, 88, true, FooterKind.Full);
    }

    private static string DocNoLabel(string transactionType) =>
        transactionType switch
        {
            "sales_order" or "purchase_order" => "Order No.",
            "delivery_challan" => "Challan No.",
            "sales_return" or "purchase_return" => "Return No.",
            "grn" => "GRN No.",
            _ => "Invoice No."
        };

    private static IReadOnlyList<ReportTableColumnDefinition> TableColumns(LayoutProfile profile)
    {
        if (profile.IsGrn)
        {
            return
            [
                ReportLayoutElements.Col("srNo", "#", 8, "center"),
                ReportLayoutElements.Col("itemCode", "Code", 16),
                ReportLayoutElements.Col("description", "Description", 40),
                ReportLayoutElements.Col("orderedQty", "Ordered", 16, "right"),
                ReportLayoutElements.Col("receivedQty", "Received", 16, "right"),
                ReportLayoutElements.Col("amount", "Amount", 22, "right")
            ];
        }

        if (profile.Footer == FooterKind.Full)
        {
            return
            [
                ReportLayoutElements.Col("srNo", "#", 8, "center"),
                ReportLayoutElements.Col("description", "Item name", 42),
                ReportLayoutElements.Col("hsnCode", "HSN/ SAC", 14),
                ReportLayoutElements.Col("qty", "Qty", 14, "right"),
                ReportLayoutElements.Col("unit", "Unit", 10, "center"),
                ReportLayoutElements.Col("rate", "Rate", 18, "right"),
                ReportLayoutElements.Col("amount", "Amount", 22, "right")
            ];
        }

        return
        [
            ReportLayoutElements.Col("srNo", "#", 8, "center"),
            ReportLayoutElements.Col("itemCode", "Code", 16),
            ReportLayoutElements.Col("description", "Description", 44),
            ReportLayoutElements.Col("qty", "Qty", 14, "right"),
            ReportLayoutElements.Col("rate", "Rate", 18, "right"),
            ReportLayoutElements.Col("amount", "Amount", 22, "right")
        ];
    }

    private static IEnumerable<ReportElementDefinition> BuildGrandTotalFooter(double y) =>
    [
        ReportLayoutElements.HLine("el_rule_total", 0, y, W),
        ReportLayoutElements.Label("el_l_total", "Grand Total", 108, y + 2, 40, 6, "bold"),
        ReportLayoutElements.Dynamic("el_total", "Grand Total", "grandTotal", 148, y + 2, 42, 8, 12, "bold", "right")
    ];

    private static IEnumerable<ReportElementDefinition> BuildFullFooter(double y) =>
    [
        ReportLayoutElements.Label("el_l_words", "Amount in Words:", 0, y, 95, 5, "bold"),
        ReportLayoutElements.Dynamic("el_words", "Amount in words", "amountInWords", 0, y + 5, 95, 10, 9),
        ReportLayoutElements.Label("el_h_terms", "Terms and Conditions", 0, y + 16, 95, 5, "bold"),
        ReportLayoutElements.Dynamic("el_terms", "Terms", "termsAndConditions", 0, y + 21, 95, 18, 8),
        ReportLayoutElements.Label("el_l_sub", "Sub Total", 108, y, 38, 5),
        ReportLayoutElements.Dynamic("el_sub", "Sub Total", "subTotal", 148, y, 42, 6, 10, "normal", "right"),
        ReportLayoutElements.Label("el_l_disc", "Discount", 108, y + 6, 38, 5),
        ReportLayoutElements.Dynamic("el_disc", "Discount", "discountAmount", 148, y + 6, 42, 6, 10, "normal", "right"),
        ReportLayoutElements.Label("el_l_net", "Total", 108, y + 12, 38, 6, "bold"),
        ReportLayoutElements.Dynamic("el_net", "Total", "grandTotal", 148, y + 12, 42, 7, 12, "bold", "right"),
        ReportLayoutElements.Label("el_l_recv", "Received", 108, y + 19, 38, 5),
        ReportLayoutElements.Dynamic("el_recv", "Received", "receivedAmount", 148, y + 19, 42, 6, 10, "normal", "right"),
        ReportLayoutElements.Label("el_l_bal", "Balance", 108, y + 25, 38, 5),
        ReportLayoutElements.Dynamic("el_bal", "Balance", "balanceAmount", 148, y + 25, 42, 6, 10, "normal", "right"),
        ReportLayoutElements.HLine("el_rule_bank", 0, y + 32, W),
        ReportLayoutElements.Label("el_h_bank", "Bank Details", 0, y + 34, 40, 5, "bold"),
        ReportLayoutElements.Dynamic("el_bank", "Bank", "bankDetails", 0, y + 39, W, 16, 9)
    ];
}
