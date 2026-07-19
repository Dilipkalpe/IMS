using System.Globalization;
using System.Windows;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;

namespace IMS.ViewModels.SubPages;

public sealed class AddSaleUomViewModel : FormSubPageViewModel
{
    private readonly MainViewModel _host;
    private readonly bool _isEdit;
    private readonly string _originalCode = string.Empty;

    public AddSaleUomViewModel(MainViewModel host) : base(
        host,
        parentTitle: "Sale UOM",
        pageTitle: "Add Sale UOM",
        pageDescription: "Create a sale unit of measure.",
        iconGlyph: "\uE7C5",
        fields:
        [
            new("UOM Code *", FormFieldKind.Text, "e.g. UOM-KG"),
            new("UOM Name *", FormFieldKind.Text, "e.g. Kilogram"),
            new("Symbol", FormFieldKind.Text, "e.g. KG"),
            new("Decimal Places", FormFieldKind.Number, "0"),
            new("Status", FormFieldKind.Combo, options: ["Active", "Inactive"], defaultValue: "Active")
        ])
    {
        _host = host;
        SaveCommand = new AsyncRelayCommand(SaveAsync);
    }

    public AddSaleUomViewModel(MainViewModel host, MockRow existing) : base(
        host,
        parentTitle: "Sale UOM",
        pageTitle: "Edit Sale UOM",
        pageDescription: "Update an existing sale unit of measure.",
        iconGlyph: "\uE70F",
        fields:
        [
            new("UOM Code *", FormFieldKind.Text, "e.g. UOM-KG", existing.Col1),
            new("UOM Name *", FormFieldKind.Text, "e.g. Kilogram", existing.Col2),
            new("Symbol", FormFieldKind.Text, "e.g. KG", existing.Col3 == "—" ? string.Empty : existing.Col3),
            new("Decimal Places", FormFieldKind.Number, "0", GetDecimalsFromRow(existing)),
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
        var code = GetFieldValue("UOM Code *");
        var name = GetFieldValue("UOM Name *");
        var symbol = GetFieldValue("Symbol");
        var decimalsText = GetFieldValue("Decimal Places");
        var status = GetComboValue("Status");
        var active = !string.Equals(status, "Inactive", StringComparison.OrdinalIgnoreCase);

        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(name))
        {
            MessageBox.Show("UOM code and name are required.", "Validation",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (!int.TryParse(decimalsText, NumberStyles.Integer, CultureInfo.InvariantCulture, out var decimals) || decimals < 0)
        {
            MessageBox.Show("Decimal places must be a non-negative number.", "Validation",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (ImsApiClient.IsAvailable)
        {
            var ok = false;
            await ApiUiHelper.RunWithApiAsync(async () =>
            {
                var dto = ApiDocumentMapper.FromSaleUomForm(code, name, symbol, decimals, active);
                if (_isEdit)
                    await ImsApiClient.UpdateSaleUomByCodeAsync(_originalCode, dto);
                else
                    await ImsApiClient.CreateSaleUomAsync(dto);

                ok = true;
            });
            if (!ok)
                return;
        }

        _host.GoBack();
    }

    private static string GetDecimalsFromRow(MockRow row)
    {
        if (row.Col4 is { } col4 && int.TryParse(col4, out _))
            return col4;

        return "0";
    }

    private string GetFieldValue(string label) =>
        Fields.FirstOrDefault(f => f.Label == label)?.Value.Trim() ?? string.Empty;

    private string GetComboValue(string label) =>
        Fields.FirstOrDefault(f => f.Label == label)?.SelectedOption ?? "Active";
}
