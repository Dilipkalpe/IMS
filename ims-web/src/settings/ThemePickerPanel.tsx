import { useTheme } from '../theme/ThemeProvider';
import type { AppThemeId } from '../theme/types';

export function ThemePickerPanel() {
  const { theme, themes, setThemeId } = useTheme();

  return (
    <section className="settings-panel settings-panel--theme" aria-labelledby="theme-picker-heading">
      <h2 id="theme-picker-heading" className="settings-panel__title wpf-section-header">
        Appearance
      </h2>
      <p className="settings-panel__desc">
        Choose a color theme for the application shell, pages, and KPI accents — same options as the desktop ERP.
      </p>

      <p className="settings-panel__label">Color theme</p>
      <div className="settings-theme-grid" role="radiogroup" aria-label="Application color theme">
        {themes.map((option) => {
          const active = option.id === theme.id;
          return (
            <label
              key={option.id}
              className={`settings-theme-card${active ? ' settings-theme-card--active' : ''}`}
            >
              <input
                type="radio"
                name="ims-theme"
                value={option.id}
                checked={active}
                onChange={() => setThemeId(option.id as AppThemeId)}
              />
              <span className="settings-theme-card__swatches" aria-hidden>
                <span style={{ background: option.tokens.sidebar }} />
                <span style={{ background: option.tokens.accent }} />
                <span style={{ background: option.tokens.contentBackground, border: '1px solid var(--border)' }} />
              </span>
              <span className="settings-theme-card__body">
                <span className="settings-theme-card__name">{option.displayName}</span>
                <span className="settings-theme-card__badge">{option.badgeText}</span>
                <span className="settings-theme-card__desc">{option.description}</span>
              </span>
            </label>
          );
        })}
      </div>

      <p className="settings-panel__active">
        Active: <strong>{theme.displayName}</strong> — primary accent {theme.palette.primary}
      </p>
    </section>
  );
}
