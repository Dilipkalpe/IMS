import { useTheme } from '../theme/ThemeProvider';
import { SettingsPanel } from './SettingsPanel';

/** Read-only theme preview cards — mirrors WPF "Theme previews" section. */
export function ThemePreviewsPanel() {
  const { theme, themes } = useTheme();

  return (
    <SettingsPanel
      title="Theme previews"
      description="Visual reference for all available color themes. Select a theme in Appearance above to apply it."
    >
      <div className="settings-theme-grid settings-theme-grid--readonly">
        {themes.map((option) => (
          <div
            key={option.id}
            className={`settings-theme-card settings-theme-card--readonly${option.id === theme.id ? ' settings-theme-card--active' : ''}`}
          >
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
          </div>
        ))}
      </div>
    </SettingsPanel>
  );
}
