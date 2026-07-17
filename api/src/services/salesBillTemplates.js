/** Backward-compatible re-exports — use billFormatTemplates.js for new code. */
export {
  listBillFormats as listSalesBillTemplates,
  getBillFormatById as getSalesBillTemplateById,
  getBillFormatByKey as getSalesBillTemplateByKey,
  getDefaultBillFormat as getDefaultSalesBillTemplate,
  ensureDefaultBillFormats as ensureDefaultSalesBillTemplates,
  createBillFormat as createSalesBillTemplate,
  updateBillFormat as updateSalesBillTemplate,
  updateBillFormatLayout as updateSalesBillTemplateLayout,
  deleteBillFormat as deleteSalesBillTemplate,
  duplicateBillFormat as duplicateSalesBillTemplate
} from './billFormatTemplates.js';
