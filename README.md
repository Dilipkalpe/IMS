# IMS — Inventory Management System

Desktop WPF client with a **Node.js + MongoDB** backend API.

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/)
- **A MongoDB database** the API can reach (see below)

### MongoDB Compass only?

**Compass is a viewer app** — it does not run the database. The IMS API needs either:

| Option | What you need |
|--------|----------------|
| **A — MongoDB Atlas (easiest with Compass)** | Free cloud cluster; connect in Compass; copy connection string to `api/.env` |
| **B — Local MongoDB Server** | Install [MongoDB Community Server](https://www.mongodb.com/try/download/community) (not just Compass), then `mongod` listens on port 27017 |

#### Option A: Use Atlas with Compass (recommended)

1. In Compass, click **+** → **MongoDB Atlas** (or open [cloud.mongodb.com](https://cloud.mongodb.com)) and create a free cluster.
2. In Atlas: **Database Access** → create user + password. **Network Access** → add IP `0.0.0.0/0` (or your IP) for dev.
3. In Compass: **Connect** to the cluster → **Connect your application** → copy the `mongodb+srv://...` string.
4. Edit `api/.env`:
   ```env
   MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/ims?retryWrites=true&w=majority
   PORT=3000
   ```
   Replace user, password, and host. Add database name `ims` before `?` if missing.
5. Run `npm run seed` then `npm run dev`.

## Client installer (one-click)

For **production deployment** on client Windows PCs (Desktop + MongoDB + API as services), see:

**[installer/README.md](installer/README.md)**

Build: `cd installer` → `.\build-release.ps1` → distribute `installer\output\IMS-Setup-1.0.0.exe`

## Quick start

### 1. API (MongoDB + Node.js)

```bash
cd api
npm install
cp .env.example .env
npm run seed
npm run dev
```

API runs at **http://localhost:3000**

Health check: `GET http://localhost:3000/api/health`

### 2. Desktop app

```bash
cd IMS
dotnet run
```

The app connects to `http://localhost:3000` by default. Configure in `%LocalAppData%\IMS\settings.json`:

```json
{
  "ApiBaseUrl": "http://localhost:3000"
}
```

## API overview

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Service health |
| `GET/POST /api/products` | Product master |
| `GET /api/products/lookup?q=` | Barcode / name lookup (sales & stock transfer) |
| `GET/POST /api/accounts` | Customer / supplier accounts |
| `GET /api/accounts/names?type=customer` | Dropdown names |
| `GET/POST /api/documents?type=sales_order` | Sales & purchase documents |
| `GET /api/documents/next-number?type=` | Next document number |
| `GET/POST /api/stock-transfers` | Stock transfers |
| `GET /api/warehouses` | Godowns / warehouses |
| `GET /api/dashboard` | Dashboard KPIs |
| `GET/POST/PUT/DELETE /api/product-types` | Product type master (CRUD) |
| `GET/POST/PUT/DELETE /api/product-main-groups` | Product main group master (CRUD) |
| `GET/POST/PUT/DELETE /api/product-sub-groups` | Product sub group master (CRUD) |
| `GET/POST/PUT/DELETE /api/assembly-types` | Assembly type master (CRUD) |
| `GET/POST/PUT/DELETE /api/sale-uoms` | Sale UOM master (CRUD) |
| `GET/POST/PUT/DELETE /api/customer-types` | Customer type master (CRUD) |
| `GET/POST/PUT/DELETE /api/users` | User management (CRUD) |
| `GET /api/payment-vouchers` | Payment voucher list |
| `GET /api/payment-vouchers/next-no` | Next payment voucher number |
| `GET /api/payment-vouchers/by-no/:voucherNo` | Get payment voucher by number |
| `POST /api/payment-vouchers` | Create payment voucher |
| `PUT /api/payment-vouchers/by-no/:voucherNo` | Update payment voucher |
| `DELETE /api/payment-vouchers/by-no/:voucherNo` | Delete payment voucher |
| `GET /api/receipt-vouchers` | Receipt voucher list |
| `GET /api/receipt-vouchers/next-no` | Next receipt voucher number |
| `GET /api/receipt-vouchers/by-no/:voucherNo` | Get receipt voucher by number |
| `POST /api/receipt-vouchers` | Create receipt voucher |
| `PUT /api/receipt-vouchers/by-no/:voucherNo` | Update receipt voucher |
| `DELETE /api/receipt-vouchers/by-no/:voucherNo` | Delete receipt voucher |
| `GET /api/credit-notes` | Credit note list |
| `GET /api/credit-notes/next-no` | Next credit note number |
| `GET/PUT/DELETE /api/credit-notes/by-no/:voucherNo` | Credit note CRUD |
| `GET /api/debit-notes` | Debit note list |
| `GET /api/debit-notes/next-no` | Next debit note number |
| `GET/PUT/DELETE /api/debit-notes/by-no/:voucherNo` | Debit note CRUD |
| `GET /api/cash-entries` | Petty cash / cash entry list |
| `GET /api/cash-entries/next-no` | Next cash entry number |
| `GET/PUT/DELETE /api/cash-entries/by-no/:entryNo` | Cash entry CRUD |
| `GET /api/bank-entries` | Bank entry list |
| `GET /api/bank-entries/next-no` | Next bank entry number |
| `GET/PUT/DELETE /api/bank-entries/by-no/:voucherNo` | Bank entry CRUD |
| `GET /api/sales-orders` | Sales order list (dedicated schema) |
| `GET /api/sales-orders/next-no` | Next SO number (`SO-####`) |
| `GET/PUT/DELETE /api/sales-orders/by-no/:docNo` | Sales order CRUD |
| `PUT /api/sales-orders/:id` | Update sales order by MongoDB id |

Document types: `sales_order`, `delivery_challan`, `sales_invoice`, `sales_return`, `purchase_order`, `grn`, `purchase_invoice`, `purchase_return`

## UI integration

When the API is available:

- **Dashboard**, **Products**, **Account Ledger** — lists load from MongoDB
- **Sales / Purchase lists** — document lists from API
- **Sales / Purchase entry** — save posts documents; product scan uses API lookup; customers/suppliers from API
- **Add Product / Add Account** — creates records in MongoDB
- **Product Types** — list, add, and delete from MongoDB; dropdown names refresh from API
- **Main Groups** — list, add, edit, and delete from MongoDB; dropdown names refresh from API
- **Sub Groups** — list, add, edit, and delete from MongoDB; Main Group dropdown is populated
- **Stock Transfer** — saves to MongoDB; godowns from API
- **Payment Voucher** — list, add, edit, delete in MongoDB; ledger entry form; account lookup from Account Master; auto voucher numbering
- **Receipt Voucher** — same pattern as payment; **RECEIPT** ledger entry; customer account lookup
- **Credit Note** — list, add, edit, delete in MongoDB; GST rate, total amount, IGST; customer account lookup; themed entry form
- **Debit Note** — same pattern as credit note; supplier account lookup; **DEBIT NOTE** badge (red)
- **Petty Cash / Cash Entry** — multi-line particulars with amounts; total auto-sum; account names as particulars dropdown; list/add/edit/delete in MongoDB
- **Bank Entry** — deposit/withdrawal/transfer; account lookup; list/add/edit/delete in MongoDB; **BANK ENTRY** badge
- **Sales Order** — dedicated MongoDB collection with header fields (payment terms, delivery priority, billing/shipping address), line items, and totals; list and save via `/api/sales-orders`

If the API is offline, the app falls back to seeded mock data (limited save).

## Project layout

```
IMS/
  IMS/              # WPF desktop client (.NET 8)
  api/              # Node.js Express API
  documentfortech/  # Technical documentation
  docs/             # Sales and marketing docs
  README.md
```
