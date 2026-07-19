import { lazy, Suspense, type ComponentType } from 'react';
import { NavKeys } from '../navigation/navKeys';
import { useSalesHubTab } from './SalesHubContext';
import { SALES_HUB_TABS } from './salesHubTabs';
import './sales-hub.scss';

const LazySalesOrderList = lazy(() =>
  import('../sales-order/SalesOrderListScreen').then((m) => ({ default: m.SalesOrderListScreen })),
);
const LazyQuotationList = lazy(() =>
  import('../quotation/QuotationListScreen').then((m) => ({ default: m.QuotationListScreen })),
);
const LazyDeliveryChallanList = lazy(() =>
  import('../delivery-challan/DeliveryChallanListScreen').then((m) => ({
    default: m.DeliveryChallanListScreen,
  })),
);
const LazySalesInvoiceList = lazy(() =>
  import('../sales-invoice/SalesInvoiceListScreen').then((m) => ({ default: m.SalesInvoiceListScreen })),
);
const LazySalesReturnList = lazy(() =>
  import('../sales-return/SalesReturnListScreen').then((m) => ({ default: m.SalesReturnListScreen })),
);

const TAB_SCREENS: Record<string, ComponentType> = {
  [NavKeys.SalesOrders]: LazySalesOrderList,
  [NavKeys.Quotation]: LazyQuotationList,
  [NavKeys.DeliveryChallan]: LazyDeliveryChallanList,
  [NavKeys.SalesInvoice]: LazySalesInvoiceList,
  [NavKeys.SalesReturn]: LazySalesReturnList,
};

function SalesHubTabPanel({ tabKey }: { tabKey: string }) {
  const Screen = TAB_SCREENS[tabKey];
  if (!Screen) return null;
  return (
    <Suspense fallback={<div className="sales-hub__loading">Loading…</div>}>
      <Screen />
    </Suspense>
  );
}

export function SalesHubScreen() {
  const { activeTab, setActiveTab } = useSalesHubTab();

  return (
    <div className="sales-hub" data-wpf-source="Views/SalesHubView.xaml">
      <div className="sales-hub__tabbar" role="tablist" aria-label="Sales modules">
        <div className="sales-hub__tabs">
          {SALES_HUB_TABS.map((tab) => {
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
                <span className="icon-text sales-hub__tab-icon" aria-hidden>
                  {tab.iconGlyph}
                </span>
                {tab.title}
              </button>
            );
          })}
        </div>
      </div>
      <div className="sales-hub__content">
        {SALES_HUB_TABS.map((tab) => (
          <div
            key={tab.key}
            role="tabpanel"
            className="sales-hub__panel"
            hidden={activeTab !== tab.key}
            aria-hidden={activeTab !== tab.key}
          >
            <SalesHubTabPanel tabKey={tab.key} />
          </div>
        ))}
      </div>
    </div>
  );
}
