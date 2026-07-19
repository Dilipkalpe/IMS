import type { DashboardStat } from '../../api/dashboard';
import { formatLocaleNumber } from '../../utils/formatLocaleNumber';

type StatPreset =
  | 'total'
  | 'open'
  | 'draft'
  | 'posted'
  | 'shipped'
  | 'cancelled'
  | 'toShip'
  | 'source'
  | 'active'
  | 'admin'
  | 'department'
  | 'users';

const PRESETS: Record<StatPreset, { iconGlyph: string; accentColor: string }> = {
  total: { iconGlyph: '\uE8A5', accentColor: '#2563eb' },
  open: { iconGlyph: '\uE8E5', accentColor: '#2563eb' },
  draft: { iconGlyph: '\uE70F', accentColor: '#64748b' },
  posted: { iconGlyph: '\uE73E', accentColor: '#16a34a' },
  shipped: { iconGlyph: '\uE7BF', accentColor: '#16a34a' },
  cancelled: { iconGlyph: '\uE711', accentColor: '#dc2626' },
  toShip: { iconGlyph: '\uE7C8', accentColor: '#d97706' },
  source: { iconGlyph: '\uE753', accentColor: '#64748b' },
  active: { iconGlyph: '\uE73E', accentColor: '#16a34a' },
  admin: { iconGlyph: '\uE8D7', accentColor: '#7c3aed' },
  department: { iconGlyph: '\uE8F1', accentColor: '#64748b' },
  users: { iconGlyph: '\uE77B', accentColor: '#2563eb' },
};

export function formatListStatValue(value: number | string | null | undefined): string {
  if (typeof value === 'number') return formatLocaleNumber(value);
  if (value == null) return '0';
  return value;
}

export function listStat(label: string, value: number | string, preset: StatPreset): DashboardStat {
  const presetStyle = PRESETS[preset];
  return {
    label,
    value: formatListStatValue(value),
    iconGlyph: presetStyle.iconGlyph,
    accentColor: presetStyle.accentColor,
  };
}

export function buildDataSourceStat(mode: 'http' | 'local' | undefined): DashboardStat {
  return listStat('Source', mode === 'http' ? 'API' : 'Local', 'source');
}
