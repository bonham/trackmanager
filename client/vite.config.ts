/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import IconsResolve from 'unplugin-icons/resolver'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: "/tm",
  plugins: [
    vue(),
    Components({
      resolvers: [IconsResolve()],
      dts: true
    }),
    Icons({
      compiler: 'vue3',
      autoInstall: true
    })
  ],
  build: {
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    host: true,
    proxy: {
      '/api': 'http://localhost:3000'
    }
  },
  test: {
    setupFiles: ['tests/vitest-setupfiles/setup-jest-dom.js', 'jsdom-worker'],
    environment: 'jsdom',
    globals: true,
    coverage: {
      enabled: false,
      include: ['src/**/*'],
      reporter: 'html',
      all: true
    }
  }
})
