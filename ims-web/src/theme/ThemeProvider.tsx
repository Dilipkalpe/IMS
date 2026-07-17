import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ALL_THEMES } from './themeDefinitions';
import { applyTheme, getCurrentTheme, initializeTheme, subscribeTheme } from './themeService';
import type { AppThemeId, ThemeDefinition } from './types';

interface ThemeContextValue {
  theme: ThemeDefinition;
  themes: ThemeDefinition[];
  setThemeId: (id: AppThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeDefinition>(() => getCurrentTheme());

  useEffect(() => {
    initializeTheme();
    setTheme(getCurrentTheme());
    return subscribeTheme(setTheme);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      themes: ALL_THEMES,
      setThemeId: (id) => {
        applyTheme(id);
      },
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
