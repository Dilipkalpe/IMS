using System.Windows;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;

namespace IMS.ViewModels.SubPages;

public sealed class AddCustomerTypeViewModel : FormSubPageViewModel
{
    private readonly MainViewModel _host;
    private readonly bool _isEdit;
    private readonly string _originalCode = string.Empty;

    public AddCustomerTypeViewModel(MainViewModel host) : base(
        host,
        parentTitle: CustomerTypeCatalog.NavTitle,
        pageTitle: "Add Customer Type",
        pageDescription: "Create a customer / account type for use in Account Master.",
        iconGlyph: CustomerTypeCatalog.IconGlyph,
        fields:
        [
            new("Type Code *", FormFieldKind.Text, "e.g. CT-CUS"),
            new("Type Name *", FormFieldKind.Text, "e.g. Customer"),
            new("Description", FormFieldKind.Multiline, "Purpose and usage of this type"),
            new("Status", FormFieldKind.Combo, options: ["Active", "Inactive"], defaultValue: "Active")
        ])
    {
        _host = host;
        SaveCommand = new AsyncRelayCommand(SaveAsync);
    }

    public AddCustomerTypeViewModel(MainViewModel host, MockRow existing) : base(
        host,
        parentTitle: CustomerTypeCatalog.NavTitle,
        pageTitle: "Edit Customer Type",
        pageDescription: "Update an existing customer / account type.",
        iconGlyph: "\uE70F",
        fields:
        [
            new("Type Code *", FormFieldKind.Text, "e.g. CT-CUS", existing.Col1),
            new("Type Name *", FormFieldKind.Text, "e.g. Customer", existing.Col2),
            new("Description", FormFieldKind.Multiline, "Purpose and usage of this type", existing.Col3 == "—" ? string.Empty : existing.Col3),
            new("Status", FormFieldKind.Combo, options: ["Active", "Inactive"], defaultValue: existing.Status ?? "Active")
        ])
    {
        _host = host;
        _isEdit = true;
        _originalCode = existing.Col1;
        SaveCommand = new AsyncRelayCommand(SaveAsync);
    }

    private async Task SaveAsync()
    {
        var code = GetFieldValue("Type Code *");
        var name = GetFieldValue("Type Name *");
        var description = GetFieldValue("Description");
        var status = GetComboValue("Status");
        var active = !string.Equals(status, "Inactive", StringComparison.OrdinalIgnoreCase);

        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(name))
        {
            MessageBox.Show("Type code and name are required.", "Validation",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (ImsApiClient.IsAvailable)
        {
            var ok = false;
            await ApiUiHelper.RunWithApiAsync(async () =>
            {
                var dto = ApiDocumentMapper.FromCustomerTypeForm(code, name, description, active);
                if (_isEdit)
                    await ImsApiClient.UpdateCustomerTypeByCodeAsync(_originalCode, dto);
                else
                    await ImsApiClient.CreateCustomerTypeAsync(dto);

                ok = true;
            });
            if (!ok)
                return;
        }

        _host.GoBack();
    }

    private string GetFieldValue(string label) =>
        Fields.FirstOrDefault(f => f.Label == label)?.Value.Trim() ?? string.Empty;

    private string GetComboValue(string label) =>
        Fields.FirstOrDefault(f => f.Label == label)?.SelectedOption ?? "Active";
}
