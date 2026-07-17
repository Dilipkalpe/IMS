import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { FinancialYear } from '../models/FinancialYear.js';
import { FinancialYearAuditLog } from '../models/FinancialYearAuditLog.js';
import { ensureFinancialYearAvailableForLogin } from '../services/financialYearBootstrap.js';
import { buildDatabaseName } from '../services/financialYearNaming.js';
import { getConfigConnection, switchToYearDb, dropDatabaseByName } from '../config/db.js';
import { runYearEnd } from '../services/yearEndService.js';

const router = Router();

function parseDate(value) {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
}

const transactionCollections = [
  'salesorders',
  'deliverychallans',
  'salesinvoices',
  'salesreturns',
  'purchaseorders',
  'grns',
  'purchaseinvoices',
  'purchasereturns',
  'paymentvouchers',
  'receiptvouchers',
  'creditnotes',
  'debitnotes',
  'cashentries',
  'bankentries',
  'stocktransfers',
  'transactiondocuments'
];

router.get('/', async (_req, res, next) => {
  try {
    await ensureFinancialYearAvailableForLogin();
    const years = await FinancialYear.find({}).sort({ startDate: 1 }).lean();
    res.json(years.map((y) => ({
      id: String(y._id),
      financialYearName: y.financialYearName,
      startDate: y.startDate,
      endDate: y.endDate,
      databaseName: y.databaseName,
      isActive: y.isActive !== false,
      closed: y.closed === true
    })));
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const financialYearName = String(req.body?.financialYearName ?? '').trim();
    const startDate = parseDate(req.body?.startDate);
    const endDate = parseDate(req.body?.endDate);

    if (!financialYearName || !startDate || !endDate) {
      return res.status(400).json({ error: 'financialYearName, startDate and endDate are required.' });
    }
    if (startDate >= endDate) {
      return res.status(400).json({ error: 'Start date must be before end date.' });
    }

    const databaseName = buildDatabaseName(financialYearName, startDate, endDate);

    const existing = await FinancialYear.findOne({
      $or: [{ financialYearName }, { databaseName }]
    }).lean();
    if (existing) {
      return res.status(409).json({ error: 'A financial year with this name or database already exists.' });
    }

    const fy = await FinancialYear.create({
      financialYearName,
      startDate,
      endDate,
      databaseName,
      isActive: true,
      closed: false,
      createdBy: req.authUser?.username || null
    });

    await FinancialYearAuditLog.create({
      action: 'CREATE_YEAR',
      financialYearId: fy._id,
      previousYearId: null,
      databaseName,
      performedBy: req.authUser?.username || null,
      details: {}
    });

    // Ensure DB is created (Mongo creates lazily; connecting is enough)
    await switchToYearDb(databaseName);

    res.status(201).json({
      id: String(fy._id),
      financialYearName: fy.financialYearName,
      startDate: fy.startDate,
      endDate: fy.endDate,
      databaseName: fy.databaseName,
      isActive: fy.isActive !== false,
      closed: fy.closed === true
    });
  } catch (err) {
    next(err);
  }
});

router.post('/year-end', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const fromYearId = String(req.body?.fromYearId ?? '').trim();
    const toFinancialYearName = String(req.body?.toFinancialYearName ?? '').trim();
    const toStartDate = parseDate(req.body?.toStartDate);
    const toEndDate = parseDate(req.body?.toEndDate);

    if (!fromYearId || !toFinancialYearName || !toStartDate || !toEndDate) {
      return res.status(400).json({ error: 'fromYearId, toFinancialYearName, toStartDate and toEndDate are required.' });
    }
    if (toStartDate >= toEndDate) {
      return res.status(400).json({ error: 'Start date must be before end date.' });
    }

    const fromYear = await FinancialYear.findById(fromYearId);
    if (!fromYear) {
      return res.status(404).json({ error: 'Source financial year not found.' });
    }
    if (fromYear.closed === true) {
      return res.status(409).json({ error: 'Source financial year is already closed.' });
    }

    const toDatabaseName = buildDatabaseName(toFinancialYearName, toStartDate, toEndDate);

    const conflict = await FinancialYear.findOne({
      $or: [{ financialYearName: toFinancialYearName }, { databaseName: toDatabaseName }]
    }).lean();
    if (conflict) {
      return res.status(409).json({ error: 'Target financial year already exists.' });
    }

    const toYear = await FinancialYear.create({
      financialYearName: toFinancialYearName,
      startDate: toStartDate,
      endDate: toEndDate,
      databaseName: toDatabaseName,
      isActive: true,
      closed: false,
      previousYearId: fromYear._id,
      createdBy: req.authUser?.username || null
    });

    // Ensure target DB exists
    await switchToYearDb(toDatabaseName);

    const result = await runYearEnd({ fromYear, toYear });

    fromYear.closed = true;
    await fromYear.save();

    await FinancialYearAuditLog.create({
      action: 'YEAR_END',
      financialYearId: toYear._id,
      previousYearId: fromYear._id,
      databaseName: toDatabaseName,
      performedBy: req.authUser?.username || null,
      details: result
    });

    res.status(201).json({
      ok: true,
      fromYearId: String(fromYear._id),
      toYearId: String(toYear._id),
      result
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = String(req.params.id ?? '').trim();
    if (!id) return res.status(400).json({ error: 'Financial year id is required.' });

    const fy = await FinancialYear.findById(id);
    if (!fy) return res.status(404).json({ error: 'Financial year not found.' });

    // Do not allow deleting currently selected FY in active token context.
    if (String(req.financialYearDb || '') === String(fy.databaseName || '')) {
      return res.status(409).json({ error: 'You cannot delete the currently active financial year. Login to another year first.' });
    }

    const cfgConn = getConfigConnection();
    const db = cfgConn.getClient().db(fy.databaseName);
    const collections = await db.listCollections({}, { nameOnly: true }).toArray();
    const names = new Set(collections.map((c) => String(c.name || '').toLowerCase()));

    // Block delete if any transaction collection has data.
    for (const collName of transactionCollections) {
      if (!names.has(collName)) continue;
      const count = await db.collection(collName).countDocuments({}, { limit: 1 });
      if (count > 0) {
        return res.status(409).json({
          error: `Cannot delete financial year because transaction data exists in collection '${collName}'.`
        });
      }
    }

    await FinancialYearAuditLog.create({
      action: 'DELETE_YEAR',
      financialYearId: fy._id,
      previousYearId: fy.previousYearId ?? null,
      databaseName: fy.databaseName,
      performedBy: req.authUser?.username || null,
      details: { reason: 'Manual delete by admin' }
    });

    await FinancialYear.deleteOne({ _id: fy._id });
    await dropDatabaseByName(fy.databaseName);

    res.json({ ok: true, message: `Financial year ${fy.financialYearName} deleted.` });
  } catch (err) {
    next(err);
  }
});

export default router;

