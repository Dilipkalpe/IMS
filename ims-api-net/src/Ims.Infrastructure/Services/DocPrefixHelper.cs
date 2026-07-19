using System.Text.RegularExpressions;

namespace Ims.Infrastructure.Services;

public static class DocPrefixHelper
{
    public static string NormalizeSoPrefix(string? prefix)
    {
        var raw = (prefix ?? "SO").Trim().ToUpperInvariant();
        var cleaned = Regex.Replace(raw, "[^A-Z0-9_-]", "");
        return cleaned.Length > 0 ? cleaned[..Math.Min(cleaned.Length, 12)] : "SO";
    }

    public static string FormatPrefixDocNo(string docPrefix, int docNo) =>
        $"{NormalizeSoPrefix(docPrefix)}-{docNo}";

    public static (string DocPrefix, int DocNo) ParseFormattedDocNo(string? formatted, string defaultPrefix = "DOC")
    {
        var value = (formatted ?? "").Trim();
        if (string.IsNullOrEmpty(value))
            return (NormalizeSoPrefix(defaultPrefix), 0);

        var dash = value.LastIndexOf('-');
        if (dash <= 0)
        {
            return int.TryParse(value, out var num)
                ? (NormalizeSoPrefix(defaultPrefix), num)
                : (NormalizeSoPrefix(defaultPrefix), 0);
        }

        var prefix = NormalizeSoPrefix(value[..dash]);
        var docNo = int.TryParse(value[(dash + 1)..], out var n) ? n : 0;
        return (prefix, docNo);
    }

    public static string SalesDocCounterKey(string counterNamespace, string? prefix, string defaultPrefix) =>
        $"{counterNamespace}:{NormalizeSoPrefix(prefix ?? defaultPrefix)}";

    public static int InitialDocNoForDefaultPrefix(string? prefix, string defaultPrefix, int legacyInitial) =>
        NormalizeSoPrefix(prefix) == NormalizeSoPrefix(defaultPrefix) ? legacyInitial : 1;

    public static int ResolveInitialSalesDocNo(string docTypeKey) => docTypeKey switch
    {
        "delivery_challan" => 1200,
        "sales_invoice" => 5500,
        "sales_return" => 301,
        _ => 1
    };

    public static int ResolveInitialPurchaseDocNo(string docTypeKey) => docTypeKey switch
    {
        "purchase_order" => 1040,
        "grn" => 880,
        "purchase_invoice" => 2200,
        "purchase_return" => 101,
        _ => 1
    };
}
