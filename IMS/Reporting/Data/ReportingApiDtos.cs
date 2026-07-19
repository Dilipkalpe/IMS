using System.Text.Json;
using System.Text.Json.Serialization;
using IMS.Models;

namespace IMS.Reporting.Data;

public sealed class ReportFormatDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("formatCode")]
    public string FormatCode { get; set; } = string.Empty;

    [JsonPropertyName("formatName")]
    public string FormatName { get; set; } = string.Empty;

    [JsonPropertyName("transactionType")]
    public string TransactionType { get; set; } = string.Empty;

    [JsonPropertyName("paperSizeKey")]
    public string PaperSizeKey { get; set; } = "A4_PORTRAIT";

    [JsonPropertyName("orientation")]
    public string Orientation { get; set; } = "portrait";

    [JsonPropertyName("customPaper")]
    public ReportCustomPaperDto? CustomPaper { get; set; }

    [JsonPropertyName("isDefault")]
    public bool IsDefault { get; set; }

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; } = true;

    [JsonPropertyName("layoutJson")]
    public JsonElement LayoutJson { get; set; }

    [JsonPropertyName("schemaVersion")]
    public int SchemaVersion { get; set; } = 2;

    [JsonPropertyName("printSettings")]
    public BillFormatPrintSettings PrintSettings { get; set; } = new();
}

public sealed class ReportFormatResolveResultDto
{
    [JsonPropertyName("source")]
    public string Source { get; set; } = string.Empty;

    [JsonPropertyName("transactionType")]
    public string TransactionType { get; set; } = string.Empty;

    [JsonPropertyName("format")]
    public ReportFormatDto? Format { get; set; }

    [JsonPropertyName("effectivePage")]
    public EffectivePageDto? EffectivePage { get; set; }
}

public sealed class EffectivePageDto
{
    [JsonPropertyName("widthMm")]
    public double WidthMm { get; set; }

    [JsonPropertyName("heightMm")]
    public double HeightMm { get; set; }

    [JsonPropertyName("marginsMm")]
    public ReportMarginsDto? MarginsMm { get; set; }

    [JsonPropertyName("orientation")]
    public string Orientation { get; set; } = "portrait";

    [JsonPropertyName("isThermal")]
    public bool IsThermal { get; set; }
}

public sealed class ReportMarginsDto
{
    [JsonPropertyName("top")]
    public double Top { get; set; }

    [JsonPropertyName("right")]
    public double Right { get; set; }

    [JsonPropertyName("bottom")]
    public double Bottom { get; set; }

    [JsonPropertyName("left")]
    public double Left { get; set; }
}

public sealed class ReportFieldRegistryEntryDto
{
    [JsonPropertyName("fieldKey")]
    public string FieldKey { get; set; } = string.Empty;

    [JsonPropertyName("displayLabel")]
    public string DisplayLabel { get; set; } = string.Empty;

    [JsonPropertyName("token")]
    public string Token { get; set; } = string.Empty;

    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;

    [JsonPropertyName("dataPath")]
    public string DataPath { get; set; } = string.Empty;

    [JsonPropertyName("controlTypes")]
    public List<string> ControlTypes { get; set; } = [];
}

public sealed class ReportFieldRegistryResponseDto
{
    [JsonPropertyName("transactionType")]
    public string TransactionType { get; set; } = string.Empty;

    [JsonPropertyName("fields")]
    public List<ReportFieldRegistryEntryDto> Fields { get; set; } = [];
}

public sealed class ReportingApplyStandardLayoutsResultDto
{
    [JsonPropertyName("updated")]
    public int Updated { get; set; }

    [JsonPropertyName("transactionTypes")]
    public int TransactionTypes { get; set; }
}

public sealed class ReportingEnsureDefaultsResultDto
{
    [JsonPropertyName("ensured")]
    public bool Ensured { get; set; }

    [JsonPropertyName("count")]
    public int Count { get; set; }

    [JsonPropertyName("formatsCreated")]
    public int FormatsCreated { get; set; }
}

public sealed class ReportCustomPaperDto
{
    [JsonPropertyName("widthMm")]
    public double? WidthMm { get; set; }

    [JsonPropertyName("heightMm")]
    public double? HeightMm { get; set; }

    [JsonPropertyName("marginsMm")]
    public ReportMarginsDto? MarginsMm { get; set; }
}

public sealed class ReportPaperSizeDto
{
    [JsonPropertyName("key")]
    public string Key { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("widthMm")]
    public double WidthMm { get; set; }

    [JsonPropertyName("heightMm")]
    public double HeightMm { get; set; }

    [JsonPropertyName("marginsMm")]
    public ReportMarginsDto? MarginsMm { get; set; }

    [JsonPropertyName("orientation")]
    public string Orientation { get; set; } = "portrait";

    [JsonPropertyName("isThermal")]
    public bool IsThermal { get; set; }

    public string DisplayLabel => IsThermal ? $"{Name} ({WidthMm:0}×{HeightMm:0} mm)" : $"{Name}";
}

public sealed class ReportFormatUpdateRequest
{
    [JsonPropertyName("formatName")]
    public string? FormatName { get; set; }

    [JsonPropertyName("paperSizeKey")]
    public string? PaperSizeKey { get; set; }

    [JsonPropertyName("orientation")]
    public string? Orientation { get; set; }

    [JsonPropertyName("customPaper")]
    public ReportCustomPaperDto? CustomPaper { get; set; }

    [JsonPropertyName("layoutJson")]
    public object? LayoutJson { get; set; }

    [JsonPropertyName("printSettings")]
    public BillFormatPrintSettings? PrintSettings { get; set; }
}
