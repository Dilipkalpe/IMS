# Sales Invoice — keyboard parity (Phase 2a)

Mirrors WPF `FormKeyboardNavigation` + `SalesInvoiceEntryView` input bindings + line grid behavior.

## Implemented

| Behavior | WPF | React |
|----------|-----|-------|
| Enter → next field | `FormKeyboardNavigation` | `FormKeyboardScope` on list + entry |
| Barcode Enter = add line | `SuppressEnterAsTab` on scan | `data-suppress-enter-as-tab` on barcode |
| Tab order (header → GST → scan → grid → narration → actions) | Visual / tab index | DOM order + `data-focus-key` |
| Grid Tab / Enter | DataGrid cell navigation | `CorporateDataGrid` editable chain |
| Grid arrows | Row/column move | ↑↓←→ between editable cells |
| Home / End | First/last editable in row | Home / End in active row |
| Exit grid (last cell) | → next control | `onExitEnd` → narration |
| F7 / F11 / F12 | `InputBindings` | `useDocumentShortcuts` |
| Validation focus | First error field | `tryAction` + `focusFirstErrorField` |
| After save | — | Focus Save button |
| After scan | Refocus scan | `barcodeRef.focus()` |
| After delete line | — | Focus prior row qty cell |
| Workspace tabs | — | Ctrl+Tab / Ctrl+Shift+Tab; Ctrl+T new tab; ←/→ on tablist |
| List New | — | Ctrl+N; Enter-as-tab to New; auto-focus search |

## Tab order reference

Exported: `SALES_INVOICE_FIELD_TAB_ORDER` in `SalesInvoiceEntryForm.tsx`.

## Keyboard-only smoke test

1. **List:** Tab to search → filter → Tab to **New** → Enter (or Ctrl+N).
2. **Entry:** Enter through Prefix → … → Payment Mode → Barcode (type + Enter adds line).
3. **Grid:** Tab into Qty → Tab/Enter across editables → arrows change row/column → End/Home in row.
4. Tab past last line cell → **Narration** → action buttons → Save (Enter).
5. **Save** with empty Bill No → focus returns to Bill No.
6. **F11** / **F12** / **F7** trigger status actions / return to list.
7. **Ctrl+Tab** between workspace tabs; focus returns to Prefix.

## Remaining gaps

- [ ] Prefix commit on navigate (WPF `TryCommitPrefixOnNavigateAsync`)
- [ ] Grid Delete column in tab order (currently `tabIndex={-1}`; use button focus + Enter)
- [ ] Per-tab document VM (shared state until API pass)
- [ ] List grid keyboard row select + Enter to open (double-click only today)
- [ ] Alt+underlined mnemonics (WPF access keys)
