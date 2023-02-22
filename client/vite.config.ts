/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
const path = require('path')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  },
  test: {
    // setupFiles: ['tests/vitest-setupfiles/mockServiceWorker.js'],
    environment: 'jsdom'
    // globals: true
  }
})
