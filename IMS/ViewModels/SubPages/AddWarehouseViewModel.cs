using System.Windows;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;

namespace IMS.ViewModels.SubPages;

public sealed class AddWarehouseViewModel : FormSubPageViewModel
{
    private readonly MainViewModel _host;
    private readonly bool _isEdit;
    private readonly string _originalCode = string.Empty;

    public AddWarehouseViewModel(MainViewModel host) : base(
        host,
        parentTitle: "Warehouse Master",
        pageTitle: "Add Warehouse",
        pageDescription: "Create a new warehouse or godown.",
        iconGlyph: "\uE7F4",
        fields:
        [
            new("Warehouse Code *", FormFieldKind.Text, "e.g. MAIN"),
            new("Warehouse Name *", FormFieldKind.Text, "e.g. Main Godown"),
            new("Location", FormFieldKind.Text, "e.g. Building A, Ground floor"),
            new("Status", FormFieldKind.Combo, options: ["Active", "Inactive"], defaultValue: "Active")
        ])
    {
        _host = host;
        SaveCommand = new AsyncRelayCommand(SaveAsync);
    }

    public AddWarehouseViewModel(MainViewModel host, MockRow existing) : base(
        host,
        parentTitle: "Warehouse Master",
        pageTitle: "Edit Warehouse",
        pageDescription: "Update an existing warehouse or godown.",
        iconGlyph: "\uE70F",
        fields:
        [
            new("Warehouse Code *", FormFieldKind.Text, "e.g. MAIN", existing.Col1),
            new("Warehouse Name *", FormFieldKind.Text, "e.g. Main Godown", existing.Col2),
            new("Location", FormFieldKind.Text, "e.g. Building A", existing.Col3 == "—" ? string.Empty : existing.Col3),
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
        var code = GetFieldValue("Warehouse Code *");
        var name = GetFieldValue("Warehouse Name *");
        var location = GetFieldValue("Location");
        var status = GetComboValue("Status");
        var active = !string.Equals(status, "Inactive", StringComparison.OrdinalIgnoreCase);

        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(name))
        {
            MessageBox.Show("Warehouse code and name are required.", "Validation",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (ImsApiClient.IsAvailable)
        {
            var ok = false;
            await ApiUiHelper.RunWithApiAsync(async () =>
            {
                var dto = ApiDocumentMapper.FromWarehouseForm(code, name, location, active);
                if (_isEdit)
                    await ImsApiClient.UpdateWarehouseByCodeAsync(_originalCode, dto);
                else
                    await ImsApiClient.CreateWarehouseAsync(dto);

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
