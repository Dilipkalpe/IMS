/**
 * Sign-in screen — wired to /api/auth/login and financial year list.
 */
import { useCallback, useEffect, useState } from 'react';
import { ApiError, probeApiHealth } from '../api/client';
import { fetchFinancialYears, login, type FinancialYearOption } from '../api/auth';
import { buildLoginLicenseNotice, fetchLicenseStatus } from '../api/license';
import { getApiBaseUrl } from '../api/config';
import { useCompanyBranding } from '../hooks/useCompanyBranding';
import './LoginWindow.scss';

const REMEMBER_LOGIN_KEY = 'ims.rememberLoginId';

const ERP_FEATURES = [
  { icon: '◈', label: 'Inventory & stock control' },
  { icon: '◎', label: 'GST billing & invoicing' },
  { icon: '⬡', label: 'Production & BOM' },
  { icon: '◇', label: 'Financial reporting' },
] as const;

export interface LoginWindowProps {
  onClose?: () => void;
  onSignedIn?: () => void;
}

export function LoginWindow({ onClose, onSignedIn }: LoginWindowProps) {
  const [loginId, setLoginId] = useState(() => localStorage.getItem(REMEMBER_LOGIN_KEY) ?? 'admin');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => Boolean(localStorage.getItem(REMEMBER_LOGIN_KEY)));
  const [showPassword, setShowPassword] = useState(false);
  const [financialYears, setFinancialYears] = useState<FinancialYearOption[]>([]);
  const [financialYearId, setFinancialYearId] = useState('');
  const [apiConnected, setApiConnected] = useState(false);
  const [loadingYears, setLoadingYears] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [licenseNotice, setLicenseNotice] = useState<string | null>(null);
  const [licenseExpired, setLicenseExpired] = useState(false);
  const selectedYear = financialYears.find((y) => y.id === financialYearId);
  const dbNameDisplay = selectedYear?.databaseName ?? '—';
  const { branding } = useCompanyBranding({
    yearDb: selectedYear?.databaseName,
    authenticated: false,
  });
  const inputsEnabled = !loadingYears && apiConnected && !isLoggingIn && financialYears.length > 0;

  const apiLinkDisplay = (() => {
    const base = getApiBaseUrl();
    if (base) return base;
    if (typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}/IMSWebAPI`;
    }
    return 'http://localhost/IMSWebAPI';
  })();

  const loadBootstrap = useCallback(async () => {
    setLoadingYears(true);
    setErrorMessage(null);
    setLicenseNotice(null);
    setLicenseExpired(false);
    try {
      const healthy = await probeApiHealth();
      setApiConnected(healthy);
      if (!healthy) {
        setFinancialYears([]);
        setFinancialYearId('');
        setErrorMessage('API is offline. Start the API (port 3000) or check IIS site IMSWebAPI.');
        return;
      }

      const [license, years] = await Promise.all([fetchLicenseStatus(), fetchFinancialYears()]);
      const notice = buildLoginLicenseNotice(license);
      setLicenseNotice(notice);
      setLicenseExpired(Boolean(license?.isExpired));
      // Match WPF LoginViewModel: only IsActive matters for the login dropdown.
      const loginYears = years.filter((y) => y.isActive !== false);
      setFinancialYears(loginYears);
      setFinancialYearId((current) => {
        if (current && loginYears.some((y) => y.id === current)) return current;
        const preferred = loginYears.find((y) => !y.closed) ?? loginYears[loginYears.length - 1];
        return preferred?.id ?? '';
      });
      if (loginYears.length === 0) {
        setErrorMessage(
          'No active financial year is configured. Ask an administrator to create one under System Setup → Financial Years.',
        );
      }
    } catch (err) {
      setApiConnected(false);
      setFinancialYears([]);
      setFinancialYearId('');
      setErrorMessage(err instanceof Error ? err.message : 'Could not load financial years.');
    } finally {
      setLoadingYears(false);
    }
  }, []);

  useEffect(() => {
    void loadBootstrap();
  }, [loadBootstrap]);

  const handleSignIn = async () => {
    if (!financialYearId) {
      setErrorMessage('Select a financial year.');
      return;
    }
    if (!loginId.trim() || !password) {
      setErrorMessage('Enter employee ID / email and password.');
      return;
    }

    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      await login({
        loginId: loginId.trim(),
        password,
        financialYearId,
      });
      if (rememberMe) {
        localStorage.setItem(REMEMBER_LOGIN_KEY, loginId.trim());
      } else {
        localStorage.removeItem(REMEMBER_LOGIN_KEY);
      }
      onSignedIn?.();
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        const body = err.body as { code?: string; error?: string; license?: { message?: string } } | undefined;
        if (body?.code === 'LICENSE_EXPIRED' || /license.*expir/i.test(err.message)) {
          const licenseMessage =
            body?.error ??
            body?.license?.message ??
            'Software license has expired. Contact your administrator to extend the license.';
          setLicenseExpired(true);
          setLicenseNotice(
            `${licenseMessage} Only an administrator can sign in to renew or extend the license.`,
          );
          setErrorMessage('Sign in blocked — software license has expired.');
          return;
        }
      }
      setErrorMessage(err instanceof Error ? err.message : 'Sign in failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose?.();
    if (e.key === 'Enter' && inputsEnabled) void handleSignIn();
  };

  return (
    <div
      className="login-window"
      role="dialog"
      aria-label="Sign in — IMS · Inventory &amp; Billing ERP"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="login-window__backdrop" aria-hidden>
        <div className="login-window__glow" />
        <div className="login-window__pattern" />
      </div>

      <section className="login-window__hero" aria-label="Brand hero">
        <header className="login-window__hero-brand">
          <div className="login-window__hero-logo">
            {branding.hasLogo ? (
              <img src={branding.logoImage} alt="" className="login-window__hero-logo-img" />
            ) : (
              branding.businessName.slice(0, 3).toUpperCase()
            )}
          </div>
          <span className="login-window__eyebrow">{branding.businessName.toUpperCase()}</span>
          <h2 className="login-window__hero-title">
            Run your entire
            <span className="login-window__hero-accent"> operations from one place</span>
          </h2>
          <p className="login-window__hero-tagline">
            {branding.logoText || 'Inventory, billing, production & finance in one workspace.'}
          </p>
        </header>

        <div className="login-window__hero-body">
          <ul className="login-window__feature-list">
            {ERP_FEATURES.map((feature) => (
              <li key={feature.label} className="login-window__feature-item">
                <span className="login-window__feature-icon" aria-hidden>
                  {feature.icon}
                </span>
                <span>{feature.label}</span>
              </li>
            ))}
          </ul>

          <div className="login-window__hero-stats">
            <div className="login-window__hero-stat">
              <div className="login-window__hero-stat-value">24/7</div>
              <div className="login-window__hero-stat-label">Live stock sync</div>
            </div>
            <div className="login-window__hero-stat">
              <div className="login-window__hero-stat-value">GST</div>
              <div className="login-window__hero-stat-label">Ready invoicing</div>
            </div>
            <div className="login-window__hero-stat">
              <div className="login-window__hero-stat-value">Multi</div>
              <div className="login-window__hero-stat-label">Warehouse</div>
            </div>
          </div>
        </div>

        <footer className="login-window__hero-footer">
          <div className="login-window__secure-badge">
            <span className="login-window__secure-dot" aria-hidden />
            <span>Enterprise-grade · Secure sign-in</span>
          </div>
          <dl className="login-window__meta-grid">
            <div className="login-window__meta-row">
              <dt>API Link</dt>
              <dd title={apiLinkDisplay}>{apiLinkDisplay}</dd>
            </div>
            <div className="login-window__meta-row">
              <dt>Db Name</dt>
              <dd title={dbNameDisplay}>{dbNameDisplay}</dd>
            </div>
          </dl>
        </footer>
      </section>

      <section className="login-window__panel" onKeyDown={handleKeyDown}>
        <div className="login-window__mobile-brand">
          <div className="login-window__mobile-logo">
            {branding.hasLogo ? (
              <img src={branding.logoImage} alt="" className="login-window__mobile-logo-img" />
            ) : (
              branding.businessName.slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <div className="login-window__mobile-title">{branding.businessName}</div>
            <div className="login-window__mobile-subtitle">Inventory &amp; Billing ERP</div>
          </div>
        </div>

        <div className="login-window__panel-toolbar">
          <button
            type="button"
            className="login-window__ghost-button"
            title="Refresh API status"
            onClick={() => void loadBootstrap()}
          >
            <span className="login-window__icon" aria-hidden>
              &#xE72C;
            </span>
            Refresh
          </button>
          <button
            type="button"
            className="login-window__icon-button login-window__close-button"
            title="Close application"
            onClick={onClose}
          >
            <span className="login-window__icon login-window__icon--sm" aria-hidden>
              &#xE8BB;
            </span>
          </button>
        </div>

        <div className="login-window__panel-body">
          <div className="login-window__card">
            <header className="login-window__card-header">
              <h1 className="login-window__signin-title">Sign in</h1>
              <p className="login-window__signin-subtitle">Access {branding.businessName}</p>
            </header>

            <div className="login-window__api-status">
              <span
                className={`login-window__api-dot${apiConnected ? ' login-window__api-dot--connected' : ''}`}
                aria-hidden
              />
              {apiConnected ? 'API connected' : 'API offline'}
            </div>

            {licenseNotice && (
              <div
                className={`login-window__license-banner${licenseExpired ? ' login-window__license-banner--expired' : ''}`}
                role="status"
              >
                <span className="login-window__icon" aria-hidden>
                  &#xE7BA;
                </span>
                {licenseNotice}
              </div>
            )}

            {errorMessage && (
              <div className="login-window__error-banner" role="alert">
                <span className="login-window__icon" aria-hidden>
                  &#xE783;
                </span>
                {errorMessage}
              </div>
            )}

            <div className="login-window__form">
              <label className="login-window__field-label" htmlFor="login-financial-year">
                Financial year
              </label>
              <div className="login-window__field-shell">
                <select
                  id="login-financial-year"
                  className="login-window__field-input"
                  disabled={!inputsEnabled && !loadingYears}
                  value={financialYearId}
                  onChange={(e) => setFinancialYearId(e.target.value)}
                >
                  {loadingYears && <option value="">Loading…</option>}
                  {!loadingYears && financialYears.length === 0 && (
                    <option value="">No financial years available</option>
                  )}
                  {financialYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.financialYearName}
                      {year.closed ? ' (Closed)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <label className="login-window__field-label" htmlFor="login-id">
                Employee ID or email
              </label>
              <div className="login-window__field-shell">
                <input
                  id="login-id"
                  className="login-window__field-input"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  disabled={!inputsEnabled}
                  autoComplete="username"
                />
              </div>

              <label className="login-window__field-label" htmlFor="login-password">
                Password
              </label>
              <div className="login-window__password-row">
                <div className="login-window__field-shell">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="login-window__field-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={!inputsEnabled}
                    autoComplete="current-password"
                  />
                </div>
                <button
                  type="button"
                  className="login-window__icon-button"
                  title="Show or hide password"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  <span className="login-window__icon login-window__icon--lg" aria-hidden>
                    {showPassword ? '\uED1A' : '\uED1B'}
                  </span>
                </button>
              </div>

              <label className="login-window__remember">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                Remember me
              </label>

              <button
                type="button"
                className="login-window__primary-button"
                disabled={!inputsEnabled}
                onClick={() => void handleSignIn()}
              >
                {isLoggingIn ? (
                  <span className="login-window__button-content">
                    <span className="login-window__icon" aria-hidden>
                      &#xE1CD;
                    </span>
                    Signing in…
                  </span>
                ) : (
                  'Sign in to ERP'
                )}
              </button>

              <p className="login-window__footer-note">
                Default: admin / admin (after seed). Contact your administrator for access.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LoginWindow;
