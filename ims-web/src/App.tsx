import { lazy, Suspense, useState } from 'react';
import { getAuthSession } from './api/auth';
import { LoginWindow } from './windows/LoginWindow';
import { XamlUiGallery } from './XamlUiGallery';
import './App.scss';

const MainWindow = lazy(() =>
  import('./windows/MainWindow').then((module) => ({ default: module.MainWindow })),
);

type Screen = 'login' | 'main' | 'gallery';

export default function App() {
  const [screen, setScreen] = useState<Screen>(() => (getAuthSession() ? 'main' : 'login'));

  if (screen === 'gallery') {
    return <XamlUiGallery onBack={() => setScreen('login')} />;
  }

  if (screen === 'main') {
    return (
      <Suspense fallback={<div className="app-shell app-shell--login">Loading application…</div>}>
        <MainWindow onLogout={() => setScreen('login')} />
      </Suspense>
    );
  }

  return (
    <div className="app-shell app-shell--login">
      <LoginWindow
        onClose={() => window.alert('Close application (not implemented in web build).')}
        onSignedIn={() => setScreen('main')}
      />
      {import.meta.env.DEV && (
        <button type="button" className="app-shell__gallery-link" onClick={() => setScreen('gallery')}>
          View all 92 WPF screens (generated)
        </button>
      )}
    </div>
  );
}
