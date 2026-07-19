namespace IMS.Services;

public static class SalesOrderListColumnCatalog
{
    public const string ModuleKey = "sales_order_list";

    public static IReadOnlyList<ListColumnDef> All { get; } =
    [
        new("soNo", "SO No", true),
        new("soDate", "SO Date", true),
        new("customer", "Customer", true),
        new("totalTaxable", "Total Taxable Amount"),
        new("totalCgst", "Total CGST"),
        new("totalSgst", "Total SGST"),
        new("totalIgst", "Total IGST"),
        new("totalDiscount", "Total Discount"),
        new("salesAmt", "Sales Amt", true, IsAmount: true),
        new("paidAmt", "Paid Amt", IsAmount: true),
        new("balance", "Balance", true, IsAmount: true),
        new("status", "Status", true)
    ];

    public static IReadOnlyList<string> DefaultVisibleKeys =>
        All.Select(c => c.Key).ToList();

    public static IReadOnlyList<string> NormalizeVisibleKeys(IEnumerable<string>? keys) =>
        ListColumnCatalog.NormalizeVisibleKeys(All, keys, DefaultVisibleKeys);
}
