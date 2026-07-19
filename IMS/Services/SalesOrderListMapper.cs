using System.Globalization;
using IMS.Models;
using IMS.Services.Api.Dtos;

namespace IMS.Services;

public static class SalesOrderListMapper
{
    public static SalesOrderListRow ToRow(SalesOrderDto dto, int serialNo) =>
        ToRow(SalesOrderListSummary.Compute(dto), dto, serialNo);

    public static SalesOrderListRow ToRow(SalesOrderListItemDto dto, int serialNo) =>
        ToRow(SalesOrderListSummary.Compute(dto), dto, serialNo);

    private static SalesOrderListRow ToRow(
        SalesOrderListSummaryResult summary,
        SalesOrderDto dto,
        int serialNo) =>
        new()
        {
            SerialNo = serialNo,
            Id = dto.ResolvedId,
            SoNo = dto.FormattedDocNo,
            SoDate = FormatSoDate(dto.SoDate, dto.BillDate),
            Customer = string.IsNullOrWhiteSpace(dto.Customer) ? "—" : dto.Customer.Trim(),
            TotalTaxable = summary.TotalTaxable,
            TotalCgst = summary.TotalCgst,
            TotalSgst = summary.TotalSgst,
            TotalIgst = summary.TotalIgst,
            TotalDiscount = summary.TotalDiscount,
            SalesAmount = summary.SalesAmount,
            PaidAmount = summary.PaidAmount,
            Balance = summary.Balance,
            Status = CapitalizeStatus(dto.Status)
        };

    private static SalesOrderListRow ToRow(
        SalesOrderListSummaryResult summary,
        SalesOrderListItemDto dto,
        int serialNo) =>
        new()
        {
            SerialNo = serialNo,
            Id = dto.ResolvedId,
            SoNo = dto.FormattedDocNo,
            SoDate = FormatSoDate(dto.SoDate, dto.BillDate),
            Customer = string.IsNullOrWhiteSpace(dto.Customer) ? "—" : dto.Customer.Trim(),
            TotalTaxable = summary.TotalTaxable,
            TotalCgst = summary.TotalCgst,
            TotalSgst = summary.TotalSgst,
            TotalIgst = summary.TotalIgst,
            TotalDiscount = summary.TotalDiscount,
            SalesAmount = summary.SalesAmount,
            PaidAmount = summary.PaidAmount,
            Balance = summary.Balance,
            Status = CapitalizeStatus(dto.Status)
        };

    public static string FormatSoDate(DateTime? soDate, string? billDate)
    {
        if (soDate is { } d)
            return d.ToString("dd-MM-yyyy", CultureInfo.InvariantCulture);

        if (string.IsNullOrWhiteSpace(billDate))
            return "—";

        var text = billDate.Trim();
        if (DateTime.TryParseExact(text, "dd/MM/yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
            return parsed.ToString("dd-MM-yyyy", CultureInfo.InvariantCulture);

        return text;
    }

    private static string CapitalizeStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
            return "Open";
        var s = status.Trim();
        return char.ToUpperInvariant(s[0]) + s[1..].ToLowerInvariant();
    }
}
