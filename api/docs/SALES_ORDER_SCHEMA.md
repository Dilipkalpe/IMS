# Sales Order — database schema

Collection: `salesorders` (Mongoose model `SalesOrder`)

## Header

| Field | Type | Description |
|-------|------|-------------|
| `soPrefix` | String | SO prefix e.g. `SO`, `INV` (per-prefix counter) |
| `docNo` | Number | SO number within prefix (unique with `soPrefix`) |
| `formattedDocNo` | String | Display number e.g. `SO-88012` |
| `soDate` | Date | SO date (date picker) |
| `billDate` | String | Legacy display date `dd/MM/yyyy` |
| `salesMan` | String | Sales person |
| `customer` | String | Customer name |
| `customerDetails` | String | Extra customer notes |
| `paymentTerms` | String | Payment terms |
| `deliveryPriority` | String | Normal, Urgent, Express |
| `billingAddress` | String | Billing address |
| `shippingAddress` | String | Shipping address |
| `narration` | String | Footer narration |
| `status` | String | draft, open, confirmed, picking, shipped, closed, cancelled |

## Lines (`lines[]`)

| Field | Type |
|-------|------|
| `sr` | Number |
| `productRetailCode` | String |
| `itemDescription` | String |
| `qty`, `rate`, `discPercent`, `discValue` | String |
| `taxType`, `taxPercent`, `amount` | String |

## Totals (`totals`)

| Field | Type |
|-------|------|
| `totQty`, `gross`, `discount`, `spDiscount`, `addOther`, `net` | String |
| `saleAmount`, `orderAmount` | String |
| `customerReturn`, `receivableToCustomer` | String |

## REST API

- `GET /api/sales-orders` — list (`?search=`, `?status=`)
- `GET /api/sales-orders/next-no?prefix=SO` — next number for prefix
- `GET /api/sales-orders/by-no/:docNo?prefix=SO` — load one
- `GET /api/sales-orders/by-formatted/SO-88012` — load by display number
- `POST /api/sales-orders` — create
- `PUT /api/sales-orders/by-no/:docNo` — update by SO number
- `PUT /api/sales-orders/:id` — update by MongoDB id
- `DELETE /api/sales-orders/by-no/:docNo` — delete
