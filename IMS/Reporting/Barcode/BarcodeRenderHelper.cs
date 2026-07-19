using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using IMS.Reporting.Models;
using ZXing;
using ZXing.Common;

namespace IMS.Reporting.Barcode;

public static class BarcodeRenderHelper
{
    public static UIElement? RenderBarcode(string payload, ReportBarcodeSettings settings, double widthDip, double heightDip)
    {
        var source = CreateBitmap(payload, MapSymbology(settings.Symbology), (int)widthDip, (int)(heightDip * 0.75), !settings.ShowText);
        return source is null
            ? null
            : new Image { Source = source, Width = widthDip, Height = heightDip, Stretch = Stretch.Fill };
    }

    public static UIElement? RenderQrCode(string payload, double widthDip, double heightDip)
    {
        var source = CreateBitmap(payload, BarcodeFormat.QR_CODE, (int)widthDip, (int)heightDip, true);
        return source is null
            ? null
            : new Image { Source = source, Width = widthDip, Height = heightDip, Stretch = Stretch.Uniform };
    }

    private static ImageSource? CreateBitmap(string payload, BarcodeFormat format, int width, int height, bool pureBarcode)
    {
        if (string.IsNullOrWhiteSpace(payload))
            return null;

        try
        {
            var writer = new BarcodeWriterPixelData
            {
                Format = format,
                Options = new EncodingOptions
                {
                    Width = Math.Max(1, width),
                    Height = Math.Max(1, height),
                    Margin = 2,
                    PureBarcode = pureBarcode
                }
            };

            var pixelData = writer.Write(payload.Trim());
            if (pixelData is null)
                return null;

            var stride = pixelData.Width * 4;
            var bitmap = BitmapSource.Create(
                pixelData.Width,
                pixelData.Height,
                96,
                96,
                PixelFormats.Bgra32,
                null,
                pixelData.Pixels,
                stride);
            bitmap.Freeze();
            return bitmap;
        }
        catch
        {
            return null;
        }
    }

    private static BarcodeFormat MapSymbology(string? symbology) =>
        symbology?.Trim().ToUpperInvariant() switch
        {
            "CODE39" => BarcodeFormat.CODE_39,
            "EAN13" => BarcodeFormat.EAN_13,
            "EAN8" => BarcodeFormat.EAN_8,
            "UPC" or "UPCA" => BarcodeFormat.UPC_A,
            "ITF14" or "ITF-14" => BarcodeFormat.ITF,
            _ => BarcodeFormat.CODE_128
        };
}
