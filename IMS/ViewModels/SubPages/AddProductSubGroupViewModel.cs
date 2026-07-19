using System.Windows;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;

namespace IMS.ViewModels.SubPages;

public sealed class AddProductSubGroupViewModel : FormSubPageViewModel
{
    private readonly MainViewModel _host;
    private readonly bool _isEdit;
    private readonly string _originalCode = string.Empty;

    public AddProductSubGroupViewModel(MainViewModel host) : base(
        host,
        parentTitle: "Sub Groups",
        pageTitle: "Add Sub Group",
        pageDescription: "Create a new product sub group and link it to a main group.",
        iconGlyph: "\uE8B7",
        fields:
        [
            new("Sub Group Code *", FormFieldKind.Text, "e.g. SG-SHT"),
            new("Sub Group Name *", FormFieldKind.Text, "e.g. Sheet"),
            new("Main Group *", FormFieldKind.Combo, options: ClassificationMasterCatalog.MainGroupNames.ToList()),
            new("Status", FormFieldKind.Combo, options: ["Active", "Inactive"], defaultValue: "Active")
        ])
    {
        _host = host;
        SaveCommand = new AsyncRelayCommand(SaveAsync);
    }

    public AddProductSubGroupViewModel(MainViewModel host, MockRow existing) : base(
        host,
        parentTitle: "Sub Groups",
        pageTitle: "Edit Sub Group",
        pageDescription: "Update an existing product sub group.",
        iconGlyph: "\uE70F",
        fields:
        [
            new("Sub Group Code *", FormFieldKind.Text, "e.g. SG-SHT", existing.Col1),
            new("Sub Group Name *", FormFieldKind.Text, "e.g. Sheet", existing.Col2),
            new("Main Group *", FormFieldKind.Combo, options: ClassificationMasterCatalog.MainGroupNames.ToList(), defaultValue: existing.Col3),
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
        var code = GetFieldValue("Sub Group Code *");
        var name = GetFieldValue("Sub Group Name *");
        var mainGroup = GetComboValue("Main Group *");
        var status = GetComboValue("Status");
        var active = !string.Equals(status, "Inactive", StringComparison.OrdinalIgnoreCase);

        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(name))
        {
            MessageBox.Show("Sub group code and name are required.", "Validation",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (string.IsNullOrWhiteSpace(mainGroup))
        {
            MessageBox.Show("Please select a Main Group.", "Validation",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (ImsApiClient.IsAvailable)
        {
            var ok = false;
            await ApiUiHelper.RunWithApiAsync(async () =>
            {
                var dto = ApiDocumentMapper.FromProductSubGroupForm(code, name, mainGroup, active);
                if (_isEdit)
                    await ImsApiClient.UpdateProductSubGroupByCodeAsync(_originalCode, dto);
                else
                    await ImsApiClient.CreateProductSubGroupAsync(dto);

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
        Fields.FirstOrDefault(f => f.Label == label)?.SelectedOption ?? string.Empty;
}
