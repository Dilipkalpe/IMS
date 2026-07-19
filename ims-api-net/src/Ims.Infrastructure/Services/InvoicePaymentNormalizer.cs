using System.Globalization;

namespace Ims.Infrastructure.Services;

public static class InvoicePaymentNormalizer
{
    public static void Normalize(Dictionary<string, object?> payload)
    {
        var totals = payload.GetValueOrDefault("totals") as Dictionary<string, object?>;
        var net = ParseMoney(totals?.GetValueOrDefault("net") ?? totals?.GetValueOrDefault("saleAmount") ?? payload.GetValueOrDefault("billAmount"));
        payload["billAmount"] = net;

        var type = (payload.GetValueOrDefault("paymentType")?.ToString() ?? "credit").ToLowerInvariant();
        var paid = ParseMoney(payload.GetValueOrDefault("paidAmount"));

        if (type == "cash")
            paid = net;

        paid = Math.Min(Math.Max(0, paid), net);
        var balance = Math.Max(0, net - paid);

        payload["paidAmount"] = paid;
        payload["balanceDue"] = balance;

        if (net > 0 && balance <= 0.001m)
            payload["status"] = "paid";
        else if (paid > 0 && string.Equals(payload.GetValueOrDefault("status")?.ToString(), "paid", StringComparison.OrdinalIgnoreCase))
            payload["status"] = "open";
    }

    private static decimal ParseMoney(object? value)
    {
        var s = (value?.ToString() ?? "0").Replace(",", "");
        return decimal.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var n) ? n : 0;
    }
}
