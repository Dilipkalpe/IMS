import { createContext, useContext, type ReactNode } from 'react';

type NavigateFn = (navKey: string) => void;

const AppNavigationContext = createContext<NavigateFn | null>(null);

export function AppNavigationProvider({
  navigate,
  children,
}: {
  navigate: NavigateFn;
  children: ReactNode;
}) {
  return (
    <AppNavigationContext.Provider value={navigate}>{children}</AppNavigationContext.Provider>
  );
}

export function useAppNavigation(): NavigateFn {
  const nav = useContext(AppNavigationContext);
  if (!nav) return () => undefined;
  return nav;
}
