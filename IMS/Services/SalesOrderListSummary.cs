using System.Globalization;
using IMS.Services.Api.Dtos;

namespace IMS.Services;

public readonly record struct SalesOrderListSummaryResult(
    decimal TotalTaxable,
    decimal TotalCgst,
    decimal TotalSgst,
    decimal TotalIgst,
    decimal TotalDiscount,
    decimal SalesAmount,
    decimal PaidAmount,
    decimal Balance);

public static class SalesOrderListSummary
{
    public static SalesOrderListSummaryResult Compute(SalesOrderDto order)
    {
        if (HasFlatSummary(order))
        {
            return new SalesOrderListSummaryResult(
                order.TotalTaxable,
                order.TotalCgst,
                order.TotalSgst,
                order.TotalIgst,
                order.TotalDiscount,
                order.SalesAmount,
                order.PaidAmount,
                order.Balance);
        }

        return ComputeFromLines(order.Lines, order.Totals);
    }

    public static SalesOrderListSummaryResult Compute(SalesOrderListItemDto item)
    {
        if (HasFlatSummary(item))
        {
            return new SalesOrderListSummaryResult(
                item.TotalTaxable,
                item.TotalCgst,
                item.TotalSgst,
                item.TotalIgst,
                item.TotalDiscount,
                item.SalesAmount,
                item.PaidAmount,
                item.Balance);
        }

        if (item.Lines is { Count: > 0 } || item.Totals is not null)
        {
            return ComputeFromLines(item.Lines ?? [], item.Totals);
        }

        return default;
    }

    private static bool HasFlatSummary(SalesOrderDto dto) =>
        dto.SalesAmount != 0
        || dto.TotalTaxable != 0
        || dto.TotalCgst != 0
        || dto.TotalSgst != 0
        || dto.TotalIgst != 0;

    private static bool HasFlatSummary(SalesOrderListItemDto dto) =>
        dto.SalesAmount != 0
        || dto.TotalTaxable != 0
        || dto.TotalCgst != 0
        || dto.TotalSgst != 0
        || dto.TotalIgst != 0;

    public static SalesOrderListSummaryResult ComputeFromLines(
        IReadOnlyList<SalesOrderLineDto> lines,
        SalesOrderTotalsDto? totals)
    {
        decimal totalTaxable = 0;
        decimal totalCgst = 0;
        decimal totalSgst = 0;
        decimal totalIgst = 0;
        decimal totalDiscount = 0;

        foreach (var line in lines)
        {
            var qty = ParseNum(line.Qty);
            var rate = ParseNum(line.Rate);
            var gross = qty * rate;
            if (gross <= 0)
            {
                var lineAmount = ParseNum(line.Amount);
                if (lineAmount > 0)
                    gross = lineAmount;
            }

            var disc = ParseNum(line.DiscValue);
            var discPct = ParseNum(line.DiscPercent);
            if (disc <= 0 && discPct > 0)
                disc = gross * discPct / 100m;
            totalDiscount += disc;

            var taxable = Math.Max(0, gross - disc);
            totalTaxable += taxable;

            var taxPct = ParseNum(line.TaxPercent);
            var taxAmt = taxable * taxPct / 100m;
            var taxType = (line.TaxType ?? "GST").ToUpperInvariant();
            if (taxType.Contains("IGST", StringComparison.Ordinal))
                totalIgst += taxAmt;
            else
            {
                totalCgst += taxAmt / 2m;
                totalSgst += taxAmt / 2m;
            }
        }

        var saleFromTotals = ParseNum(totals?.SaleAmount);
        if (saleFromTotals == 0)
            saleFromTotals = ParseNum(totals?.OrderAmount);
        if (saleFromTotals == 0)
            saleFromTotals = ParseNum(totals?.Net);
        if (saleFromTotals == 0)
            saleFromTotals = ParseNum(totals?.Gross);

        var saleAmount = RoundMoney(
            saleFromTotals > 0
                ? saleFromTotals
                : totalTaxable + totalCgst + totalSgst + totalIgst);

        var receivable = ParseNum(totals?.ReceivableToCustomer);
        var paidAmount = receivable > 0
            ? RoundMoney(Math.Max(0, saleAmount - receivable))
            : saleAmount;
        var balance = RoundMoney(Math.Max(0, saleAmount - paidAmount));

        return new SalesOrderListSummaryResult(
            RoundMoney(totalTaxable),
            RoundMoney(totalCgst),
            RoundMoney(totalSgst),
            RoundMoney(totalIgst),
            RoundMoney(totalDiscount),
            saleAmount,
            paidAmount,
            balance);
    }

    private static decimal ParseNum(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return 0m;

        if (decimal.TryParse(value, NumberStyles.Number, CultureInfo.InvariantCulture, out var n))
            return n;

        var cleaned = value.Replace(",", string.Empty, StringComparison.Ordinal).Trim();
        return decimal.TryParse(cleaned, NumberStyles.Number, CultureInfo.InvariantCulture, out n) ? n : 0m;
    }

    private static decimal RoundMoney(decimal value) =>
        Math.Round(value, 2, MidpointRounding.AwayFromZero);
}
