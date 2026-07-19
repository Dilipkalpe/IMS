using System.Windows;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;
using IMS.ViewModels;

namespace IMS.ViewModels.SubPages;

public sealed class AddBillFormatViewModel : FormSubPageViewModel
{
    private static readonly (string Label, string Key)[] TransactionOptions =
    [
        ("Sales Invoice", "sales_invoice"),
        ("Sales Order", "sales_order"),
        ("Sales Return", "sales_return"),
        ("Delivery Challan", "delivery_challan"),
        ("Purchase Invoice", "purchase_invoice"),
        ("Purchase Order", "purchase_order"),
        ("Purchase Return", "purchase_return"),
        ("GRN", "grn")
    ];

    private static readonly string[] TransactionLabels = TransactionOptions.Select(t => t.Label).ToArray();

    private readonly MainViewModel _host;
    private readonly bool _isEdit;
    private readonly string? _templateId;

    public AddBillFormatViewModel(MainViewModel host) : base(
        host,
        parentTitle: "Bill Format Master",
        pageTitle: "Add Bill Format",
        pageDescription: "Create a new print layout. Then use Print layout on the list to set sections and columns.",
        iconGlyph: "\uE8A5",
        fields: CreateFields())
    {
        _host = host;
        SaveCommand = new AsyncRelayCommand(SaveAsync);
    }

    public AddBillFormatViewModel(MainViewModel host, MockRow existing) : base(
        host,
        parentTitle: "Bill Format Master",
        pageTitle: "Edit Bill Format",
        pageDescription: "Update format name and type. Use Print layout on the list to change sections and columns.",
        iconGlyph: "\uE70F",
        fields: CreateFields(existing))
    {
        _host = host;
        _isEdit = true;
        _templateId = (existing.Source as SalesBillTemplateDto)?.Id;
        SaveCommand = new AsyncRelayCommand(SaveAsync);
    }

    private static IEnumerable<FormFieldViewModel> CreateFields(MockRow? existing = null)
    {
        var dto = existing?.Source as SalesBillTemplateDto;
        var txLabel = LabelForKey(dto?.TransactionType ?? "sales_invoice");
        return
        [
            new("Format Code *", FormFieldKind.Text, "e.g. SI_STD", existing?.Col1 ?? string.Empty),
            new("Format Name *", FormFieldKind.Text, "e.g. Standard Sales Invoice", existing?.Col2 ?? string.Empty),
            new("Document Type *", FormFieldKind.Combo, options: TransactionLabels, defaultValue: txLabel),
            new("Notes", FormFieldKind.Multiline, "Optional description", dto?.Description ?? string.Empty),
            new("Status", FormFieldKind.Combo, options: ["Active", "Inactive"],
                defaultValue: string.Equals(existing?.Status, "Inactive", StringComparison.OrdinalIgnoreCase)
                    ? "Inactive"
                    : "Active"),
            new("Default for document type", FormFieldKind.Boolean, defaultValue: dto?.IsDefault == true ? "True" : "False")
        ];
    }

    private async Task SaveAsync()
    {
        var code = GetFieldValue("Format Code *");
        var name = GetFieldValue("Format Name *");
        var txLabel = GetComboValue("Document Type *");
        var description = GetFieldValue("Notes");
        var active = !string.Equals(GetComboValue("Status"), "Inactive", StringComparison.OrdinalIgnoreCase);
        var isDefault = GetBooleanValue("Default for document type");
        var txKey = KeyForLabel(txLabel);

        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(name))
        {
            MessageBox.Show("Format code and name are required.", "Validation",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (!AuthSession.IsAdministrator)
        {
            MessageBox.Show("Administrator login is required to manage bill formats.", "Bill Format",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (ImsApiClient.IsAvailable)
        {
            var ok = false;
            await ApiUiHelper.RunWithApiAsync(async () =>
            {
                if (_isEdit && !string.IsNullOrWhiteSpace(_templateId))
                {
                    await ImsApiClient.UpdateSalesBillTemplateAsync(
                        _templateId,
                        new SalesBillTemplateUpdateRequest
                        {
                            FormatCode = code.Trim().ToUpperInvariant(),
                            TransactionType = txKey,
                            Name = name.Trim(),
                            Description = description,
                            IsActive = active,
                            IsDefault = isDefault ? true : null,
                            AppliesToDocTypes = [txKey]
                        });
                }
                else
                {
                    await ImsApiClient.EnsureSalesBillTemplateDefaultsAsync();
                    var catalog = await ImsApiClient.GetBillFormatCatalogAsync();
                    var title = catalog?.TransactionTypes
                        .FirstOrDefault(t => t.Key == txKey)?.DefaultTitle ?? "DOCUMENT";
                    var layout = BillFormatLayoutBootstrap.CreateForTransaction(catalog, txKey, title);
                    var templateKey = $"fmt_{code.Trim().ToLowerInvariant().Replace(" ", "_")}";
                    await ImsApiClient.CreateSalesBillTemplateAsync(new SalesBillTemplateCreateRequest
                    {
                        TemplateKey = templateKey,
                        FormatCode = code.Trim().ToUpperInvariant(),
                        TransactionType = txKey,
                        Name = name.Trim(),
                        Description = description,
                        AppliesToDocTypes = [txKey],
                        IsDefault = isDefault,
                        LayoutJson = layout,
                        PrintSettings = layout.PrintSettings,
                        VisibilityRules = layout.Visibility
                    });
                }

                BillFormatTemplateService.InvalidateCache();
                SalesBillTemplateService.InvalidateCache();
                ok = true;
            });
            if (!ok)
                return;
        }

        _host.GoBack();
    }

    private static string LabelForKey(string key) =>
        TransactionOptions.FirstOrDefault(t => string.Equals(t.Key, key, StringComparison.OrdinalIgnoreCase)).Label
        ?? "Sales Invoice";

    private static string KeyForLabel(string label) =>
        TransactionOptions.FirstOrDefault(t => string.Equals(t.Label, label, StringComparison.OrdinalIgnoreCase)).Key
        ?? "sales_invoice";

    private string GetFieldValue(string label) =>
        Fields.FirstOrDefault(f => f.Label == label)?.Value.Trim() ?? string.Empty;

    private string GetComboValue(string label) =>
        Fields.FirstOrDefault(f => f.Label == label)?.SelectedOption ?? string.Empty;

    private bool GetBooleanValue(string label) =>
        Fields.FirstOrDefault(f => f.Label == label)?.BoolValue ?? false;
}
