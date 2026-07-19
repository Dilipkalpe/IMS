using IMS.Models;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.Services;

public static class CompanyProfileService
{
    public static InvoiceCompanyProfile Current { get; private set; } = InvoiceCompanyProfile.Default;

    public static async Task RefreshAsync()
    {
        if (!ImsApiClient.IsAvailable)
            return;

        try
        {
            var company = await ImsApiClient.GetDefaultCompanyAsync();
            if (company is not null)
                Current = ToProfile(company);
        }
        catch
        {
            // Keep last known or built-in default.
        }
    }

    public static InvoiceCompanyProfile ToProfile(CompanyDto dto) =>
        new()
        {
            BusinessName = dto.BusinessName,
            Address = dto.Address ?? string.Empty,
            Phone = dto.Phone ?? string.Empty,
            Gstin = dto.Gstin ?? string.Empty,
            State = dto.State ?? string.Empty,
            PlaceOfSupply = dto.PlaceOfSupply ?? dto.State ?? string.Empty,
            BankName = dto.BankName ?? string.Empty,
            BankAccountNo = dto.BankAccountNo ?? string.Empty,
            BankIfsc = dto.BankIfsc ?? string.Empty,
            BankAccountHolder = dto.BankAccountHolder ?? string.Empty,
            LogoText = string.IsNullOrWhiteSpace(dto.LogoText) ? "Raj" : dto.LogoText.Trim(),
            LogoImage = dto.LogoImage?.Trim() ?? string.Empty,
            Terms = dto.Terms.Count > 0
                ? dto.Terms.ToArray()
                : InvoiceCompanyProfile.Default.Terms
        };
}
