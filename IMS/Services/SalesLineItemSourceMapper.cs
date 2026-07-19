using System.Globalization;
using IMS.Models;
using IMS.Services.Api.Dtos;

namespace IMS.Services;

public static class SalesLineItemSourceMapper
{
    public static void ApplyDeliveryChallanSource(SalesLineItem item, SalesOrderLineDto line)
    {
        item.DcPrefix = line.DcPrefix ?? string.Empty;
        item.DcDocNo = line.DcDocNo;
        item.DcFormattedDocNo = line.DcFormattedDocNo ?? string.Empty;
        item.DcLineSr = line.DcLineSr;
        if (decimal.TryParse(line.DcPendingQty, NumberStyles.Any, CultureInfo.InvariantCulture, out var pending))
            item.MaxDeliverQty = pending;
    }

    public static void ApplyPurchaseOrderSource(SalesLineItem item, SalesOrderLineDto line)
    {
        item.PoPrefix = line.PoPrefix ?? string.Empty;
        item.PoDocNo = line.PoDocNo;
        item.PoFormattedDocNo = line.PoFormattedDocNo ?? string.Empty;
        item.PoLineSr = line.PoLineSr;
        if (decimal.TryParse(line.PoPendingQty, NumberStyles.Any, CultureInfo.InvariantCulture, out var pending))
            item.MaxDeliverQty = pending;
    }

    public static void ApplyGrnSource(SalesLineItem item, SalesOrderLineDto line)
    {
        item.GrnPrefix = line.GrnPrefix ?? string.Empty;
        item.GrnDocNo = line.GrnDocNo;
        item.GrnFormattedDocNo = line.GrnFormattedDocNo ?? string.Empty;
        item.GrnLineSr = line.GrnLineSr;
        if (decimal.TryParse(line.GrnPendingQty, NumberStyles.Any, CultureInfo.InvariantCulture, out var pending))
            item.MaxDeliverQty = pending;
    }

    public static List<NumberedDocReferenceDto> BuildDcReferences(IEnumerable<SalesLineItem> lines) =>
        BuildReferences(lines, l => l.HasDeliveryChallanSource, l => l.DcPrefix, l => l.DcDocNo, l => l.DcFormattedDocNo, "DC");

    public static List<NumberedDocReferenceDto> BuildPoReferences(IEnumerable<SalesLineItem> lines) =>
        BuildReferences(lines, l => l.HasPurchaseOrderSource, l => l.PoPrefix, l => l.PoDocNo, l => l.PoFormattedDocNo, "PO");

    public static List<NumberedDocReferenceDto> BuildGrnReferences(IEnumerable<SalesLineItem> lines) =>
        BuildReferences(lines, l => l.HasGrnSource, l => l.GrnPrefix, l => l.GrnDocNo, l => l.GrnFormattedDocNo, "GRN");

    private static List<NumberedDocReferenceDto> BuildReferences(
        IEnumerable<SalesLineItem> lines,
        Func<SalesLineItem, bool> hasSource,
        Func<SalesLineItem, string> prefix,
        Func<SalesLineItem, int?> docNo,
        Func<SalesLineItem, string> formatted,
        string defaultPrefix) =>
        lines
            .Where(hasSource)
            .Where(l => docNo(l) is int)
            .GroupBy(l => $"{prefix(l)}|{docNo(l)}")
            .Select(g =>
            {
                var first = g.First();
                return new NumberedDocReferenceDto
                {
                    DocPrefix = string.IsNullOrWhiteSpace(prefix(first)) ? defaultPrefix : prefix(first),
                    DocNo = docNo(first)!.Value,
                    FormattedDocNo = formatted(first)
                };
            })
            .ToList();
}
