import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'favicon-32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'LumiLedger — Track your business finances',
        short_name: 'LumiLedger',
        description: 'Manage invoices, expenses, and track owner capital — money you\'ve put into your business and recovered over time.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/dashboard',
        scope: '/',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App-shell only — API calls are never cached, so data is always fresh.
        // Without this, Workbox's default globPatterns would still only pick up
        // built static assets, but we're explicit here to avoid ever caching /api/*.
        navigateFallbackDenylist: [/^\/api\//],
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        globIgnores: ['logo.png'], // legacy 2MB asset, unused — not worth precaching
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // covers the current ~3MB main bundle with headroom
      },
    }),
  ],
})
