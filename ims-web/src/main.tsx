import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { ThemeProvider } from './theme/ThemeProvider';
import { initializeTheme } from './theme/themeService';
import './styles/global.scss';

initializeTheme();

window.addEventListener('unhandledrejection', (event) => {
  console.error('IMS unhandled rejection:', event.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </AppErrorBoundary>
  </StrictMode>,
);