/** Mirrors IMS.Models.AppThemeId */
export type AppThemeId =
  | 'Corporate'
  | 'MidnightIndigo'
  | 'EmeraldForest'
  | 'BlueWhiteBlack';

export interface ThemePalette {
  primary: string;
  secondary: string;
  teal: string;
  slate: string;
  success: string;
  warning: string;
  danger: string;
  purple: string;
  gold: string;
}

export interface ThemeTokens {
  sidebar: string;
  sidebarMid: string;
  sidebarActive: string;
  accent: string;
  accentHover: string;
  teal: string;
  contentBackground: string;
  card: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textOnDark: string;
  textOnDarkMuted: string;
  accentLight: string;
  panelMuted: string;
  success: string;
  warning: string;
  danger: string;
  dangerLight: string;
  dangerBorder: string;
  gold: string;
  shadow: string;
  textOnLight: string;
  headerBar: string;
}

export interface ThemeDefinition {
  id: AppThemeId;
  displayName: string;
  badgeText: string;
  description: string;
  palette: ThemePalette;
  tokens: ThemeTokens;
}
