import { Suspense, lazy, useMemo, useState } from 'react';
import { xamlUiManifest, xamlUiPaths } from './wpf-ui/manifest';
import './XamlUiGallery.scss';

export interface XamlUiGalleryProps {
  onBack: () => void;
}

export function XamlUiGallery({ onBack }: XamlUiGalleryProps) {
  const [path, setPath] = useState(xamlUiPaths[0] ?? '');
  const LazyView = useMemo(() => {
    const loader = xamlUiManifest[path];
    return loader ? lazy(loader) : null;
  }, [path]);

  return (
    <div className="xaml-gallery">
      <header className="xaml-gallery__header">
        <button type="button" onClick={onBack}>← Back</button>
        <h1>WPF → React UI gallery ({xamlUiPaths.length} screens)</h1>
      </header>
      <div className="xaml-gallery__body">
        <aside className="xaml-gallery__list">
          {xamlUiPaths.map((p) => (
            <button
              key={p}
              type="button"
              className={p === path ? 'is-active' : ''}
              onClick={() => setPath(p)}
            >
              {p}
            </button>
          ))}
        </aside>
        <section className="xaml-gallery__preview">
          {LazyView ? (
            <Suspense fallback={<div>Loading {path}…</div>}>
              <LazyView />
            </Suspense>
          ) : (
            <div>Select a screen</div>
          )}
        </section>
      </div>
    </div>
  );
}
