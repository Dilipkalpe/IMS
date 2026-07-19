namespace Ims.Domain.Config;

public sealed class FinancialYear
{
    public string Id { get; set; } = Common.ObjectIdGenerator.NewId();

    public string FinancialYearName { get; set; } = string.Empty;

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public string DatabaseName { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public bool Closed { get; set; }

    public string? PreviousYearId { get; set; }

    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

    public string? CreatedBy { get; set; }
}
