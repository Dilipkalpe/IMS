import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDb, disconnectDb, getMongoUri } from './config/db.js';
import { yearDbContextMiddleware } from './middleware/yearDbContext.js';
import { bootstrapUsersIfEmpty } from './bootstrapUsers.js';
import { bootstrapPayrollIfEmpty } from './bootstrapPayroll.js';
import { migrateSalesOrderIndexes } from './migrateSalesOrderIndexes.js';
import productsRouter from './routes/products.js';
import accountsRouter from './routes/accounts.js';
import documentsRouter from './routes/documents.js';
import stockTransfersRouter from './routes/stockTransfers.js';
import bomsRouter from './routes/boms.js';
import productionOrdersRouter from './routes/productionOrders.js';
import warehousesRouter from './routes/warehouses.js';
import dashboardRouter from './routes/dashboard.js';
import productTypesRouter from './routes/productTypes.js';
import productMainGroupsRouter from './routes/productMainGroups.js';
import productSubGroupsRouter from './routes/productSubGroups.js';
import assemblyTypesRouter from './routes/assemblyTypes.js';
import machinesRouter from './routes/machines.js';
import payrollEmployeesRouter from './routes/payrollEmployees.js';
import attendanceRouter from './routes/attendance.js';
import payrollRunsRouter from './routes/payrollRuns.js';
import payrollReportsRouter from './routes/payrollReports.js';
import saleUomsRouter from './routes/saleUoms.js';
import customerTypesRouter from './routes/customerTypes.js';
import usersRouter from './routes/users.js';
import paymentVouchersRouter from './routes/paymentVouchers.js';
import receiptVouchersRouter from './routes/receiptVouchers.js';
import creditNotesRouter from './routes/creditNotes.js';
import debitNotesRouter from './routes/debitNotes.js';
import cashEntriesRouter from './routes/cashEntries.js';
import bankEntriesRouter from './routes/bankEntries.js';
import salesOrdersRouter from './routes/salesOrders.js';
import quotationsRouter from './routes/quotations.js';
import deliveryChallansRouter from './routes/deliveryChallans.js';
import salesInvoicesRouter from './routes/salesInvoices.js';
import salesReturnsRouter from './routes/salesReturns.js';
import purchaseOrdersRouter from './routes/purchaseOrders.js';
import grnsRouter from './routes/grns.js';
import purchaseInvoicesRouter from './routes/purchaseInvoices.js';
import purchaseReturnsRouter from './routes/purchaseReturns.js';
import companiesRouter from './routes/companies.js';
import reportsRouter from './routes/reports.js';
import importRouter from './routes/import.js';
import adminRouter from './routes/admin.js';
import securityRouter from './routes/security.js';
import licenseRouter from './routes/license.js';
import gridColumnsRouter from './routes/gridColumns.js';
import salesPurchaseSettingsRouter from './routes/salesPurchaseSettings.js';
import salesBillTemplatesRouter from './routes/salesBillTemplates.js';
import billFormatsRouter from './routes/billFormats.js';
import reportingRouter from './reporting/routes/reportingRouter.js';
import { ensureEditDeletePasswordSettings } from './services/editDeletePassword.js';
import { ensureSoftwareLicense } from './services/softwareLicense.js';
import { ensureDefaultBillFormats } from './services/billFormatTemplates.js';
import authRouter from './routes/auth.js';
import financialYearsRouter from './routes/financialYears.js';
import rolesRouter from './routes/roles.js';
import menusRouter from './routes/menus.js';
import { ensureFinancialYearAvailableForLogin } from './services/financialYearBootstrap.js';
import { bootstrapRolesMenus } from './bootstrapRolesMenus.js';
const app = express();
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' }));
app.use(yearDbContextMiddleware);

const iisMountPath = String(process.env.IMS_API_MOUNT_PATH || '').trim().replace(/\/$/, '');
if (iisMountPath) {
  app.use((req, _res, next) => {
    if (req.url === iisMountPath) {
      req.url = '/';
    } else if (req.url.startsWith(`${iisMountPath}/`)) {
      req.url = req.url.slice(iisMountPath.length) || '/';
    }
    next();
  });
}

// Browser opens http://localhost:3000 — show help instead of "Cannot GET /"
app.get('/', (_req, res) => {
  res.redirect(302, '/api/health');
});

