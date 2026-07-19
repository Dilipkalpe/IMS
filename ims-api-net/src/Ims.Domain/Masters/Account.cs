using Ims.Domain.Common;

namespace Ims.Domain.Masters;

public sealed class Account : EntityBase, IYearScoped
{
    public string YearDatabaseName { get; set; } = string.Empty;

    public string AccountType { get; set; } = "customer";

    public string Code { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string? ContactPerson { get; set; }

    public string? Address { get; set; }

    public string? City { get; set; }

    public string? State { get; set; }

    public string? Pincode { get; set; }

    public string? Phone { get; set; }

    public string? MobileNo { get; set; }

    public string? Email { get; set; }

    public string? Gstin { get; set; }

    public string? Pan { get; set; }

    public decimal CreditLimit { get; set; }

    public int CreditDays { get; set; }

    public decimal OpeningBalance { get; set; }

    public string OpeningBalanceType { get; set; } = "Dr";

    public string? CustomerType { get; set; }

    public bool ActiveStatus { get; set; } = true;
}
