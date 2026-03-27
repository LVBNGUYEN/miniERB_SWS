import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/uiux/',
  build: {
    outDir: '../../../dist/modules/uiux',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    open: '/uiux/login',
    proxy: {
      '/iam': 'http://localhost:3000',
      '/projects': 'http://localhost:3000',
      '/timesheets': 'http://localhost:3000',
      '/finance': 'http://localhost:3000',
      '/sales': 'http://localhost:3000',
      '/audit': 'http://localhost:3000',
      '/alerts': 'http://localhost:3000',
      '/system': 'http://localhost:3000',
      '/support': 'http://localhost:3000',
      '/ai-engine': 'http://localhost:3000',
    },
  },
})
