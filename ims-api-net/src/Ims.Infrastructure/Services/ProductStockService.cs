using System.Globalization;
using System.Text.Json;
using Ims.Application.Documents;
using Ims.Domain.Masters;
using Ims.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Ims.Infrastructure.Services;

public sealed class ProductStockService(ImsDbContext db)
{
    public async Task ApplyDocumentStockAsync(
        string yearDb,
        JsonElement? linesElement,
        StockDirection direction,
        CancellationToken ct = default)
    {
        if (direction == StockDirection.None) return;
        if (linesElement is null || linesElement.Value.ValueKind != JsonValueKind.Array) return;

        var sign = direction == StockDirection.Out ? -1 : 1;
        foreach (var line in linesElement.Value.EnumerateArray())
        {
            var delta = ParseQty(GetLineString(line, "qty")) * sign;
            if (delta == 0) continue;

            var product = await ResolveProductForLineAsync(yearDb, line, ct);
            if (product is null) continue;

            var current = product.StockQty;
            product.StockQty = Math.Max(0, current + delta);

            var lineRate = ParseRate(GetLineString(line, "rate"));
            if (lineRate > 0 && product.PurchasePrice <= 0)
                product.PurchasePrice = lineRate;

            if (string.IsNullOrWhiteSpace(product.Unit))
                product.Unit = "EA";

            if (!product.ActiveStatus && direction == StockDirection.In)
                product.ActiveStatus = true;

            product.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(ct);
    }

    public async Task ReplaceDocumentStockAsync(
        string yearDb,
        JsonElement? oldLines,
        JsonElement? newLines,
        StockDirection direction,
        StockDirection priorDirection,
        CancellationToken ct = default)
    {
        var oldDir = priorDirection;
        var newDir = direction;

        if (oldDir != StockDirection.None)
        {
            var revert = oldDir == StockDirection.In ? StockDirection.Out : StockDirection.In;
            await ApplyDocumentStockAsync(yearDb, oldLines, revert, ct);
        }

        if (newDir != StockDirection.None)
            await ApplyDocumentStockAsync(yearDb, newLines, newDir, ct);
    }

    private async Task<Product?> ResolveProductForLineAsync(string yearDb, JsonElement line, CancellationToken ct)
    {
        var code = GetLineString(line, "productRetailCode");
        if (string.IsNullOrEmpty(code))
            code = GetLineString(line, "productCode");

        code = code.Trim().ToUpperInvariant();
        if (!string.IsNullOrEmpty(code))
        {
            var byCode = await db.Products.FirstOrDefaultAsync(
                p => p.YearDatabaseName == yearDb && p.Code == code, ct);
            if (byCode is not null) return byCode;
        }

        var name = GetLineString(line, "itemDescription");
        if (string.IsNullOrEmpty(name))
            name = GetLineString(line, "productName");

        name = name.Trim();
        if (string.IsNullOrEmpty(name)) return null;

        return await db.Products.FirstOrDefaultAsync(
            p => p.YearDatabaseName == yearDb && EF.Functions.ILike(p.Name, name), ct);
    }

    private static string GetLineString(JsonElement line, string property)
    {
        if (line.TryGetProperty(property, out var el) && el.ValueKind == JsonValueKind.String)
            return el.GetString() ?? "";
        if (line.TryGetProperty(property, out el) && el.ValueKind == JsonValueKind.Number)
            return el.GetRawText();
        return "";
    }

    private static decimal ParseQty(string? qty)
    {
        var n = decimal.TryParse((qty ?? "0").Replace(",", ""), NumberStyles.Any, CultureInfo.InvariantCulture, out var v)
            ? v : 0;
        return n;
    }

    private static decimal ParseRate(string? rate)
    {
        var n = decimal.TryParse((rate ?? "0").Replace(",", ""), NumberStyles.Any, CultureInfo.InvariantCulture, out var v)
            ? v : 0;
        return n;
    }
}
