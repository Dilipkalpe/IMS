import { lazy, Suspense, type ComponentType } from 'react';

import { NavKeys } from '../navigation/navKeys';

import { useProcurementHubTab } from './ProcurementHubContext';

import { PROCUREMENT_HUB_TABS } from './procurementHubTabs';

import './procurement-hub.scss';



const LazyPurchaseOrderList = lazy(() =>

  import('../purchase-order/PurchaseOrderListScreen').then((m) => ({

    default: m.PurchaseOrderListScreen,

  })),

);

const LazyGrnList = lazy(() =>

  import('../grn/GrnListScreen').then((m) => ({ default: m.GrnListScreen })),

);

const LazyPurchaseInvoiceList = lazy(() =>

  import('../purchase-invoice/PurchaseInvoiceListScreen').then((m) => ({

    default: m.PurchaseInvoiceListScreen,

  })),

);

const LazyPurchaseReturnList = lazy(() =>

  import('../purchase-return/PurchaseReturnListScreen').then((m) => ({

    default: m.PurchaseReturnListScreen,

  })),

);



const TAB_SCREENS: Record<string, ComponentType> = {

  [NavKeys.PurchaseOrders]: LazyPurchaseOrderList,

  [NavKeys.Grn]: LazyGrnList,

  [NavKeys.PurchaseInvoice]: LazyPurchaseInvoiceList,

  [NavKeys.PurchaseReturn]: LazyPurchaseReturnList,

};



function ProcurementHubTabPanel({ tabKey }: { tabKey: string }) {

  const Screen = TAB_SCREENS[tabKey];

  if (!Screen) return null;

  return (

    <Suspense fallback={<div className="procurement-hub__loading">Loading…</div>}>

      <Screen />

    </Suspense>

  );

}



export function ProcurementHubScreen() {

  const { activeTab, setActiveTab } = useProcurementHubTab();



  return (

    <div className="procurement-hub" data-wpf-source="Views/ProcurementHubView.xaml">

      <div className="procurement-hub__tabbar" role="tablist" aria-label="Procurement modules">

        <div className="procurement-hub__tabs">

          {PROCUREMENT_HUB_TABS.map((tab) => {

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

                <span className="icon-text procurement-hub__tab-icon" aria-hidden>

                  {tab.iconGlyph}

                </span>

                {tab.title}

              </button>

            );

          })}

        </div>

      </div>

      <div className="procurement-hub__content">

        {PROCUREMENT_HUB_TABS.map((tab) => (

          <div

            key={tab.key}

            role="tabpanel"

            className="procurement-hub__panel"

            hidden={activeTab !== tab.key}

            aria-hidden={activeTab !== tab.key}

          >

            <ProcurementHubTabPanel tabKey={tab.key} />

          </div>

        ))}

      </div>

    </div>

  );

}


