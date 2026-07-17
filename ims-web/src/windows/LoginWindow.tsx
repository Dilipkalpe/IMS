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
      <div className="login-window__glow" aria-hidden />

      <section className="login-window__hero" aria-label="Brand hero">
        <div>
          <div className="login-window__hero-logo">
            {branding.hasLogo ? (
              <img src={branding.logoImage} alt="" className="login-window__hero-logo-img" />
            ) : (
              branding.businessName.slice(0, 3).toUpperCase()
            )}
          </div>
          <span className="login-eyebrow">{branding.businessName.toUpperCase()}</span>
          <div className="login-hero-title">Run your entire</div>
          <div className="login-hero-accent">operations from one place</div>
          <p className="login-window__hero-tagline">Inventory, billing, production &amp; finance in one workspace.</p>
        </div>

        <div className="login-window__hero-center">
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            <div className="login-module-pill"><span className="login-module-pill-text">◈  Inventory</span></div>
            <div className="login-module-pill"><span className="login-module-pill-text">◎  Billing</span></div>
            <div className="login-module-pill"><span className="login-module-pill-text">⬡  Production</span></div>
            <div className="login-module-pill"><span className="login-module-pill-text">◇  Finance</span></div>
          </div>
          <div className="login-window__hero-stats">
            <div>
              <div className="login-window__hero-stat-value">24/7</div>
              <div className="login-window__hero-stat-label">LIVE STOCK SYNC</div>
            </div>
            <div>
              <div className="login-window__hero-stat-value">GST</div>
              <div className="login-window__hero-stat-label">READY INVOICING</div>
            </div>
            <div>
              <div className="login-window__hero-stat-value">Multi</div>
              <div className="login-window__hero-stat-label">WAREHOUSE</div>
            </div>
          </div>
        </div>

        <footer className="login-window__hero-footer">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', marginRight: 8 }} />
            <span style={{ fontSize: 12, color: '#818cf8' }}>Enterprise-grade · Secure sign-in</span>
          </div>
          <div className="login-window__meta-grid">
            <span className="login-window__meta-label">API Link</span>
            <span className="login-window__meta-value" title={apiLinkDisplay}>{apiLinkDisplay}</span>
            <span className="login-window__meta-label">Db Name</span>
            <span className="login-window__meta-value" title={dbNameDisplay}>{dbNameDisplay}</span>
          </div>
        </footer>
      </section>

      <section className="login-window__panel" onKeyDown={handleKeyDown}>
        <div className="login-window__panel-toolbar">
          <button type="button" className="login-ghost-button" title="Refresh API status" onClick={() => void loadBootstrap()}>
            <span className="icon-text" style={{ marginRight: 6 }}>&#xE72C;</span>
            Refresh
          </button>
          <button type="button" className="login-icon-button login-close-button" title="Close application" onClick={onClose}>
            <span className="icon-text" style={{ fontSize: 12 }}>&#xE8BB;</span>
          </button>
        </div>

        <div className="login-window__panel-body">
          <div className="login-glass-card">
            <h1 className="login-window__signin-title">Sign in</h1>
            <p className="login-window__signin-subtitle">Access your company workspace</p>

            <div className="login-window__api-status">
              <span className={`login-window__api-dot${apiConnected ? ' login-window__api-dot--connected' : ''}`} />
              {apiConnected ? 'API connected' : 'API offline'}
            </div>

            {licenseNotice && (
              <div
                className={`login-license-banner${licenseExpired ? ' login-license-banner--expired' : ''}`}
                role="status"
              >
                <span className="icon-text" style={{ marginRight: 8 }}>&#xE7BA;</span>
                {licenseNotice}
              </div>
            )}

            {errorMessage && (
              <div className="login-error-banner">
                <span className="icon-text" style={{ marginRight: 8 }}>&#xE783;</span>
                {errorMessage}
              </div>
            )}

            <label className="login-field-label">Financial year</label>
            <div className="login-field-shell" style={{ marginBottom: 16 }}>
              <select
                className="login-field-input"
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

            <label className="login-field-label">Employee ID or email</label>
            <div className="login-field-shell" style={{ marginBottom: 16 }}>
              <input
                className="login-field-input"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                disabled={!inputsEnabled}
                autoComplete="username"
              />
            </div>

            <label className="login-field-label">Password</label>
            <div className="login-window__password-row">
              <div className="login-field-shell">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="login-field-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!inputsEnabled}
                  autoComplete="current-password"
                />
              </div>
              <button
                type="button"
                className="login-icon-button"
                title="Show or hide password"
                onClick={() => setShowPassword((v) => !v)}
              >
                <span className="icon-text" style={{ fontSize: 18 }}>{showPassword ? '\uED1A' : '\uED1B'}</span>
              </button>
            </div>

            <label className="login-window__remember">
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
              Remember me
            </label>

            <button
              type="button"
              className="login-primary-button"
              disabled={!inputsEnabled}
              onClick={() => void handleSignIn()}
            >
              {isLoggingIn ? (
                <span><span className="icon-text" style={{ marginRight: 8 }}>&#xE1CD;</span>Signing in…</span>
              ) : (
                'Sign in to ERP'
              )}
            </button>

            <p className="login-window__footer-note">
              Default: admin / admin (after seed). Contact your administrator for access.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LoginWindow;
