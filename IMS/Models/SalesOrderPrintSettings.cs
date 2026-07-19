namespace IMS.Models;

public sealed class SalesOrderPrintSettings
{
    public PrintPaperFormat PaperFormat { get; set; } = PrintPaperFormat.A4;
    public double CustomWidthMm { get; set; } = 210;
    public double CustomHeightMm { get; set; } = 148;
    public double MarginMm { get; set; } = 10;
}
