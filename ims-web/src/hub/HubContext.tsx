import { createContext, useContext, type ReactNode } from 'react';

import { getHubDefinition } from './hubRegistry';

interface HubNavigationContextValue {
  hubTabs: Record<string, string>;
  setHubTab: (hubNavKey: string, tabNavKey: string) => void;
}

const HubNavigationContext = createContext<HubNavigationContextValue | null>(null);

export function HubNavigationProvider({
  hubTabs,
  setHubTab,
  children,
}: HubNavigationContextValue & { children: ReactNode }) {
  return (
    <HubNavigationContext.Provider value={{ hubTabs, setHubTab }}>
      {children}
    </HubNavigationContext.Provider>
  );
}

export function useHubNavigation(): HubNavigationContextValue {
  const ctx = useContext(HubNavigationContext);
  if (!ctx) throw new Error('HubNavigationProvider is required.');
  return ctx;
}

export function useHubTab(hubNavKey: string): {
  activeTab: string;
  setActiveTab: (tabNavKey: string) => void;
} {
  const { hubTabs, setHubTab } = useHubNavigation();
  const hub = getHubDefinition(hubNavKey);
  return {
    activeTab: hubTabs[hubNavKey] ?? hub?.defaultTabKey ?? hubNavKey,
    setActiveTab: (tabNavKey: string) => setHubTab(hubNavKey, tabNavKey),
  };
}
