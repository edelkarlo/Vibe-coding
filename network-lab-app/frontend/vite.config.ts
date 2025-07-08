import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Optional: You can specify a port for the dev server
    open: true, // Optional: Automatically open the app in the browser on server start
    proxy: {
      // String shorthand for simple proxy:
      // '/api': 'http://localhost:5001'
      // Or with options:
      '/api': {
        target: 'http://localhost:5001', // Your Flask backend runs on this port
        changeOrigin: true, // Needed for virtual hosted sites and to avoid CORS issues by changing the Host header
        // secure: false, // Set to false if your backend is HTTP and Vite dev server is HTTPS (uncommon for local)
        // rewrite: (path) => path.replace(/^\/api/, '/api') // Default keeps /api prefix to backend
                                                            // If your Flask routes are like /api/auth/login, this is fine.
                                                            // If Flask routes are /auth/login, then rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'build' // Optional: specify output directory for production build, default is 'dist'
  }
})
