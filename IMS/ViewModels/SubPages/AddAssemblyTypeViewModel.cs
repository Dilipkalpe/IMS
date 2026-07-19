using System.Windows;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;

namespace IMS.ViewModels.SubPages;

public sealed class AddAssemblyTypeViewModel : FormSubPageViewModel
{
    private readonly MainViewModel _host;
    private readonly bool _isEdit;
    private readonly string _originalCode = string.Empty;

    public AddAssemblyTypeViewModel(MainViewModel host) : base(
        host,
        parentTitle: "Assembly Types",
        pageTitle: "Add Assembly Type",
        pageDescription: "Create a new assembly type for BOM and production.",
        iconGlyph: "\uE8F1",
        fields:
        [
            new("Assembly Code *", FormFieldKind.Text, "e.g. AT-SUB"),
            new("Assembly Type *", FormFieldKind.Text, "e.g. Sub-Assembly"),
            new("Description", FormFieldKind.Multiline, "Purpose of this assembly type"),
            new("Status", FormFieldKind.Combo, options: ["Active", "Inactive"], defaultValue: "Active")
        ])
    {
        _host = host;
        SaveCommand = new AsyncRelayCommand(SaveAsync);
    }

    public AddAssemblyTypeViewModel(MainViewModel host, MockRow existing) : base(
        host,
        parentTitle: "Assembly Types",
        pageTitle: "Edit Assembly Type",
        pageDescription: "Update an existing assembly type.",
        iconGlyph: "\uE70F",
        fields:
        [
            new("Assembly Code *", FormFieldKind.Text, "e.g. AT-SUB", existing.Col1),
            new("Assembly Type *", FormFieldKind.Text, "e.g. Sub-Assembly", existing.Col2),
            new("Description", FormFieldKind.Multiline, "Purpose of this assembly type", existing.Col3 == "—" ? string.Empty : existing.Col3),
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
        var code = GetFieldValue("Assembly Code *");
        var name = GetFieldValue("Assembly Type *");
        var description = GetFieldValue("Description");
        var status = GetComboValue("Status");
        var active = !string.Equals(status, "Inactive", StringComparison.OrdinalIgnoreCase);

        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(name))
        {
            MessageBox.Show("Assembly code and type name are required.", "Validation",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (ImsApiClient.IsAvailable)
        {
            var ok = false;
            await ApiUiHelper.RunWithApiAsync(async () =>
            {
                var dto = ApiDocumentMapper.FromAssemblyTypeForm(code, name, description, active);
                if (_isEdit)
                    await ImsApiClient.UpdateAssemblyTypeByCodeAsync(_originalCode, dto);
                else
                    await ImsApiClient.CreateAssemblyTypeAsync(dto);

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
