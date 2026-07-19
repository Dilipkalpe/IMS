using System.Globalization;
using System.Text.Json;

namespace Ims.Infrastructure.Services;

public static class DocumentJsonHelper
{
    private static readonly JsonSerializerOptions WebOptions = new(JsonSerializerDefaults.Web);

    public static Dictionary<string, object?> ToUpdatePayload(IReadOnlyDictionary<string, object?>? body)
    {
        var result = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
        if (body is null) return result;

        foreach (var (key, value) in body)
        {
            if (key is "_id" or "id" or "__v" or "createdAt" or "updatedAt")
                continue;
            result[key] = UnwrapValue(value);
        }

        return result;
    }

    public static Dictionary<string, object?> NormalizeTotals(Dictionary<string, object?> payload, bool isPurchase)
    {
        if (!payload.TryGetValue("totals", out var totalsObj) || totalsObj is null)
        {
            payload["totals"] = new Dictionary<string, object?>();
            return payload;
        }

        var totals = ToDictionary(totalsObj);
        if (isPurchase)
        {
            var amount = totals.GetValueOrDefault("orderAmount") ?? totals.GetValueOrDefault("saleAmount") ?? totals.GetValueOrDefault("net") ?? "0";
            totals["orderAmount"] = amount;
            totals["saleAmount"] = totals.GetValueOrDefault("saleAmount") ?? amount;
        }
        else
        {
            var sale = totals.GetValueOrDefault("saleAmount") ?? totals.GetValueOrDefault("orderAmount") ?? totals.GetValueOrDefault("net") ?? "0";
            totals["saleAmount"] = sale;
            totals["orderAmount"] = totals.GetValueOrDefault("orderAmount") ?? sale;
        }

        payload["totals"] = totals;
        return payload;
    }

    public static object ToApiResponse(Domain.Entities.NumberedDocumentBase doc)
    {
        var body = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(doc.BodyJson, WebOptions)
                   ?? new Dictionary<string, JsonElement>();

        var result = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
        foreach (var (k, v) in body)
            result[k] = JsonElementToObject(v);

        result["_id"] = doc.Id;
        result["id"] = doc.Id;
        result["createdAt"] = doc.CreatedAt;
        result["updatedAt"] = doc.UpdatedAt;
        return result;
    }

    public static Dictionary<string, object?> PayloadToDictionary(IReadOnlyDictionary<string, object?> payload) =>
        payload.ToDictionary(k => k.Key, v => v.Value, StringComparer.OrdinalIgnoreCase);

    public static string SerializeBody(Dictionary<string, object?> payload) =>
        JsonSerializer.Serialize(payload, WebOptions);

    public static JsonElement? GetLinesElement(Dictionary<string, object?> payload)
    {
        if (!payload.TryGetValue("lines", out var lines) || lines is null) return null;
        var json = JsonSerializer.Serialize(lines, WebOptions);
        using var doc = JsonDocument.Parse(json);
        return doc.RootElement.Clone();
    }

    public static JsonElement? GetLinesFromBodyJson(string bodyJson)
    {
        using var doc = JsonDocument.Parse(bodyJson);
        if (doc.RootElement.TryGetProperty("lines", out var lines))
            return lines.Clone();
        return null;
    }

    public static void ApplyNumbers(Dictionary<string, object?> payload, int docNo, string? prefix, string defaultPrefix)
    {
        var docPrefix = DocPrefixHelper.NormalizeSoPrefix(prefix ?? payload.GetValueOrDefault("docPrefix")?.ToString() ?? defaultPrefix);
        payload["docPrefix"] = docPrefix;
        payload["docNo"] = docNo;
        payload["formattedDocNo"] = DocPrefixHelper.FormatPrefixDocNo(docPrefix, docNo);
    }

    public static void SyncIndexedFields(Domain.Entities.NumberedDocumentBase entity, Dictionary<string, object?> payload, string? tranDateField)
    {
        entity.DocPrefix = payload.GetValueOrDefault("docPrefix")?.ToString() ?? entity.DocPrefix;
        entity.DocNo = CoerceInt(payload.GetValueOrDefault("docNo"), entity.DocNo);
        entity.FormattedDocNo = payload.GetValueOrDefault("formattedDocNo")?.ToString() ?? entity.FormattedDocNo;
        entity.Status = payload.GetValueOrDefault("status")?.ToString();
        entity.Customer = payload.GetValueOrDefault("customer")?.ToString();
        entity.Supplier = payload.GetValueOrDefault("supplier")?.ToString();
        entity.SalesMan = payload.GetValueOrDefault("salesMan")?.ToString();
        entity.Narration = payload.GetValueOrDefault("narration")?.ToString();

        if (!string.IsNullOrEmpty(tranDateField) && payload.TryGetValue(tranDateField, out var dateVal) && dateVal is not null)
        {
            entity.TranDate = CoerceUtcDate(dateVal);
        }
    }

    private static DateTime? CoerceUtcDate(object? dateVal)
    {
        if (dateVal is null) return null;
        if (dateVal is DateTime dt)
            return dt.Kind == DateTimeKind.Utc ? dt : DateTime.SpecifyKind(dt, DateTimeKind.Utc);
        if (dateVal is JsonElement el)
        {
            if (el.ValueKind == JsonValueKind.String && DateTime.TryParse(el.GetString(), CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var parsedEl))
                return parsedEl;
            return null;
        }
        if (DateTime.TryParse(dateVal.ToString(), CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var parsed))
            return parsed;
        return null;
    }

    private static object? UnwrapValue(object? value) => value switch
    {
        JsonElement el => JsonElementToObject(el),
        _ => value
    };

    public static object? UnwrapForHook(object? value) => UnwrapValue(value);

    public static int CoerceInt(object? value, int fallback = 0)
    {
        if (value is null) return fallback;
        if (value is int i) return i;
        if (value is long l) return (int)l;
        if (value is JsonElement el)
        {
            if (el.ValueKind == JsonValueKind.Number && el.TryGetInt32(out var n)) return n;
            if (int.TryParse(el.GetString(), out var parsed)) return parsed;
            return fallback;
        }
        return int.TryParse(value.ToString(), out var p) ? p : fallback;
    }

    private static Dictionary<string, object?> ToDictionary(object obj)
    {
        if (obj is Dictionary<string, object?> dict)
            return new Dictionary<string, object?>(dict, StringComparer.OrdinalIgnoreCase);
        var json = JsonSerializer.Serialize(obj, WebOptions);
        return JsonSerializer.Deserialize<Dictionary<string, object?>>(json, WebOptions)
               ?? new Dictionary<string, object?>();
    }

    private static object? JsonElementToObject(JsonElement el) => el.ValueKind switch
    {
        JsonValueKind.String => el.GetString(),
        JsonValueKind.Number => el.TryGetInt64(out var l) ? l : el.GetDecimal(),
        JsonValueKind.True => true,
        JsonValueKind.False => false,
        JsonValueKind.Null => null,
        JsonValueKind.Array => el.EnumerateArray().Select(JsonElementToObject).ToList(),
        JsonValueKind.Object => el.EnumerateObject().ToDictionary(p => p.Name, p => JsonElementToObject(p.Value), StringComparer.OrdinalIgnoreCase),
        _ => el.GetRawText()
    };
}
