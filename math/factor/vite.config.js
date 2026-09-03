// codex: 2026-09-03 use relative base './' so assets resolve correctly in any subpath
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
})
