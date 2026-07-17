import type { ComponentType } from 'react';
import { ContentHost } from '../components/ContentHost';
import { RefinedScreenShell } from '../screens/RefinedScreenShell';
import { refinedByXamlPath } from '../screens/refinedScreens';
import { refinedScreenMap } from './refinedScreenMap';
import { resolveXamlPath } from './navigationRouteMap';

function FallbackContent({ xamlPath }: { xamlPath: string }) {
  return (
    <RefinedScreenShell>
      <ContentHost xamlPath={xamlPath} />
    </RefinedScreenShell>
  );
}

/** Resolves the React screen for a WPF navigation key */
export function resolveScreenComponent(navKey: string): ComponentType {
  const explicit = refinedScreenMap[navKey];
  if (explicit) return explicit;

  const xamlPath = resolveXamlPath(navKey);
  const byXaml = refinedByXamlPath[xamlPath as keyof typeof refinedByXamlPath];
  if (byXaml) return byXaml;

  const Fallback = function ScreenFallback() {
    return <FallbackContent xamlPath={xamlPath} />;
  };
  return Fallback;
}

export function getXamlPathForNavKey(navKey: string): string {
  return resolveXamlPath(navKey);
}
