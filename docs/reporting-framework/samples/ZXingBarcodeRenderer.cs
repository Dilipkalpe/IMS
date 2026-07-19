// Barcode / QR — ERP.Reporting.Barcode/ (ZXing.Net)

using System.Windows.Media.Imaging;
using ERP.Reporting.Core.Layout;
using ZXing;
using ZXing.Common;
using ZXing.Windows.Compatibility;

namespace ERP.Reporting.Barcode;

public static class ZXingBarcodeRenderer
{
    public static BitmapSource EncodeBarcode(string symbology, string payload, int widthPx, int heightPx)
    {
        var format = symbology.ToUpperInvariant() switch
        {
            "CODE128" => BarcodeFormat.CODE_128,
            "CODE39" => BarcodeFormat.CODE_39,
            "EAN13" => BarcodeFormat.EAN_13,
            "EAN8" => BarcodeFormat.EAN_8,
            "UPCA" => BarcodeFormat.UPC_A,
            "ITF14" => BarcodeFormat.ITF,
            "GS1128" => BarcodeFormat.CODE_128,
            _ => BarcodeFormat.CODE_128
        };

        var writer = new BarcodeWriter
        {
            Format = format,
            Options = new EncodingOptions
            {
                Width = widthPx,
                Height = heightPx,
                Margin = 2,
                PureBarcode = false
            }
        };

        return writer.Write(payload);
    }

    public static BitmapSource EncodeQr(string payload, int sizePx, string errorCorrection = "M")
    {
        var level = errorCorrection.ToUpperInvariant() switch
        {
            "L" => ZXing.QrCode.Internal.ErrorCorrectionLevel.L,
            "Q" => ZXing.QrCode.Internal.ErrorCorrectionLevel.Q,
            "H" => ZXing.QrCode.Internal.ErrorCorrectionLevel.H,
            _ => ZXing.QrCode.Internal.ErrorCorrectionLevel.M
        };

        var writer = new BarcodeWriter
        {
            Format = BarcodeFormat.QR_CODE,
            Options = new QrCodeEncodingOptions
            {
                Width = sizePx,
                Height = sizePx,
                Margin = 1,
                ErrorCorrection = level
            }
        };

        return writer.Write(payload);
    }
}