app.get('/api', (_req, res) => {
  res.json({
    service: 'ims-api', // dev watch test
    status: 'running',
    message: 'REST API for IMS desktop app. Open these URLs in the browser or use the WPF app.',
    endpoints: {
      health: 'GET /api/health',
      products: 'GET /api/products',
      productLookup: 'GET /api/products/lookup?q=10001',
      productTypes: 'GET /api/product-types',
      productMainGroups: 'GET /api/product-main-groups',
      productSubGroups: 'GET /api/product-sub-groups',
      assemblyTypes: 'GET /api/assembly-types',
      saleUoms: 'GET /api/sale-uoms',
      customerTypes: 'GET /api/customer-types',
      users: 'GET /api/users',
      paymentVouchers: 'GET /api/payment-vouchers',
      paymentVoucherNextNo: 'GET /api/payment-vouchers/next-no',
      paymentVoucherByNo: 'GET /api/payment-vouchers/by-no/:voucherNo',
      receiptVouchers: 'GET /api/receipt-vouchers',
      receiptVoucherNextNo: 'GET /api/receipt-vouchers/next-no',
      receiptVoucherByNo: 'GET /api/receipt-vouchers/by-no/:voucherNo',
      creditNotes: 'GET /api/credit-notes',
      creditNoteNextNo: 'GET /api/credit-notes/next-no',
      creditNoteByNo: 'GET /api/credit-notes/by-no/:voucherNo',
      debitNotes: 'GET /api/debit-notes',
      debitNoteNextNo: 'GET /api/debit-notes/next-no',
      debitNoteByNo: 'GET /api/debit-notes/by-no/:voucherNo',
      cashEntries: 'GET /api/cash-entries',
      cashEntryNextNo: 'GET /api/cash-entries/next-no',
      cashEntryByNo: 'GET /api/cash-entries/by-no/:entryNo',
      bankEntries: 'GET /api/bank-entries',
      bankEntryNextNo: 'GET /api/bank-entries/next-no',
      bankEntryByNo: 'GET /api/bank-entries/by-no/:voucherNo',
      salesOrders: 'GET /api/sales-orders',
      salesOrderNextNo: 'GET /api/sales-orders/next-no',
      salesOrderByNo: 'GET /api/sales-orders/by-no/:docNo',
      salesOrderStats: 'GET /api/sales-orders/stats',
      deliveryChallans: 'GET /api/delivery-challans',
      deliveryChallanNextNo: 'GET /api/delivery-challans/next-no',
      salesInvoices: 'GET /api/sales-invoices',
      salesInvoiceNextNo: 'GET /api/sales-invoices/next-no',
      salesReturns: 'GET /api/sales-returns',
      salesReturnNextNo: 'GET /api/sales-returns/next-no',
      purchaseOrders: 'GET /api/purchase-orders',
      purchaseOrderNextNo: 'GET /api/purchase-orders/next-no',
      grns: 'GET /api/grns',
      grnNextNo: 'GET /api/grns/next-no',
      purchaseInvoices: 'GET /api/purchase-invoices',
      purchaseInvoiceNextNo: 'GET /api/purchase-invoices/next-no',
      purchaseReturns: 'GET /api/purchase-returns',
      purchaseReturnNextNo: 'GET /api/purchase-returns/next-no',
      companies: 'GET /api/companies',
      companyDefault: 'GET /api/companies/default',
      accounts: 'GET /api/accounts',
      documents: 'GET /api/documents?type=sales_order',
      stockTransfers: 'GET /api/stock-transfers',
      bomsByProduct: 'GET /api/boms/by-product/:productCode',
      bomsUpsert: 'PUT /api/boms/by-product/:productCode',
      warehouses: 'GET /api/warehouses',
      authLogin: 'POST /api/auth/login',
      authMe: 'GET /api/auth/me',
      dashboard: 'GET /api/dashboard',
      salesPurchaseSettings: 'GET /api/settings/sales-purchase',
      purchaseInvoiceLatestSalesRate: 'GET /api/purchase-invoices/latest-sales-rate/:productCode',
      openingStockReport: 'GET /api/reports/opening-stock',
      closingStockReport: 'GET /api/reports/closing-stock',
      ledgerReport: 'GET /api/reports/ledger?accountCode=3&dateFrom=&dateTo=',
      ledgerAccounts: 'GET /api/reports/ledger-accounts',
      trialBalance: 'GET /api/reports/trial-balance?dateFrom=&dateTo=',
      reorderLevel: 'GET /api/reports/reorder-level?productCode=&productName=',
      profitAnalysis: 'GET /api/reports/profit-analysis?dateFrom=&dateTo=',
      importTemplate: 'GET /api/import/:type/template',
      importData: 'POST /api/import/:type',
      dataSummary: 'GET /api/admin/data/summary',
      deleteAllData: 'POST /api/admin/data/purge (body: { confirmPhrase: "DELETE ALL IMS DATA" })',
      databaseBackup: 'POST /api/admin/database/backup (auth, body: { outputDirectory, fileName })'
    }
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'ims-api', timestamp: new Date().toISOString() });
});

