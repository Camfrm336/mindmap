// /home/cameron/mindmap/voice-mindmap/client/vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Check if running on Railway (production)
const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_STATIC_URL;

// For local dev, use localhost. For Railway, use internal DNS.
const apiTarget = isRailway 
  ? 'http://voice-mindmap-server.railway.internal:3001'
  : 'http://localhost:3001';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['voice-mindmap-client-production.up.railway.app', 'localhost'],
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true
      }
    }
  }
});
