namespace IMS.Models;

public enum SalesRateSource
{
    ProductMaster,
    PurchaseInvoice
}

public sealed class SalesPurchaseSettings
{
    public SalesRateSource SalesRateSource { get; set; } = SalesRateSource.ProductMaster;
}
