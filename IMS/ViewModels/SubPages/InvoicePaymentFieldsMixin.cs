using System.Globalization;
using IMS.Models;

namespace IMS.ViewModels.SubPages;

internal static class InvoicePaymentFieldsMixin
{
    public static string NormalizePaymentType(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "credit";

        return value.Trim().ToLowerInvariant() switch
        {
            "cash" => "cash",
            "partial" => "partial",
            _ => "credit"
        };
    }

    public static string NormalizePaymentMode(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        return value.Trim().ToLowerInvariant() switch
        {
            "cash" => "cash",
            "bank" => "bank",
            "upi" => "upi",
            "cheque" => "cheque",
            "card" => "card",
            _ => string.Empty
        };
    }

    public static string DisplayPaymentType(string? apiValue) =>
        NormalizePaymentType(apiValue) switch
        {
            "cash" => "Cash",
            "partial" => "Partial",
            _ => "Credit"
        };

    public static string DisplayPaymentMode(string? apiValue)
    {
        var mode = NormalizePaymentMode(apiValue);
        return string.IsNullOrEmpty(mode)
            ? string.Empty
            : CultureInfo.InvariantCulture.TextInfo.ToTitleCase(mode);
    }

    public static string ResolveStatus(string paymentType) =>
        string.Equals(paymentType, "Cash", StringComparison.OrdinalIgnoreCase) ? "paid" : "open";

    /// <summary>ComboBox-safe mode: credit keeps a placeholder item selected (combo is disabled).</summary>
    public static string UiPaymentMode(string? paymentType, string? paymentMode)
    {
        if (NormalizePaymentType(paymentType) == "credit")
            return InvoicePaymentOptions.DefaultPaymentMode;

        var displayed = DisplayPaymentMode(paymentMode);
        return string.IsNullOrEmpty(displayed)
            ? InvoicePaymentOptions.DefaultPaymentMode
            : displayed;
    }

    public static void ApplyFromDto(string? paymentType, string? paymentMode, Action<string> setType, Action<string> setMode)
    {
        setType(DisplayPaymentType(paymentType));
        setMode(UiPaymentMode(paymentType, paymentMode));
    }

    public static void MapToDto(
        string paymentType,
        string paymentMode,
        string netDisplay,
        string paidAmountDisplay,
        Action<string?> setType,
        Action<string?> setMode,
        Action<string>? setStatus,
        Action<decimal>? setBill,
        Action<decimal>? setPaid,
        Action<decimal>? setBalance)
    {
        var normalizedType = NormalizePaymentType(paymentType);
        var normalizedMode = normalizedType == "credit" ? string.Empty : NormalizePaymentMode(paymentMode);
        setType(normalizedType);
        setMode(normalizedMode);
        setStatus?.Invoke(ResolveStatus(paymentType));

        if (setBill is null || setPaid is null || setBalance is null)
            return;

        var bill = InvoicePaymentSummarySupport.ParseMoney(netDisplay);
        setBill(bill);

        if (string.Equals(paymentType, "Cash", StringComparison.OrdinalIgnoreCase))
        {
            setPaid(bill);
            setBalance(0);
            return;
        }

        if (string.Equals(paymentType, "Partial", StringComparison.OrdinalIgnoreCase))
        {
            var paid = InvoicePaymentSummarySupport.ParseMoney(paidAmountDisplay);
            setPaid(Math.Min(paid, bill));
            setBalance(Math.Max(0, bill - Math.Min(paid, bill)));
            return;
        }

        setPaid(0);
        setBalance(bill);
    }
}
