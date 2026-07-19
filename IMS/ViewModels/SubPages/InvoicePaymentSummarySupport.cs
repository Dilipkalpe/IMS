using System.Globalization;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels.SubPages;

internal static class InvoicePaymentSummarySupport
{
    public static decimal ParseMoney(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return 0m;

        if (decimal.TryParse(value, NumberStyles.Number, CultureInfo.CurrentCulture, out var amount))
            return amount;

        return decimal.TryParse(value, NumberStyles.Number, CultureInfo.InvariantCulture, out amount)
            ? amount
            : 0m;
    }

    public static string FormatMoney(decimal value) =>
        value.ToString("N2", CultureInfo.CurrentCulture);

    public static string PaymentModeToCashBank(string? paymentMode) =>
        paymentMode is "Bank" or "UPI" or "Cheque" or "Card" ? "BANK" : "CASH";

    public static void ApplyAmountsFromDto(
        NumberedSalesDocumentDto dto,
        Action<string> setBill,
        Action<string> setPaid,
        Action<string> setBalance)
    {
        var bill = dto.BillAmount > 0 ? dto.BillAmount : ParseMoney(dto.Totals?.Net);
        var paid = dto.PaidAmount;
        var balance = dto.BalanceDue > 0 ? dto.BalanceDue : Math.Max(0, bill - paid);
        setBill(FormatMoney(bill));
        setPaid(FormatMoney(paid));
        setBalance(FormatMoney(balance));
    }

    public static void ApplyAmountsFromDto(
        NumberedPurchaseDocumentDto dto,
        Action<string> setBill,
        Action<string> setPaid,
        Action<string> setBalance)
    {
        var bill = dto.BillAmount > 0 ? dto.BillAmount : ParseMoney(dto.Totals?.Net);
        var paid = dto.PaidAmount;
        var balance = dto.BalanceDue > 0 ? dto.BalanceDue : Math.Max(0, bill - paid);
        setBill(FormatMoney(bill));
        setPaid(FormatMoney(paid));
        setBalance(FormatMoney(balance));
    }

    public static void MapAmountsToDto(
        string netDisplay,
        string paymentType,
        Action<decimal> setBill,
        Action<decimal> setPaid,
        Action<decimal> setBalance)
    {
        var bill = ParseMoney(netDisplay);
        setBill(bill);

        if (string.Equals(paymentType, "Cash", StringComparison.OrdinalIgnoreCase))
        {
            setPaid(bill);
            setBalance(0);
            return;
        }

        setPaid(0);
        setBalance(bill);
    }
}
