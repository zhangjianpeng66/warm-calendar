import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  base: '/warm-calendar/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
      },
      includeAssets: ['favicon.svg'],
      manifest: {
        name: '一小步',
        short_name: '一小步',
        description: '一小步 · 每一步都算数',
        theme_color: '#f59e0b',
        background_color: '#fff8f0',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/warm-calendar/',
        scope: '/warm-calendar/',
        icons: [
          {
            src: '/warm-calendar/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/warm-calendar/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
