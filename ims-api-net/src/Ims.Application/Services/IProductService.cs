using Ims.Domain.Masters;

namespace Ims.Application.Services;

public interface IProductService
{
    Task<object> ListAsync(string yearDb, int page, int limit, string? search, CancellationToken ct);
    Task<object> SearchAsync(string yearDb, string term, int limit, CancellationToken ct);
    Task<object?> LookupAsync(string yearDb, string term, CancellationToken ct);
    Task<Product?> GetByCodeAsync(string yearDb, string code, CancellationToken ct);
    Task<Product?> GetByIdAsync(string yearDb, string id, CancellationToken ct);
    Task<Product> CreateAsync(string yearDb, Product product, CancellationToken ct);
    Task<Product?> UpdateByCodeAsync(string yearDb, string code, Product patch, CancellationToken ct);
    Task<Product?> UpdateByIdAsync(string yearDb, string id, Product patch, CancellationToken ct);
    Task<bool> DeleteByCodeAsync(string yearDb, string code, CancellationToken ct);
    Task<bool> DeleteByIdAsync(string yearDb, string id, CancellationToken ct);
}

public static class MongoJson
{
    public static object MapProduct(Product p) => new
    {
        _id = p.Id,
        id = p.Id,
        p.Code,
        p.Name,
        p.Category,
        p.Unit,
        p.Size,
        p.Length,
        p.Brand,
        p.HsnCode,
        p.SalePrice,
        p.PurchasePrice,
        p.ReorderQty,
        p.MinOrderQty,
        p.Cgst,
        p.Sgst,
        p.Igst,
        p.ProductType,
        p.ProductMainGroup,
        p.ProductSubGroup,
        p.AssemblyType,
        p.SaleUom,
        p.PurchaseUom,
        p.SerialApplicable,
        p.GstExempt,
        p.ActiveStatus,
        p.ProductImage,
        p.TaxType,
        p.TaxPercent,
        p.StockQty,
        createdAt = p.CreatedAt,
        updatedAt = p.UpdatedAt
    };

    public static object MapAccount(Account a) => new
    {
        _id = a.Id,
        id = a.Id,
        a.AccountType,
        a.Code,
        a.Name,
        a.ContactPerson,
        a.Address,
        a.City,
        a.State,
        a.Pincode,
        a.Phone,
        a.MobileNo,
        a.Email,
        a.Gstin,
        a.Pan,
        a.CreditLimit,
        a.CreditDays,
        a.OpeningBalance,
        a.OpeningBalanceType,
        a.CustomerType,
        a.ActiveStatus,
        createdAt = a.CreatedAt,
        updatedAt = a.UpdatedAt
    };
}
