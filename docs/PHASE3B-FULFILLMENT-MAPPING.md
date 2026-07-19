# Phase 3b — Pending Consolidation & Fulfillment

## Node → .NET mapping

| Node.js | ASP.NET Core |
|---------|--------------|
| `fulfillmentQtyIndex.js` + `parseQty`/`formatQty` | `Services/Fulfillment/FulfillmentQty.cs` |
| `deliveryChallanInvoicing.js` | `DeliveryChallanInvoicingService.cs` |
| `grnInvoicing.js` | `GrnInvoicingService` in `GrnAndPurchaseOrderFulfillment.cs` |
| `purchaseOrderFulfillment.js` | `PurchaseOrderFulfillmentService` |
| `salesInvoiceHooks.js` | `SalesInvoiceDocumentHooks` |
| `purchaseInvoiceHooks.js` | `PurchaseInvoiceDocumentHooks` |
| `grnHooks.js` | `GrnDocumentHooks` |
| `deliveryChallanHooks.js` (SO sync) | Deferred — requires `SalesOrder` entity |

## Migrated pending endpoints (+6)

| Method | Path |
|--------|------|
| GET | `/api/delivery-challans/pending-for-invoice?customer=` |
| POST | `/api/delivery-challans/pending-invoice-lines` |
| GET | `/api/grns/pending-for-invoice?supplier=` |
| POST | `/api/grns/pending-invoice-lines` |
| GET | `/api/purchase-orders/pending-for-receipt?supplier=` |
| POST | `/api/purchase-orders/pending-receipt-lines` |

## Hook behavior (parity)

| Document | Before save | After save/delete | Stock |
|----------|-------------|-------------------|-------|
| Sales invoice | Validate DC refs / pending qty; set `dcReferences` | Sync DC `invoicedQty` + status | `none` if DC-sourced |
| Purchase invoice | Validate GRN refs / pending qty; set `grnReferences` | Sync GRN `invoicedQty` + status | `none` if GRN-sourced |
| GRN | Validate PO refs / pending qty; set `poReferences` | Sync PO `receivedQty` + status | `in` |
| Delivery challan | (SO validation deferred) | (SO sync deferred) | `out` |

## Transactional consistency

Create / update / delete of numbered docs now wrap **document persist + stock movement + fulfillment sync** in a single EF Core transaction (counter allocation remains a separate pre-step, matching Node).

## Gaps

1. **SalesOrder ↔ Delivery Challan** fulfillment and `/api/sales-orders/pending-*` — SalesOrder not migrated yet.
2. Customer/supplier list filter uses case-insensitive in-memory match after status SQL filter (Node uses regex in Mongo).
