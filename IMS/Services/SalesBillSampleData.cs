using IMS.Services.Api.Dtos;

namespace IMS.Services;

public static class SalesBillSampleData
{
    public static SalesOrderDto CreateSampleOrder() => new()
    {
        DocNo = 1001,
        FormattedDocNo = "INV-1001",
        BillDate = DateTime.Today.ToString("dd-MMM-yyyy"),
        Customer = "Sample Customer Pvt Ltd",
        CustomerDetails = "+91 98765 43210",
        SalesMan = "Express Logistics",
        ShippingAddress = "Warehouse A, Industrial Area",
        DocumentTitle = "Tax Invoice (Preview)",
        Lines =
        [
            new SalesOrderLineDto
            {
                Sr = 1,
                ProductRetailCode = "SKU-001",
                ItemDescription = "Cotton Shirt — Blue / L",
                Qty = "2",
                Rate = "899.00",
                DiscPercent = "5",
                TaxPercent = "12",
                Amount = "1708.20"
            },
            new SalesOrderLineDto
            {
                Sr = 2,
                ProductRetailCode = "SKU-002",
                ItemDescription = "Denim Jeans — 32",
                Qty = "1",
                Rate = "1499.00",
                DiscPercent = "0",
                TaxPercent = "12",
                Amount = "1499.00"
            }
        ],
        Totals = new SalesOrderTotalsDto
        {
            Gross = "3207.20",
            Discount = "89.80",
            Net = "3117.40",
            SaleAmount = "3117.40"
        }
    };

    public static SalesOrderDto CreateSamplePurchaseOrder(string transactionType = "grn") =>
        transactionType.Trim().ToLowerInvariant() switch
        {
            "purchase_order" => CreateSampleWithTitle("PURCHASE ORDER", "PO-1001"),
            "purchase_invoice" => CreateSampleWithTitle("PURCHASE INVOICE", "PI-1001"),
            "purchase_return" => CreateSampleWithTitle("PURCHASE RETURN", "PR-1001"),
            _ => CreateSampleWithTitle("GOODS RECEIPT NOTE", "GRN-1001")
        };

    private static SalesOrderDto CreateSampleWithTitle(string title, string docNo) => new()
    {
        DocNo = 1001,
        FormattedDocNo = docNo,
        BillDate = DateTime.Today.ToString("dd-MMM-yyyy"),
        Customer = "Sample Supplier Pvt Ltd",
        CustomerDetails = "+91 91234 56789",
        DocumentTitle = title,
        Lines =
        [
            new SalesOrderLineDto
            {
                Sr = 1,
                ProductRetailCode = "RM-001",
                ItemDescription = "Raw Material A",
                Qty = "100",
                Rate = "45.00",
                Amount = "4500.00"
            },
            new SalesOrderLineDto
            {
                Sr = 2,
                ProductRetailCode = "RM-002",
                ItemDescription = "Raw Material B",
                Qty = "50",
                Rate = "120.00",
                Amount = "6000.00"
            }
        ],
        Totals = new SalesOrderTotalsDto
        {
            TotQty = "150",
            Gross = "10500.00",
            Net = "10500.00",
            SaleAmount = "10500.00",
            OrderAmount = "10500.00"
        }
    };
}
