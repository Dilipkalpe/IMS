import { useState } from 'react';
import { getAuthSession } from './api/auth';
import { LoginWindow } from './windows/LoginWindow';
import { MainWindow } from './windows/MainWindow';
import { XamlUiGallery } from './XamlUiGallery';
import './App.scss';

type Screen = 'login' | 'main' | 'gallery';

export default function App() {
  const [screen, setScreen] = useState<Screen>(() => (getAuthSession() ? 'main' : 'login'));

  if (screen === 'gallery') {
    return <XamlUiGallery onBack={() => setScreen('login')} />;
  }

  if (screen === 'main') {
    return <MainWindow onLogout={() => setScreen('login')} />;
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
