namespace IMS.Services;

/// <summary>Crystal Reports–style report bands mapped to bill section types.</summary>
public static class BillFormatBands
{
    public static IReadOnlyList<BillFormatBandDefinition> All { get; } =
    [
        new("reportHeader", "a. Report Header", "#5c6b7a", ["header", "companyLogo", "companyDetails"]),
        new("pageHeader", "b. Page Header", "#6b7c8f", ["customerDetails", "supplierDetails"]),
        new("details", "c. Details", "#2d6a9f", ["itemTable"]),
        new("reportFooter", "d. Report Footer", "#5c6b7a", ["taxDetails", "termsAndConditions", "footer"]),
        new("pageFooter", "e. Page Footer", "#6b7c8f", ["field"])
    ];

    public static string GetBandKeyForSectionType(string sectionType)
    {
        foreach (var band in All)
        {
            if (band.SectionTypes.Contains(sectionType, StringComparer.OrdinalIgnoreCase))
                return band.Key;
        }

        return sectionType.Equals("field", StringComparison.OrdinalIgnoreCase)
            ? "pageFooter"
            : "reportHeader";
    }
}

public sealed record BillFormatBandDefinition(
    string Key,
    string Title,
    string HeaderColor,
    IReadOnlyList<string> SectionTypes);
