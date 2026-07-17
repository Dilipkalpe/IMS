import { ALL_THEMES, DEFAULT_THEME_ID, getThemeById } from './themeDefinitions';
import type { AppThemeId, ThemeDefinition, ThemeTokens } from './types';

const STORAGE_KEY = 'ims.themeId';

type ThemeListener = (theme: ThemeDefinition) => void;

let currentTheme: ThemeDefinition = getThemeById(DEFAULT_THEME_ID);
const listeners = new Set<ThemeListener>();

function parseStoredThemeId(raw: string | null): AppThemeId {
  if (!raw) return DEFAULT_THEME_ID;
  const match = ALL_THEMES.find((t) => t.id.toLowerCase() === raw.toLowerCase());
  return match?.id ?? DEFAULT_THEME_ID;
}

function applyTokensToRoot(tokens: ThemeTokens): void {
  const root = document.documentElement;
  root.style.setProperty('--sidebar', tokens.sidebar);
  root.style.setProperty('--sidebar-mid', tokens.sidebarMid);
  root.style.setProperty('--sidebar-active', tokens.sidebarActive);
  root.style.setProperty('--sidebar-selected', tokens.accent);
  root.style.setProperty('--sidebar-border', tokens.sidebarMid);
  root.style.setProperty('--sidebar-text', tokens.textOnDark);
  root.style.setProperty('--sidebar-text-muted', tokens.textOnDarkMuted);
  root.style.setProperty('--content-background', tokens.contentBackground);
  root.style.setProperty('--card', tokens.card);
  root.style.setProperty('--border', tokens.border);
  root.style.setProperty('--text-primary', tokens.textPrimary);
  root.style.setProperty('--text-secondary', tokens.textSecondary);
  root.style.setProperty('--text-on-light', tokens.textOnLight);
  root.style.setProperty('--accent', tokens.accent);
  root.style.setProperty('--accent-hover', tokens.accentHover);
  root.style.setProperty('--accent-light', tokens.accentLight);
  root.style.setProperty('--panel-muted', tokens.panelMuted);
  root.style.setProperty('--teal', tokens.teal);
  root.style.setProperty('--success', tokens.success);
  root.style.setProperty('--warning', tokens.warning);
  root.style.setProperty('--danger', tokens.danger);
  root.style.setProperty('--danger-light', tokens.dangerLight);
  root.style.setProperty('--danger-border', tokens.dangerBorder);
  root.style.setProperty('--gold', tokens.gold);
  root.style.setProperty('--theme-shadow', tokens.shadow);
  root.style.setProperty('--header-bar', tokens.headerBar);
  root.style.setProperty('--transaction-page-background', '#e6ebf1');
}

export function getCurrentTheme(): ThemeDefinition {
  return currentTheme;
}

export function applyTheme(themeId: AppThemeId, persist = true): ThemeDefinition {
  const definition = getThemeById(themeId);
  if (definition.id === currentTheme.id && document.documentElement.dataset.imsTheme === definition.id) {
    return currentTheme;
  }

  currentTheme = definition;
  document.documentElement.dataset.imsTheme = definition.id;
  applyTokensToRoot(definition.tokens);

  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, definition.id);
    } catch {
      // Ignore quota / private mode errors.
    }
  }

  listeners.forEach((listener) => listener(definition));
  return definition;
}

export function initializeTheme(): ThemeDefinition {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    stored = null;
  }
  return applyTheme(parseStoredThemeId(stored), false);
}

export function subscribeTheme(listener: ThemeListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
