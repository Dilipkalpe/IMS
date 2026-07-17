import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const basePath = (process.env.VITE_BASE_PATH || '/IMSWebApp/').replace(/\/?$/, '/');

export default defineConfig({
  base: basePath,
  plugins: [react()],
  server: {
    port: 5173,
    // Same-origin /api in dev — avoids browser CORS when the UI runs on :5173 and API on :3000.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // WPF-migrated view SCSS still uses @import; silence until batch @use migration.
        silenceDeprecations: ['import'],
      },
    },
  },
});
