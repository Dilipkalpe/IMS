using IMS.Models;
using IMS.Services;

namespace IMS.ViewModels.SubPages;

internal static class GstEntrySummarySupport
{
    public static string ExtractStateCode(string? value)
    {
        var text = (value ?? string.Empty).Trim();
        if (text.Length < 2)
            return string.Empty;
        return text[..2];
    }

    public static bool IsInterState(string? placeOfSupply) =>
        ExtractStateCode(placeOfSupply) != ExtractStateCode(CompanyProfileService.Current.State);

    public static string TotalTaxable(IEnumerable<SalesLineItem> lines) =>
        InvoicePaymentSummarySupport.FormatMoney(lines.Sum(l => l.TaxableValue));

    public static string TotalCgst(IEnumerable<SalesLineItem> lines, bool isInterState) =>
        InvoicePaymentSummarySupport.FormatMoney(isInterState ? 0m : lines.Sum(l => l.CgstAmountValue));

    public static string TotalSgst(IEnumerable<SalesLineItem> lines, bool isInterState) =>
        InvoicePaymentSummarySupport.FormatMoney(isInterState ? 0m : lines.Sum(l => l.SgstAmountValue));

    public static string TotalIgst(IEnumerable<SalesLineItem> lines, bool isInterState) =>
        InvoicePaymentSummarySupport.FormatMoney(isInterState ? lines.Sum(l => l.IgstAmountValue) : 0m);

    public static string TotalDiscount(string discount, string spDiscount) =>
        InvoicePaymentSummarySupport.FormatMoney(
            InvoicePaymentSummarySupport.ParseMoney(discount)
            + InvoicePaymentSummarySupport.ParseMoney(spDiscount));

    public static string RoundOff(string net)
    {
        var total = InvoicePaymentSummarySupport.ParseMoney(net);
        var rounded = Math.Round(total, 0, MidpointRounding.AwayFromZero);
        return InvoicePaymentSummarySupport.FormatMoney(rounded - total);
    }

    public static string BalanceDue(string net, string paid) =>
        InvoicePaymentSummarySupport.FormatMoney(
            Math.Max(0, InvoicePaymentSummarySupport.ParseMoney(net) - InvoicePaymentSummarySupport.ParseMoney(paid)));
}
