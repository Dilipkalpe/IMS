using Ims.Application.Documents;
using Ims.Domain.Entities;
using Ims.Infrastructure.Services;
using Ims.Infrastructure.Services.Fulfillment;
using Ims.Infrastructure.Services.Hooks;
using Microsoft.Extensions.DependencyInjection;

namespace Ims.Infrastructure;

public interface INumberedDocumentServiceFactory
{
    INumberedDocumentService Get(NumberedDocKind kind);
}

public sealed class NumberedDocumentServiceFactory : INumberedDocumentServiceFactory
{
    private readonly IReadOnlyDictionary<NumberedDocKind, INumberedDocumentService> _services;

    public NumberedDocumentServiceFactory(
        ImsDbContext db,
        CounterService counters,
        ProductStockService stock,
        SalesInvoiceDocumentHooks salesInvoiceHooks,
        DeliveryChallanDocumentHooks deliveryChallanHooks,
        PurchaseInvoiceDocumentHooks purchaseInvoiceHooks,
        GrnDocumentHooks grnHooks,
        EmptyDocumentHooks emptyHooks)
    {
        _services = new Dictionary<NumberedDocKind, INumberedDocumentService>
        {
            [NumberedDocKind.SalesInvoice] = new NumberedDocumentService<SalesInvoiceDocument>(db, counters, stock, NumberedDocConfigs.SalesInvoice, salesInvoiceHooks),
            [NumberedDocKind.DeliveryChallan] = new NumberedDocumentService<DeliveryChallanDocument>(db, counters, stock, NumberedDocConfigs.DeliveryChallan, deliveryChallanHooks),
            [NumberedDocKind.SalesReturn] = new NumberedDocumentService<SalesReturnDocument>(db, counters, stock, NumberedDocConfigs.SalesReturn, emptyHooks),
            [NumberedDocKind.PurchaseInvoice] = new NumberedDocumentService<PurchaseInvoiceDocument>(db, counters, stock, NumberedDocConfigs.PurchaseInvoice, purchaseInvoiceHooks),
            [NumberedDocKind.Grn] = new NumberedDocumentService<GrnDocument>(db, counters, stock, NumberedDocConfigs.Grn, grnHooks),
            [NumberedDocKind.PurchaseReturn] = new NumberedDocumentService<PurchaseReturnDocument>(db, counters, stock, NumberedDocConfigs.PurchaseReturn, emptyHooks),
            [NumberedDocKind.PurchaseOrder] = new NumberedDocumentService<PurchaseOrderDocument>(db, counters, stock, NumberedDocConfigs.PurchaseOrder, emptyHooks)
        };
    }

    public INumberedDocumentService Get(NumberedDocKind kind) => _services[kind];
}

public static class NumberedDocumentRegistration
{
    public static IServiceCollection AddNumberedDocuments(this IServiceCollection services)
    {
        services.AddScoped<CounterService>();
        services.AddScoped<ProductStockService>();
        services.AddScoped<DeliveryChallanInvoicingService>();
        services.AddScoped<GrnInvoicingService>();
        services.AddScoped<PurchaseOrderFulfillmentService>();
        services.AddScoped<SalesInvoiceDocumentHooks>();
        services.AddScoped<DeliveryChallanDocumentHooks>();
        services.AddScoped<PurchaseInvoiceDocumentHooks>();
        services.AddScoped<GrnDocumentHooks>();
        services.AddScoped<EmptyDocumentHooks>();
        services.AddScoped<INumberedDocumentServiceFactory, NumberedDocumentServiceFactory>();
        return services;
    }
}

internal static class NumberedDocConfigs
{
    public static NumberedDocConfig SalesInvoice => new()
    {
        Kind = NumberedDocKind.SalesInvoice,
        CounterNamespace = "sales_invoice",
        DefaultDocPrefix = "INV",
        DocTypeKey = "sales_invoice",
        NotFoundLabel = "Sales invoice",
        ApiRoutePrefix = "sales-invoices",
        StockDirection = StockDirection.Out,
        NormalizeInvoicePayment = true,
        TranDateField = "invoiceDate"
    };

    public static NumberedDocConfig DeliveryChallan => new()
    {
        Kind = NumberedDocKind.DeliveryChallan,
        CounterNamespace = "delivery_challan",
        DefaultDocPrefix = "DC",
        DocTypeKey = "delivery_challan",
        NotFoundLabel = "Delivery challan",
        ApiRoutePrefix = "delivery-challans",
        StockDirection = StockDirection.Out,
        TranDateField = "dcDate"
    };

    public static NumberedDocConfig SalesReturn => new()
    {
        Kind = NumberedDocKind.SalesReturn,
        CounterNamespace = "sales_return",
        DefaultDocPrefix = "SR",
        DocTypeKey = "sales_return",
        NotFoundLabel = "Sales return",
        ApiRoutePrefix = "sales-returns",
        StockDirection = StockDirection.In,
        TranDateField = "returnDate"
    };

    public static NumberedDocConfig PurchaseInvoice => new()
    {
        Kind = NumberedDocKind.PurchaseInvoice,
        CounterNamespace = "purchase_invoice",
        DefaultDocPrefix = "PI",
        DocTypeKey = "purchase_invoice",
        NotFoundLabel = "Purchase invoice",
        ApiRoutePrefix = "purchase-invoices",
        StockDirection = StockDirection.In,
        IsPurchaseSide = true,
        NormalizeInvoicePayment = true,
        TranDateField = "invoiceDate"
    };

    public static NumberedDocConfig Grn => new()
    {
        Kind = NumberedDocKind.Grn,
        CounterNamespace = "grn",
        DefaultDocPrefix = "GRN",
        DocTypeKey = "grn",
        NotFoundLabel = "GRN",
        ApiRoutePrefix = "grns",
        StockDirection = StockDirection.In,
        IsPurchaseSide = true,
        TranDateField = "grnDate"
    };

    public static NumberedDocConfig PurchaseReturn => new()
    {
        Kind = NumberedDocKind.PurchaseReturn,
        CounterNamespace = "purchase_return",
        DefaultDocPrefix = "PR",
        DocTypeKey = "purchase_return",
        NotFoundLabel = "Purchase return",
        ApiRoutePrefix = "purchase-returns",
        StockDirection = StockDirection.Out,
        IsPurchaseSide = true,
        TranDateField = "returnDate"
    };

    public static NumberedDocConfig PurchaseOrder => new()
    {
        Kind = NumberedDocKind.PurchaseOrder,
        CounterNamespace = "purchase_order",
        DefaultDocPrefix = "PO",
        DocTypeKey = "purchase_order",
        NotFoundLabel = "Purchase order",
        ApiRoutePrefix = "purchase-orders",
        StockDirection = StockDirection.None,
        IsPurchaseSide = true,
        TranDateField = "poDate"
    };
}
