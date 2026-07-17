import type { ReactNode } from 'react';
import './TransactionEntryShell.scss';

export interface TransactionEntryShellProps {
  title: string;
  titleRight?: ReactNode;
  children: ReactNode;
  contentMargin?: string;
}

/** WPF TransactionEntryShell (Themes/Generic.xaml) */
export function TransactionEntryShell({
  title,
  titleRight,
  children,
  contentMargin = '4px',
}: TransactionEntryShellProps) {
  return (
    <div className="transaction-entry-shell">
      <div className="transaction-entry-shell__frame">
        <header className="transaction-entry-shell__titlebar">
          <span className="transaction-entry-shell__title">{title}</span>
          {titleRight && <div className="transaction-entry-shell__title-right">{titleRight}</div>}
        </header>
        <div className="transaction-entry-shell__content" style={{ margin: contentMargin }}>
          {children}
        </div>
      </div>
    </div>
  );
}
