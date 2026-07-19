# Phase 3 — Numbered Document Factory: Node.js → ASP.NET Core Mapping

## Factory modules

| Node.js | ASP.NET Core |
|---------|--------------|
| `routes/numberedSalesDocRoutes.js` | `Infrastructure/Services/NumberedDocumentService.cs` (sales mode) |
| `routes/numberedPurchaseDocRoutes.js` | `Infrastructure/Services/NumberedDocumentService.cs` (purchase mode) |
| `models/Counter.js` | `Domain/Entities/Counter` + `Infrastructure/Services/CounterService.cs` |
| `services/productStock.js` | `Infrastructure/Services/ProductStockService.cs` |
| `services/numberedSalesDocNo.js` / `numberedPurchaseDocNo.js` | `Infrastructure/Services/DocPrefixHelper.cs` |
| `services/salesOrderNo.js` → `normalizeSoPrefix` | `DocPrefixHelper.NormalizeSoPrefix` |
| `services/invoicePayment.js` | `Infrastructure/Services/InvoicePaymentNormalizer.cs` |
| `utils/pagination.js` / `columnFilters.js` / list sort | `Infrastructure/Services/QueryHelpers.cs` |
| `db/yearModels.js` | `year_database_name` column + `IFinancialYearContext` |
| Per-type Express routers | `Ims.Api/Controllers/NumberedDocumentControllers.cs` |

## Route wiring

| Node route file | Mount | ASP.NET Controller | Status |
|-----------------|-------|-------------------|--------|
| `salesInvoices.js` | `/api/sales-invoices` | `SalesInvoicesController` | Migrated (11 factory routes) |
| `deliveryChallans.js` | `/api/delivery-challans` | `DeliveryChallansController` | Factory migrated; pending-* deferred |
| `salesReturns.js` | `/api/sales-returns` | `SalesReturnsController` | Migrated |
| `purchaseInvoices.js` | `/api/purchase-invoices` | `PurchaseInvoicesController` | Migrated |
| `grns.js` | `/api/grns` | `GrnsController` | Factory migrated; pending-* deferred |
| `purchaseReturns.js` | `/api/purchase-returns` | `PurchaseReturnsController` | Migrated |
| `purchaseOrders.js` | `/api/purchase-orders` | `PurchaseOrdersController` | Factory migrated; pending-* deferred |

## Document storage

MongoDB stores schemaless documents per collection. PostgreSQL uses **one table per document type** with:

- Indexed scalar columns (`doc_prefix`, `doc_no`, `formatted_doc_no`, `status`, `customer`/`supplier`, `tran_date`)
- `body_json` (jsonb) — full document body for response parity
- `_id` → `id` (24-char hex, exposed as `_id` in JSON)

## Hooks mapping

| Node hooks | ASP.NET | Notes |
|------------|---------|-------|
| `salesInvoiceHooks.js` | `SalesInvoiceDocumentHooks` | Customer required; DC-sourced → stock none |
| `deliveryChallanHooks.js` | `DeliveryChallanDocumentHooks` | Empty (fulfillment deferred) |
| `purchaseInvoiceHooks.js` | `PurchaseInvoiceDocumentHooks` | GRN-sourced → stock none |
| `grnHooks.js` | `GrnDocumentHooks` | Empty (fulfillment deferred) |

## Stock direction per type

| Document | Default direction | Hook override |
|----------|-------------------|---------------|
| Sales invoice | out | none if DC-sourced lines |
| Delivery challan | out | — |
| Sales return | in | — |
| Purchase invoice | in | none if GRN-sourced lines |
| GRN | in | — |
| Purchase return | out | — |
| Purchase order | none | — |

## Factory endpoints (per document type)

For each of the 7 mounts above:

| Method | Path |
|--------|------|
| GET | `/` (list + pagination/filters) |
| GET | `/stats` |
| GET | `/next-no` |
| GET | `/by-no/{docNo}` |
| GET | `/by-formatted/{formatted}` |
| GET | `/{id}` |
| POST | `/` |
| PUT | `/by-no/{docNo}` |
| PUT | `/{id}` |
| DELETE | `/by-no/{docNo}` |
| DELETE | `/{id}` |

**Total migrated factory endpoints: 77** (7 × 11).

## Deferred (not in factory core)

| Method | Path | Status |
|--------|------|--------|
| GET/POST | `/api/delivery-challans/pending-*` | **Done** — see `PHASE3B-FULFILLMENT-MAPPING.md` |
| GET/POST | `/api/grns/pending-*` | **Done** |
| GET/POST | `/api/purchase-orders/pending-*` | **Done** |
| GET/POST | `/api/sales-orders/pending-*` | Deferred — SalesOrder entity not migrated |

## Gaps / assumptions

1. **SO↔DC fulfillment** still deferred until SalesOrder is ported.
2. **Column filter col3** (deep totals amount search) not fully replicated on jsonb.
3. **Failed create after counter bump** skips a number (same class of behavior as Node).
4. **Tran dates** stored as UTC timestamps for PostgreSQL `timestamptz` compatibility.
5. Create/update/delete now use a DB transaction around document + stock + fulfillment sync.
