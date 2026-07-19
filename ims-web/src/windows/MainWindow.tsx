/**
 * UI conversion of IMS/MainWindow.xaml — shell with navigation + content host.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppNavigationProvider } from '../context/AppNavigationContext';
import {
  useWorkspaceDocumentHeaderOptional,
  WorkspaceDocumentHeaderProvider,
} from '../context/WorkspaceDocumentHeaderContext';
import { EditDeleteGuardProvider } from '../context/EditDeleteGuardContext';
import { MenuPermissionProvider } from '../context/MenuPermissionContext';
import { DocumentPrintProvider } from '../document';
import { PurchaseInvoiceNavIntentProvider } from '../purchase-invoice/context/PurchaseInvoiceNavIntent';
import { PurchaseInvoiceRepositoryProvider } from '../purchase-invoice/repository/PurchaseInvoiceRepositoryContext';
import { GrnNavIntentProvider } from '../grn/context/GrnNavIntent';
import { GrnRepositoryProvider } from '../grn/repository/GrnRepositoryContext';
import { PurchaseOrderNavIntentProvider } from '../purchase-order/context/PurchaseOrderNavIntent';
import { PurchaseOrderRepositoryProvider } from '../purchase-order/repository/PurchaseOrderRepositoryContext';
import { PurchaseReturnNavIntentProvider } from '../purchase-return/context/PurchaseReturnNavIntent';
import { PurchaseReturnRepositoryProvider } from '../purchase-return/repository/PurchaseReturnRepositoryContext';
import { QuotationNavIntentProvider } from '../quotation/context/QuotationNavIntent';
import { QuotationRepositoryProvider } from '../quotation/repository/QuotationRepositoryContext';
import { DeliveryChallanNavIntentProvider } from '../delivery-challan/context/DeliveryChallanNavIntent';
import { DeliveryChallanRepositoryProvider } from '../delivery-challan/repository/DeliveryChallanRepositoryContext';
import { SalesOrderNavIntentProvider } from '../sales-order/context/SalesOrderNavIntent';
import { SalesOrderRepositoryProvider } from '../sales-order/repository/SalesOrderRepositoryContext';
import { SalesReturnNavIntentProvider } from '../sales-return/context/SalesReturnNavIntent';
import { SalesReturnRepositoryProvider } from '../sales-return/repository/SalesReturnRepositoryContext';
import { InvoiceCommunicationProvider } from '../sales-invoice/context/InvoiceCommunicationContext';
import { SalesInvoiceNavIntentProvider } from '../sales-invoice/context/SalesInvoiceNavIntent';
import { ReceiptVoucherNavIntentProvider } from '../receipt-voucher/context/ReceiptVoucherNavIntent';
import { PaymentVoucherNavIntentProvider } from '../payment-voucher/context/PaymentVoucherNavIntent';
import { WorkOrderNavIntentProvider } from '../work-order/context/WorkOrderNavIntent';
import { ProductMasterNavIntentProvider } from '../masters/context/ProductMasterNavIntent';
import { PayrollEmployeeNavIntentProvider } from '../payroll/context/PayrollEmployeeNavIntent';
import { RoleNavIntentProvider } from '../security/context/RoleNavIntent';
import { UserNavIntentProvider, useUserNavIntent } from '../security/context/UserNavIntent';
import { AccountMasterNavIntentProvider } from '../masters/context/AccountMasterNavIntent';
import { SalesInvoiceRepositoryProvider } from '../sales-invoice/repository/SalesInvoiceRepositoryContext';
import { SalesCustomerPickerProvider } from '../components/transaction/SalesCustomerPickerContext';
import { WorkflowQuickNav } from '../components/WorkflowQuickNav';
import { buildNavigationSections, navigationCatalog, searchableNavigationCatalog } from '../navigation/navigationCatalog';
import { NavKeys } from '../navigation/navKeys';
import { resolveScreenComponent } from '../navigation/resolveScreen';
import {
  getHubDefinition,
  getHubForModuleNavKey,
  getHubTabTitle,
  HUB_BY_SECTION,
  isHubModuleNavKey,
  isHubNavKey,
  isNavItemActive,
  resolveInitialHubTabs,
  resolveInitialSelectedKey,
} from '../hub/hubRegistry';
import { HubNavigationProvider } from '../hub/HubContext';
import { formatWorkspaceEntryHeaderTitle } from '../navigation/workspaceEntryHeaders';
import { placeholders } from '../placeholders';
import { getAuthSession, logout } from '../api/auth';
import { HeaderUserMenu } from '../components/header/HeaderUserMenu';
import { useCompanyBranding } from '../hooks/useCompanyBranding';
import './MainWindow.scss';

export interface MainWindowProps {
  initialNavKey?: string;
  onLogout?: () => void;
}

const MOBILE_NAV_QUERY = '(max-width: 1023px)';
const SIDEBAR_COLLAPSED_KEY = 'ims.sidebarCollapsed';

function readSidebarCollapsedPreference(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function MainWindowShell({ initialNavKey = NavKeys.Dashboard, onLogout }: MainWindowProps) {
  const authSession = useMemo(() => getAuthSession(), []);
  const { publishOpenIntent } = useUserNavIntent();
  const { branding } = useCompanyBranding({ authenticated: true });
  const workspaceDocumentLabel = useWorkspaceDocumentHeaderOptional()?.documentLabel;
  const sections = useMemo(() => buildNavigationSections(), []);
  const [selectedKey, setSelectedKey] = useState(() => resolveInitialSelectedKey(initialNavKey));
  const [hubTabs, setHubTabs] = useState(() => resolveInitialHubTabs(initialNavKey));
  const [menuSearch, setMenuSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsedPreference);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sections.map((s) => [s.name, s.isExpanded])),
  );

  const isMobileNav = useCallback(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_NAV_QUERY).matches,
    [],
  );

  const setHubTab = useCallback((hubNavKey: string, tabNavKey: string) => {
    setHubTabs((prev) => ({ ...prev, [hubNavKey]: tabNavKey }));
  }, []);

  const selectNavKey = useCallback(
    (key: string) => {
      const moduleHub = getHubForModuleNavKey(key);
      if (moduleHub) {
        setHubTab(moduleHub.hubNavKey, key);
        setSelectedKey(moduleHub.hubNavKey);
      } else if (isHubNavKey(key)) {
        setSelectedKey(key);
      } else {
        setSelectedKey(key);
      }
      if (isMobileNav()) {
        setSidebarOpen(false);
      }
    },
    [isMobileNav, setHubTab],
  );

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
    } catch {
      // ignore storage failures
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_NAV_QUERY);
    const onChange = () => {
      if (!mq.matches) {
        setSidebarOpen(false);
      }
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const headerTitle = useMemo(() => {
    const workspaceTitle = formatWorkspaceEntryHeaderTitle(
      selectedKey,
      workspaceDocumentLabel ?? 'New',
    );
    if (workspaceTitle) return workspaceTitle;
    if (isHubNavKey(selectedKey)) {
      const hub = getHubDefinition(selectedKey);
      const tabKey = hubTabs[selectedKey] ?? hub?.defaultTabKey;
      if (hub && tabKey) {
        return getHubTabTitle(selectedKey, tabKey) ?? hub.sidebarTitle;
      }
    }
    const catalogItem =
      navigationCatalog.find((i) => i.key === selectedKey) ??
      searchableNavigationCatalog.find((i) => i.key === selectedKey);
    return catalogItem?.title ?? 'Dashboard';
  }, [selectedKey, hubTabs, workspaceDocumentLabel]);
  const Screen = useMemo(() => resolveScreenComponent(selectedKey), [selectedKey]);
  const showDevTools = import.meta.env.DEV;

  const searchTerm = menuSearch.trim().toLowerCase();
  const isSearchActive = searchTerm.length > 0;
  const searchResults = isSearchActive
    ? searchableNavigationCatalog.filter(
        (i) =>
          i.title.toLowerCase().includes(searchTerm) ||
          i.section.toLowerCase().includes(searchTerm) ||
          i.key.toLowerCase().includes(searchTerm),
      )
    : [];

  const collapsedNavItems = useMemo(() => {
    const items: Array<{ key: string; title: string; iconGlyph: string; section: string }> = [];
    for (const section of sections) {
      const hub = HUB_BY_SECTION.get(section.name);
      if (hub) {
        const hubItem = section.items[0];
        if (hubItem) items.push(hubItem);
        continue;
      }
      if (section.name === 'Overview') {
        const overviewItem = section.items[0];
        if (overviewItem) items.push(overviewItem);
        continue;
      }
      items.push(...section.items);
    }
    return items;
  }, [sections]);

  const handleMobileMenuToggle = useCallback(() => {
    setSidebarOpen((open) => !open);
  }, []);

  const toggleSection = (name: string) => {
    setExpandedSections((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleLogout = useCallback(async () => {
    if (!window.confirm('Sign out and return to login?')) return;
    await logout();
    onLogout?.();
  }, [onLogout]);

  const handleOpenProfile = useCallback(() => {
    const username = authSession?.user.username?.trim();
    if (username) {
      publishOpenIntent({ type: 'edit', username });
      selectNavKey('user-form');
      return;
    }
    selectNavKey(NavKeys.UserRoles);
  }, [authSession?.user.username, publishOpenIntent, selectNavKey]);

  return (
    <div
      className={`main-window${sidebarOpen ? ' main-window--sidebar-open' : ''}${sidebarCollapsed ? ' main-window--sidebar-collapsed' : ''}`}
      data-wpf-source="MainWindow.xaml"
    >
      {sidebarOpen && (
        <button
          type="button"
          className="main-window__backdrop"
          aria-label="Close navigation menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className="main-window__sidebar" aria-label="Main navigation">
        <div className="main-window__sidebar-brand">
          <div className="main-window__sidebar-brand-row">
            <div className="main-window__sidebar-logo">
              {branding.hasLogo ? (
                <img src={branding.logoImage} alt="" className="main-window__sidebar-logo-img" />
              ) : (
                <span className="icon-text main-window__sidebar-logo-fallback" aria-hidden>&#xE7B8;</span>
              )}
            </div>
            <div className="main-window__sidebar-title">
              <h1>{branding.businessName}</h1>
              <p className="main-window__sidebar-tagline">{branding.logoText}</p>
            </div>
          </div>
        </div>

        <div className="main-window__search-block">
          <div className="main-window__search-label">Search menu</div>
          <div className="main-window__search-box">
            <span className="icon-text" title="Search">&#xE721;</span>
            <input
              className="wpf-nav-sidebar-search-box-inner"
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              placeholder=""
            />
            <button type="button" className="wpf-nav-sidebar-icon-button" title="Clear search" onClick={() => setMenuSearch('')}>
              <span className="icon-text" style={{ fontSize: 12 }}>&#xE8BB;</span>
            </button>
          </div>
        </div>

        <div className="main-window__nav-scroll">
          {!isSearchActive && sidebarCollapsed && (
            <>
              {collapsedNavItems.map((item) => (
                <NavItemRow
                  key={item.key}
                  item={item}
                  active={isNavItemActive(selectedKey, hubTabs, item.key)}
                  onSelect={() => selectNavKey(item.key)}
                  collapsed
                />
              ))}
            </>
          )}

          {!isSearchActive && !sidebarCollapsed && (
            <>
              {sections.map((section) => {
                const hub = HUB_BY_SECTION.get(section.name);
                if (hub) {
                  const hubItem = section.items[0];
                  if (!hubItem) return null;
                  const hubActive =
                    selectedKey === hub.hubNavKey ||
                    (isHubModuleNavKey(selectedKey) &&
                      getHubForModuleNavKey(selectedKey)?.hubNavKey === hub.hubNavKey);
                  return (
                    <div key={section.name} className="main-window__nav-section">
                      <NavItemRow
                        item={hubItem}
                        active={hubActive}
                        onSelect={() => selectNavKey(hub.hubNavKey)}
                      />
                    </div>
                  );
                }

                if (section.name === 'Overview') {
                  const overviewItem = section.items[0];
                  if (!overviewItem) return null;
                  return (
                    <div key={section.name} className="main-window__nav-section">
                      <NavItemRow
                        item={overviewItem}
                        active={selectedKey === overviewItem.key}
                        onSelect={() => selectNavKey(overviewItem.key)}
                      />
                    </div>
                  );
                }

                return (
                <div key={section.name} className="main-window__nav-section">
                  <button
                    type="button"
                    className="main-window__nav-section-header"
                    title="Expand or collapse this section"
                    onClick={() => toggleSection(section.name)}
                  >
                    <span className="icon-text">{expandedSections[section.name] ? '\uE70D' : '\uE76C'}</span>
                    <span>{section.name}</span>
                    <span>{section.items.length}</span>
                  </button>
                  {expandedSections[section.name] &&
                    section.items.map((item) => (
                      <NavItemRow
                        key={item.key}
                        item={item}
                        active={selectedKey === item.key}
                        onSelect={() => selectNavKey(item.key)}
                      />
                    ))}
                </div>
                );
              })}
            </>
          )}

          {isSearchActive && (
            <>
              {searchResults.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--sidebar-text-muted)', margin: '12px 8px' }}>No matching menu items</p>
              )}
              {searchResults.map((item) => (
                <NavItemRow
                  key={item.key}
                  item={item}
                  active={isNavItemActive(selectedKey, hubTabs, item.key)}
                  onSelect={() => {
                    selectNavKey(item.key);
                    setMenuSearch('');
                  }}
                  showSection
                />
              ))}
            </>
          )}
        </div>

        <div className="main-window__sidebar-collapse-wrap">
          <button
            type="button"
            className="main-window__sidebar-collapse"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
          >
            <span className="icon-text main-window__sidebar-collapse-icon" aria-hidden>
              {sidebarCollapsed ? '\uE76C' : '\uE76B'}
            </span>
            <span className="main-window__sidebar-collapse-label">Collapse</span>
          </button>
        </div>
      </aside>

      <div className="main-window__content">
        <header className="main-window__header">
          <div className="main-window__header-breadcrumb">
            <button
              type="button"
              className="main-window__menu-toggle"
              aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={sidebarOpen}
              onClick={handleMobileMenuToggle}
            >
              <span className="icon-text">&#xE700;</span>
            </button>
            <span className="icon-text main-window__header-breadcrumb-icon" style={{ opacity: 0.7 }}>&#xE80F;</span>
            <span className="main-window__header-breadcrumb-desktop" style={{ opacity: 0.7 }}>IMS</span>
            <span className="main-window__header-breadcrumb-sep" style={{ color: 'var(--border)' }}> / </span>
            <span className="main-window__header-title">{headerTitle}</span>
          </div>
          <div className="main-window__header-actions">
            {showDevTools ? <WorkflowQuickNav onSelect={selectNavKey} /> : null}
            <HeaderUserMenu
              authSession={authSession}
              onNavigate={selectNavKey}
              onLogout={handleLogout}
              onOpenProfile={handleOpenProfile}
            />
          </div>
        </header>

        <main className="main-window__content-host">
          <DocumentPrintProvider>
            <SalesCustomerPickerProvider>
            <SalesInvoiceRepositoryProvider>
              <PurchaseInvoiceRepositoryProvider>
                <PurchaseOrderRepositoryProvider>
                  <PurchaseReturnRepositoryProvider>
                  <GrnRepositoryProvider>
                    <DeliveryChallanRepositoryProvider>
                      <SalesOrderRepositoryProvider>
                        <SalesReturnRepositoryProvider>
                          <QuotationRepositoryProvider>
                            <SalesInvoiceNavIntentProvider>
                              <ReceiptVoucherNavIntentProvider>
                              <PaymentVoucherNavIntentProvider>
                              <WorkOrderNavIntentProvider>
                              <ProductMasterNavIntentProvider>
                              <PayrollEmployeeNavIntentProvider>
                              <RoleNavIntentProvider>
                              <AccountMasterNavIntentProvider>
                              <PurchaseInvoiceNavIntentProvider>
                                <PurchaseOrderNavIntentProvider>
                                  <PurchaseReturnNavIntentProvider>
                                  <GrnNavIntentProvider>
                                    <DeliveryChallanNavIntentProvider>
                                      <SalesOrderNavIntentProvider>
                                        <SalesReturnNavIntentProvider>
                                          <QuotationNavIntentProvider>
                                            <MenuPermissionProvider>
                                              <EditDeleteGuardProvider>
                                                <InvoiceCommunicationProvider>
                                                  <AppNavigationProvider navigate={selectNavKey}>
                                                    <HubNavigationProvider hubTabs={hubTabs} setHubTab={setHubTab}>
                                                      <Screen />
                                                    </HubNavigationProvider>
                                                  </AppNavigationProvider>
                                                </InvoiceCommunicationProvider>
                                              </EditDeleteGuardProvider>
                                            </MenuPermissionProvider>
                                          </QuotationNavIntentProvider>
                                        </SalesReturnNavIntentProvider>
                                      </SalesOrderNavIntentProvider>
                                    </DeliveryChallanNavIntentProvider>
                                  </GrnNavIntentProvider>
                                  </PurchaseReturnNavIntentProvider>
                                </PurchaseOrderNavIntentProvider>
                              </PurchaseInvoiceNavIntentProvider>
                              </AccountMasterNavIntentProvider>
                              </RoleNavIntentProvider>
                              </PayrollEmployeeNavIntentProvider>
                              </ProductMasterNavIntentProvider>
                              </WorkOrderNavIntentProvider>
                              </PaymentVoucherNavIntentProvider>
                              </ReceiptVoucherNavIntentProvider>
                            </SalesInvoiceNavIntentProvider>
                          </QuotationRepositoryProvider>
                        </SalesReturnRepositoryProvider>
                      </SalesOrderRepositoryProvider>
                    </DeliveryChallanRepositoryProvider>
                  </GrnRepositoryProvider>
                  </PurchaseReturnRepositoryProvider>
                </PurchaseOrderRepositoryProvider>
              </PurchaseInvoiceRepositoryProvider>
            </SalesInvoiceRepositoryProvider>
            </SalesCustomerPickerProvider>
          </DocumentPrintProvider>
        </main>
      </div>
    </div>
  );
}

function NavItemRow({
  item,
  active,
  onSelect,
  showSection,
  collapsed,
}: {
  item: { key: string; title: string; iconGlyph: string; section: string };
  active: boolean;
  onSelect: () => void;
  showSection?: boolean;
  collapsed?: boolean;
}) {
  return (
    <div className={`main-window__nav-item-row${collapsed ? ' main-window__nav-item-row--collapsed' : ''}`}>
      <button
        type="button"
        className={`main-window__nav-item${active ? ' main-window__nav-item--active' : ''}${collapsed ? ' main-window__nav-item--collapsed' : ''}`}
        onClick={onSelect}
        title={collapsed ? item.title : undefined}
      >
        <span className="icon-text main-window__nav-item-icon" aria-hidden>
          {item.iconGlyph}
        </span>
        {!collapsed && (
          <span>
            <span className="main-window__nav-item-title">{item.title}</span>
            {showSection && <span className="main-window__nav-item-section">{item.section}</span>}
          </span>
        )}
      </button>
      {!collapsed && (
        <button type="button" className="main-window__nav-pin" title="Pin to favorites" onClick={() => placeholders.noop()}>
          <span className="icon-text">{'\uE734'}</span>
        </button>
      )}
    </div>
  );
}

export function MainWindow(props: MainWindowProps) {
  return (
    <WorkspaceDocumentHeaderProvider>
      <UserNavIntentProvider>
        <MainWindowShell {...props} />
      </UserNavIntentProvider>
    </WorkspaceDocumentHeaderProvider>
  );
}

export default MainWindow;
