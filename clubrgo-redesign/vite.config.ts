import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/clubrgo-redesign-demo/',
  build: { outDir: '../clubrgo-redesign-demo', emptyOutDir: true },
  cacheDir: '.vite-cache',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': '/src' },
  },
})
