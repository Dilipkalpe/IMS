using System.Text.Json.Serialization;

namespace IMS.Reporting.Models;

/// <summary>Canvas layout schema v2 stored in MongoDB <c>layoutJson</c>.</summary>
public sealed class ReportLayoutDocument
{
    [JsonPropertyName("schemaVersion")]
    public int SchemaVersion { get; set; } = 2;

    [JsonPropertyName("page")]
    public ReportPageSettings Page { get; set; } = new();

    [JsonPropertyName("theme")]
    public ReportThemeSettings Theme { get; set; } = new();

    [JsonPropertyName("options")]
    public ReportLayoutOptions Options { get; set; } = new();

    [JsonPropertyName("elements")]
    public List<ReportElementDefinition> Elements { get; set; } = [];
}

public sealed class ReportPageSettings
{
    [JsonPropertyName("paperSizeKey")]
    public string PaperSizeKey { get; set; } = "A4_PORTRAIT";

    [JsonPropertyName("orientation")]
    public string Orientation { get; set; } = "portrait";

    [JsonPropertyName("widthMm")]
    public double WidthMm { get; set; } = 210;

    [JsonPropertyName("heightMm")]
    public double HeightMm { get; set; } = 297;

    [JsonPropertyName("marginsMm")]
    public ReportMarginsMm MarginsMm { get; set; } = new();
}

public sealed class ReportMarginsMm
{
    [JsonPropertyName("top")]
    public double Top { get; set; } = 10;

    [JsonPropertyName("right")]
    public double Right { get; set; } = 10;

    [JsonPropertyName("bottom")]
    public double Bottom { get; set; } = 10;

    [JsonPropertyName("left")]
    public double Left { get; set; } = 10;
}

public sealed class ReportThemeSettings
{
    [JsonPropertyName("fontFamily")]
    public string FontFamily { get; set; } = "Segoe UI";

    [JsonPropertyName("baseFontSizePt")]
    public double BaseFontSizePt { get; set; } = 10;

    [JsonPropertyName("primaryColor")]
    public string PrimaryColor { get; set; } = "#1e293b";

    [JsonPropertyName("textColor")]
    public string TextColor { get; set; } = "#0f172a";

    [JsonPropertyName("borderColor")]
    public string BorderColor { get; set; } = "#334155";
}

public sealed class ReportLayoutOptions
{
    [JsonPropertyName("showLogo")]
    public bool ShowLogo { get; set; } = true;

    [JsonPropertyName("showGst")]
    public bool ShowGst { get; set; } = true;

    [JsonPropertyName("showAmountInWords")]
    public bool ShowAmountInWords { get; set; } = true;

    [JsonPropertyName("watermark")]
    public string Watermark { get; set; } = "original";
}

public sealed class ReportElementDefinition
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString("N")[..8];

    [JsonPropertyName("type")]
    public string Type { get; set; } = "text";

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("xMm")]
    public double XMm { get; set; }

    [JsonPropertyName("yMm")]
    public double YMm { get; set; }

    [JsonPropertyName("widthMm")]
    public double WidthMm { get; set; } = 40;

    [JsonPropertyName("heightMm")]
    public double HeightMm { get; set; } = 6;

    [JsonPropertyName("zIndex")]
    public int ZIndex { get; set; }

    [JsonPropertyName("visible")]
    public bool Visible { get; set; } = true;

    [JsonPropertyName("style")]
    public ReportElementStyle Style { get; set; } = new();

    [JsonPropertyName("binding")]
    public ReportElementBinding Binding { get; set; } = new();

    [JsonPropertyName("table")]
    public ReportTableSettings? Table { get; set; }

    [JsonPropertyName("barcode")]
    public ReportBarcodeSettings? Barcode { get; set; }

    [JsonPropertyName("qrcode")]
    public ReportQrCodeSettings? QrCode { get; set; }
}

public sealed class ReportElementStyle
{
    [JsonPropertyName("fontFamily")]
    public string? FontFamily { get; set; }

    [JsonPropertyName("fontSizePt")]
    public double? FontSizePt { get; set; }

    [JsonPropertyName("fontWeight")]
    public string? FontWeight { get; set; }

    [JsonPropertyName("foreground")]
    public string? Foreground { get; set; }

    [JsonPropertyName("background")]
    public string? Background { get; set; }

    [JsonPropertyName("textAlign")]
    public string? TextAlign { get; set; }

    [JsonPropertyName("borderThicknessMm")]
    public double BorderThicknessMm { get; set; }

    [JsonPropertyName("borderColor")]
    public string? BorderColor { get; set; }
}

public sealed class ReportElementBinding
{
    [JsonPropertyName("token")]
    public string? Token { get; set; }

    [JsonPropertyName("fieldKey")]
    public string? FieldKey { get; set; }

    [JsonPropertyName("value")]
    public string? Value { get; set; }

    [JsonPropertyName("dataSource")]
    public string? DataSource { get; set; }
}

public sealed class ReportTableSettings
{
    [JsonPropertyName("showHeader")]
    public bool ShowHeader { get; set; } = true;

    [JsonPropertyName("rowHeightMm")]
    public double RowHeightMm { get; set; } = 6;

    [JsonPropertyName("headerBackground")]
    public string? HeaderBackground { get; set; }

    [JsonPropertyName("headerForeground")]
    public string? HeaderForeground { get; set; }

    [JsonPropertyName("showTotalsRow")]
    public bool ShowTotalsRow { get; set; }

    [JsonPropertyName("columns")]
    public List<ReportTableColumnDefinition> Columns { get; set; } = [];

    [JsonPropertyName("footer")]
    public ReportTableFooterSettings? Footer { get; set; }
}

public sealed class ReportTableColumnDefinition
{
    [JsonPropertyName("key")]
    public string Key { get; set; } = string.Empty;

    [JsonPropertyName("header")]
    public string Header { get; set; } = string.Empty;

    [JsonPropertyName("widthMm")]
    public double WidthMm { get; set; } = 20;

    [JsonPropertyName("align")]
    public string Align { get; set; } = "left";

    [JsonPropertyName("visible")]
    public bool Visible { get; set; } = true;
}

public sealed class ReportTableFooterSettings
{
    [JsonPropertyName("rows")]
    public List<ReportTableFooterRow> Rows { get; set; } = [];
}

public sealed class ReportTableFooterRow
{
    [JsonPropertyName("label")]
    public string Label { get; set; } = string.Empty;

    [JsonPropertyName("columnKey")]
    public string ColumnKey { get; set; } = "amount";

    [JsonPropertyName("binding")]
    public string? Binding { get; set; }
}

public sealed class ReportBarcodeSettings
{
    [JsonPropertyName("symbology")]
    public string Symbology { get; set; } = "Code128";

    [JsonPropertyName("showText")]
    public bool ShowText { get; set; } = true;
}

public sealed class ReportQrCodeSettings
{
    [JsonPropertyName("qrKind")]
    public string QrKind { get; set; } = "dynamic";

    [JsonPropertyName("errorCorrection")]
    public string ErrorCorrection { get; set; } = "M";
}
