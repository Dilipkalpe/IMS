using System.Globalization;
using System.Windows;
using System.Windows.Controls;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api.Dtos;

namespace IMS.Views;

public partial class BarcodeLabelPrintDialog : Window
{
    private readonly NumberedPurchaseDocumentDto _invoice;

    private BarcodeLabelPrintDialog(NumberedPurchaseDocumentDto invoice)
    {
        _invoice = invoice;
        InitializeComponent();
        Owner = Application.Current?.MainWindow;

        var docNo = invoice.FormattedDocNo ?? $"{invoice.DocPrefix}-{invoice.DocNo}";
        InvoiceCaption.Text = $"Purchase invoice: {docNo} — {invoice.Lines?.Count ?? 0} line(s)";

        FormatCombo.ItemsSource = BarcodeLabelCatalog.Formats;
        FormatCombo.ItemTemplate = CreateFormatItemTemplate();
        FormatCombo.SelectedItem = BarcodeLabelCatalog.Default;
        FormatCombo.SelectionChanged += (_, _) => UpdateFormatDescription();
        UpdateFormatDescription();

        PurchaseQtyRadio.Checked += (_, _) => CustomQtyPanel.IsEnabled = false;
        CustomQtyRadio.Checked += (_, _) => CustomQtyPanel.IsEnabled = true;
    }

    public static BarcodeLabelPrintOptions? ShowDialog(NumberedPurchaseDocumentDto invoice)
    {
        var dialog = new BarcodeLabelPrintDialog(invoice);
        return dialog.ShowDialog() == true ? dialog._result : null;
    }

    private BarcodeLabelPrintOptions? _result;

    private static DataTemplate CreateFormatItemTemplate()
    {
        var factory = new FrameworkElementFactory(typeof(StackPanel));
        var name = new FrameworkElementFactory(typeof(TextBlock));
        name.SetBinding(TextBlock.TextProperty, new System.Windows.Data.Binding(nameof(BarcodeLabelFormat.DisplayName)));
        name.SetValue(TextBlock.FontWeightProperty, FontWeights.SemiBold);
        var size = new FrameworkElementFactory(typeof(TextBlock));
        size.SetBinding(TextBlock.TextProperty, new System.Windows.Data.Binding(nameof(BarcodeLabelFormat.Description)));
        size.SetValue(TextBlock.FontSizeProperty, 11.0);
        size.SetValue(TextBlock.ForegroundProperty, System.Windows.Media.Brushes.Gray);
        factory.AppendChild(name);
        factory.AppendChild(size);
        return new DataTemplate { VisualTree = factory };
    }

    private void UpdateFormatDescription()
    {
        if (FormatCombo.SelectedItem is not BarcodeLabelFormat format)
        {
            FormatDescription.Text = string.Empty;
            CustomSizePanel.Visibility = Visibility.Collapsed;
            return;
        }

        var isCustom = format.Id.Equals(BarcodeLabelCatalog.CustomFormatId, StringComparison.OrdinalIgnoreCase);
        CustomSizePanel.Visibility = isCustom ? Visibility.Visible : Visibility.Collapsed;

        if (isCustom)
        {
            FormatDescription.Text = "Enter label width and height in millimetres.";
            return;
        }

        FormatDescription.Text =
            $"{format.DisplayName} — {format.WidthMm:0.#} × {format.HeightMm:0.#} mm — {format.Description}";
    }

    private void Cancel_OnClick(object sender, RoutedEventArgs e)
    {
        DialogResult = false;
        Close();
    }

    private void Generate_OnClick(object sender, RoutedEventArgs e)
    {
        if (FormatCombo.SelectedItem is not BarcodeLabelFormat selectedFormat)
        {
            MessageBox.Show(this, "Select a label format.", "Validation",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        BarcodeLabelFormat format = selectedFormat;
        if (selectedFormat.Id.Equals(BarcodeLabelCatalog.CustomFormatId, StringComparison.OrdinalIgnoreCase))
        {
            if (!double.TryParse(CustomWidthBox.Text?.Trim(), NumberStyles.Any, CultureInfo.InvariantCulture, out var widthMm)
                || widthMm <= 0
                || !double.TryParse(CustomHeightBox.Text?.Trim(), NumberStyles.Any, CultureInfo.InvariantCulture, out var heightMm)
                || heightMm <= 0)
            {
                MessageBox.Show(this, "Enter valid custom label width and height (mm), both greater than zero.", "Validation",
                    MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            format = BarcodeLabelCatalog.BuildCustomFormat(widthMm, heightMm);
        }

        if (!int.TryParse(CopiesBox.Text?.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var copies)
            || copies < 1)
        {
            copies = 1;
        }

        var customQty = 1;
        if (CustomQtyRadio.IsChecked == true)
        {
            if (!int.TryParse(CustomQtyBox.Text?.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out customQty)
                || customQty < 1)
            {
                MessageBox.Show(this, "Enter a custom quantity of at least 1.", "Validation",
                    MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }
        }

        _result = new BarcodeLabelPrintOptions
        {
            Format = format,
            Symbology = QrCodeTypeRadio.IsChecked == true
                ? BarcodeLabelSymbology.QrCode
                : BarcodeLabelSymbology.Code128,
            QuantitySource = CustomQtyRadio.IsChecked == true
                ? BarcodeLabelQuantitySource.CustomQuantity
                : BarcodeLabelQuantitySource.PurchaseQuantity,
            CustomQuantityPerLine = customQty,
            CopyMultiplier = copies
        };

        DialogResult = true;
        Close();
    }
}
