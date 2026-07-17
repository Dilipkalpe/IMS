import { Bom } from '../models/Bom.js';
import { Product } from '../models/Product.js';
import { bomLineRef } from '../constants/materialStages.js';
import { createStageEvent } from './materialTracking.js';

function normalizeCode(code) {
  return String(code || '').trim().toUpperCase();
}

/**
 * Expand BOM lines for a production quantity (same rules as desktop WorkOrder).
 */
export async function expandBomForProduction(productCode, produceQty) {
  const code = normalizeCode(productCode);
  if (!code) {
    throw Object.assign(new Error('Manufacturing item code is required.'), { status: 400 });
  }

  const bom = await Bom.findOne({ productCode: code }).lean();
  if (!bom) {
    throw Object.assign(new Error(`No BOM found for product ${code}. Create BOM first.`), { status: 404 });
  }

  const standardQty = Number(bom.standardQty) > 0 ? Number(bom.standardQty) : 1;
  let produce = Number(produceQty);
  if (!Number.isFinite(produce) || produce <= 0) produce = 1;
  const multiplier = produce / standardQty;

  const rawMaterials = [];
  let sr = 1;
  for (const line of (bom.rawMaterials ?? []).sort((a, b) => (a.srNo ?? 0) - (b.srNo ?? 0))) {
    const itemCode = normalizeCode(line.itemCode || line.itemId);
    const reqQty = (Number(line.qty) || 0) * multiplier;
    const rate = Number(line.rate) || 0;
    let availableQty = reqQty;
    if (itemCode) {
      const product = await Product.findOne({ code: itemCode }).lean();
      if (product) availableQty = Number(product.stockQty) || 0;
    }
    const srNo = sr++;
    rawMaterials.push({
      srNo,
      bomLineRef: bomLineRef('raw', srNo),
      assignmentType: 'bom',
      stage: 'planned',
      stageEvents: [createStageEvent('planned', { qty: reqQty, note: 'Expanded from BOM' })],
      itemId: itemCode || line.itemId || '',
      itemName: line.itemName || '',
      unit: line.unit || 'Nos',
      reqQty,
      availableQty,
      rate,
      amount: reqQty * rate
    });
  }

  const consumables = [];
  sr = 1;
  for (const line of (bom.consumables ?? []).sort((a, b) => (a.srNo ?? 0) - (b.srNo ?? 0))) {
    const qty = (Number(line.qty) || 0) * multiplier;
    const rate = Number(line.rate) || 0;
    const srNo = sr++;
    consumables.push({
      srNo,
      bomLineRef: bomLineRef('consumable', srNo),
      assignmentType: 'bom',
      stage: 'planned',
      stageEvents: [createStageEvent('planned', { qty, note: 'Expanded from BOM' })],
      material: line.material || '',
      qty,
      rate,
      amount: qty * rate
    });
  }

  const rawTotal = rawMaterials.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const consumableTotal = consumables.reduce((s, l) => s + (Number(l.amount) || 0), 0);

  return {
    bom,
    multiplier,
    rawMaterials,
    consumables,
    rawMaterialAmount: rawTotal,
    productionAmount: rawTotal + consumableTotal
  };
}
