import { useCallback, useEffect, useMemo, useState } from 'react';
import { probeApiHealth } from '../api/client';
import { getApiBaseUrl } from '../api/config';
import { fetchDashboard } from '../api/dashboard';
import { LoadingHost } from '../components/loading';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import { useAppNavigation } from '../context/AppNavigationContext';
import { NavKeys } from '../navigation/navKeys';
import { RefinedScreenShell } from '../screens/RefinedScreenShell';
import { DashboardBarChart } from './components/DashboardBarChart';
import { DashboardDonutChart } from './components/DashboardDonutChart';
import { DashboardLineChart } from './components/DashboardLineChart';
import { DashboardPanel, DashboardQuickLink } from './components/DashboardQuickLink';
import { StatCounterCard } from './components/StatCounterCard';
import { buildSampleDashboard } from './dashboardSampleData';
import { prepareDashboardView, type DashboardViewState } from './dashboardViewModel';
import './dashboard.scss';

const API_BASE = getApiBaseUrl();

export function DashboardScreen() {
  const navigate = useAppNavigation();
  const [view, setView] = useState<DashboardViewState | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPresentedContent, setHasPresentedContent] = useState(false);
  const [isLiveData, setIsLiveData] = useState(false);
  const [connectivityChecked, setConnectivityChecked] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [apiStatusMessage, setApiStatusMessage] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState('Loading…');

  const applyPayload = useCallback((live: boolean, message: string, refreshed: string) => {
    return (payload: ReturnType<typeof buildSampleDashboard>) => {
      setView(prepareDashboardView(payload));
      setIsLiveData(live);
      setLastRefreshed(refreshed);
      setApiStatusMessage(message);
      setHasPresentedContent(true);
    };
  }, []);

  const reload = useCallback(
    async (force = false) => {
      const firstPaint = !hasPresentedContent;
      if (firstPaint || force) setLoading(true);

      try {
        const apiOnline = await probeApiHealth();
        setConnectivityChecked(true);
        setApiConnected(apiOnline);

        if (!apiOnline) {
          setApiConnected(false);
          applyPayload(
            false,
            `Cannot connect to the API at ${API_BASE}. Start the server in the api folder (npm run dev), then click Refresh. Dashboard KPIs and charts below are sample data only.`,
            'API not connected — sample data',
          )(buildSampleDashboard());
          return;
        }

        const payload = await fetchDashboard();
        if (!payload) {
          setApiConnected(false);
          applyPayload(
            false,
            `API at ${API_BASE} did not return dashboard data.`,
            'No response from API — sample data',
          )(buildSampleDashboard());
          return;
        }

        applyPayload(
          true,
          '',
          `Live data • updated ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
        )(payload);
        setApiConnected(true);
      } catch {
        setConnectivityChecked(true);
        setApiConnected(false);
        applyPayload(
          false,
          `Lost connection to ${API_BASE}. Check that the API is running, then click Refresh.`,
          'Refresh failed — sample data shown',
        )(buildSampleDashboard());
      } finally {
        setLoading(false);
      }
    },
    [applyPayload, hasPresentedContent],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  const showLoadingOverlay = loading && !hasPresentedContent;
  const showOfflineBanner = connectivityChecked && !apiConnected && Boolean(apiStatusMessage);

  const accountingMetrics = useMemo(
    () =>
      (view?.activityRows ?? []).map((row) => ({
        label: row.col1,
        value: row.col2,
      })),
    [view?.activityRows],
  );

  const inventoryMetrics = useMemo(
    () =>
      (view?.summaryLines ?? []).map((line) => ({
        label: line.label,
        value: line.value,
      })),
    [view?.summaryLines],
  );

  const productionMetrics = useMemo(
    () =>
      (view?.alerts ?? []).map((alert) => ({
        label: alert.title,
        value: alert.detail,
      })),
    [view?.alerts],
  );

  return (
    <RefinedScreenShell className="dashboard-screen">
      <TransactionEntryShell
        title="Dashboard"
        contentMargin="0"
        titleRight={
          <div className="dash__title-right">
            <span className="dash__refreshed">{lastRefreshed}</span>
            <button
              type="button"
              className="wpf-secondary-button"
              onClick={() => void reload(true)}
              disabled={loading}
            >
              Refresh
            </button>
          </div>
        }
      >
        <LoadingHost
          loading={showLoadingOverlay}
          title="Loading dashboard…"
          subtitle="Fetching live figures from the API"
          className="dash"
        >
          {showOfflineBanner ? (
            <div className="dash__offline-banner" role="alert">
              {apiStatusMessage}
            </div>
          ) : null}

          {hasPresentedContent && view ? (
            <>
              <div className="dash__stats-row">
                {view.stats.map((stat) => (
                  <StatCounterCard key={stat.label} stat={stat} />
                ))}
              </div>

              <div className="dash__panels-row">
                <DashboardPanel
                  title="Accounting Overview"
                  metrics={accountingMetrics}
                  quickLinks={
                    <>
                      <DashboardQuickLink
                        icon={'\uE8A5'}
                        label="Invoice"
                        onClick={() => navigate(NavKeys.SalesInvoice)}
                      />
                      <DashboardQuickLink
                        icon={'\uE719'}
                        label="Purchase"
                        onClick={() => navigate(NavKeys.PurchaseInvoice)}
                      />
                      <DashboardQuickLink
                        icon={'\uE8C8'}
                        label="Payment"
                        onClick={() => navigate(NavKeys.PaymentVoucher)}
                      />
                    </>
                  }
                  chart={<DashboardBarChart chart={view.salesPurchaseChart} />}
                />

                <DashboardPanel
                  title="Inventory Management"
                  metrics={inventoryMetrics}
                  quickLinks={
                    <>
                      <DashboardQuickLink
                        icon={'\uE74C'}
                        label="Opening Stock"
                        onClick={() => navigate(NavKeys.OpeningStock)}
                      />
                      <DashboardQuickLink
                        icon={'\uE8AB'}
                        label="Stock Transfer"
                        onClick={() => navigate(NavKeys.StockTransfer)}
                      />
                      <DashboardQuickLink
                        icon={'\uE8F2'}
                        label="Closing Stock"
                        onClick={() => navigate(NavKeys.ClosingStock)}
                      />
                    </>
                  }
                  chart={<DashboardLineChart chart={view.inventoryStockChart} />}
                />

                <DashboardPanel
                  title="Production Status"
                  metrics={productionMetrics}
                  quickLinks={
                    <>
                      <DashboardQuickLink
                        icon={'\uE8FD'}
                        label="Job Work"
                        onClick={() => navigate(NavKeys.ProductionOrders)}
                      />
                      <DashboardQuickLink
                        icon={'\uE710'}
                        label="Add Product"
                        onClick={() => navigate(NavKeys.Products)}
                      />
                      <DashboardQuickLink
                        icon={'\uE77B'}
                        label="Add Customer"
                        onClick={() => navigate(NavKeys.AccountLedger)}
                      />
                    </>
                  }
                  chart={<DashboardDonutChart chart={view.stockCategoryChart} />}
                />
              </div>

              {!isLiveData ? (
                <p className="dash__sample-note" role="status">
                  Showing sample dashboard data until the API is available.
                </p>
              ) : null}
            </>
          ) : null}
        </LoadingHost>
      </TransactionEntryShell>
    </RefinedScreenShell>
  );
}
