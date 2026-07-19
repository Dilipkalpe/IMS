using System.ComponentModel;
using System.Windows;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;

namespace IMS.ViewModels.SubPages;

public sealed class AddProductViewModel : DynamicFormViewModelBase
{
    private static readonly HashSet<string> SidebarFieldKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        "product_image",
        "serial_applicable",
        "gst_exempt",
        "active_status"
    };

    private readonly MainViewModel _host;
    private readonly bool _isEdit;
    private readonly string _originalCode = string.Empty;
    private int _selectedTabIndex;

    public AddProductViewModel(MainViewModel host) : base(
        host,
        parentTitle: "Products",
        pageTitle: "Add Product",
        pageDescription: "Define item identity, pricing, tax, and classification for inventory and documents.",
        iconGlyph: "\uE710",
        ProductMasterFormCatalog.All)
    {
        _host = host;
        SaveCommand = new AsyncRelayCommand(SaveProductAsync);
        HookPreviewRefresh();
    }

    public AddProductViewModel(MainViewModel host, string productCode) : base(
        host,
        parentTitle: "Products",
        pageTitle: "Edit Product",
        pageDescription: "Update product master details. Field visibility follows your saved layout.",
        iconGlyph: "\uE70F",
        ProductMasterFormCatalog.All)
    {
        _host = host;
        _isEdit = true;
        _originalCode = productCode;
        SaveCommand = new AsyncRelayCommand(SaveProductAsync);
        HookPreviewRefresh();
        _ = LoadProductAsync(productCode);
    }

    public bool IsEditMode => _isEdit;

    public int SelectedTabIndex
    {
        get => _selectedTabIndex;
        set => SetProperty(ref _selectedTabIndex, value);
    }

    public string PreviewCode =>
        string.IsNullOrWhiteSpace(GetText("product_code")) ? "—" : GetText("product_code").ToUpperInvariant();

    public string PreviewName =>
        string.IsNullOrWhiteSpace(GetText("product_name")) ? "New product" : GetText("product_name");

    public string PreviewStatusLabel => GetBool("active_status") ? "Active" : "Inactive";

    public bool PreviewIsActive => GetBool("active_status");

    public FormFieldViewModel? ProductImageField => GetField("product_image");
    public FormFieldViewModel? SerialApplicableField => GetField("serial_applicable");
    public FormFieldViewModel? GstExemptField => GetField("gst_exempt");
    public FormFieldViewModel? ActiveStatusField => GetField("active_status");

    public FormSectionViewModel? BasicSection => FindSection("Basic information");
    public FormSectionViewModel? PricingSection => FindSection("Pricing, quantity & tax");
    public FormSectionViewModel? ClassificationSection => FindSection("Classification & UOM");

    public IEnumerable<FormFieldViewModel> BasicFields => FilterTabFields(BasicSection);
    public IEnumerable<FormFieldViewModel> PricingFields => FilterTabFields(PricingSection);
    public IEnumerable<FormFieldViewModel> ClassificationFields => FilterTabFields(ClassificationSection);

    protected override string FormModuleKey => "product_master_form";

    public override void RefreshVisibleFields()
    {
        base.RefreshVisibleFields();
        OnPropertyChanged(nameof(BasicSection));
        OnPropertyChanged(nameof(PricingSection));
        OnPropertyChanged(nameof(ClassificationSection));
        OnPropertyChanged(nameof(BasicFields));
        OnPropertyChanged(nameof(PricingFields));
        OnPropertyChanged(nameof(ClassificationFields));
        RefreshPreview();
    }

    private FormSectionViewModel? FindSection(string title) =>
        FormSections.FirstOrDefault(s => string.Equals(s.Title, title, StringComparison.Ordinal));

    private static IEnumerable<FormFieldViewModel> FilterTabFields(FormSectionViewModel? section) =>
        section?.Fields.Where(f => !SidebarFieldKeys.Contains(f.Key)) ?? [];

    private void HookPreviewRefresh()
    {
        foreach (var field in AllFields)
            field.PropertyChanged += OnFieldPropertyChanged;
    }

    private void OnFieldPropertyChanged(object? sender, PropertyChangedEventArgs e)
    {
        if (e.PropertyName is nameof(FormFieldViewModel.Value)
            or nameof(FormFieldViewModel.SelectedOption)
            or nameof(FormFieldViewModel.BoolValue))
            RefreshPreview();
    }

    private void RefreshPreview()
    {
        OnPropertyChanged(nameof(PreviewCode));
        OnPropertyChanged(nameof(PreviewName));
        OnPropertyChanged(nameof(PreviewStatusLabel));
        OnPropertyChanged(nameof(PreviewIsActive));
    }

    protected override void OnBrowseField(FormFieldViewModel field)
    {
        if (string.Equals(field.Key, "product_image", StringComparison.OrdinalIgnoreCase))
            SetText("product_image", @"C:\Mock\product-images\new-product.png");
    }

    private async Task LoadProductAsync(string code)
    {
        if (!ImsApiClient.IsAvailable && !await ImsApiClient.CheckHealthAsync())
            return;

        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            var product = await ImsApiClient.GetProductByCodeAsync(code);
            if (product is null)
            {
                MessageBox.Show($"Product \"{code}\" was not found.", "Edit Product",
                    MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            ApiDocumentMapper.ApplyProductToForm(product, this);
        });
    }

    private async Task SaveProductAsync()
    {
        if (!ValidateRequiredFields("product_code", "product_name"))
        {
            MessageBox.Show("Product code and name are required.", "Validation",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (!await ImsApiClient.CheckHealthAsync())
        {
            MessageBox.Show(
                "Cannot save — the API is not running.\n\nStart MongoDB, then run the API (npm run dev in the api folder) and try again.",
                "Add Product",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
            return;
        }

        var saved = false;
        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            var dto = ApiDocumentMapper.FromAddProduct(this);
            if (_isEdit)
                await ImsApiClient.UpdateProductByCodeAsync(_originalCode, dto);
            else
                await ImsApiClient.CreateProductAsync(dto);

            saved = true;
        }, "Add Product");

        if (!saved)
            return;

        MessageBox.Show(
            _isEdit ? "Product updated successfully." : "Product saved successfully.",
            "Product Master",
            MessageBoxButton.OK,
            MessageBoxImage.Information);

        _host.GoBack();
    }
}
