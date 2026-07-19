# Document Consolidation

Many-to-one mapping from multiple upstream documents into a single downstream document, with line-level traceability and automatic fulfillment status updates.

## Flows

| Scenario | Source documents | Target document | Stock on target |
|----------|------------------|-----------------|-----------------|
| 1 | Delivery Challans (same customer) | Sales Invoice | None (DC already reduced stock) |
| 2 | Purchase Orders (same vendor) | GRN | In (normal GRN receipt) |
| 3 | GRNs (same vendor) | Purchase Invoice | None (GRN already increased stock) |

## Database design

### Line-level references

Each downstream line stores the upstream document and line:

**Sales Invoice lines**

- `dcPrefix`, `dcDocNo`, `dcLineSr`, `dcFormattedDocNo`
- `invoicedQty` tracked on DC lines via aggregation

**GRN lines**

- `poPrefix`, `poDocNo`, `poLineSr`, `poFormattedDocNo`
- `receivedQty` tracked on PO lines via aggregation

**Purchase Invoice lines**

- `grnPrefix`, `grnDocNo`, `grnLineSr`, `grnFormattedDocNo`
- `invoicedQty` tracked on GRN lines via aggregation

### Header-level references

Structured arrays for audit and display:

- `dcReferences[]` on sales invoices
- `poReferences[]` on GRNs
- `grnReferences[]` on purchase invoices

Each entry: `{ docPrefix, docNo, formattedDocNo }`.

### Status derivation

| Document | Statuses |
|----------|----------|
| Delivery Challan | `partially_invoiced`, `fully_invoiced` (+ existing) |
| Purchase Order | `partially_received`, `fully_received` |
| GRN | `partially_invoiced`, `fully_invoiced` |

Statuses are recomputed from summed downstream quantities across all documents (supports partial qty and multiple downstream docs).

## API endpoints

### Delivery Challan → Sales Invoice

- `GET /api/delivery-challans/pending-for-invoice?customer={name}`
- `POST /api/delivery-challans/pending-invoice-lines` — body: `{ customer, deliveryChallans: [{ docPrefix, docNo }] }`

### Purchase Order → GRN

- `GET /api/purchase-orders/pending-for-receipt?supplier={name}`
- `POST /api/purchase-orders/pending-receipt-lines` — body: `{ supplier, purchaseOrders: [...] }`

### GRN → Purchase Invoice

- `GET /api/grns/pending-for-invoice?supplier={name}`
- `POST /api/grns/pending-invoice-lines` — body: `{ supplier, grns: [...] }`

Sales invoice, GRN, and purchase invoice create/update/delete routes run validation hooks that:

1. Enforce same party, compatible document state, and qty caps
2. Prevent duplicate billing/receipt beyond pending quantities
3. Refresh upstream statuses after save or delete

## WPF UI

Entry screens mirror the existing SO → DC pattern:

- **Sales Invoice** — “Load from DCs” multi-select dialog
- **GRN** — “Load from POs”
- **Purchase Invoice** — “Load from GRNs”

Line grid shows **Ref No** (source document). Quantities are capped to pending amounts from the API preview.

## End-to-end examples

### Example 1: Two DCs → one invoice

1. Customer *Acme* has DC-101 (qty 10) and DC-102 (qty 5), both dispatched, not invoiced.
2. Open Sales Invoice, select *Acme*, click **Load from DCs**, select both challans.
3. Preview loads 15 lines (or fewer if partial invoicing already exists) with `dcPrefix`/`dcLineSr` on each line.
4. Save invoice → DC-101 and DC-102 move to `fully_invoiced` or `partially_invoiced`; no additional stock movement.

### Example 2: Three POs → one GRN

1. Vendor *Beta Supplies* has PO-10, PO-11 (partially received), PO-12 (open).
2. GRN entry → **Load from POs** → select PO-10 and PO-12.
3. Received qty per line cannot exceed pending PO qty.
4. On GRN save, PO receipt totals and statuses update automatically.

### Example 3: Two GRNs → one purchase invoice

1. Vendor *Beta Supplies* has GRN-50 and GRN-51 with uninvoiced received qty.
2. Purchase Invoice → **Load from GRNs** → consolidated lines with `grnLineSr` refs.
3. Post invoice → GRN invoice statuses update; stock unchanged on PI (already received on GRN).

## Tests

Run API unit tests:

```bash
cd api && npm test
```

Covers quantity parsing/formatting and status derivation for sales orders, delivery challans, purchase orders, and GRNs.
