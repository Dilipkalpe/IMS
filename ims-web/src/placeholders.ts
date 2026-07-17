/** Placeholder bindings/commands/events — UI-only migration (no backend). */
// Auto-generated WPF screens reference arbitrary PascalCase binding names.
export const placeholders: Record<string, any> & { noop: () => undefined } = {
  noop: () => undefined,
  loginId: '',
  password: '',
  rememberMe: false,
  showPassword: false,
  isLoggingIn: false,
  hasError: false,
  errorMessage: '',
  isInputEnabled: true,
  isApiConnected: false,
  apiStatusText: 'Checking API…',
  companyName: 'IMS',
  companyTagline: 'Stock, billing, production, and finance in one workspace.',
  apiLinkDisplay: 'http://localhost:3000',
  dbNameDisplay: 'ims',
  darkModeToggleLabel: 'Light mode',
  passwordRevealGlyph: '\uE7B3',
  financialYears: [] as { financialYearName: string }[],
  selectedFinancialYear: null as { financialYearName: string } | null,
  menuSearchText: '',
  showNavigationMenu: true,
  isMenuSearchActive: false,
  showMenuSearchEmpty: false,
  headerTitle: 'Dashboard',
  isSubPage: false,
  subPageTitle: '',
  usesFullPageLayout: false,
  themeBadgeText: 'Corporate',
  displayName: 'User',
  roleLabel: 'Administrator',
  navigationSections: [] as Array<{
    name: string;
    isExpanded: boolean;
    items: Array<{ key: string; title: string; iconGlyph: string; section: string; isPinned: boolean }>;
  }>,
  menuSearchResults: [] as Array<{ key: string; title: string; iconGlyph: string; section: string }>,
  selectedNavigationKey: 'dashboard',
  currentViewKey: 'dashboard',
  PageDescription: '',
  Title: '',
};

export type Placeholders = Record<string, any>;
