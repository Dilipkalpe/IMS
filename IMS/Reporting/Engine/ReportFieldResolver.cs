using System.Globalization;
using System.Reflection;
using IMS.Helpers;
using IMS.Reporting.Core.Fields;
using IMS.Reporting.Data;
using IMS.Services.Api.Dtos;

namespace IMS.Reporting.Engine;

public static class ReportFieldResolver
{
    private static readonly CultureInfo In = CultureInfo.GetCultureInfo("en-IN");

    public static ReportDocumentContext BuildContext(
        SalesOrderDto document,
        IMS.Models.InvoiceCompanyProfile company,
        string documentTitle,
        string partyLabel)
    {
        var gross = IndianAmountInWords.ParseDecimal(document.Totals?.Gross);
        var discount = IndianAmountInWords.ParseDecimal(document.Totals?.Discount);
        var net = IndianAmountInWords.ParseDecimal(document.Totals?.Net ?? document.Totals?.SaleAmount);
        if (net == 0)
            net = gross - discount;

        var received = document.PaidAmount > 0 ? document.PaidAmount : net;
        var balance = document.Balance != 0
            ? document.Balance
            : net - received;
        var receivable = IndianAmountInWords.ParseDecimal(document.Totals?.ReceivableToCustomer);
        if (balance == 0 && receivable != 0)
            balance = receivable;
        var discPercent = gross > 0 ? discount / gross * 100m : 0m;

        return new ReportDocumentContext
        {
            Company = company,
            Document = document,
            DocumentTitle = documentTitle,
            PartyLabel = partyLabel,
            Party = new PartySnapshot
            {
                Name = document.Customer ?? "—",
                Details = string.IsNullOrWhiteSpace(document.CustomerDetails)
                    ? "—"
                    : document.CustomerDetails.Trim()
            },
            Totals = new TotalsSnapshot
            {
                SubTotal = FormatCurrency(gross),
                Discount = FormatCurrency(discount),
                DiscountLabel = discount > 0 ? $"Discount ({discPercent:N2}%)" : "Discount",
                Net = FormatCurrency(net),
                Tax = FormatCurrency(net / 2m),
                GrandTotal = FormatCurrency(net),
                Received = FormatCurrency(received),
                Balance = FormatCurrency(balance),
                PreviousBalance = FormatCurrency(0),
                CurrentBalance = FormatCurrency(balance),
                EarnedPoints = "0",
                AvailablePoints = "0"
            },
            Lines = document.Lines ?? []
        };
    }

