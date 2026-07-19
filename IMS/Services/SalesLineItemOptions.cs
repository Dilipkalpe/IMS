namespace IMS.Services;

public static class SalesLineItemOptions
{
    public static IReadOnlyList<string> Qty { get; } = ["1", "2", "3", "5", "10", "12", "24", "48", "100"];
    public static IReadOnlyList<string> Rate { get; } = ["0.00", "12.50", "85.00", "150.00", "320.00", "472.00", "840.00", "2450.00"];
    public static IReadOnlyList<string> DiscPercent { get; } = ["0", "2", "5", "10", "15", "20"];
    public static IReadOnlyList<string> DiscValue { get; } = ["0.00", "16.00", "42.00", "100.00", "200.00"];
    public static IReadOnlyList<string> TaxType { get; } = ["GST", "IGST", "CGST+SGST", "Exempt"];
    public static IReadOnlyList<string> TaxPercent { get; } = ["0", "5", "12", "18", "28"];
}
