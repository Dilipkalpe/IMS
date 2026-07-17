import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireAdmin } from '../../middleware/requireAdmin.js';
import * as ctrl from '../controllers/reportingController.js';

const router = Router();

router.use(requireAuth);

// Catalog & seed
router.get('/catalog', ctrl.designerCatalog);
router.get('/field-registry', ctrl.fieldRegistry);
router.post('/seed', requireAdmin, ctrl.seed);
router.post('/ensure-defaults', ctrl.ensureDefaults);
router.post('/apply-standard-layouts', ctrl.applyStandardLayouts);

// Paper sizes
router.get('/paper-sizes', ctrl.listPaperSizes);
router.post('/paper-sizes', requireAdmin, ctrl.createPaperSize);

// Report formats
router.get('/report-formats', ctrl.listReportFormats);
router.get('/report-formats/resolve', ctrl.resolveReportFormat);
router.get('/report-formats/:id', ctrl.getReportFormat);
router.post('/report-formats', requireAdmin, ctrl.createReportFormat);
router.put('/report-formats/:id', ctrl.updateReportFormat);
router.delete('/report-formats/:id', requireAdmin, ctrl.deleteReportFormat);

// Label formats
router.get('/label-formats', ctrl.listLabelFormats);
router.get('/label-formats/resolve', ctrl.resolveLabelFormat);
router.get('/label-formats/:id', ctrl.getLabelFormat);
router.post('/label-formats', requireAdmin, ctrl.createLabelFormat);
router.put('/label-formats/:id', requireAdmin, ctrl.updateLabelFormat);

// Party print preferences
router.put('/customer-print-preferences', requireAdmin, ctrl.setCustomerMapping);
router.put('/supplier-print-preferences', requireAdmin, ctrl.setSupplierMapping);

export default router;
