-- =============================================================================
-- IMS SYSTEM RESET — LOGICAL SQL EQUIVALENT (DOCUMENTATION ONLY)
-- =============================================================================
-- IMS does NOT use SQL Server / PostgreSQL / MySQL as its primary database.
-- All persistence is MongoDB 6+ via Mongoose 8.x (database name default: ims).
--
-- This file maps MongoDB collections to familiar SQL-style operations for
-- DBAs and auditors. Do NOT run this against a relational engine.
--
-- Production execution:
--   1. Backup:  mongodump --uri="<MONGODB_URI>" --gzip --archive=pre_reset.bak
--   2. Dry run: node api/scripts/system-reset-business-data.js --dry-run
--   3. Reset:   node api/scripts/system-reset-business-data.js --confirm RESET_BUSINESS_DATA
--
-- Repeat steps 2–3 for EACH financial-year database (see FinancialYear.databaseName).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- PHASE 0: BACKUP (mandatory rollback point)
-- ---------------------------------------------------------------------------
-- mongodump --uri="mongodb://127.0.0.1:27017/ims" --gzip --archive=pre_reset.bak
-- Rollback: mongorestore --uri="mongodb://127.0.0.1:27017/ims" --gzip --archive=pre_reset.bak --drop

-- ---------------------------------------------------------------------------
-- PHASE 1: TRANSACTIONAL / BUSINESS DATA — DELETE (child docs first)
-- MongoDB has no FK enforcement; order is for clarity and operational safety.
-- Collection names are lowercase plural unless noted.
-- ---------------------------------------------------------------------------

-- Sales cycle
-- DELETE FROM salesorders;           -- Sales orders + embedded lines
-- DELETE FROM deliverychallans;      -- Delivery challans
-- DELETE FROM salesinvoices;         -- Tax invoices
-- DELETE FROM salesreturns;          -- Sales returns

-- Purchase cycle
-- DELETE FROM purchaseorders;
-- DELETE FROM grns;
-- DELETE FROM purchaseinvoices;
-- DELETE FROM purchasereturns;

-- Finance / vouchers
-- DELETE FROM paymentvouchers;
-- DELETE FROM receiptvouchers;
-- DELETE FROM creditnotes;
-- DELETE FROM debitnotes;
-- DELETE FROM cashentries;
-- DELETE FROM bankentries;

-- Inventory / production
-- DELETE FROM stocktransfers;        -- Inter-godown transfers
-- DELETE FROM productionorders;      -- Production work orders
-- DELETE FROM transactiondocuments;  -- Legacy generic documents

-- Period opening / carry-forward (business data, not master config)
-- DELETE FROM openingstockentries;
-- DELETE FROM openingbalanceentries;

-- Security audit trail (operational, not master config)
-- DELETE FROM editdeleteauthlogs;

-- Document numbering state (tied to deleted transactions — reset, not preserve)
-- DELETE FROM counters;
-- Re-seed doc_* keys from DOC_INITIAL in api/src/services/docTypeMap.js

-- ---------------------------------------------------------------------------
-- PHASE 2: RESET DERIVED FIELDS ON PRESERVED MASTER TABLES
-- ---------------------------------------------------------------------------

-- UPDATE products SET stockQty = 0;
--   Reason: stockQty is computed from transactions; masters stay, qty must clear.

-- UPDATE ledgeraccounts SET openingBalance = 0, openingBalanceType = 'Dr';
--   Reason: opening balances came from vouchers / year-end carry-forward.

-- ---------------------------------------------------------------------------
-- PHASE 3: USERS — KEEP admin ONLY
-- ---------------------------------------------------------------------------

-- DELETE FROM usergridcolumnpreferences WHERE userId <> (SELECT _id FROM appusers WHERE username = 'admin');
-- DELETE FROM appusers WHERE username <> 'admin';
-- UPDATE appusers SET passwordHash = '<PBKDF2 via api/scripts/set-admin-password.js>', activeStatus = true WHERE username = 'admin';
-- If no admin row: INSERT default admin (use Node script — password is PBKDF2, not plain SQL).

