import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Built once per direction: `VITE_THEME=clarivue vite build` → base /scout-clarivue-demo/.
const theme = process.env.VITE_THEME
const base = theme ? `/scout-${theme}-demo/` : '/'

export default defineConfig({
  base,
  cacheDir: `.vite-cache/${theme ?? 'dev'}`,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': '/src' },
  },
})
