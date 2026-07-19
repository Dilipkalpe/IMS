import { useMemo } from 'react';
import { resolveScreenComponent } from '../navigation/resolveScreen';
import { getHubDefinition } from './hubRegistry';
import { useHubTab } from './HubContext';

function HubTabPanel({ tabKey }: { tabKey: string }) {
  const Screen = useMemo(() => resolveScreenComponent(tabKey), [tabKey]);
  return <Screen />;
}

export interface HubScreenProps {
  hubNavKey: string;
}

export function HubScreen({ hubNavKey }: HubScreenProps) {
  const hub = getHubDefinition(hubNavKey);
  const { activeTab, setActiveTab } = useHubTab(hubNavKey);

  if (!hub) return null;

  return (
    <div className="module-hub" data-wpf-source={hub.wpfSource}>
      <div className="module-hub__tabbar" role="tablist" aria-label={`${hub.sidebarTitle} modules`}>
        <div className="module-hub__tabs">
          {hub.tabs.map((tab) => {
            const selected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={selected}
                className={`si-tab-chip__btn${selected ? ' si-tab-chip__btn--active' : ''}`}
                title={tab.description}
                onClick={() => setActiveTab(tab.key)}
              >
                <span className="icon-text module-hub__tab-icon" aria-hidden>
                  {tab.iconGlyph}
                </span>
                {tab.title}
              </button>
            );
          })}
        </div>
      </div>
      <div className="module-hub__content">
        {hub.tabs.map((tab) => (
          <div
            key={tab.key}
            role="tabpanel"
            className="module-hub__panel"
            hidden={activeTab !== tab.key}
            aria-hidden={activeTab !== tab.key}
          >
            <HubTabPanel tabKey={tab.key} />
          </div>
        ))}
      </div>
    </div>
  );
}
