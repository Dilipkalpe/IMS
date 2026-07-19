import { useCallback, useMemo, type KeyboardEvent } from 'react';
import { useWorkspaceTabShortcuts } from '../keyboard/useWorkspaceTabShortcuts';
import { usePurchaseOrderRepositoryOptional } from './repository/PurchaseOrderRepositoryContext';
import { RefinedScreenShell } from '../screens/RefinedScreenShell';
import '../sales-invoice/sales-invoice.scss';
import { WorkspaceTabBarStatus } from '../components/transaction/WorkspaceDocumentStatusBanner';
import { PurchaseOrderEntryForm } from './PurchaseOrderEntryForm';
import { PurchaseOrderWorkspaceProvider, usePurchaseOrderWorkspace } from './workspace/PurchaseOrderWorkspaceProvider';

function PurchaseOrderWorkspaceInner({ lineCount = 0 }: { lineCount?: number }) {
  const ws = usePurchaseOrderWorkspace();
  const { tabs, activeTab, tabIds, selectTab, closeTab, addTab, focusSeed } = ws;

  useWorkspaceTabShortcuts(tabIds, activeTab?.id ?? '', selectTab, { onNewTab: addTab });

  const onTabListKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const idx = tabIds.indexOf(activeTab?.id ?? '');
      if (idx < 0) return;
      e.preventDefault();
      const next = e.key === 'ArrowRight' ? (idx + 1) % tabIds.length : (idx - 1 + tabIds.length) % tabIds.length;
      selectTab(tabIds[next]);
    },
    [activeTab?.id, selectTab, tabIds],
  );

  const mountedTabs = useMemo(() => tabs, [tabs]);

  return (
    <RefinedScreenShell className="sales-invoice-workspace-screen">
      <div className="si-workspace" data-wpf-source="Views/PurchaseOrderWorkspaceView.xaml">
        <div className="si-workspace__tabbar">
          <div
            className="si-workspace__tabs"
            role="tablist"
            aria-label="Purchase order tabs"
            onKeyDown={onTabListKeyDown}
          >
            {tabs.map((tab) => (
              <div key={tab.id} className="si-tab-chip" role="presentation">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab.isSelected}
                  className={`si-tab-chip__btn${tab.isSelected ? ' si-tab-chip__btn--active' : ''}`}
                  onClick={() => selectTab(tab.id)}
                >
                  {tab.title}
                </button>
                <button
                  type="button"
                  className="si-tab-chip__close"
                  title="Close tab"
                  onClick={() => closeTab(tab.id)}
                  disabled={tabs.length <= 1}
                  aria-label={`Close ${tab.title}`}
                  tabIndex={-1}
                >
                  &#xE711;
                </button>
              </div>
            ))}
            <button type="button" className="wpf-action-button si-workspace__new-tab" onClick={() => addTab()} title="New tab (Ctrl+T)">
              + New Tab
            </button>
          </div>
          <WorkspaceTabBarStatus activeTabId={activeTab?.id} documents={ws.documents} />
        </div>
        <div className="si-workspace__content" role="tabpanel">
          {mountedTabs.map((tab) => (
            <div key={tab.id} className="si-workspace__panel" hidden={!tab.isSelected} aria-hidden={!tab.isSelected}>
              <PurchaseOrderEntryForm
                tabId={tab.id}
                lineCount={lineCount}
                autoFocusFieldKey={tab.isSelected ? `entryDocPrefix-${tab.id}-${focusSeed}` : undefined}
              />
            </div>
          ))}
        </div>
      </div>
    </RefinedScreenShell>
  );
}

export function PurchaseOrderWorkspaceScreen({ lineCount = 0 }: { lineCount?: number }) {
  const { isReady } = usePurchaseOrderRepositoryOptional();
  if (!isReady) {
    return (
      <RefinedScreenShell className="sales-invoice-workspace-screen">
        <div className="si-list-toolbar__status">Preparing purchase order workspace…</div>
      </RefinedScreenShell>
    );
  }
  return (
    <PurchaseOrderWorkspaceProvider lineCount={lineCount}>
      <PurchaseOrderWorkspaceInner lineCount={lineCount} />
    </PurchaseOrderWorkspaceProvider>
  );
}