-- ---------------------------------------------------------------------------
-- TABLES / COLLECTIONS TO PRESERVE (DO NOT DELETE)
-- ---------------------------------------------------------------------------
-- products                 Product master (SKU, rates, classification)
-- accounts                   Customer / supplier parties
-- ledgeraccounts             Chart of accounts
-- companies                  Company registration / GST / bank
-- warehouses                 Warehouse / godown master
-- machines                   Production machine master
-- producttypes               Product type classification
-- productmaingroups          Main group master
-- productsubgroups           Sub group master
-- assemblytypes              Assembly type master
-- saleuoms                   Sale unit of measure
-- customertypes              Customer type classification
-- boms                       Bill of materials (manufacturing recipes)
-- systemsettings             Application settings (e.g. sales rate source)
-- securitysettings           Edit/delete password policy
-- gridcolumnglobaldefaults   UI column defaults (admin)
-- salesbilltemplates         Invoice print templates
-- FinancialYear              Financial year registry (config DB)
-- FinancialYearAuditLog      Year-end audit log (config DB — optional clear)

-- Note: Roles are NOT a separate table. Role is a string column on appusers.role.

-- ---------------------------------------------------------------------------
-- CONFIG DATABASE (same MongoDB server, collection FinancialYear)
-- PRESERVE — defines which year DBs exist; do not drop databases here.
-- ---------------------------------------------------------------------------
-- SELECT * FROM FinancialYear;   -- preserve all rows

-- ---------------------------------------------------------------------------
-- EXECUTION ORDER SUMMARY
-- ---------------------------------------------------------------------------
-- 1. Backup (mongodump)
-- 2. Delete transactional collections (Phase 1)
-- 3. Delete counters; re-seed document counters
-- 4. Zero product stockQty and ledger opening balances (Phase 2)
-- 5. Remove non-admin users and preferences (Phase 3)
-- 6. Reset admin password to 'admin' via Node (PBKDF2)
-- 7. Verify login and master screens

-- ---------------------------------------------------------------------------
-- ROLLBACK STRATEGY
-- ---------------------------------------------------------------------------
-- 1. PRIMARY: Restore pre_reset.bak with mongorestore --drop
-- 2. App UI: Settings → Database Backup (if configured)
-- 3. Partial rollback is NOT supported — restore full backup only
-- 4. After rollback, restart API so connections refresh

-- ---------------------------------------------------------------------------
-- MONGOSH QUICK REFERENCE (single year DB — replace ims with your year DB)
-- ---------------------------------------------------------------------------
-- use ims
-- db.salesorders.deleteMany({})
-- db.deliverychallans.deleteMany({})
-- db.salesinvoices.deleteMany({})
-- db.salesreturns.deleteMany({})
-- db.purchaseorders.deleteMany({})
-- db.grns.deleteMany({})
-- db.purchaseinvoices.deleteMany({})
-- db.purchasereturns.deleteMany({})
-- db.paymentvouchers.deleteMany({})
-- db.receiptvouchers.deleteMany({})
-- db.creditnotes.deleteMany({})
-- db.debitnotes.deleteMany({})
-- db.cashentries.deleteMany({})
-- db.bankentries.deleteMany({})
-- db.stocktransfers.deleteMany({})
-- db.productionorders.deleteMany({})
-- db.transactiondocuments.deleteMany({})
-- db.openingstockentries.deleteMany({})
-- db.openingbalanceentries.deleteMany({})
-- db.editdeleteauthlogs.deleteMany({})
-- db.counters.deleteMany({})
-- db.products.updateMany({}, { $set: { stockQty: 0 } })
-- db.ledgeraccounts.updateMany({}, { $set: { openingBalance: 0, openingBalanceType: 'Dr' } })
-- db.appusers.deleteMany({ username: { $ne: 'admin' } })
-- Then run: node scripts/set-admin-password.js admin
