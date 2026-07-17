import * as reportFormatService from '../services/reportFormatService.js';
import * as labelFormatService from '../services/labelFormatService.js';
import * as paperSizeService from '../services/paperSizeService.js';
import * as partyMappingService from '../services/partyMappingService.js';
import * as fieldRegistryService from '../services/fieldRegistryService.js';
import * as seedService from '../services/reportingSeedService.js';

export async function seed(req, res, next) {
  try {
    res.json(await seedService.seedReportingMasterData());
  } catch (err) {
    next(err);
  }
}

export async function ensureDefaults(req, res, next) {
  try {
    res.json(await seedService.ensureReportingDefaults());
  } catch (err) {
    next(err);
  }
}

export async function applyStandardLayouts(req, res, next) {
  try {
    res.json(await seedService.applyStandardLayoutsToSystemFormats());
  } catch (err) {
    next(err);
  }
}

export async function designerCatalog(_req, res, next) {
  try {
    res.json(await fieldRegistryService.getDesignerCatalog());
  } catch (err) {
    next(err);
  }
}

export async function fieldRegistry(req, res, next) {
  try {
    const transactionType = String(req.query.transactionType ?? 'sales_invoice').trim();
    res.json(await fieldRegistryService.getRegistryForTransaction(transactionType));
  } catch (err) {
    next(err);
  }
}

// --- Report formats ---
export async function listReportFormats(req, res, next) {
  try {
    const transactionType = req.query.transactionType ? String(req.query.transactionType).trim() : undefined;
    const includeInactive = req.query.includeInactive === 'true';
    res.json(await reportFormatService.listReportFormats({ transactionType, includeInactive }));
  } catch (err) {
    next(err);
  }
}

export async function resolveReportFormat(req, res, next) {
  try {
    res.json(
      await reportFormatService.resolveReportFormat({
        transactionType: req.query.transactionType,
        partyCode: req.query.partyCode ?? null,
        partyKind: req.query.partyKind ?? null
      })
    );
  } catch (err) {
    next(err);
  }
}

export async function getReportFormat(req, res, next) {
  try {
    const format = await reportFormatService.getReportFormatById(req.params.id);
    if (!format) return res.status(404).json({ error: 'Report format not found.' });
    res.json(format);
  } catch (err) {
    next(err);
  }
}

export async function createReportFormat(req, res, next) {
  try {
    res.status(201).json(await reportFormatService.createReportFormat(req.body, req.authUser));
  } catch (err) {
    next(err);
  }
}

export async function updateReportFormat(req, res, next) {
  try {
    res.json(await reportFormatService.updateReportFormat(req.params.id, req.body, req.authUser));
  } catch (err) {
    next(err);
  }
}

export async function deleteReportFormat(req, res, next) {
  try {
    res.json(await reportFormatService.deleteReportFormat(req.params.id));
  } catch (err) {
    next(err);
  }
}

// --- Label formats ---
export async function listLabelFormats(req, res, next) {
  try {
    const labelType = req.query.labelType ? String(req.query.labelType).trim() : undefined;
    res.json(await labelFormatService.listLabelFormats({ labelType }));
  } catch (err) {
    next(err);
  }
}

export async function resolveLabelFormat(req, res, next) {
  try {
    res.json(await labelFormatService.resolveLabelFormat(req.query.labelType ?? 'product'));
  } catch (err) {
    next(err);
  }
}

export async function getLabelFormat(req, res, next) {
  try {
    const format = await labelFormatService.getLabelFormatById(req.params.id);
    if (!format) return res.status(404).json({ error: 'Label format not found.' });
    res.json(format);
  } catch (err) {
    next(err);
  }
}

export async function createLabelFormat(req, res, next) {
  try {
    res.status(201).json(await labelFormatService.createLabelFormat(req.body, req.authUser));
  } catch (err) {
    next(err);
  }
}

export async function updateLabelFormat(req, res, next) {
  try {
    res.json(await labelFormatService.updateLabelFormat(req.params.id, req.body, req.authUser));
  } catch (err) {
    next(err);
  }
}

// --- Paper sizes ---
export async function listPaperSizes(_req, res, next) {
  try {
    res.json(await paperSizeService.listPaperSizes());
  } catch (err) {
    next(err);
  }
}

export async function createPaperSize(req, res, next) {
  try {
    res.status(201).json(await paperSizeService.createOrUpdatePaperSize(req.body));
  } catch (err) {
    next(err);
  }
}

// --- Party mappings ---
export async function setCustomerMapping(req, res, next) {
  try {
    const { customerCode, transactionType, reportFormatId } = req.body ?? {};
    if (!customerCode || !transactionType || !reportFormatId) {
      return res.status(400).json({ error: 'customerCode, transactionType, reportFormatId required.' });
    }
    res.json(await partyMappingService.setCustomerFormatMapping({ customerCode, transactionType, reportFormatId }));
  } catch (err) {
    next(err);
  }
}

export async function setSupplierMapping(req, res, next) {
  try {
    const { supplierCode, transactionType, reportFormatId } = req.body ?? {};
    if (!supplierCode || !transactionType || !reportFormatId) {
      return res.status(400).json({ error: 'supplierCode, transactionType, reportFormatId required.' });
    }
    res.json(await partyMappingService.setSupplierFormatMapping({ supplierCode, transactionType, reportFormatId }));
  } catch (err) {
    next(err);
  }
}
