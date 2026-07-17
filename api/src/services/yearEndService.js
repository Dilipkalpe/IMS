import { Account } from '../models/Account.js';
import { AppUser } from '../models/AppUser.js';
import { AssemblyType } from '../models/AssemblyType.js';
import { Bom } from '../models/Bom.js';
import { Company } from '../models/Company.js';
import { Counter } from '../models/Counter.js';
import { CustomerType } from '../models/CustomerType.js';
import { GridColumnGlobalDefault } from '../models/GridColumnGlobalDefault.js';
import { LedgerAccount } from '../models/LedgerAccount.js';
import { OpeningBalanceEntry } from '../models/OpeningBalanceEntry.js';
import { OpeningStockEntry } from '../models/OpeningStockEntry.js';
import { Product } from '../models/Product.js';
import { ProductMainGroup } from '../models/ProductMainGroup.js';
import { ProductSubGroup } from '../models/ProductSubGroup.js';
import { ProductType } from '../models/ProductType.js';
import { SaleUom } from '../models/SaleUom.js';
import { SecuritySettings } from '../models/SecuritySettings.js';
import { SystemSettings } from '../models/SystemSettings.js';
import { UserGridColumnPreference } from '../models/UserGridColumnPreference.js';
import { Warehouse } from '../models/Warehouse.js';
import { listLedgerAccountOptions, computeAccountClosingBalance } from './ledgerReport.js';
import { switchToYearDb } from '../config/db.js';

