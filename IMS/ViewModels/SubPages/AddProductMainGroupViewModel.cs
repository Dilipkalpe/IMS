using System.Windows;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;

namespace IMS.ViewModels.SubPages;

public sealed class AddProductMainGroupViewModel : FormSubPageViewModel
{
    private readonly MainViewModel _host;
    private readonly bool _isEdit;
    private readonly string _originalCode = string.Empty;

    public AddProductMainGroupViewModel(MainViewModel host) : base(
        host,
        parentTitle: "Main Groups",
        pageTitle: "Add Main Group",
        pageDescription: "Create a new top-level product classification group.",
        iconGlyph: "\uE8B7",
        fields:
        [
            new("Group Code *", FormFieldKind.Text, "e.g. MG-MTL"),
            new("Group Name *", FormFieldKind.Text, "e.g. Metals"),
            new("Description", FormFieldKind.Multiline, "Group description"),
            new("Status", FormFieldKind.Combo, options: ["Active", "Inactive"], defaultValue: "Active")
        ])
    {
        _host = host;
        SaveCommand = new AsyncRelayCommand(SaveAsync);
    }

    public AddProductMainGroupViewModel(MainViewModel host, MockRow existing) : base(
        host,
        parentTitle: "Main Groups",
        pageTitle: "Edit Main Group",
        pageDescription: "Update an existing product main group.",
        iconGlyph: "\uE70F",
        fields:
        [
            new("Group Code *", FormFieldKind.Text, "e.g. MG-MTL", existing.Col1),
            new("Group Name *", FormFieldKind.Text, "e.g. Metals", existing.Col2),
            new("Description", FormFieldKind.Multiline, "Group description", existing.Col3 == "—" ? string.Empty : existing.Col3),
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
        var code = GetFieldValue("Group Code *");
        var name = GetFieldValue("Group Name *");
        var description = GetFieldValue("Description");
        var status = GetComboValue("Status");
        var active = !string.Equals(status, "Inactive", StringComparison.OrdinalIgnoreCase);

        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(name))
        {
            MessageBox.Show("Group code and name are required.", "Validation",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (ImsApiClient.IsAvailable)
        {
            var ok = false;
            await ApiUiHelper.RunWithApiAsync(async () =>
            {
                var dto = ApiDocumentMapper.FromProductMainGroupForm(code, name, description, active);
                if (_isEdit)
                    await ImsApiClient.UpdateProductMainGroupByCodeAsync(_originalCode, dto);
                else
                    await ImsApiClient.CreateProductMainGroupAsync(dto);

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
