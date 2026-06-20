import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// "Felt" variant build: served by the gallery at /clubr-felt/, emitting the static
// site one level up into ../clubr-felt (the deployable dist the gallery serves).
export default defineConfig({
  base: '/clubr-felt/',
  cacheDir: '.vite-cache',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': '/src' },
  },
  build: {
    outDir: '../clubr-felt',
    emptyOutDir: true,
  },
})
