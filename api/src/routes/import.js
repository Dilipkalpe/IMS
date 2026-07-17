import { Router } from 'express';
import multer from 'multer';
import {
  buildImportTemplate,
  getImportType,
  runImport,
  IMPORT_TYPES
} from '../services/excelImport.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.get('/types', (_req, res) => {
  res.json(
    Object.entries(IMPORT_TYPES).map(([key, value]) => ({
      key,
      label: value.label,
      navigateKey: value.navigateKey,
      templateName: value.templateName
    }))
  );
});

router.get('/:type/template', (req, res, next) => {
  try {
    const config = getImportType(req.params.type);
    if (!config) return res.status(404).json({ error: 'Unknown import type' });

    const buffer = buildImportTemplate(req.params.type);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${config.templateName}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

router.post('/:type', upload.single('file'), async (req, res, next) => {
  try {
    const config = getImportType(req.params.type);
    if (!config) return res.status(404).json({ error: 'Unknown import type' });

    if (!req.file?.buffer?.length) {
      return res.status(400).json({ error: 'Excel file is required (field name: file)' });
    }

    const result = await runImport(req.params.type, req.file.buffer);
    res.json({
      success: result.failed === 0 || result.imported > 0,
      type: req.params.type,
      label: config.label,
      navigateKey: config.navigateKey,
      imported: result.imported,
      failed: result.failed,
      errors: result.errors,
      documents: result.documents
    });
  } catch (err) {
    next(err);
  }
});

export default router;
