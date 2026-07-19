# Sales Module — Phase 4 Verification Matrix

**Date:** 2026-06-06  
**Scope:** Five React transaction modules (SO, DC, SI, SR, Quotation) vs WPF baseline  
**Status:** Automated/code parity complete; manual QA checklist below

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Implemented and wired in code |
| ⚠️ | Partial — works with constraints |
| 🔲 | Manual QA only (run in browser) |
| N/A | Not in WPF scope |

---

## Cross-module matrix

| Area | SO | DC | SI | SR | QT |
|------|----|----|----|----|-----|
| List search/filter/paging/sort | ✅ | ✅ | ✅ | ✅ | ✅ |
| List column filters | ✅ | ⚠️ | ✅ | ✅ | ✅ |
| List export/print | ✅ | ✅ | ✅ | ✅ | ✅ |
| List permissions | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ctrl+N new (list) | ✅ | ✅ | ✅ | ✅ | ✅ |
| New / next number | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit / dirty / discard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Save validations (+ GST) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Delete + guard password | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bill template print | ✅ | ✅ | ✅ | ✅ | ✅ |
| F7 / Esc / F11 / F12 | ✅ | ✅ | ✅ | ✅ | ✅ |
| Workspace tab shortcuts | ✅ | ✅ | ✅ | ✅ | ✅ |
| Consolidation picker | N/A | ✅ | ✅ | N/A | N/A |
| Responsive 1100/640px | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Phase 4 code fixes applied

1. **GST validation on save** — `salesWorkspaceValidation.ts` used by all five workspace providers
2. **Esc → Cancel** — `useDocumentShortcuts.ts` (skips when focus is in an input)
3. **Column filter column order** — `SALES_LIST_COLUMN_FILTER_DEFS` aligned with grid
4. **Column filters on SO + Quotation lists** — `TransactionListColumnFilters` + `supportsColumnFilters`
5. **Ctrl+N on all list screens** — `useListNewShortcut` hook
6. **Copy fixes** — Quotation “New quote”, Sales Return “New return”

---

## Known constraints (not blockers)

| Item | Notes |
|------|-------|
| DC SO Ref column filter | Use global search; API has no dedicated `soReference` col filter |
| Consolidation pickers | Require live API (`pending-for-delivery` / `pending-for-invoice`) |
| SR invoice reference | Manual field only (WPF parity; no `pending-for-return` API) |
| List row bill print | Register print only; bill layout is entry-screen |
| Native PDF | Browser print/HTML; not WPF `SalesBillPdfExporter` file format |
| Quotation → SO convert | No API endpoint; web-only module |

---

## Manual QA checklist

Run `cd ims-web && npm run dev` with API + MongoDB.

### Per transaction module (SO, DC, SI, SR, QT)

- [ ] **List:** search, status filter, paging, sort, column filters, export Excel, print preview
- [ ] **Permissions:** non-admin cannot add/edit/delete when menu denies
- [ ] **New:** Ctrl+N or New → workspace tab, next number, prefix focus
- [ ] **Edit:** double-click row → loads document; dirty banner after change
- [ ] **Discard:** close tab with unsaved changes → confirm prompt
- [ ] **Save:** invalid customer / empty lines blocked; GST errors on save (e.g. missing place of supply)
- [ ] **Delete:** confirm + password when policy enabled; list refreshes
- [ ] **Print:** F12 or Print → bill layout with GST breakdown
- [ ] **Shortcuts:** F11 save+next, F7/Esc close, Ctrl+T new tab
- [ ] **Responsive:** resize to 1100px and 640px — no overlapping fields

### Consolidation chain

- [ ] **SO → DC:** Load SOs on DC entry; qty capped by pending; save updates SO fulfillment
- [ ] **DC → SI:** Load DCs on SI entry; DC reference populated; save posts invoice

### Phase 3 screens

- [ ] **Registers (×4):** Show, print, export, grand total
- [ ] **Sales analysis:** filters, totals row, export
- [ ] **Import SI:** template download, upload, navigate to list
- [ ] **Settings:** sales rate source (admin PUT)

---

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Dev | | | Code parity + build pass |
| QA | | | Manual matrix above |
| Product | | | WPF screenshot acceptance |
