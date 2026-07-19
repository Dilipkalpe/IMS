using System.Windows;
using System.Windows.Input;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;

namespace IMS.ViewModels.SubPages;

public sealed class AddCompanyRegistrationViewModel : FormSubPageViewModel
{
    private readonly MainViewModel _host;
    private readonly bool _isEdit;
    private readonly string _originalCode = string.Empty;

    public AddCompanyRegistrationViewModel(MainViewModel host) : base(
        host,
        parentTitle: CompanyCatalog.NavTitle,
        pageTitle: "Register Company",
        pageDescription: "Register business details used on tax invoices and sales documents.",
        iconGlyph: CompanyCatalog.IconGlyph,
        fields: CreateFields())
    {
        _host = host;
        SaveCommand = new AsyncRelayCommand(SaveAsync);
    }

    public AddCompanyRegistrationViewModel(MainViewModel host, MockRow existing) : base(
        host,
        parentTitle: CompanyCatalog.NavTitle,
        pageTitle: "Edit Company",
        pageDescription: "Update registered company details.",
        iconGlyph: "\uE70F",
        fields: CreateFields(existing))
    {
        _host = host;
        _isEdit = true;
        _originalCode = existing.Col1;
        SaveCommand = new AsyncRelayCommand(SaveAsync);
        _ = LoadCompanyAsync(existing.Col1);
    }

    public FormFieldViewModel? LogoImageField => Fields.FirstOrDefault(f => f.Kind == FormFieldKind.Image);

    private static IEnumerable<FormFieldViewModel> CreateFields(MockRow? existing = null)
    {
        yield return new("Company Code *", FormFieldKind.Text, "e.g. RAJ", existing?.Col1);
        yield return new("Business Name *", FormFieldKind.Text, "e.g. RAJ CLOTH CENTER", existing?.Col2);
        yield return new("GSTIN", FormFieldKind.Text, "e.g. 27ARDPP7668M1ZX", existing?.Col3 == "—" ? string.Empty : existing?.Col3);
        yield return new("Phone", FormFieldKind.Text, "e.g. 8421802210");
        yield return new("Email", FormFieldKind.Text, "company@email.com");
        yield return new("State", FormFieldKind.Text, "e.g. 27-Maharashtra");
        yield return new("Place of Supply", FormFieldKind.Text, "e.g. 27-Maharashtra");
        yield return new("Logo Text", FormFieldKind.Text, "Fallback text when no logo image is set");
        yield return new("Company Logo", FormFieldKind.Image, "PNG/JPG — shown on main screen and print formats");
        yield return new("Address", FormFieldKind.Multiline, "Full business address");
        yield return new("Bank Name", FormFieldKind.Text, "e.g. IDBI BANK");
        yield return new("Account No.", FormFieldKind.Text, "Bank account number");
        yield return new("IFSC Code", FormFieldKind.Text, "e.g. IBKL0001357");
        yield return new("Account Holder", FormFieldKind.Text, "Account holder name");
        yield return new("Terms & Conditions", FormFieldKind.Multiline,
            "One term per line (shown on invoice footer)");
        yield return new("Default Company", FormFieldKind.Combo, options: ["Yes", "No"],
            defaultValue: existing?.Col4 == "Yes" ? "Yes" : "No");
        yield return new("Status", FormFieldKind.Combo, options: ["Active", "Inactive"],
            defaultValue: existing?.Status ?? "Active");
    }

    private async Task LoadCompanyAsync(string code)
    {
        if (!ImsApiClient.IsAvailable)
            return;

        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            var company = await ImsApiClient.GetCompanyByCodeAsync(code);
            if (company is null)
                return;

            SetFieldValue("Company Code *", company.Code);
            SetFieldValue("Business Name *", company.BusinessName);
            SetFieldValue("GSTIN", company.Gstin ?? string.Empty);
            SetFieldValue("Phone", company.Phone ?? string.Empty);
            SetFieldValue("Email", company.Email ?? string.Empty);
            SetFieldValue("State", company.State ?? string.Empty);
            SetFieldValue("Place of Supply", company.PlaceOfSupply ?? string.Empty);
            SetFieldValue("Logo Text", company.LogoText ?? string.Empty);
            SetFieldValue("Company Logo", company.LogoImage ?? string.Empty);
            SetFieldValue("Address", company.Address ?? string.Empty);
            SetFieldValue("Bank Name", company.BankName ?? string.Empty);
            SetFieldValue("Account No.", company.BankAccountNo ?? string.Empty);
            SetFieldValue("IFSC Code", company.BankIfsc ?? string.Empty);
            SetFieldValue("Account Holder", company.BankAccountHolder ?? string.Empty);
            SetFieldValue("Terms & Conditions", string.Join(Environment.NewLine, company.Terms));
            SetComboValue("Default Company", company.IsDefault ? "Yes" : "No");
            SetComboValue("Status", company.ActiveStatus ? "Active" : "Inactive");
        });
    }

    private async Task SaveAsync()
    {
        var code = GetFieldValue("Company Code *");
        var businessName = GetFieldValue("Business Name *");

        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(businessName))
        {
            MessageBox.Show("Company code and business name are required.", "Validation",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        var terms = GetFieldValue("Terms & Conditions")
            .Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        var dto = ApiDocumentMapper.FromCompanyForm(
            code,
            businessName,
            GetFieldValue("Address"),
            GetFieldValue("Phone"),
            GetFieldValue("Email"),
            GetFieldValue("GSTIN"),
            GetFieldValue("State"),
            GetFieldValue("Place of Supply"),
            GetFieldValue("Bank Name"),
            GetFieldValue("Account No."),
            GetFieldValue("IFSC Code"),
            GetFieldValue("Account Holder"),
            GetFieldValue("Logo Text"),
            GetFieldValue("Company Logo"),
            terms,
            string.Equals(GetComboValue("Default Company"), "Yes", StringComparison.OrdinalIgnoreCase),
            !string.Equals(GetComboValue("Status"), "Inactive", StringComparison.OrdinalIgnoreCase));

        if (ImsApiClient.IsAvailable)
        {
            var ok = false;
            await ApiUiHelper.RunWithApiAsync(async () =>
            {
                if (_isEdit)
                    await ImsApiClient.UpdateCompanyByCodeAsync(_originalCode, dto);
                else
                    await ImsApiClient.CreateCompanyAsync(dto);

                await CompanyProfileService.RefreshAsync();
                _host.RefreshCompanyBranding();
                ok = true;
            });
            if (!ok)
                return;
        }

        _host.GoBack();
    }

    protected override void OnBrowseField(FormFieldViewModel field)
    {
        if (field.Kind != FormFieldKind.Image)
            return;

        if (!CompanyLogoHelper.TryPickImageFromFile(out var dataUri, out var fileName))
            return;

        field.Value = dataUri;
        field.ValidationMessage = string.IsNullOrWhiteSpace(fileName) ? null : $"Selected: {fileName}";
    }

    private string GetFieldValue(string label) =>
        Fields.FirstOrDefault(f => f.Label == label)?.Value.Trim() ?? string.Empty;

    private string GetComboValue(string label) =>
        Fields.FirstOrDefault(f => f.Label == label)?.SelectedOption ?? string.Empty;

    private void SetFieldValue(string label, string value)
    {
        var field = Fields.FirstOrDefault(f => f.Label == label);
        if (field is not null)
            field.Value = value;
    }

    private void SetComboValue(string label, string value)
    {
        var field = Fields.FirstOrDefault(f => f.Label == label);
        if (field is not null)
            field.SelectedOption = value;
    }
}
