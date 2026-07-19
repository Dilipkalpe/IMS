using IMS.Models;
using IMS.Reporting.Data;
using IMS.Reporting.Models;

namespace IMS.Reporting.Services;

public sealed class ResolvedReportPrintModel
{
    public required ReportFormatDto Format { get; init; }
    public required ReportLayoutDocument Layout { get; init; }
    public EffectivePageDto? EffectivePage { get; init; }
    public BillFormatPrintSettings PrintSettings { get; init; } = new();
    public string ResolveSource { get; init; } = "default";
}
