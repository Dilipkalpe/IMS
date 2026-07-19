// Core layout models — ERP.Reporting.Core/Layout/
// Serialize with System.Text.Json

using System.Text.Json.Serialization;

namespace ERP.Reporting.Core.Layout;

public sealed class ReportLayoutDocument
{
    [JsonPropertyName("schemaVersion")]
    public int SchemaVersion { get; set; } = 1;

    [JsonPropertyName("page")]
    public PageSettings Page { get; set; } = new();

    [JsonPropertyName("theme")]
    public ThemeSettings Theme { get; set; } = new();

    [JsonPropertyName("options")]
    public LayoutOptions Options { get; set; } = new();

    [JsonPropertyName("elements")]
    public List<LayoutElement> Elements { get; set; } = [];
}

public sealed class PageSettings
{
    public string PaperKey { get; set; } = "A4_PORTRAIT";
    public string Orientation { get; set; } = "portrait";
    public double WidthMm { get; set; } = 210;
    public double HeightMm { get; set; } = 297;
    public MarginMm MarginsMm { get; set; } = new();
}

public sealed class MarginMm
{
    public double Top { get; set; } = 10;
    public double Right { get; set; } = 10;
    public double Bottom { get; set; } = 10;
    public double Left { get; set; } = 10;
}

public sealed class ThemeSettings
{
    public string FontFamily { get; set; } = "Segoe UI";
    public double BaseFontSizePt { get; set; } = 10;
    public string PrimaryColor { get; set; } = "#1e293b";
    public string TextColor { get; set; } = "#0f172a";
    public string BorderColor { get; set; } = "#334155";
}

public sealed class LayoutOptions
{
    public bool ShowLogo { get; set; } = true;
    public bool ShowGst { get; set; } = true;
    public bool ShowAmountInWords { get; set; } = true;
    public string Watermark { get; set; } = "original";
}

public sealed class LayoutElement
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N")[..12];
    public string Type { get; set; } = "text";
    public string? Name { get; set; }
    public double XMm { get; set; }
    public double YMm { get; set; }
    public double WidthMm { get; set; }
    public double HeightMm { get; set; }
    public int ZIndex { get; set; }
    public bool Visible { get; set; } = true;
    public string? VisibleWhen { get; set; }
    public ElementStyle Style { get; set; } = new();
    public ElementBinding? Binding { get; set; }
    public TableDefinition? Table { get; set; }
    public BarcodeDefinition? Barcode { get; set; }
    public QrCodeDefinition? QrCode { get; set; }
}

public sealed class ElementStyle
{
    public string FontFamily { get; set; } = "Segoe UI";
    public double FontSizePt { get; set; } = 10;
    public string FontWeight { get; set; } = "normal";
    public string? Foreground { get; set; }
    public string? Background { get; set; }
    public string TextAlign { get; set; } = "left";
    public double BorderThicknessMm { get; set; }
    public string? BorderColor { get; set; }
}

public sealed class ElementBinding
{
    public string Mode { get; set; } = "token";
    public string? Value { get; set; }
}

public sealed class TableDefinition
{
    public string DataSource { get; set; } = "lines";
    public bool ShowHeader { get; set; } = true;
    public bool RepeatHeaderOnPage { get; set; } = true;
    public List<TableColumnDefinition> Columns { get; set; } = [];
}

public sealed class TableColumnDefinition
{
    public string Key { get; set; } = string.Empty;
    public string Header { get; set; } = string.Empty;
    public double WidthMm { get; set; } = 20;
    public string Align { get; set; } = "left";
    public bool Visible { get; set; } = true;
}

public sealed class BarcodeDefinition
{
    public string Symbology { get; set; } = "Code128";
    public bool ShowText { get; set; } = true;
}

public sealed class QrCodeDefinition
{
    public string QrKind { get; set; } = "dynamic";
    public string ErrorCorrection { get; set; } = "M";
    public double SizeMm { get; set; } = 25;
}
