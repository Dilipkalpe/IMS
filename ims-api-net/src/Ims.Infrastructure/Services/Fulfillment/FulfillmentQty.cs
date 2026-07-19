using System.Globalization;
using System.Text.Json;
using Ims.Domain.Entities;

namespace Ims.Infrastructure.Services.Fulfillment;

public static class FulfillmentQty
{
    private static readonly JsonSerializerOptions WebOptions = new(JsonSerializerDefaults.Web);

    public static decimal ParseQty(object? value)
    {
        if (value is null) return 0;
        if (value is decimal d) return d;
        if (value is double dbl) return (decimal)dbl;
        if (value is int i) return i;
        if (value is long l) return l;
        if (value is JsonElement el)
        {
            if (el.ValueKind == JsonValueKind.Number && el.TryGetDecimal(out var n)) return n;
            value = el.GetString() ?? el.GetRawText();
        }

        var s = (value.ToString() ?? "0").Replace(",", "", StringComparison.Ordinal).Trim();
        return decimal.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsed) ? parsed : 0;
    }

    public static string FormatQty(decimal n)
    {
        var v = Math.Round(n, 3, MidpointRounding.AwayFromZero);
        if (v == Math.Truncate(v))
            return ((long)v).ToString(CultureInfo.InvariantCulture);
        return v.ToString("0.###", CultureInfo.InvariantCulture);
    }

    public static string LineKey(string? prefix, object? docNo, object? lineSr, string defaultPrefix) =>
        $"{NormalizePrefix(prefix, defaultPrefix)}|{CoerceInt(docNo)}|{CoerceInt(lineSr)}";

    public static string NormalizePrefix(string? prefix, string defaultPrefix) =>
        string.IsNullOrWhiteSpace(prefix) ? defaultPrefix.ToUpperInvariant() : prefix.Trim().ToUpperInvariant();

    public static int CoerceInt(object? value)
    {
        if (value is null) return 0;
        if (value is int i) return i;
        if (value is long l) return (int)l;
        if (value is decimal d) return (int)d;
        if (value is JsonElement el)
        {
            if (el.ValueKind == JsonValueKind.Number && el.TryGetInt32(out var n)) return n;
            return int.TryParse(el.GetString(), out var p) ? p : 0;
        }
        return int.TryParse(value.ToString(), out var parsed) ? parsed : 0;
    }

    public static string NormalizeParty(object? value) => (value?.ToString() ?? "").Trim();

    public static bool PartiesMatch(object? a, object? b) =>
        string.Equals(NormalizeParty(a), NormalizeParty(b), StringComparison.OrdinalIgnoreCase);

    public static Dictionary<string, decimal> BuildLineQtyIndex(
        IEnumerable<IReadOnlyList<Dictionary<string, object?>>> documentLines,
        string prefixField,
        string docNoField,
        string lineSrField,
        string defaultPrefix,
        string qtyField = "qty")
    {
        var index = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
        foreach (var lines in documentLines)
        {
            foreach (var line in lines)
            {
                if (!line.TryGetValue(docNoField, out var docNo) || docNo is null) continue;
                if (!line.TryGetValue(lineSrField, out var lineSr) || lineSr is null) continue;

                var prefix = NormalizePrefix(line.GetValueOrDefault(prefixField)?.ToString(), defaultPrefix);
                var key = LineKey(prefix, docNo, lineSr, defaultPrefix);
                index.TryGetValue(key, out var current);
                index[key] = current + ParseQty(line.GetValueOrDefault(qtyField));
            }
        }
        return index;
    }

    public static decimal SumQtyFromIndex(
        IReadOnlyDictionary<string, decimal> index,
        string? prefix,
        object? docNo,
        object? lineSr,
        string defaultPrefix)
    {
        var key = LineKey(prefix, docNo, lineSr, defaultPrefix);
        return index.TryGetValue(key, out var qty) ? qty : 0;
    }

    public static List<Dictionary<string, object?>> EnsureMutableLines(Dictionary<string, object?> payload)
    {
        var lines = ExtractLines(payload.GetValueOrDefault("lines"));
        payload["lines"] = lines;
        return lines;
    }

    public static List<Dictionary<string, object?>> ExtractLines(object? linesObj)
    {
        var result = new List<Dictionary<string, object?>>();
        if (linesObj is null) return result;

        if (linesObj is JsonElement el && el.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in el.EnumerateArray())
            {
                if (item.ValueKind == JsonValueKind.Object)
                    result.Add(ToMutableDict(item));
            }
            return result;
        }

        if (linesObj is IEnumerable<object?> list)
        {
            foreach (var item in list)
            {
                if (item is Dictionary<string, object?> dict)
                    result.Add(dict);
                else if (item is JsonElement lineEl && lineEl.ValueKind == JsonValueKind.Object)
                    result.Add(ToMutableDict(lineEl));
                else if (item is IDictionary<string, object?> idict)
                    result.Add(new Dictionary<string, object?>(idict, StringComparer.OrdinalIgnoreCase));
            }
        }

        return result;
    }

    public static List<Dictionary<string, object?>> GetLinesFromBodyJson(string bodyJson)
    {
        using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(bodyJson) ? "{}" : bodyJson);
        if (!doc.RootElement.TryGetProperty("lines", out var lines) || lines.ValueKind != JsonValueKind.Array)
            return new List<Dictionary<string, object?>>();

        var result = new List<Dictionary<string, object?>>();
        foreach (var item in lines.EnumerateArray())
        {
            if (item.ValueKind == JsonValueKind.Object)
                result.Add(ToMutableDict(item));
        }
        return result;
    }

    public static Dictionary<string, object?> GetBodyDict(string bodyJson) =>
        JsonSerializer.Deserialize<Dictionary<string, object?>>(
            string.IsNullOrWhiteSpace(bodyJson) ? "{}" : bodyJson, WebOptions)
        ?? new Dictionary<string, object?>();

    public static void WriteBody(NumberedDocumentBase entity, Dictionary<string, object?> body)
    {
        // Re-serialize lines as plain objects (not JsonElement)
        if (body.TryGetValue("lines", out var linesObj))
            body["lines"] = ExtractLines(linesObj);

        entity.BodyJson = JsonSerializer.Serialize(body, WebOptions);
        entity.Status = body.GetValueOrDefault("status")?.ToString() ?? entity.Status;
        entity.UpdatedAt = DateTime.UtcNow;
    }

    public static void UpdateLineField(
        List<Dictionary<string, object?>> lines,
        Func<object?, bool> matchSr,
        string field,
        string value)
    {
        foreach (var line in lines)
        {
            if (matchSr(line.GetValueOrDefault("sr")))
                line[field] = value;
        }
    }

    private static Dictionary<string, object?> ToMutableDict(JsonElement el)
    {
        var dict = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
        foreach (var prop in el.EnumerateObject())
            dict[prop.Name] = DocumentJsonHelper.UnwrapForHook(prop.Value);
        return dict;
    }
}
