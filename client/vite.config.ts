/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
const path = require('path')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          compatConfig: {
            MODE: 2
          }
        }
      }
    })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      vue: '@vue/compat'
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
