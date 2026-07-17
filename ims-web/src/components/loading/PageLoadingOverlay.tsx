import './PageLoadingOverlay.scss';

export interface PageLoadingOverlayProps {
  title?: string;
  subtitle?: string;
  variant?: 'overlay' | 'card';
  className?: string;
}

export function PageLoadingOverlay({
  title = 'Loading…',
  subtitle = 'Please wait while data is retrieved',
  variant = 'overlay',
  className,
}: PageLoadingOverlayProps) {
  const card = (
    <div className="page-loading-overlay__card">
      <div className="page-loading-overlay__progress" aria-hidden="true">
        <div className="page-loading-overlay__progress-bar" />
      </div>
      <p className="page-loading-overlay__title">{title}</p>
      {subtitle ? <p className="page-loading-overlay__subtitle">{subtitle}</p> : null}
    </div>
  );

  if (variant === 'card') {
    return (
      <div className={['page-loading-overlay', className].filter(Boolean).join(' ')} role="status" aria-live="polite" aria-busy="true">
        {card}
      </div>
    );
  }

  return (
    <div
      className={['page-loading-overlay', 'page-loading-overlay--overlay', className].filter(Boolean).join(' ')}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {card}
    </div>
  );
}
