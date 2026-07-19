using System.Windows;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;

namespace IMS.ViewModels.SubPages;

public sealed class AddMachineViewModel : FormSubPageViewModel
{
    private readonly MainViewModel _host;
    private readonly bool _isEdit;
    private readonly string _originalCode = string.Empty;

    public AddMachineViewModel(MainViewModel host) : base(
        host,
        parentTitle: "Machine Master",
        pageTitle: "Add Machine",
        pageDescription: "Create a new production machine.",
        iconGlyph: "\uE912",
        fields:
        [
            new("Machine Code *", FormFieldKind.Text, "e.g. MCH-001"),
            new("Machine Name *", FormFieldKind.Text, "e.g. CNC Lathe #1"),
            new("Description", FormFieldKind.Multiline, "Location or purpose"),
            new("Status", FormFieldKind.Combo, options: ["Active", "Inactive"], defaultValue: "Active")
        ])
    {
        _host = host;
        SaveCommand = new AsyncRelayCommand(SaveAsync);
    }

    public AddMachineViewModel(MainViewModel host, MockRow existing) : base(
        host,
        parentTitle: "Machine Master",
        pageTitle: "Edit Machine",
        pageDescription: "Update an existing machine.",
        iconGlyph: "\uE70F",
        fields:
        [
            new("Machine Code *", FormFieldKind.Text, "e.g. MCH-001", existing.Col1),
            new("Machine Name *", FormFieldKind.Text, "e.g. CNC Lathe #1", existing.Col2),
            new("Description", FormFieldKind.Multiline, "Location or purpose", existing.Col3 == "—" ? string.Empty : existing.Col3),
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
        var code = GetFieldValue("Machine Code *");
        var name = GetFieldValue("Machine Name *");
        var description = GetFieldValue("Description");
        var status = GetComboValue("Status");
        var active = !string.Equals(status, "Inactive", StringComparison.OrdinalIgnoreCase);

        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(name))
        {
            MessageBox.Show("Machine code and name are required.", "Validation",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (ImsApiClient.IsAvailable)
        {
            var ok = false;
            await ApiUiHelper.RunWithApiAsync(async () =>
            {
                var dto = ApiDocumentMapper.FromMachineForm(code, name, description, active);
                if (_isEdit)
                    await ImsApiClient.UpdateMachineByCodeAsync(_originalCode, dto);
                else
                    await ImsApiClient.CreateMachineAsync(dto);

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
