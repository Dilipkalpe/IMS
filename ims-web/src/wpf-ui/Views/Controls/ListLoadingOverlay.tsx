import {
  PageLoadingOverlay,
  type PageLoadingOverlayProps,
} from '../../../components/loading/PageLoadingOverlay';

export interface ListLoadingOverlayProps extends PageLoadingOverlayProps {
  className?: string;
}

/** WPF ListLoadingOverlay parity — use PageLoadingOverlay card in generated views. */
export function ListLoadingOverlay({
  title = 'Loading…',
  subtitle = 'Please wait while data is retrieved',
  className,
}: ListLoadingOverlayProps) {
  return (
    <PageLoadingOverlay
      title={title}
      subtitle={subtitle}
      variant="card"
      className={className}
    />
  );
}

export default ListLoadingOverlay;
