import type { MaterialStageEvent } from '../api/productionOrders';

export function formatMaterialStage(stage?: string): string {
  if (!stage?.trim()) return '—';
  return stage
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatMaterialAssignment(assignmentType?: string): string {
  if (!assignmentType?.trim()) return 'BOM';
  switch (assignmentType.toUpperCase()) {
    case 'BOM':
      return 'BOM';
    case 'MANUAL':
      return 'Manual';
    case 'OVERRIDE':
      return 'Override';
    default:
      return assignmentType;
  }
}

export function formatLastMaterialEvent(events?: MaterialStageEvent[]): string {
  if (!events?.length) return '—';
  const event = events[events.length - 1];
  const when = event.at ? new Date(event.at).toLocaleString() : '';
  const place = event.godown?.trim() ? ` @ ${event.godown}` : '';
  const summary = `${formatMaterialStage(event.stage)}${place}${when ? ` · ${when}` : ''}`.trim();
  return summary.replace(/\s·\s$/, '') || '—';
}

export function formatMaterialHistoryTooltip(events?: MaterialStageEvent[]): string {
  if (!events?.length) return 'No stage history yet.';
  return events
    .map((event) => {
      const when = event.at ? new Date(event.at).toLocaleString() : '—';
      const who = event.by?.trim() ? ` · ${event.by}` : '';
      const qty = Number(event.qty) > 0 ? ` · qty ${Number(event.qty).toFixed(2)}` : '';
      const note = event.note?.trim() ? ` — ${event.note}` : '';
      return `${formatMaterialStage(event.stage)} · ${when}${who}${qty}${note}`;
    })
    .join('\n');
}
