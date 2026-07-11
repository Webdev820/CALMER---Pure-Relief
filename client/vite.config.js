import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:5000', ws: true }
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        // Split heavy libs into cacheable chunks — first paint no longer waits for maps/animation libs
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'axios'],
          map: ['leaflet'],
          motion: ['gsap'],
          realtime: ['socket.io-client']
        }
      }
    }
  }
})