app.use('/api/products', productsRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/stock-transfers', stockTransfersRouter);
app.use('/api/boms', bomsRouter);
app.use('/api/production-orders', productionOrdersRouter);
app.use('/api/warehouses', warehousesRouter);
app.use('/api/auth', authRouter);
app.use('/api/license', licenseRouter);
app.use('/api/financial-years', financialYearsRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/menus', menusRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/product-types', productTypesRouter);
app.use('/api/product-main-groups', productMainGroupsRouter);
app.use('/api/product-sub-groups', productSubGroupsRouter);
app.use('/api/assembly-types', assemblyTypesRouter);
app.use('/api/machines', machinesRouter);
app.use('/api/payroll-employees', payrollEmployeesRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/payroll-runs', payrollRunsRouter);
app.use('/api/payroll-reports', payrollReportsRouter);
app.use('/api/sale-uoms', saleUomsRouter);
app.use('/api/customer-types', customerTypesRouter);
app.use('/api/users', usersRouter);
app.use('/api/payment-vouchers', paymentVouchersRouter);
app.use('/api/receipt-vouchers', receiptVouchersRouter);
app.use('/api/credit-notes', creditNotesRouter);
app.use('/api/debit-notes', debitNotesRouter);
app.use('/api/cash-entries', cashEntriesRouter);
app.use('/api/bank-entries', bankEntriesRouter);
app.use('/api/sales-orders', salesOrdersRouter);
app.use('/api/quotations', quotationsRouter);
app.use('/api/delivery-challans', deliveryChallansRouter);
app.use('/api/sales-invoices', salesInvoicesRouter);
app.use('/api/sales-returns', salesReturnsRouter);
app.use('/api/purchase-orders', purchaseOrdersRouter);
app.use('/api/grns', grnsRouter);
app.use('/api/purchase-invoices', purchaseInvoicesRouter);
app.use('/api/purchase-returns', purchaseReturnsRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/import', importRouter);
app.use('/api/admin', adminRouter);
app.use('/api/security', securityRouter);
app.use('/api/grid-columns', gridColumnsRouter);
app.use('/api/settings/sales-purchase', salesPurchaseSettingsRouter);
app.use('/api/sales-bill-templates', salesBillTemplatesRouter);
app.use('/api/bill-formats', billFormatsRouter);
app.use('/api/reporting', reportingRouter);

app.use((_req, res) => {
  res.status(404).json({
    error: 'Not found',
    hint: 'Try GET /api/health or GET /api — this server has no web UI at that path.'
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

/** @type {import('http').Server | undefined} */
let server;

async function shutdown(signal) {
  const exit = () => process.exit(0);
  if (!server) {
    try {
      await disconnectDb();
    } catch {
      /* ignore */
    }
    exit();
    return;
  }
  console.log(`\n${signal}: closing server on port ${port}...`);
  server.close(async () => {
    try {
      await disconnectDb();
    } catch {
      /* ignore */
    }
    exit();
  });
  setTimeout(exit, 3000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

async function start() {
  try {
    await connectDb();
    try {
      await bootstrapUsersIfEmpty();
    } catch (bootstrapErr) {
      console.warn(`User bootstrap: ${bootstrapErr.message}`);
    }
    try {
      await bootstrapPayrollIfEmpty();
    } catch (payrollErr) {
      console.warn(`Payroll bootstrap: ${payrollErr.message}`);
    }
    try {
      await ensureFinancialYearAvailableForLogin();
    } catch (fyErr) {
      console.warn(`Financial year bootstrap: ${fyErr.message}`);
    }
    try {
      await bootstrapRolesMenus();
    } catch (roleErr) {
      console.warn(`Role/menu bootstrap: ${roleErr.message}`);
    }
    try {
      await migrateSalesOrderIndexes();
    } catch (migrateErr) {
      console.warn(`Sales order index migration: ${migrateErr.message}`);
    }
    try {
      await ensureEditDeletePasswordSettings();
    } catch (securityErr) {
      console.warn(`Security settings bootstrap: ${securityErr.message}`);
    }
    try {
      await ensureSoftwareLicense();
    } catch (licenseErr) {
      console.warn(`Software license bootstrap: ${licenseErr.message}`);
    }
    try {
      const billTpl = await ensureDefaultBillFormats();
      if (billTpl.created > 0) {
        console.log(`Sales bill templates: seeded ${billTpl.created} default layout(s).`);
      }
    } catch (billTplErr) {
      console.warn(`Sales bill template bootstrap: ${billTplErr.message}`);
    }
  } catch (err) {
    console.error('\n=== IMS API could not start ===\n');
    console.error(`MongoDB connection failed: ${err.message}`);
    console.error(`URI: ${getMongoUri()}\n`);
    console.error('Fix (pick one):');
    console.error('  A) Docker:  docker compose up -d   (in api folder, needs Docker Desktop)');
    console.error('  B) Atlas:   set MONGODB_URI in api/.env to your mongodb+srv://... string from Compass');
    console.error('  C) Local:   install MongoDB Community Server, then: net start MongoDB');
    console.error('Then: npm run seed  &&  npm run dev\n');
    process.exit(1);
  }

  const maxAttempts = 6;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        server = app.listen(port, host, resolve);
        server.once('error', reject);
      });
      console.log(`IMS API listening on http://${host}:${port}`);
      return;
    } catch (err) {
      server = undefined;
      if (err.code === 'EADDRINUSE' && attempt < maxAttempts) {
        const waitMs = 400 * attempt;
        console.warn(`Port ${port} busy (restart ${attempt}/${maxAttempts - 1}), retrying in ${waitMs}ms...`);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }
      if (err.code === 'EADDRINUSE') {
        console.error(`\nPort ${port} is already in use.`);
        console.error('Run:  npm run stop');
        console.error('Then: npm run dev\n');
      } else {
        console.error(err);
      }
      try {
        await disconnectDb();
      } catch {
        /* ignore */
      }
      process.exit(1);
    }
  }
}

start();
