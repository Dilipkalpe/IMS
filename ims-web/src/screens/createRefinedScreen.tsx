import type { ComponentType } from 'react';
import { RefinedScreenShell } from './RefinedScreenShell';

export interface RefinedViewProps {
  className?: string;
}

/** Wraps a generated WPF→React view in the transaction-page shell */
export function createRefinedScreen(
  View: ComponentType<RefinedViewProps>,
  shellClassName?: string,
): ComponentType<RefinedViewProps> {
  function RefinedScreen(props: RefinedViewProps) {
    return (
      <RefinedScreenShell className={shellClassName}>
        <View {...props} />
      </RefinedScreenShell>
    );
  }
  RefinedScreen.displayName = `Refined(${View.displayName ?? View.name ?? 'View'})`;
  return RefinedScreen;
}
