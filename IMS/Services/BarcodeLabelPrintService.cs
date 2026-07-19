using System.IO;
using System.Printing;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using IMS.Models;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;
using Microsoft.Win32;

namespace IMS.Services;

public static class BarcodeLabelPrintService
{
    public static async Task<bool> TryPrintFromPurchaseInvoiceListAsync(string formattedDocNo)
    {
        if (!AuthSession.CanPrintBarcodeLabels)
        {
            MessageBox.Show(
                Application.Current?.MainWindow,
                "You do not have permission to print barcode labels. Ask an administrator to enable \"Barcode label printing\" on your user account.",
                "Barcode labels",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
            return false;
        }

        if (!ImsApiClient.IsAvailable)
        {
            MessageBox.Show(
                Application.Current?.MainWindow,
                "API is not available. Start the API server to load purchase invoice lines.",
                "Barcode labels",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
            return false;
        }

        NumberedPurchaseDocumentDto? invoice = null;
        var loaded = false;
        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            invoice = await ImsApiClient.GetPurchaseDocumentByFormattedAsync(
                PurchaseEntryType.PurchaseInvoice,
                formattedDocNo);
            loaded = invoice is not null;
        }, "Load purchase invoice");

        if (!loaded || invoice is null)
        {
            await UiThread.RunAsync(() => MessageBox.Show(
                Application.Current?.MainWindow,
                $"Purchase invoice {formattedDocNo} was not found.",
                "Barcode labels",
                MessageBoxButton.OK,
                MessageBoxImage.Warning));
            return false;
        }

        var options = await UiThread.RunAsync(() => Views.BarcodeLabelPrintDialog.ShowDialog(invoice));
        if (options is null)
            return false;

        BarcodeLabelPrintResult? result = null;
        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            result = await BarcodeLabelGenerator.GenerateFromPurchaseInvoiceAsync(invoice, options);
        }, "Generate labels");

        if (result is null)
            return false;

        if (result.Warnings.Count > 0)
        {
            var warningText = string.Join("\n", result.Warnings.Take(8));
            if (result.Warnings.Count > 8)
                warningText += $"\n… and {result.Warnings.Count - 8} more.";

            await UiThread.RunAsync(() => MessageBox.Show(
                Application.Current?.MainWindow,
                warningText,
                "Barcode labels — notice",
                MessageBoxButton.OK,
                MessageBoxImage.Information));
        }

        if (result.Labels.Count == 0)
        {
            await UiThread.RunAsync(() => MessageBox.Show(
                Application.Current?.MainWindow,
                "No labels to print. Add product lines to the purchase invoice first.",
                "Barcode labels",
                MessageBoxButton.OK,
                MessageBoxImage.Warning));
            return false;
        }

        await UiThread.RunAsync(() => ShowPreview(result, options));
        return true;
    }

    public static void ShowPreview(BarcodeLabelPrintResult result, BarcodeLabelPrintOptions options)
    {
        var document = BarcodeLabelDocumentBuilder.BuildFixedDocument(result.Labels, options.Format, options.Symbology);
        var title = $"Barcode labels — {result.Labels.Count:N0} label(s)";

        var window = new Window
        {
            Title = title,
            Width = 920,
            Height = 720,
            WindowStartupLocation = WindowStartupLocation.CenterOwner,
            Owner = Application.Current?.MainWindow,
            Background = System.Windows.Media.Brushes.WhiteSmoke
        };

        var root = new DockPanel();
        var toolbar = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            Margin = new Thickness(12, 10, 12, 8)
        };
        DockPanel.SetDock(toolbar, Dock.Top);

        var printBtn = new Button { Content = "Print labels…", Padding = new Thickness(16, 6, 16, 6), Margin = new Thickness(0, 0, 8, 0) };
        printBtn.Click += (_, _) => PrintDocument(document, title);
        var pdfBtn = new Button { Content = "Download PDF…", Padding = new Thickness(16, 6, 16, 6), Margin = new Thickness(0, 0, 8, 0) };
        pdfBtn.Click += (_, _) => DownloadPdf(result.Labels, options.Format, options.Symbology, title);
        var closeBtn = new Button { Content = "Close", Padding = new Thickness(16, 6, 16, 6), IsCancel = true };
        closeBtn.Click += (_, _) => window.Close();
        toolbar.Children.Add(printBtn);
        toolbar.Children.Add(pdfBtn);
        toolbar.Children.Add(closeBtn);

        var viewer = new DocumentViewer { Document = document };
        root.Children.Add(toolbar);
        root.Children.Add(viewer);
        window.Content = root;
        window.ShowDialog();
    }

    private static void PrintDocument(FixedDocument document, string description)
    {
        var dialog = new PrintDialog();
        if (dialog.ShowDialog() != true)
            return;

        dialog.PrintDocument(document.DocumentPaginator, description);
    }

    private static void DownloadPdf(
        IReadOnlyList<BarcodeLabelItem> labels,
        BarcodeLabelFormat format,
        BarcodeLabelSymbology symbology,
        string title)
    {
        var dialog = new SaveFileDialog
        {
            Title = "Save barcode labels PDF",
            Filter = "PDF files (*.pdf)|*.pdf",
            FileName = $"{SanitizeFileName(title)}.pdf",
            DefaultExt = ".pdf"
        };

        if (dialog.ShowDialog() != true)
            return;

        try
        {
            BarcodeLabelDocumentBuilder.SavePdf(labels, format, dialog.FileName, symbology);
            MessageBox.Show(
                Application.Current?.MainWindow,
                $"Saved {labels.Count:N0} label(s) to:\n{dialog.FileName}",
                "PDF saved",
                MessageBoxButton.OK,
                MessageBoxImage.Information);
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                Application.Current?.MainWindow,
                $"Could not save PDF:\n{ex.Message}",
                "PDF error",
                MessageBoxButton.OK,
                MessageBoxImage.Error);
        }
    }

    private static string SanitizeFileName(string name)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var cleaned = new string(name.Select(ch => invalid.Contains(ch) ? '_' : ch).ToArray());
        return string.IsNullOrWhiteSpace(cleaned) ? "barcode-labels" : cleaned;
    }
}
