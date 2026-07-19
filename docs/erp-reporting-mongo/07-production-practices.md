# Production best practices

1. **Schema versioning** — Never deploy designer without supporting older `schemaVersion` read paths.
2. **Validate layout on write** — `validateLayoutJson()` in API; reject invalid elements.
3. **Index party mappings** — Unique compound indexes on customer/supplier + transactionType.
4. **Cache resolved formats** — WPF memory cache keyed by `formatId` + version `updatedAt`.
5. **Invalidate on save** — SignalR or poll `updatedAt` for multi-user edits (optional).
6. **Separate label and document** — Different renderers; different API modules.
7. **Field registry in MongoDB** — Single source for designer tokens and `dataPath`.
8. **mm storage, DIP render** — `dip = mm * 96 / 25.4`.
9. **Thermal testing** — Real 58/80mm printers; test narrow layouts.
10. **Audit** — `updatedBy` from JWT user; optional `report_format_versions` collection.
11. **Seed on deploy** — `POST /api/reporting/seed` in installer/migration script.
12. **No hardcoded invoices** — Integration tests load JSON fixtures from MongoDB test DB.
13. **JWT on all routes** — Already via `requireAuth`; admin for mutations.
14. **Rate limit designer saves** — Debounce auto-save 500ms in WPF.
15. **ZXing payload limits** — Validate barcode length per symbology before render.

## Phased delivery

| Phase | Deliverable |
|-------|-------------|
| 1 | API module + seed + WPF API client |
| 2 | Field resolver + text/table render + sales invoice print |
| 3 | Canvas designer (move, resize, snap) |
| 4 | Barcode/QR + label module |
| 5 | Undo/redo, align, multi-select |
| 6 | Migrate legacy `salesbilltemplates` → `report_formats` |
