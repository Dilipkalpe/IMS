using IMS.Models;

namespace IMS.Services;

public static class DocumentListColumnCatalog
{
    public static string ModuleKey(SalesEntryType type) => $"sales_doc_{type.ToString().ToLowerInvariant()}";
    public static string ModuleKey(PurchaseEntryType type) => $"purchase_doc_{type.ToString().ToLowerInvariant()}";

    public static IReadOnlyList<ListColumnDef> ForSales(SalesEntryType type) =>
        type switch
        {
            SalesEntryType.DeliveryChallan =>
            [
                new("col1", SalesEntryCatalog.Get(type).Col1Header, true),
                new("col2", SalesEntryCatalog.Get(type).Col2Header, true),
                new("col3", SalesEntryCatalog.Get(type).Col3Header, true),
                new("col4", SalesEntryCatalog.Get(type).Col4Header, true),
                new("status", "Status", true)
            ],
            _ =>
            [
                new("col1", SalesEntryCatalog.Get(type).Col1Header, true),
                new("col2", SalesEntryCatalog.Get(type).Col2Header, true),
                new("col3", SalesEntryCatalog.Get(type).Col3Header, true, IsAmount: true),
                new("col4", SalesEntryCatalog.Get(type).Col4Header, true),
                new("status", "Status", true)
            ]
        };

    public static IReadOnlyList<ListColumnDef> ForPurchase(PurchaseEntryType type) =>
    [
        new("col1", PurchaseEntryCatalog.Get(type).Col1Header, true),
        new("col2", PurchaseEntryCatalog.Get(type).Col2Header, true),
        new("col3", PurchaseEntryCatalog.Get(type).Col3Header, true, IsAmount: true),
        new("col4", PurchaseEntryCatalog.Get(type).Col4Header, true),
        new("status", "Status", true)
    ];

    public static IReadOnlyList<string> DefaultKeys(IReadOnlyList<ListColumnDef> all) =>
        all.Select(c => c.Key).ToList();
}
