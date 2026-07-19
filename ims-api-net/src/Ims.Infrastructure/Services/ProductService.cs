using Ims.Application.Services;
using Ims.Domain.Common;
using Ims.Domain.Masters;
using Microsoft.EntityFrameworkCore;

namespace Ims.Infrastructure.Services;

public sealed class ProductService(ImsDbContext db) : IProductService
{
    public async Task<object> ListAsync(string yearDb, int page, int limit, string? search, CancellationToken ct)
    {
        var query = db.Products.AsNoTracking().Where(p => p.YearDatabaseName == yearDb);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(p => EF.Functions.ILike(p.Code, $"%{term}%") || EF.Functions.ILike(p.Name, $"%{term}%"));
        }

        var total = await query.CountAsync(ct);
        var items = await query.OrderBy(p => p.Code)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(ct);

        return new { items = items.Select(MongoJson.MapProduct), total, page, limit };
    }

    public async Task<object> SearchAsync(string yearDb, string term, int limit, CancellationToken ct)
    {
        term = term.Trim();
        if (string.IsNullOrEmpty(term))
            return new { items = Array.Empty<object>(), total = 0 };

        var query = db.Products.AsNoTracking()
            .Where(p => p.YearDatabaseName == yearDb &&
                        (EF.Functions.ILike(p.Code, $"%{term}%") || EF.Functions.ILike(p.Name, $"%{term}%")));

        var total = await query.CountAsync(ct);
        var items = await query.OrderBy(p => p.Code).Take(limit).ToListAsync(ct);

        return new
        {
            items = items.Select(p => new
            {
                code = p.Code,
                name = p.Name,
                rate = p.SalePrice,
                purchasePrice = p.PurchasePrice,
                stockQty = p.StockQty,
                taxType = p.TaxType,
                taxPercent = ResolveTaxPercent(p)
            }),
            total
        };
    }

    public async Task<object?> LookupAsync(string yearDb, string term, CancellationToken ct)
    {
        term = term.Trim();
        if (string.IsNullOrEmpty(term)) return null;

        var product = await db.Products.AsNoTracking()
            .Where(p => p.YearDatabaseName == yearDb)
            .FirstOrDefaultAsync(p => EF.Functions.ILike(p.Code, term), ct)
            ?? await db.Products.AsNoTracking()
                .Where(p => p.YearDatabaseName == yearDb && EF.Functions.ILike(p.Name, $"%{term}%"))
                .FirstOrDefaultAsync(ct);

        if (product is null) return null;

        return new
        {
            code = product.Code,
            name = product.Name,
            rate = product.SalePrice,
            purchasePrice = product.PurchasePrice,
            stockQty = product.StockQty,
            taxType = product.TaxType,
            taxPercent = product.TaxPercent ?? ResolveTaxPercent(product)
        };
    }

    public Task<Product?> GetByCodeAsync(string yearDb, string code, CancellationToken ct) =>
        db.Products.AsNoTracking()
            .FirstOrDefaultAsync(p => p.YearDatabaseName == yearDb && p.Code == code.ToUpperInvariant(), ct);

    public Task<Product?> GetByIdAsync(string yearDb, string id, CancellationToken ct) =>
        db.Products.AsNoTracking()
            .FirstOrDefaultAsync(p => p.YearDatabaseName == yearDb && p.Id == id, ct);

    public async Task<Product> CreateAsync(string yearDb, Product product, CancellationToken ct)
    {
        product.Id = ObjectIdGenerator.NewId();
        product.YearDatabaseName = yearDb;
        product.Code = product.Code.Trim().ToUpperInvariant();
        product.CreatedAt = product.UpdatedAt = DateTime.UtcNow;
        db.Products.Add(product);
        await db.SaveChangesAsync(ct);
        return product;
    }

    public async Task<Product?> UpdateByCodeAsync(string yearDb, string code, Product patch, CancellationToken ct)
    {
        var product = await db.Products.FirstOrDefaultAsync(
            p => p.YearDatabaseName == yearDb && p.Code == code.ToUpperInvariant(), ct);
        if (product is null) return null;
        ApplyPatch(product, patch);
        await db.SaveChangesAsync(ct);
        return product;
    }

    public async Task<Product?> UpdateByIdAsync(string yearDb, string id, Product patch, CancellationToken ct)
    {
        var product = await db.Products.FirstOrDefaultAsync(
            p => p.YearDatabaseName == yearDb && p.Id == id, ct);
        if (product is null) return null;
        ApplyPatch(product, patch);
        await db.SaveChangesAsync(ct);
        return product;
    }

    public async Task<bool> DeleteByCodeAsync(string yearDb, string code, CancellationToken ct)
    {
        var product = await db.Products.FirstOrDefaultAsync(
            p => p.YearDatabaseName == yearDb && p.Code == code.ToUpperInvariant(), ct);
        if (product is null) return false;
        db.Products.Remove(product);
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> DeleteByIdAsync(string yearDb, string id, CancellationToken ct)
    {
        var product = await db.Products.FirstOrDefaultAsync(
            p => p.YearDatabaseName == yearDb && p.Id == id, ct);
        if (product is null) return false;
        db.Products.Remove(product);
        await db.SaveChangesAsync(ct);
        return true;
    }

    private static void ApplyPatch(Product target, Product patch)
    {
        if (!string.IsNullOrWhiteSpace(patch.Name)) target.Name = patch.Name;
        if (!string.IsNullOrWhiteSpace(patch.Category)) target.Category = patch.Category;
        if (!string.IsNullOrWhiteSpace(patch.Unit)) target.Unit = patch.Unit;
        target.SalePrice = patch.SalePrice;
        target.PurchasePrice = patch.PurchasePrice;
        target.ReorderQty = patch.ReorderQty;
        target.MinOrderQty = patch.MinOrderQty;
        target.Cgst = patch.Cgst;
        target.Sgst = patch.Sgst;
        target.Igst = patch.Igst;
        target.StockQty = patch.StockQty;
        target.ActiveStatus = patch.ActiveStatus;
        target.TaxType = patch.TaxType;
        target.TaxPercent = patch.TaxPercent;
        target.UpdatedAt = DateTime.UtcNow;
    }

    private static string ResolveTaxPercent(Product product)
    {
        if (!string.IsNullOrWhiteSpace(product.TaxPercent)) return product.TaxPercent;
        var fromGst = product.Igst > 0 ? product.Igst : product.Cgst + product.Sgst;
        return (fromGst > 0 ? fromGst : 18).ToString();
    }
}
