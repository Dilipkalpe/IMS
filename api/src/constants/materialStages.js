/** Lifecycle stages for job-work material lines (extensible via config later). */
export const MATERIAL_STAGES = Object.freeze([
  'planned',
  'issued',
  'in_process',
  'consumed',
  'scrapped',
  'received'
]);

export function isValidMaterialStage(stage) {
  return MATERIAL_STAGES.includes(String(stage || '').toLowerCase());
}

export function bomLineRef(lineKind, srNo) {
  return `${lineKind}:${Number(srNo) || 0}`;
}
