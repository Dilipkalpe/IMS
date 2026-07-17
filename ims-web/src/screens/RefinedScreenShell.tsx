import type { ReactNode } from 'react';
import './RefinedScreenShell.scss';

/** Transaction-page wrapper used by high-traffic refined screens */
export function RefinedScreenShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={['refined-screen-shell', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}
