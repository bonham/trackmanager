import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
const path = require('path')

const vitestConfig = {
  test: {
    globals: true,
    environment: 'jsdom',
    deps: {
      inline: true
    }
  }
}

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
      vue: '@vue/compat',
      Vue: '@vue/compat'
    }
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  },
  test: vitestConfig.test
})
