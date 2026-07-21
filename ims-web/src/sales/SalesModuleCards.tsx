import type { HubTab } from '../hub/hubTypes';
import type { SalesHubTabCounts } from './useSalesHubTabCounts';
import './SalesModuleCards.scss';

export interface SalesModuleCardsProps {
  tabs: HubTab[];
  activeTab: string;
  counts: SalesHubTabCounts;
  onSelect: (tabKey: string) => void;
}

export function SalesModuleCards({ tabs, activeTab, counts, onSelect }: SalesModuleCardsProps) {
  return (
    <div className="sales-module-cards" role="tablist" aria-label="Sales modules">
      <div className="sales-module-cards__row">
        {tabs.map((tab) => {
          const selected = activeTab === tab.key;
          const count = counts[tab.key] ?? 0;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`sales-module-cards__card${selected ? ' sales-module-cards__card--active' : ''}`}
              title={tab.description}
              onClick={() => onSelect(tab.key)}
            >
              <span className="icon-text sales-module-cards__icon" aria-hidden>
                {tab.iconGlyph}
              </span>
              <span className="sales-module-cards__count" aria-label={`${count} records`}>
                {count}
              </span>
              <span className="sales-module-cards__label">{tab.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
