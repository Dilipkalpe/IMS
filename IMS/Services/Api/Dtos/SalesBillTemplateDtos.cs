using System.Text.Json;
using System.Text.Json.Serialization;
using IMS.Models;

namespace IMS.Services.Api.Dtos;

public sealed class SalesBillTemplateDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("templateKey")]
    public string TemplateKey { get; set; } = string.Empty;

    [JsonPropertyName("formatCode")]
    public string FormatCode { get; set; } = string.Empty;

    [JsonPropertyName("transactionType")]
    public string TransactionType { get; set; } = "sales_invoice";

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("appliesToDocTypes")]
    public List<string> AppliesToDocTypes { get; set; } = [];

    [JsonPropertyName("isSystem")]
    public bool IsSystem { get; set; }

    [JsonPropertyName("isDefault")]
    public bool IsDefault { get; set; }

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; } = true;

    [JsonPropertyName("printSettings")]
    public BillFormatPrintSettings PrintSettings { get; set; } = new();

    [JsonPropertyName("visibilityRules")]
    public BillFormatVisibilityRules VisibilityRules { get; set; } = new();

    [JsonPropertyName("layoutJson")]
    public JsonElement LayoutJson { get; set; }

    [JsonPropertyName("version")]
    public int Version { get; set; }

    [JsonPropertyName("updatedBy")]
    public string UpdatedBy { get; set; } = string.Empty;

    [JsonPropertyName("createdAt")]
    public DateTime? CreatedAt { get; set; }

    [JsonPropertyName("updatedAt")]
    public DateTime? UpdatedAt { get; set; }

    public SalesBillLayoutDefinition? ParseLayout()
    {
        if (LayoutJson.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null)
            return null;
        return LayoutJson.Deserialize<SalesBillLayoutDefinition>(ImsApiClient.SerializerOptions);
    }
}

public sealed class SalesBillTemplateCreateRequest
{
    [JsonPropertyName("templateKey")]
    public string TemplateKey { get; set; } = string.Empty;

    [JsonPropertyName("formatCode")]
    public string? FormatCode { get; set; }

    [JsonPropertyName("transactionType")]
    public string? TransactionType { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("appliesToDocTypes")]
    public List<string>? AppliesToDocTypes { get; set; }

    [JsonPropertyName("isDefault")]
    public bool IsDefault { get; set; }

    [JsonPropertyName("printSettings")]
    public BillFormatPrintSettings? PrintSettings { get; set; }

    [JsonPropertyName("visibilityRules")]
    public BillFormatVisibilityRules? VisibilityRules { get; set; }

    [JsonPropertyName("layoutJson")]
    public SalesBillLayoutDefinition? LayoutJson { get; set; }
}

public sealed class SalesBillTemplateUpdateRequest
{
    [JsonPropertyName("formatCode")]
    public string? FormatCode { get; set; }

    [JsonPropertyName("transactionType")]
    public string? TransactionType { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("appliesToDocTypes")]
    public List<string>? AppliesToDocTypes { get; set; }

    [JsonPropertyName("isDefault")]
    public bool? IsDefault { get; set; }

    [JsonPropertyName("isActive")]
    public bool? IsActive { get; set; }

    [JsonPropertyName("printSettings")]
    public BillFormatPrintSettings? PrintSettings { get; set; }

    [JsonPropertyName("visibilityRules")]
    public BillFormatVisibilityRules? VisibilityRules { get; set; }

    [JsonPropertyName("layoutJson")]
    public SalesBillLayoutDefinition? LayoutJson { get; set; }
}

public sealed class SalesBillTemplateDuplicateRequest
{
    [JsonPropertyName("templateKey")]
    public string TemplateKey { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string? Name { get; set; }
}

public sealed class SalesBillTemplateEnsureDefaultsResult
{
    [JsonPropertyName("created")]
    public int Created { get; set; }

    [JsonPropertyName("total")]
    public int Total { get; set; }
}
