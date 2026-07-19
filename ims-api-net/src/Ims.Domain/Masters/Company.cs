using Ims.Domain.Common;

namespace Ims.Domain.Masters;

public sealed class Company : EntityBase, IYearScoped
{
    public string YearDatabaseName { get; set; } = string.Empty;

    public string Code { get; set; } = string.Empty;

    public string BusinessName { get; set; } = string.Empty;

    public string? Tagline { get; set; }

    public string? Address { get; set; }

    public string? Phone { get; set; }

    public string? Email { get; set; }

    public string? Gstin { get; set; }

    public string? State { get; set; }

    public string? PlaceOfSupply { get; set; }

    public string? LogoText { get; set; }

    public string? LogoImage { get; set; }

    public bool IsDefault { get; set; }

    public bool ActiveStatus { get; set; } = true;
}
