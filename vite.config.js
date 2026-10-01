import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  build: {
    rollupOptions: {
      output: {
        // Forme fonction : capture tous les sous-modules (ex: react-dom/client),
        // la forme objet dupliquait react-dom entre vendor et index
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          return 'vendor'
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/avatars': 'http://localhost:3000',
    },
  },
})
