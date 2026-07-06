import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000, // Increase limit to 1MB
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['lucide-react', 'framer-motion', 'sonner', 'clsx'],
          'vendor-utils': ['date-fns', 'uuid', 'zod', 'axios'],
          'visualization': ['recharts', 'react-big-calendar'],
        },
      },
    },
  },
})
