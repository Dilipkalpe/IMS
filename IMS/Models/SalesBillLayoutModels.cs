using System.Text.Json.Serialization;

namespace IMS.Models;

/// <summary>Layout JSON stored in API <c>layoutJson</c> field (version 1).</summary>
public sealed class SalesBillLayoutDefinition
{
    [JsonPropertyName("version")]
    public int Version { get; set; } = 1;

    [JsonPropertyName("page")]
    public SalesBillPageSettings Page { get; set; } = new();

    [JsonPropertyName("theme")]
    public SalesBillThemeSettings Theme { get; set; } = new();

    [JsonPropertyName("sections")]
    public List<SalesBillSectionDefinition> Sections { get; set; } = [];

    [JsonPropertyName("itemTable")]
    public SalesBillItemTableSettings ItemTable { get; set; } = new();

    [JsonPropertyName("documentTitle")]
    public string? DocumentTitle { get; set; }

    [JsonPropertyName("visibility")]
    public BillFormatVisibilityRules Visibility { get; set; } = new();

    [JsonPropertyName("printSettings")]
    public BillFormatPrintSettings PrintSettings { get; set; } = new();

    [JsonPropertyName("elements")]
    public List<BillFormatElementDefinition> Elements { get; set; } = [];
}

public sealed class BillFormatVisibilityRules
{
    [JsonPropertyName("showLogo")]
    public bool ShowLogo { get; set; } = true;

    [JsonPropertyName("showGst")]
    public bool ShowGst { get; set; } = true;

    [JsonPropertyName("showDiscount")]
    public bool ShowDiscount { get; set; } = true;

    [JsonPropertyName("showTaxBreakup")]
    public bool ShowTaxBreakup { get; set; } = true;

    [JsonPropertyName("showBankDetails")]
    public bool ShowBankDetails { get; set; } = true;

    [JsonPropertyName("showQrCode")]
    public bool ShowQrCode { get; set; }

    [JsonPropertyName("showSignature")]
    public bool ShowSignature { get; set; } = true;

    [JsonPropertyName("showRate")]
    public bool ShowRate { get; set; } = true;

    [JsonPropertyName("showAmountInWords")]
    public bool ShowAmountInWords { get; set; } = true;

    [JsonPropertyName("showSupplierInfo")]
    public bool ShowSupplierInfo { get; set; } = true;

    [JsonPropertyName("showCustomerInfo")]
    public bool ShowCustomerInfo { get; set; } = true;
}

public sealed class BillFormatPrintSettings
{
    [JsonPropertyName("autoPrintAfterSave")]
    public bool AutoPrintAfterSave { get; set; }

    [JsonPropertyName("printPreview")]
    public bool PrintPreview { get; set; } = true;

    [JsonPropertyName("numberOfCopies")]
    public int NumberOfCopies { get; set; } = 1;

    [JsonPropertyName("watermark")]
    public string Watermark { get; set; } = "original";
}

public sealed class BillFormatElementDefinition
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("fieldKey")]
    public string FieldKey { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = "field";

    [JsonPropertyName("label")]
    public string Label { get; set; } = string.Empty;

    [JsonPropertyName("visible")]
    public bool Visible { get; set; } = true;

    [JsonPropertyName("x")]
    public double X { get; set; }

    [JsonPropertyName("y")]
    public double Y { get; set; }

    [JsonPropertyName("width")]
    public double Width { get; set; } = 40;

    [JsonPropertyName("height")]
    public double Height { get; set; } = 6;

    [JsonPropertyName("text")]
    public string? Text { get; set; }
}

public sealed class SalesBillPageSettings
{
    [JsonPropertyName("sizeKey")]
    public string SizeKey { get; set; } = "A4";

    [JsonPropertyName("widthMm")]
    public double WidthMm { get; set; } = 210;

    [JsonPropertyName("heightMm")]
    public double HeightMm { get; set; } = 297;

    [JsonPropertyName("orientation")]
    public string Orientation { get; set; } = "portrait";

