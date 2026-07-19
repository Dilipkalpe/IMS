namespace IMS.Services;

/// <summary>One-shot filters when opening stock reports after production save.</summary>
public static class StockReportNavigationContext
{
    public static DateTime? PendingDateFrom { get; set; }
    public static DateTime? PendingDateTo { get; set; }
    public static string? PendingProductCode { get; set; }
    public static string? PendingMovementType { get; set; }

    public static void SetAfterProduction(DateTime productionDate, string? productCode)
    {
        PendingDateFrom = productionDate.Date;
        PendingDateTo = productionDate.Date;
        PendingProductCode = productCode?.Trim();
        PendingMovementType = "All";
    }

    public static bool TryConsume(out DateTime? from, out DateTime? to, out string? productCode, out string? movementType)
    {
        if (PendingDateFrom is null && PendingDateTo is null && string.IsNullOrWhiteSpace(PendingProductCode))
        {
            from = null;
            to = null;
            productCode = null;
            movementType = null;
            return false;
        }

        from = PendingDateFrom;
        to = PendingDateTo;
        productCode = PendingProductCode;
        movementType = PendingMovementType;
        PendingDateFrom = null;
        PendingDateTo = null;
        PendingProductCode = null;
        PendingMovementType = null;
        return true;
    }
}
