using Ims.Domain.Common;

namespace Ims.Domain.Masters;

public sealed class Product : EntityBase, IYearScoped
{
    public string YearDatabaseName { get; set; } = string.Empty;

    public string Code { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Category { get; set; } = "General";

    public string Unit { get; set; } = "EA";

    public string? Size { get; set; }

    public string? Length { get; set; }

    public string? Brand { get; set; }

    public string? HsnCode { get; set; }

    public decimal SalePrice { get; set; }

    public decimal PurchasePrice { get; set; }

    public decimal ReorderQty { get; set; }

    public decimal MinOrderQty { get; set; }

    public decimal Cgst { get; set; }

    public decimal Sgst { get; set; }

    public decimal Igst { get; set; }

    public string? ProductType { get; set; }

    public string? ProductMainGroup { get; set; }

    public string? ProductSubGroup { get; set; }

    public string? AssemblyType { get; set; }

    public string? SaleUom { get; set; }

    public string? PurchaseUom { get; set; }

    public bool SerialApplicable { get; set; }

    public bool GstExempt { get; set; }

    public bool ActiveStatus { get; set; } = true;

    public string? ProductImage { get; set; }

    public string TaxType { get; set; } = "GST";

    public string TaxPercent { get; set; } = "18";

    public decimal StockQty { get; set; }
}
