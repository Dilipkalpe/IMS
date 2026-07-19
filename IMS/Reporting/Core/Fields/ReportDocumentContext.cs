using IMS.Models;
using IMS.Services.Api.Dtos;

namespace IMS.Reporting.Core.Fields;

public sealed class ReportDocumentContext
{
    public required InvoiceCompanyProfile Company { get; init; }
    public required SalesOrderDto Document { get; init; }
    public required string DocumentTitle { get; init; }
    public required string PartyLabel { get; init; }
    public PartySnapshot Party { get; init; } = new();
    public TotalsSnapshot Totals { get; init; } = new();
    public IReadOnlyList<SalesOrderLineDto> Lines { get; init; } = [];
}

public sealed class PartySnapshot
{
    public string Name { get; init; } = "—";
    public string Details { get; init; } = "—";
}

public sealed class TotalsSnapshot
{
    public string SubTotal { get; init; } = "0.00";
    public string Discount { get; init; } = "0.00";
    public string DiscountLabel { get; init; } = "Discount";
    public string Net { get; init; } = "0.00";
    public string Tax { get; init; } = "0.00";
    public string GrandTotal { get; init; } = "0.00";
    public string Received { get; init; } = "0.00";
    public string Balance { get; init; } = "0.00";
    public string PreviousBalance { get; init; } = "0.00";
    public string CurrentBalance { get; init; } = "0.00";
    public string EarnedPoints { get; init; } = "0";
    public string AvailablePoints { get; init; } = "0";
}
