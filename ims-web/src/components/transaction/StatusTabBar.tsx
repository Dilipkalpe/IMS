import type { CSSProperties } from 'react';
import { formatLocaleNumber } from '../../utils/formatLocaleNumber';
import './StatusTabBar.scss';

export interface StatusTabItem {
  /** Unique tab id (for React keys). */
  id: string;
  /** Visible label below the count. */
  label: string;
  /** Record count shown prominently on the tab. */
  count: number;
  /** Value passed to list status filter when tab is selected. */
  filterValue: string;
  /** Accent color for icon box, count, and active underline. */
  color: string;
  /** Segoe MDL2 glyph shown inside the colored icon square. */
  iconGlyph: string;
}

export interface StatusTabBarProps {
  tabs: StatusTabItem[];
  activeFilter: string;
  onTabSelect: (filterValue: string) => void;
  className?: string;
}

/** Horizontal status tabs with colored icon squares and record counts (Outward Order List style). */
export function StatusTabBar({ tabs, activeFilter, onTabSelect, className }: StatusTabBarProps) {
  const normalizedActive =
    activeFilter === '(All)' || activeFilter === '' ? 'All' : activeFilter;

  return (
    <div
      className={['status-tab-bar', className].filter(Boolean).join(' ')}
      role="tablist"
      aria-label="Status filters"
    >
      {tabs.map((tab) => {
        const isActive = tab.filterValue === normalizedActive;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={['status-tab-bar__tab', isActive && 'status-tab-bar__tab--active']
              .filter(Boolean)
              .join(' ')}
            style={
              {
                '--status-tab-color': tab.color,
              } as CSSProperties
            }
            onClick={() => onTabSelect(tab.filterValue)}
          >
            <span className="status-tab-bar__icon" aria-hidden>
              <span className="status-tab-bar__glyph">{tab.iconGlyph}</span>
            </span>
            <span className="status-tab-bar__meta">
              <span className="status-tab-bar__count">{formatLocaleNumber(tab.count)}</span>
              <span className="status-tab-bar__label">{tab.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
