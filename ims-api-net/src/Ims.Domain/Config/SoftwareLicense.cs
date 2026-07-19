namespace Ims.Domain.Config;

public sealed class SoftwareLicense
{
    public string Id { get; set; } = Common.ObjectIdGenerator.NewId();

    public string Key { get; set; } = string.Empty;

    public string LicenseType { get; set; } = "trial";

    public int? PlanDays { get; set; }

    public DateTime? ActivatedAt { get; set; }

    public DateTime? ExpiresAt { get; set; }

    public List<LicenseExtension> Extensions { get; set; } = [];

    public int TotalExtensionDays { get; set; }
}

public sealed class LicenseExtension
{
    public DateTime ExtendedAt { get; set; }

    public int Days { get; set; }

    public string? Reason { get; set; }
}
