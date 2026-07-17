/**
 * UI conversion of IMS/MainWindow.xaml — shell with navigation + content host.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppNavigationProvider } from '../context/AppNavigationContext';
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
import { ProductMasterNavIntentProvider } from '../masters/context/ProductMasterNavIntent';
import { PayrollEmployeeNavIntentProvider } from '../payroll/context/PayrollEmployeeNavIntent';
import { RoleNavIntentProvider } from '../security/context/RoleNavIntent';
import { UserNavIntentProvider } from '../security/context/UserNavIntent';
import { AccountMasterNavIntentProvider } from '../masters/context/AccountMasterNavIntent';
import { SalesInvoiceRepositoryProvider } from '../sales-invoice/repository/SalesInvoiceRepositoryContext';
import { SalesCustomerPickerProvider } from '../components/transaction/SalesCustomerPickerContext';
import { WorkflowQuickNav } from '../components/WorkflowQuickNav';
import { buildNavigationSections, navigationCatalog } from '../navigation/navigationCatalog';
import { NavKeys } from '../navigation/navKeys';
import { resolveScreenComponent } from '../navigation/resolveScreen';
import { placeholders } from '../placeholders';
import { getAuthSession, logout } from '../api/auth';
import { useTheme } from '../theme/ThemeProvider';
import { useCompanyBranding } from '../hooks/useCompanyBranding';
import './MainWindow.scss';

export interface MainWindowProps {
  initialNavKey?: string;
  onLogout?: () => void;
}

const MOBILE_NAV_QUERY = '(max-width: 1023px)';

export function MainWindow({ initialNavKey = NavKeys.Dashboard, onLogout }: MainWindowProps) {
  const authSession = useMemo(() => getAuthSession(), []);
  const { theme } = useTheme();
  const { branding } = useCompanyBranding({ authenticated: true });
  const sections = useMemo(() => buildNavigationSections(), []);
  const [selectedKey, setSelectedKey] = useState(initialNavKey);
  const [menuSearch, setMenuSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sections.map((s) => [s.name, s.isExpanded])),
  );

  const isMobileNav = useCallback(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_NAV_QUERY).matches,
    [],
  );

  const selectNavKey = useCallback(
    (key: string) => {
      setSelectedKey(key);
      if (isMobileNav()) {
        setSidebarOpen(false);
      }
    },
    [isMobileNav],
  );

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

  const catalogItem = navigationCatalog.find((i) => i.key === selectedKey);
  const headerTitle = catalogItem?.title ?? 'Dashboard';
  const Screen = useMemo(() => resolveScreenComponent(selectedKey), [selectedKey]);
  const showDevTools = import.meta.env.DEV;

  const searchTerm = menuSearch.trim().toLowerCase();
  const isSearchActive = searchTerm.length > 0;
  const searchResults = isSearchActive
    ? navigationCatalog.filter(
        (i) =>
          i.title.toLowerCase().includes(searchTerm) ||
          i.section.toLowerCase().includes(searchTerm) ||
          i.key.toLowerCase().includes(searchTerm),
      )
    : [];

  const toggleSection = (name: string) => {
    setExpandedSections((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleLogout = useCallback(async () => {
    if (!window.confirm('Sign out and return to login?')) return;
    await logout();
    onLogout?.();
  }, [onLogout]);

  return (
    <div
      className={`main-window${sidebarOpen ? ' main-window--sidebar-open' : ''}`}
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
                <span className="icon-text" style={{ fontSize: 20 }}>&#xE7B8;</span>
              )}
            </div>
            <div className="main-window__sidebar-title">
              <h1>{branding.businessName}</h1>
              <p>{branding.logoText}</p>
            </div>
          </div>
          <p className="main-window__sidebar-desc">Inventory Management with Production (BOM)</p>
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
          {!isSearchActive && (
            <>
              <div className="main-window__nav-tools">
                <button
                  type="button"
                  className="main-window__nav-tool-btn"
                  title="Expand all menu sections"
                  onClick={() => setExpandedSections(Object.fromEntries(sections.map((s) => [s.name, true])))}
                >
                  <span className="icon-text" style={{ marginRight: 6, fontSize: 11 }}>&#xE70D;</span>
                  Expand all
                </button>
                <button
                  type="button"
                  className="main-window__nav-tool-btn"
                  title="Collapse all menu sections"
                  onClick={() => setExpandedSections(Object.fromEntries(sections.map((s) => [s.name, false])))}
                >
                  <span className="icon-text" style={{ marginRight: 6, fontSize: 11 }}>&#xE76C;</span>
                  Collapse all
                </button>
              </div>

              {sections.map((section) => (
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
              ))}
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
                  active={selectedKey === item.key}
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

        <footer className="main-window__sidebar-user">
          <div className="main-window__sidebar-user-avatar">
            <span className="icon-text" style={{ fontSize: 16 }}>&#xE77B;</span>
          </div>
          <div className="main-window__sidebar-user-meta">
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--sidebar-text)' }}>
              {authSession?.user.fullName ?? 'User'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--sidebar-text-muted)' }}>
              {authSession?.user.role ?? 'Administrator'}
              {authSession?.financialYear?.financialYearName
                ? ` · ${authSession.financialYear.financialYearName}`
                : ''}
            </div>
          </div>
          <button
            type="button"
            className="main-window__logout-btn"
            title="Sign out"
            onClick={handleLogout}
          >
            <span className="icon-text" style={{ fontSize: 14 }}>&#xE7E8;</span>
            <span className="main-window__logout-label">Sign out</span>
          </button>
        </footer>
      </aside>

      <div className="main-window__content">
        <header className="main-window__header">
          <div className="main-window__header-breadcrumb">
            <button
              type="button"
              className="main-window__menu-toggle"
              aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen((open) => !open)}
            >
              <span className="icon-text">&#xE700;</span>
            </button>
            <span className="icon-text main-window__header-breadcrumb-icon" style={{ opacity: 0.7 }}>&#xE80F;</span>
            <span className="main-window__header-breadcrumb-desktop" style={{ opacity: 0.7 }}>IMS</span>
            <span className="main-window__header-breadcrumb-sep" style={{ color: 'var(--border)' }}> / </span>
            <span className="main-window__header-title">{headerTitle}</span>
          </div>
          <div className="main-window__header-actions">
            <span className="wpf-toolbar-badge main-window__theme-badge">
              <span style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 700 }}>{theme.badgeText}</span>
            </span>
            {showDevTools ? <WorkflowQuickNav onSelect={selectNavKey} /> : null}
            <button
              type="button"
              className="main-window__header-logout"
              title="Sign out"
              onClick={handleLogout}
            >
              <span className="icon-text">&#xE7E8;</span>
            </button>
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
                              <ProductMasterNavIntentProvider>
                              <PayrollEmployeeNavIntentProvider>
                              <UserNavIntentProvider>
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
                                                    <Screen />
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
                              </UserNavIntentProvider>
                              </PayrollEmployeeNavIntentProvider>
                              </ProductMasterNavIntentProvider>
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
}: {
  item: { key: string; title: string; iconGlyph: string; section: string };
  active: boolean;
  onSelect: () => void;
  showSection?: boolean;
}) {
  return (
    <div className="main-window__nav-item-row">
      <button
        type="button"
        className={`main-window__nav-item${active ? ' main-window__nav-item--active' : ''}`}
        onClick={onSelect}
      >
        <span className="icon-text" style={{ fontSize: 16, color: 'var(--sidebar-text-muted)' }}>
          {item.iconGlyph}
        </span>
        <span>
          <span className="main-window__nav-item-title">{item.title}</span>
          {showSection && <span className="main-window__nav-item-section">{item.section}</span>}
        </span>
      </button>
      <button type="button" className="main-window__nav-pin" title="Pin to favorites" onClick={() => placeholders.noop()}>
        <span className="icon-text">{'\uE734'}</span>
      </button>
    </div>
  );
}

export default MainWindow;