    [JsonPropertyName("marginMm")]
    public SalesBillMarginMm MarginMm { get; set; } = new();
}

public sealed class SalesBillMarginMm
{
    [JsonPropertyName("top")]
    public double Top { get; set; } = 12;

    [JsonPropertyName("right")]
    public double Right { get; set; } = 12;

    [JsonPropertyName("bottom")]
    public double Bottom { get; set; } = 12;

    [JsonPropertyName("left")]
    public double Left { get; set; } = 12;
}

public sealed class SalesBillThemeSettings
{
    [JsonPropertyName("fontFamily")]
    public string FontFamily { get; set; } = "Segoe UI";

    [JsonPropertyName("baseFontSizePt")]
    public double BaseFontSizePt { get; set; } = 11;

    [JsonPropertyName("primaryColor")]
    public string PrimaryColor { get; set; } = "#5C4033";

    [JsonPropertyName("textColor")]
    public string TextColor { get; set; } = "#000000";

    [JsonPropertyName("borderColor")]
    public string BorderColor { get; set; } = "#333333";

    [JsonPropertyName("showBorders")]
    public bool ShowBorders { get; set; } = true;
}

public sealed class SalesBillSectionDefinition
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("label")]
    public string Label { get; set; } = string.Empty;

    [JsonPropertyName("visible")]
    public bool Visible { get; set; } = true;

    [JsonPropertyName("order")]
    public int Order { get; set; }

    [JsonPropertyName("x")]
    public double X { get; set; }

    [JsonPropertyName("y")]
    public double Y { get; set; }

    [JsonPropertyName("width")]
    public double Width { get; set; } = 100;

    [JsonPropertyName("height")]
    public double Height { get; set; } = 10;

    [JsonPropertyName("align")]
    public string Align { get; set; } = "left";

    [JsonPropertyName("fontFamily")]
    public string? FontFamily { get; set; }

    [JsonPropertyName("fontSizePt")]
    public double? FontSizePt { get; set; }

    [JsonPropertyName("fontWeight")]
    public string? FontWeight { get; set; }

    [JsonPropertyName("color")]
    public string? Color { get; set; }

    [JsonPropertyName("showBorder")]
    public bool ShowBorder { get; set; }

    [JsonPropertyName("text")]
    public string? Text { get; set; }

    [JsonPropertyName("showGstin")]
    public bool? ShowGstin { get; set; }

    [JsonPropertyName("showPhone")]
    public bool? ShowPhone { get; set; }

    [JsonPropertyName("showAddress")]
    public bool? ShowAddress { get; set; }

    [JsonPropertyName("headerBackground")]
    public string? HeaderBackground { get; set; }

    [JsonPropertyName("headerTextColor")]
    public string? HeaderTextColor { get; set; }

    [JsonPropertyName("showCgst")]
    public bool? ShowCgst { get; set; }

    [JsonPropertyName("showSgst")]
    public bool? ShowSgst { get; set; }

    [JsonPropertyName("showIgst")]
    public bool? ShowIgst { get; set; }

    [JsonPropertyName("showRoundOff")]
    public bool? ShowRoundOff { get; set; }
}

public sealed class SalesBillItemTableSettings
{
    [JsonPropertyName("visible")]
    public bool Visible { get; set; } = true;

    [JsonPropertyName("showHeader")]
    public bool ShowHeader { get; set; } = true;

    [JsonPropertyName("borderThickness")]
    public double BorderThickness { get; set; } = 1;

    [JsonPropertyName("columns")]
    public List<SalesBillItemColumnDefinition> Columns { get; set; } = [];
}

public sealed class SalesBillItemColumnDefinition
{
    [JsonPropertyName("key")]
    public string Key { get; set; } = string.Empty;

    [JsonPropertyName("header")]
    public string Header { get; set; } = string.Empty;

    [JsonPropertyName("visible")]
    public bool Visible { get; set; } = true;

    [JsonPropertyName("width")]
    public double Width { get; set; } = 60;

    [JsonPropertyName("align")]
    public string Align { get; set; } = "left";
}
