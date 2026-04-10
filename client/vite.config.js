// /home/cameron/mindmap/voice-mindmap/client/vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['voice-mindmap-client-production.up.railway.app', 'localhost'],
    proxy: {
      '/api': {
        target: 'http://voice-mindmap-server.railway.internal:3001',
        changeOrigin: true
      }
    }
  }
});
