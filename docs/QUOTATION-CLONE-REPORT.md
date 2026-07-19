# Quotation v1 — platform clone report

Third transaction module on the shared platform (after Sales Invoice reference, Purchase Invoice, Sales Order).

## Summary

| Metric | Quotation | Sales Order | Purchase Invoice |
|--------|-----------|-------------|------------------|
| Module-specific `.ts/.tsx` files | **21** | 21 | 22 |
| Print/export mappers | **2** (`recordMappers`, `quotationPrintMapper`) | 2 | 2 |
| Extra module helpers | 0 | 0 | 1 (`taxContext.ts`) |
| **Estimated platform reuse** | **~79%** | ~78% | ~76% |
| **Build** | **Pass** | Pass | Pass |

## Reused unchanged

| Layer | Location |
|-------|----------|
| Workspace lifecycle | Tab bar, dirty baseline, `confirmUnsaved`, close guards |
| `CorporateDataGrid` | `components/datagrid/` |
| Keyboard | `keyboard/*`, `useDocumentShortcuts`, `useWorkspaceTabShortcuts` |
| GST / totals | `sales-invoice/calculations.ts`, `taxContextFromHeader` |
| Print/export | `DocumentPrintService`, stub providers (`quotation` doc type) |
| Transaction shell SCSS | `sales-invoice/sales-invoice.scss` |
| Line display | Delegates to `sales-invoice/lineDisplay` |

## Module-specific (created)

| Piece | Path |
|-------|------|
| Types / seed | `quotation/types.ts`, `mockData.ts`, `lineDisplay.ts` |
| Repository | `quotation/repository/*` — `/api/quotations`, `ims.quotations.v1` |
| API | `api/src/models/Quotation.js`, `routes/quotations.js`, `services/quotationNo.js` |
| Workspace | `QuotationWorkspaceProvider.tsx`, `documentState.ts` |
| Screens | `QuotationListScreen`, `QuotationWorkspaceScreen`, `QuotationEntryForm`, `routes.tsx` |
| Hook | `useQuotationDocument.ts` |
| Print | `document/mappers/quotationPrintMapper.ts`, `hooks/useQuotationPrintActions.ts` |
| Nav | `NavKeys.Quotation`, `quotation-entry` |

## Header mapping (Quotation-specific)

| UI field | API / record |
|----------|----------------|
| `entryDocPrefix` | `qtPrefix` (default `QT`) |
| `billNo` | `docNo` |
| `quoteDate` | `quoteDate` |
| `validUntil` | `validUntil` |
| `paymentTerms` | `paymentTerms` |
| `customer` | `customer` |

## v1 delivered

- [x] List → workspace → entry flow
- [x] Save / load via HTTP + local repository
- [x] Per-tab state isolation and dirty guards
- [x] GST totals (shared engine)
- [x] Print / export stubs (`quotation`)
- [x] Navigation catalog + `MainWindow` providers

## Deferred (v1)

- Quote revisions and approval workflow
- Quote → Sales Order conversion
- Linked-document navigation
- Advanced status transitions (API supports `sent` / `accepted` / `expired`; UI uses simplified filters)
- Delete action in entry UI (repository supports `deleteById`)

## WPF parity gaps

| Area | Gap |
|------|-----|
| Dedicated WPF views | No `QuotationWorkspaceView` in React map yet; uses shared `si-*` layout |
| Labels / pixel pass | Pending screenshot acceptance |
| Conversion actions | Quote → SO not wired |
| Menu in WPF shell | React catalog adds Quotation under Sales; WPF NavKeys.cs may lag |

## Parallel backlog (non-blocking)

- Sales Order delete (v1.1)
- Sales Invoice / Purchase Invoice acceptance stream
- API contract validation screenshots

## Conclusion

Quotation confirms the platform scales again with **no framework changes**—only DTOs, repository, mappers, header config, and wiring. Next in sequence: **Purchase Order**, then GRN.
