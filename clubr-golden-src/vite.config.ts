import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// "Felt" variant — mobile-first installable PWA. Served by the gallery at
// /clubr-golden/, emitting the static site one level up into ../clubr-golden.
export default defineConfig({
  base: '/clubr-golden/',
  cacheDir: '.vite-cache',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: '/clubr-golden/',
        name: 'ClubrGO — Poker Club Games',
        short_name: 'ClubrGO',
        description: 'Transparent scorekeeper for poker clubs — FT Fantasy, Last Longer & Squares.',
        start_url: '/clubr-golden/',
        scope: '/clubr-golden/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0B0F17',
        theme_color: '#0B0F17',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512-mask.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/clubr-golden/index.html',
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: { alias: { '@': '/src' } },
  build: { outDir: ../clubr-golden', emptyOutDir: true },
})
