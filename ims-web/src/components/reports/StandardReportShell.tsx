import type { ReactNode } from 'react';
import { ListGridArea } from '../loading';
import { TransactionEntryShell } from '../transaction/TransactionEntryShell';
import { RefinedScreenShell } from '../../screens/RefinedScreenShell';
import '../../sales-invoice/sales-invoice.scss';
import './StandardReportShell.scss';

export interface StandardReportShellProps {
  title: string;
  summary?: string;
  busy?: boolean;
  error?: string | null;
  statusMessage?: string;
  filters: ReactNode;
  grid: ReactNode;
  footer?: ReactNode;
}

export function StandardReportShell({
  title,
  summary,
  busy,
  error,
  statusMessage,
  filters,
  grid,
  footer,
}: StandardReportShellProps) {
  const statusLine = statusMessage ?? (error ?? '');

  return (
    <RefinedScreenShell className="sales-invoice-list-screen">
      <TransactionEntryShell title={title} titleRight={summary ? <span role="status">{summary}</span> : null}>
        <div className="si-list-layout standard-report">
          <div className="si-list-toolbar standard-report__toolbar">
            <div className="standard-report__filters">{filters}</div>
            {statusLine ? (
              <p className="si-list-toolbar__status" role={error ? 'alert' : 'status'}>
                {statusLine}
              </p>
            ) : null}
          </div>
          <ListGridArea
            loading={busy}
            title="Loading report…"
            subtitle="Please wait while data is retrieved"
            className="standard-report__wrap"
          >
            <div className="standard-report__grid">{grid}</div>
          </ListGridArea>
          {footer ? <div className="standard-report__footer">{footer}</div> : null}
        </div>
      </TransactionEntryShell>
    </RefinedScreenShell>
  );
}
