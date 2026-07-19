using System.Text.Json.Serialization;
using IMS.Services.Api.Dtos;

namespace IMS.Models;

public sealed class BillFormatCatalogDto
{
    [JsonPropertyName("layoutVersion")]
    public int LayoutVersion { get; set; }

    [JsonPropertyName("paperPresets")]
    public List<BillFormatPaperPreset> PaperPresets { get; set; } = [];

    [JsonPropertyName("watermarkTypes")]
    public List<string> WatermarkTypes { get; set; } = [];

    [JsonPropertyName("transactionTypes")]
    public List<BillFormatTransactionTypeInfo> TransactionTypes { get; set; } = [];

    [JsonPropertyName("headerControls")]
    public List<BillFormatControlInfo> HeaderControls { get; set; } = [];

    [JsonPropertyName("documentControls")]
    public List<BillFormatControlInfo> DocumentControls { get; set; } = [];

    [JsonPropertyName("itemColumns")]
    public List<BillFormatColumnInfo> ItemColumns { get; set; } = [];

    [JsonPropertyName("footerControls")]
    public List<BillFormatControlInfo> FooterControls { get; set; } = [];

    [JsonPropertyName("defaultVisibility")]
    public BillFormatVisibilityRules DefaultVisibility { get; set; } = new();

    [JsonPropertyName("defaultPrintSettings")]
    public BillFormatPrintSettings DefaultPrintSettings { get; set; } = new();

    [JsonPropertyName("defaultColumnsByTransaction")]
    public Dictionary<string, List<string>> DefaultColumnsByTransaction { get; set; } =
        new(StringComparer.OrdinalIgnoreCase);
}

public sealed class BillFormatPaperPreset
{
    [JsonPropertyName("key")]
    public string Key { get; set; } = string.Empty;

    [JsonPropertyName("label")]
    public string Label { get; set; } = string.Empty;

    [JsonPropertyName("sizeKey")]
    public string SizeKey { get; set; } = "A4";

    [JsonPropertyName("widthMm")]
    public double WidthMm { get; set; }

    [JsonPropertyName("heightMm")]
    public double HeightMm { get; set; }

    [JsonPropertyName("orientation")]
    public string Orientation { get; set; } = "portrait";
}

public sealed class BillFormatTransactionTypeInfo
{
    [JsonPropertyName("key")]
    public string Key { get; set; } = string.Empty;

    [JsonPropertyName("label")]
    public string Label { get; set; } = string.Empty;

    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;

    [JsonPropertyName("defaultTitle")]
    public string DefaultTitle { get; set; } = string.Empty;

    [JsonPropertyName("partyKind")]
    public string PartyKind { get; set; } = "customer";
}

public sealed class BillFormatControlInfo
{
    [JsonPropertyName("key")]
    public string Key { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("label")]
    public string Label { get; set; } = string.Empty;

    [JsonPropertyName("token")]
    public string? Token { get; set; }
}

public sealed class BillFormatColumnInfo
{
    [JsonPropertyName("key")]
    public string Key { get; set; } = string.Empty;

    [JsonPropertyName("header")]
    public string Header { get; set; } = string.Empty;

    [JsonPropertyName("align")]
    public string Align { get; set; } = "left";

    [JsonPropertyName("width")]
    public double Width { get; set; } = 60;
}

public sealed class BillFormatResolveResultDto
{
    [JsonPropertyName("source")]
    public string Source { get; set; } = string.Empty;

    [JsonPropertyName("docTypeKey")]
    public string DocTypeKey { get; set; } = string.Empty;

    [JsonPropertyName("partyCode")]
    public string? PartyCode { get; set; }

    [JsonPropertyName("template")]
    public SalesBillTemplateDto? Template { get; set; }
}
