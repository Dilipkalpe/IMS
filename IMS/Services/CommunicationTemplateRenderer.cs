using System.Text.RegularExpressions;
using IMS.Models;

namespace IMS.Services;

public static class CommunicationTemplateRenderer
{
    private static readonly Regex PlaceholderRegex = new(@"\{\{\s*(\w+)\s*\}\}", RegexOptions.Compiled);

    public static string Render(string template, IReadOnlyDictionary<string, string> values)
    {
        if (string.IsNullOrEmpty(template))
            return string.Empty;

        return PlaceholderRegex.Replace(template, match =>
        {
            var key = match.Groups[1].Value;
            return values.TryGetValue(key, out var value) ? value : match.Value;
        });
    }

    public static string RenderForDocument(CommunicationDocumentKind kind, InvoiceCommunicationContext context)
    {
        var settings = CommunicationSettingsService.Instance.Current;
        var template = kind == CommunicationDocumentKind.PurchaseInvoice
            ? settings.PurchaseInvoiceTemplate
            : settings.SalesInvoiceTemplate;

        return Render(template, context.ToPlaceholderMap());
    }
}

public sealed class InvoiceCommunicationContext
{
    public CommunicationDocumentKind DocumentKind { get; init; }
    public string InvoiceNumber { get; init; } = string.Empty;
    public string InvoiceDate { get; init; } = string.Empty;
    public string PartyName { get; init; } = string.Empty;
    public string? PartyEmail { get; init; }
    public string? PartyPhone { get; init; }
    public string Amount { get; init; } = string.Empty;
    public string BalanceAmount { get; init; } = string.Empty;
    public string CompanyName { get; init; } = string.Empty;
    public string ContactDetails { get; init; } = string.Empty;

    public IReadOnlyDictionary<string, string> ToPlaceholderMap() =>
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["CustomerName"] = PartyName,
            ["SupplierName"] = PartyName,
            ["InvoiceNumber"] = InvoiceNumber,
            ["InvoiceDate"] = InvoiceDate,
            ["Amount"] = Amount,
            ["BalanceAmount"] = BalanceAmount,
            ["CompanyName"] = CompanyName,
            ["ContactDetails"] = ContactDetails
        };
}
