import { bomLineRef, isValidMaterialStage } from '../constants/materialStages.js';

export function createStageEvent(stage, { qty = 0, by = '', godown = '', note = '', at } = {}) {
  return {
    stage: String(stage).toLowerCase(),
    at: at ? new Date(at) : new Date(),
    by: String(by || '').trim(),
    qty: Number(qty) || 0,
    godown: String(godown || '').trim(),
    note: String(note || '').trim()
  };
}

export function ensureLineTracking(line, lineKind, { assignmentType = 'bom', by = '', godown = '' } = {}) {
  if (!line) return line;
  const qty = lineKind === 'raw' ? Number(line.reqQty) || 0 : Number(line.qty) || 0;
  if (!line.bomLineRef) line.bomLineRef = bomLineRef(lineKind, line.srNo);
  if (!line.assignmentType) line.assignmentType = assignmentType;
  if (!line.stage) line.stage = 'planned';
  if (!Array.isArray(line.stageEvents) || line.stageEvents.length === 0) {
    line.stageEvents = [createStageEvent('planned', { qty, by, godown, note: 'BOM expand / line created' })];
  }
  return line;
}

export function ensureOrderMaterialTracking(doc, { assignmentType = 'bom' } = {}) {
  const by = doc.operatorId || doc.operatorName || '';
  const godown = doc.fromGodown || '';
  for (const line of doc.rawMaterials ?? []) {
    ensureLineTracking(line, 'raw', { assignmentType, by, godown });
  }
  for (const line of doc.consumables ?? []) {
    ensureLineTracking(line, 'consumable', { assignmentType, by, godown });
  }
  return doc;
}

export function appendLineStageEvent(line, stage, opts = {}) {
  if (!isValidMaterialStage(stage)) {
    throw Object.assign(new Error(`Invalid material stage: ${stage}`), { status: 400 });
  }
  const event = createStageEvent(stage, opts);
  line.stage = event.stage;
  line.stageEvents = [...(line.stageEvents ?? []), event];
  return line;
}

export function findMaterialLine(doc, lineKind, srNo) {
  const n = Number(srNo);
  if (lineKind === 'raw') return (doc.rawMaterials ?? []).find((l) => Number(l.srNo) === n);
  if (lineKind === 'consumable') return (doc.consumables ?? []).find((l) => Number(l.srNo) === n);
  return null;
}

/** Auto-advance lines when production is marked completed (stock issue / consume). */
export function applyAutoStagesOnComplete(doc) {
  ensureOrderMaterialTracking(doc);
  const by = doc.operatorId || doc.operatorName || '';
  const godown = doc.fromGodown || '';
  for (const line of doc.rawMaterials ?? []) {
    if (line.stage === 'planned') {
      appendLineStageEvent(line, 'issued', {
        qty: line.reqQty,
        by,
        godown,
        note: 'Stock issue on production complete'
      });
    }
  }
  for (const line of doc.consumables ?? []) {
    if (line.stage === 'planned') {
      appendLineStageEvent(line, 'consumed', {
        qty: line.qty,
        by,
        godown,
        note: 'Consumable on production complete'
      });
    }
  }
  return doc;
}

export function materialTrackingSummary(doc) {
  const lines = [];
  for (const line of doc.rawMaterials ?? []) {
    lines.push({
      lineKind: 'raw',
      srNo: line.srNo,
      bomLineRef: line.bomLineRef,
      assignmentType: line.assignmentType,
      itemId: line.itemId,
      itemName: line.itemName,
      qty: line.reqQty,
      stage: line.stage,
      stageEvents: line.stageEvents ?? [],
      lastEvent: (line.stageEvents ?? []).at(-1) ?? null
    });
  }
  for (const line of doc.consumables ?? []) {
    lines.push({
      lineKind: 'consumable',
      srNo: line.srNo,
      bomLineRef: line.bomLineRef,
      assignmentType: line.assignmentType,
      material: line.material,
      qty: line.qty,
      stage: line.stage,
      stageEvents: line.stageEvents ?? [],
      lastEvent: (line.stageEvents ?? []).at(-1) ?? null
    });
  }
  return {
    productionNo: doc.productionNo,
    status: doc.status,
    bomProductCode: doc.bomProductCode,
    bomRevision: doc.bomRevision,
    lines
  };
}
