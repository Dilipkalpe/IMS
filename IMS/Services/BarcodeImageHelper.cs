using System.Windows;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using ZXing;
using ZXing.Common;

namespace IMS.Services;

internal static class BarcodeImageHelper
{
    public static ImageSource? CreateQrCode(string? value, int width = 120, int height = 120)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        try
        {
            var writer = new BarcodeWriterPixelData
            {
                Format = BarcodeFormat.QR_CODE,
                Options = new EncodingOptions
                {
                    Width = width,
                    Height = height,
                    Margin = 2,
                    PureBarcode = true
                }
            };

            var pixelData = writer.Write(value.Trim());
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

    public static ImageSource? CreateCode128(string? value, int width = 220, int height = 56)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        try
        {
            var writer = new BarcodeWriterPixelData
            {
                Format = BarcodeFormat.CODE_128,
                Options = new EncodingOptions
                {
                    Width = width,
                    Height = height,
                    Margin = 4,
                    PureBarcode = true
                }
            };

            var pixelData = writer.Write(value.Trim());
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
}
