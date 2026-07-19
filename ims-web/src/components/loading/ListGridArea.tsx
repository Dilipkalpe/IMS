import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { TransactionListPagination } from '../transaction/TransactionListPagination';
import { LoadingHost } from './LoadingHost';

export interface ListGridAreaProps {
  loading?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
  children: ReactNode;
}

function isListPaginationNode(child: ReactNode): child is ReactElement {
  return isValidElement(child) && child.type === TransactionListPagination;
}

/** List/report grid region with the standard loading overlay. */
export function ListGridArea({
  loading = false,
  title = 'Loading…',
  subtitle = 'Please wait while data is retrieved',
  className,
  children,
}: ListGridAreaProps) {
  const items = Children.toArray(children);
  const footer = items.filter(isListPaginationNode);
  const tableContent = items.filter((child) => !isListPaginationNode(child));

  return (
    <LoadingHost
      loading={loading}
      title={title}
      subtitle={subtitle}
      className={['si-list-grid-wrap', className].filter(Boolean).join(' ')}
    >
      <div className="si-list-table-scroll">{tableContent}</div>
      {footer}
    </LoadingHost>
  );
}
