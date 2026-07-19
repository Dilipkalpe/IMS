using System.Windows;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;

namespace IMS.ViewModels.SubPages;

public sealed class AddProductTypeViewModel : FormSubPageViewModel
{
    private readonly MainViewModel _host;
    private readonly bool _isEdit;
    private readonly string _originalCode = string.Empty;

    public AddProductTypeViewModel(MainViewModel host) : base(
        host,
        parentTitle: "Product Types",
        pageTitle: "Add Product Type",
        pageDescription: "Create a new product type for classification.",
        iconGlyph: "\uE8FD",
        fields:
        [
            new("Type Code *", FormFieldKind.Text, "e.g. PT-RM"),
            new("Type Name *", FormFieldKind.Text, "e.g. Raw Material"),
            new("Description", FormFieldKind.Multiline, "Purpose of this product type"),
            new("Status", FormFieldKind.Combo, options: ["Active", "Inactive"], defaultValue: "Active")
        ])
    {
        _host = host;
        SaveCommand = new AsyncRelayCommand(SaveAsync);
    }

    public AddProductTypeViewModel(MainViewModel host, MockRow existing) : base(
        host,
        parentTitle: "Product Types",
        pageTitle: "Edit Product Type",
        pageDescription: "Update an existing product type.",
        iconGlyph: "\uE70F",
        fields:
        [
            new("Type Code *", FormFieldKind.Text, "e.g. PT-RM", existing.Col1),
            new("Type Name *", FormFieldKind.Text, "e.g. Raw Material", existing.Col2),
            new("Description", FormFieldKind.Multiline, "Purpose of this product type", existing.Col3 == "—" ? string.Empty : existing.Col3),
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
                var dto = ApiDocumentMapper.FromProductTypeForm(code, name, description, active);
                if (_isEdit)
                    await ImsApiClient.UpdateProductTypeByCodeAsync(_originalCode, dto);
                else
                    await ImsApiClient.CreateProductTypeAsync(dto);

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