    public static string ResolveToken(
        string? token,
        ReportDocumentContext ctx,
        IReadOnlyList<ReportFieldRegistryEntryDto>? registry)
    {
        if (string.IsNullOrWhiteSpace(token))
            return string.Empty;

        var trimmed = token.Trim();
        if (!trimmed.StartsWith("{{", StringComparison.Ordinal) || !trimmed.EndsWith("}}", StringComparison.Ordinal))
            return trimmed;

        var key = trimmed[2..^2].Trim();
        var entry = registry?.FirstOrDefault(f =>
            string.Equals(f.FieldKey, key, StringComparison.OrdinalIgnoreCase)
            || string.Equals(f.Token, trimmed, StringComparison.OrdinalIgnoreCase));

        if (entry is not null && !string.IsNullOrWhiteSpace(entry.DataPath))
        {
            var fromPath = ResolveDataPath(entry.DataPath, ctx);
            if (!string.IsNullOrWhiteSpace(fromPath))
                return fromPath;
        }

        return key switch
        {
            "documentTitle" => ctx.DocumentTitle,
            "invoiceNo" => ctx.Document.FormattedDocNo ?? $"DOC-{ctx.Document.DocNo}",
            "invoiceDate" => FormatDate(ctx.Document.BillDate, ctx.Document.SoDate),
            "customerName" => ctx.Party.Name,
            "customerDetails" => ctx.Party.Details,
            "supplierName" => ctx.Party.Name,
            "supplierDetails" => ctx.Party.Details,
            "companyName" => ctx.Company.BusinessName,
            "companyAddress" => ctx.Company.Address,
            "companyPhone" => ctx.Company.Phone,
            "companyPhoneFormatted" => $"Phone no. : {ctx.Company.Phone}",
            "companyGstState" => $"GSTIN: {ctx.Company.Gstin}  State: {ctx.Company.State}",
            "customerContact" => FormatCustomerContact(ctx.Party.Details),
            "gstin" => ctx.Company.Gstin,
            "placeOfSupply" => ctx.Company.PlaceOfSupply,
            "transportName" => ResolveTransportName(ctx),
            "deliveryLocation" => ResolveDeliveryLocation(ctx),
            "amountInWords" => IndianAmountInWords.ToRupeeWords(ParseMoney(ctx.Totals.GrandTotal)),
            "termsAndConditions" => FormatTerms(ctx.Company.Terms),
            "bankDetails" => FormatBankDetails(ctx.Company),
            "bankDetailsFormatted" => FormatBankDetailsFormatted(ctx.Company),
            "subTotal" => ctx.Totals.SubTotal,
            "discountLabel" => ctx.Totals.DiscountLabel,
            "discountAmount" => ctx.Totals.Discount,
            "grandTotal" => ctx.Totals.GrandTotal,
            "receivedAmount" => ctx.Totals.Received,
            "balanceAmount" => ctx.Totals.Balance,
            "previousBalance" => ctx.Totals.PreviousBalance,
            "currentBalance" => ctx.Totals.CurrentBalance,
            "earnedPoints" => ctx.Totals.EarnedPoints,
            "availablePoints" => ctx.Totals.AvailablePoints,
            "totalAmount" => ctx.Totals.Net,
            "taxAmount" => ctx.Totals.Tax,
            _ => trimmed
        };
    }

    public static string ResolveDataPath(string dataPath, ReportDocumentContext ctx)
    {
        if (string.IsNullOrWhiteSpace(dataPath))
            return string.Empty;

        if (string.Equals(dataPath, "lines", StringComparison.OrdinalIgnoreCase))
            return string.Empty;

        var known = TryResolveKnownDataPath(dataPath, ctx);
        if (known is not null)
            return known;

        var parts = dataPath.Split('.');
        object? current = ctx;
        foreach (var part in parts)
        {
            if (current is null)
                return string.Empty;
            current = GetMemberValue(current, part);
        }

        return current switch
        {
            null => string.Empty,
            DateTime dt => dt.ToString("dd-MMM-yyyy", In),
            decimal d => d.ToString("N2", In),
            double d => d.ToString("N2", In),
            _ => current.ToString() ?? string.Empty
        };
    }

    public static string ResolveElementText(
        Models.ReportElementDefinition element,
        ReportDocumentContext ctx,
        IReadOnlyList<ReportFieldRegistryEntryDto>? registry)
    {
        var type = element.Type.Trim().ToLowerInvariant();
        return type switch
        {
            "text" => element.Binding.Value ?? string.Empty,
            "dynamicText" => ResolveToken(element.Binding.Token ?? element.Binding.FieldKey, ctx, registry),
            "companyLogo" => ctx.Company.LogoText,
            _ => ResolveToken(element.Binding.Token, ctx, registry)
        };
    }

    public static string GetLineCellValue(string key, SalesOrderLineDto line)
    {
        var qty = IndianAmountInWords.ParseDecimal(line.Qty);
        var rate = IndianAmountInWords.ParseDecimal(line.Rate);
        var amount = IndianAmountInWords.ParseDecimal(line.Amount);
        if (amount == 0 && qty > 0)
            amount = qty * rate;

        return key switch
        {
            "srNo" or "sr" => line.Sr.ToString(In),
            "itemCode" => line.ProductRetailCode ?? "—",
            "hsnCode" => line.ProductRetailCode ?? "—",
            "description" => line.ItemDescription ?? line.ProductRetailCode ?? "—",
            "colour" => "—",
            "size" => "—",
            "unit" => string.IsNullOrWhiteSpace(line.TaxType) ? "PCS" : line.TaxType.Trim(),
            "qty" => qty.ToString("N2", In),
            "rate" => FormatCurrency(rate),
            "amount" => FormatCurrency(amount),
            "discount" => line.DiscPercent ?? "0",
            "gstPercent" => line.TaxPercent ?? "0",
            _ => "—"
        };
    }