function roundMoney(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function splitToOpening(closingDisplay) {
  // closingDisplay = { dr, cr, column }
  const dr = roundMoney(closingDisplay?.dr ?? 0);
  const cr = roundMoney(closingDisplay?.cr ?? 0);
  if (dr > 0) return { openingBalance: dr, openingBalanceType: 'Dr' };
  if (cr > 0) return { openingBalance: cr, openingBalanceType: 'Cr' };
  return { openingBalance: 0, openingBalanceType: 'Dr' };
}

function sanitizeForInsert(doc) {
  const x = { ...doc };
  delete x.__v;
  return x;
}

async function copyCollectionFromSnapshot(Model, docs) {
  if (docs.length === 0) return 0;
  const cleaned = docs.map(sanitizeForInsert);
  await Model.insertMany(cleaned, { ordered: false });
  return cleaned.length;
}

export async function runYearEnd({ fromYear, toYear }) {
  // 1) Compute closing balances + snapshot closing stock in FROM DB
  await switchToYearDb(fromYear.databaseName);

  const ledgerOptions = await listLedgerAccountOptions();
  const balances = [];

  for (const opt of ledgerOptions) {
    try {
      const summary = await computeAccountClosingBalance(opt.code, fromYear.startDate, fromYear.endDate);
      balances.push({
        accountCode: summary.accountCode,
        accountName: summary.accountName,
        closingDisplay: summary.closingDisplay
      });
    } catch {
      // ignore accounts that can't be resolved
    }
  }

  // Snapshot only master collections from source FY (no transaction carry-forward).
  const sourceSnapshots = {
    products: await Product.find({}).lean(),
    accounts: await Account.find({}).lean(),
    ledgerAccounts: await LedgerAccount.find({}).lean(),
    companies: await Company.find({}).lean(),
    appUsers: await AppUser.find({}).lean(),
    customerTypes: await CustomerType.find({}).lean(),
    warehouses: await Warehouse.find({}).lean(),
    productTypes: await ProductType.find({}).lean(),
    productMainGroups: await ProductMainGroup.find({}).lean(),
    productSubGroups: await ProductSubGroup.find({}).lean(),
    assemblyTypes: await AssemblyType.find({}).lean(),
    saleUoms: await SaleUom.find({}).lean(),
    boms: await Bom.find({}).lean(),
    systemSettings: await SystemSettings.find({}).lean(),
    securitySettings: await SecuritySettings.find({}).lean(),
    counters: await Counter.find({}).lean(),
    gridColumnGlobalDefaults: await GridColumnGlobalDefault.find({}).lean(),
    userGridColumnPreferences: await UserGridColumnPreference.find({}).lean()
  };

  // Closing stock from product master snapshot.
  const stockRows = sourceSnapshots.products.map((p) => {
    const qty = Number(p.stockQty) || 0;
    const rate = Number(p.purchasePrice) || 0;
    return {
      productCode: String(p.code || '').trim().toUpperCase(),
      productName: String(p.name || '').trim(),
      unit: String(p.unit || 'EA').trim(),
      quantity: qty,
      rate,
      value: roundMoney(qty * rate)
    };
  });

  // 2) Switch to TO DB and migrate masters + opening balances/stock
  await switchToYearDb(toYear.databaseName);

  // Master carry-forward only (no transaction collections copied).
  const mastersCopied = {
    products: await copyCollectionFromSnapshot(Product, sourceSnapshots.products),
    accounts: await copyCollectionFromSnapshot(Account, sourceSnapshots.accounts),
    ledgerAccounts: await copyCollectionFromSnapshot(LedgerAccount, sourceSnapshots.ledgerAccounts),
    companies: await copyCollectionFromSnapshot(Company, sourceSnapshots.companies),
    appUsers: await copyCollectionFromSnapshot(AppUser, sourceSnapshots.appUsers),
    customerTypes: await copyCollectionFromSnapshot(CustomerType, sourceSnapshots.customerTypes),
    warehouses: await copyCollectionFromSnapshot(Warehouse, sourceSnapshots.warehouses),
    productTypes: await copyCollectionFromSnapshot(ProductType, sourceSnapshots.productTypes),
    productMainGroups: await copyCollectionFromSnapshot(ProductMainGroup, sourceSnapshots.productMainGroups),
    productSubGroups: await copyCollectionFromSnapshot(ProductSubGroup, sourceSnapshots.productSubGroups),
    assemblyTypes: await copyCollectionFromSnapshot(AssemblyType, sourceSnapshots.assemblyTypes),
    saleUoms: await copyCollectionFromSnapshot(SaleUom, sourceSnapshots.saleUoms),
    boms: await copyCollectionFromSnapshot(Bom, sourceSnapshots.boms),
    systemSettings: await copyCollectionFromSnapshot(SystemSettings, sourceSnapshots.systemSettings),
    securitySettings: await copyCollectionFromSnapshot(SecuritySettings, sourceSnapshots.securitySettings),
    counters: await copyCollectionFromSnapshot(Counter, sourceSnapshots.counters),
    gridColumnGlobalDefaults: await copyCollectionFromSnapshot(
      GridColumnGlobalDefault,
      sourceSnapshots.gridColumnGlobalDefaults
    ),
    userGridColumnPreferences: await copyCollectionFromSnapshot(
      UserGridColumnPreference,
      sourceSnapshots.userGridColumnPreferences
    )
  };

  // Apply opening balances to ledger accounts + create opening balance records.
  let openingBalanceRecordsCreated = 0;
  for (const row of balances) {
    const opening = splitToOpening(row.closingDisplay);
    await LedgerAccount.updateOne(
      { code: row.accountCode },
      { $set: { openingBalance: opening.openingBalance, openingBalanceType: opening.openingBalanceType } }
    );

    if (opening.openingBalance > 0) {
      await OpeningBalanceEntry.create({
        accountCode: row.accountCode,
        accountName: row.accountName || '',
        amount: opening.openingBalance,
        balanceType: opening.openingBalanceType,
        openingDate: toYear.startDate,
        sourceFinancialYear: fromYear.financialYearName,
        targetFinancialYear: toYear.financialYearName,
        note: 'Opening balance carried forward from previous FY closing'
      });
      openingBalanceRecordsCreated += 1;
    }
  }

  // Opening stock: update product master stock + create opening stock records.
  let openingStockRecordsCreated = 0;
  for (const s of stockRows) {
    await Product.updateOne(
      { code: s.productCode },
      { $set: { stockQty: s.quantity } }
    );

    await OpeningStockEntry.create({
      productCode: s.productCode,
      productName: s.productName,
      unit: s.unit,
      quantity: s.quantity,
      rate: s.rate,
      value: s.value,
      openingDate: toYear.startDate,
      sourceFinancialYear: fromYear.financialYearName,
      targetFinancialYear: toYear.financialYearName,
      note: 'Opening stock carried forward from previous FY closing'
    });
    openingStockRecordsCreated += 1;
  }

  return {
    mastersCopied,
    openingBalancesMigrated: balances.length,
    openingBalanceRecordsCreated,
    openingStockMigrated: stockRows.length,
    openingStockRecordsCreated
  };
}

