import { FinancialYear } from '../models/FinancialYear.js';
import { getMongoUri, parseDbNameFromUri } from '../config/db.js';

function computeCurrentFinancialYearRange() {
  const today = new Date();
  const year = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  return {
    startDate: new Date(year, 3, 1),
    endDate: new Date(year + 1, 2, 31),
    financialYearName: `${year}-${String(year + 1).slice(-2)}`
  };
}

export async function ensureFinancialYearBootstrap() {
  const count = await FinancialYear.countDocuments({});
  if (count > 0) return;

  const { financialYearName, startDate, endDate } = computeCurrentFinancialYearRange();
  const databaseName = parseDbNameFromUri(getMongoUri());

  await FinancialYear.create({
    financialYearName,
    startDate,
    endDate,
    databaseName,
    isActive: true,
    closed: false,
    createdBy: 'system'
  });

  console.log(`FinancialYear bootstrap created: ${financialYearName} -> ${databaseName}`);
}

/** Ensure at least one year can be selected at login (WPF: IsActive only). */
export async function ensureFinancialYearAvailableForLogin() {
  await ensureFinancialYearBootstrap();

  const activeCount = await FinancialYear.countDocuments({ isActive: { $ne: false } });
  if (activeCount > 0) return;

  const latest = await FinancialYear.findOne({}).sort({ endDate: -1 });
  if (latest) {
    latest.isActive = true;
    await latest.save();
    console.log(`FinancialYear reactivated for login: ${latest.financialYearName}`);
  }
}