    private static object? GetMemberValue(object target, string memberName)
    {
        var type = target.GetType();
        var prop = type.GetProperty(memberName,
            BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
        if (prop is not null)
            return prop.GetValue(target);

        var field = type.GetField(memberName,
            BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
        return field?.GetValue(target);
    }

    private static string? TryResolveKnownDataPath(string dataPath, ReportDocumentContext ctx)
    {
        switch (dataPath.Trim().ToLowerInvariant())
        {
            case "lines":
                return string.Empty;
            case "document.billdate":
                return FormatDate(ctx.Document.BillDate, ctx.Document.SoDate);
            case "document.formatteddocno":
                return ctx.Document.FormattedDocNo ?? $"DOC-{ctx.Document.DocNo}";
            case "document.title":
            case "document.documenttitle":
                return ctx.DocumentTitle;
            case "company.name":
            case "company.businessname":
                return ctx.Company.BusinessName;
            case "company.address":
                return ctx.Company.Address;
            case "company.gstin":
                return ctx.Company.Gstin;
            case "party.name":
                return ctx.Party.Name;
            case "party.details":
                return ctx.Party.Details;
            case "totals.net":
                return ctx.Totals.Net;
            case "totals.tax":
                return ctx.Totals.Tax;
            case "totals.grandtotal":
                return ctx.Totals.GrandTotal;
            default:
                return null;
        }
    }

    private static string FormatCurrency(decimal value) => $"₹ {value:N2}";

    private static decimal ParseMoney(string value) =>
        IndianAmountInWords.ParseDecimal(value.Replace("₹", "", StringComparison.Ordinal).Trim());

    private static string ResolveTransportName(ReportDocumentContext ctx) =>
        !string.IsNullOrWhiteSpace(ctx.Document.ShippingAddress)
            ? ctx.Document.ShippingAddress.Trim()
            : ctx.Document.Narration ?? "—";

    private static string ResolveDeliveryLocation(ReportDocumentContext ctx) =>
        !string.IsNullOrWhiteSpace(ctx.Document.BillingAddress)
            ? ctx.Document.BillingAddress.Trim()
            : ctx.Document.ShippingAddress ?? "—";

    private static string FormatTerms(string[] terms) =>
        terms.Length == 0
            ? "—"
            : string.Join(Environment.NewLine, terms.Select(t => $"• {t}"));

    private static string FormatBankDetails(IMS.Models.InvoiceCompanyProfile company) =>
        $"Name: {company.BankName}{Environment.NewLine}" +
        $"Account No.: {company.BankAccountNo}{Environment.NewLine}" +
        $"IFSC: {company.BankIfsc}{Environment.NewLine}" +
        $"Holder: {company.BankAccountHolder}";

    private static string FormatBankDetailsFormatted(IMS.Models.InvoiceCompanyProfile company) =>
        $"Name : {company.BankName}{Environment.NewLine}" +
        $"Account No. : {company.BankAccountNo}{Environment.NewLine}" +
        $"IFSC code : {company.BankIfsc}{Environment.NewLine}" +
        $"Account holder's name : {company.BankAccountHolder}";

    private static string FormatCustomerContact(string details)
    {
        if (string.IsNullOrWhiteSpace(details) || details == "—")
            return "—";
        var d = details.Trim();
        if (d.StartsWith("Contact", StringComparison.OrdinalIgnoreCase))
            return d;
        return d;
    }

    private static string FormatDate(string? billDate, DateTime? soDate)
    {
        if (!string.IsNullOrWhiteSpace(billDate))
        {
            var trimmed = billDate.Trim();
            if (DateTime.TryParse(trimmed, In, DateTimeStyles.None, out var parsed))
                return parsed.ToString("dd-MM-yyyy", In);
            return trimmed;
        }
        return soDate?.ToString("dd-MM-yyyy", In) ?? "—";
    }
}
