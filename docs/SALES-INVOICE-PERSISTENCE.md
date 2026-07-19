# Sales Invoice — Persistence & workspace state (Phase 2e)

**API:** `GET/POST/PUT /api/sales-invoices` (Mongo) — see `api/src/routes/numberedSalesDocRoutes.js`.

**React:** `ims-web/src/sales-invoice/repository/`, `workspace/`, `context/SalesInvoiceNavIntent.tsx`.

## Repository layer

| Type | Role |
|------|------|
| `SalesInvoiceRepository` | List, load, save, delete, `peekNextNo` |
| `HttpSalesInvoiceRepository` | Used when `GET /api/health` or stats succeeds |
| `LocalSalesInvoiceRepository` | `localStorage` (`ims.salesInvoices.v1`) fallback |

Configure API: `VITE_API_BASE_URL=http://localhost:3000` in `ims-web/.env.local`.

Mapping: `repository/recordMappers.ts` — UI header/lines ↔ API record (payment enums, dates, totals).

## Document identity

| State | Id |
|-------|-----|
| New tab (unsaved) | `documentId: null`, `clientDocumentId: temp:{uuid}` |
| After save | `documentId` = Mongo `_id` or `local-{uuid}` |
| Print/export | `getUiSnapshot().documentId` uses persisted id when available |

## Per-tab workspace

- `SalesInvoiceWorkspaceProvider` holds `documents: Record<tabId, TabDocumentState>`.
- **All tabs stay mounted** (`hidden` panels) so switching tabs does not lose edits.
- Dirty flag: JSON baseline of header + lines after load/save; any edit sets `isDirty` and `*` in tab title.
- Tab close / workspace close (F7, Close): `confirm()` if dirty.

## Navigation

- List **New** / **Edit** / double-click → `publishOpenIntent` + navigate to `sales-invoice-entry`.
- Workspace `consumeOpenIntent` opens a tab and loads (or assigns next bill no for new).

## List cache invalidation

After save: `invalidateSalesInvoiceList()` bumps `listVersion`; list screen refetches in `useEffect`.

Documented strategy: **pessimistic refresh** on save (no optimistic list row); suitable until pagination/API latency is tuned.

## Manual verification

1. **Two tabs:** Tab 1 change customer; Tab 2 change customer differently; switch tabs — each keeps its value.
2. **Dirty guard:** Edit without save; close tab or F7 — confirm dialog.
3. **Save:** Save tab; title loses `*`; return to list — row count/values reflect save (local: refresh; API: live data).
4. **F12:** Save + print uses repository save, then opens print preview with saved doc no.
5. **API mode:** Run `api` on port 3000; list status shows `API` in stats card.

## Exit criteria

- [x] Multiple tabs edit independently
- [x] Save/load via repository interfaces
- [x] Dirty close prompts (tab + workspace)
- [x] List refreshes after save
- [x] Print uses persisted `documentId` in snapshot when saved
- [ ] Per-tab loading overlay (optional polish)
- [ ] Delete invoice from UI
- [ ] Save-as / duplicate bill

## Next

1. IGST / interstate rules (`calculations.ts`)
2. Manual screenshot sign-off
3. Clone stack for Purchase Invoice
