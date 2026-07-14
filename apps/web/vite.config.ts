import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Health Tracker',
        short_name: 'Health Tracker',
        description: 'Theo dõi sức khỏe, cân nặng và lượng nước hàng ngày',
        lang: 'vi',
        theme_color: '#10b981',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
  server: {
    port: 3000,
    allowedHosts: [
      'localhost',
      '.ngrok-free.dev',
      '.ngrok.io',
    ],
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
  preview: {
    port: 3000,
  },
});
