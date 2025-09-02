import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const API_PORT = process.env.VITE_API_URL?.split(':')[2] || '8080';

console.log(`📦 Vite config: Using API port ${API_PORT}`);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  // Development server configuration
  server: {
    port: 5173,
    strictPort: false,
    cors: true,
    proxy: {
      '/api': {
        target: `http://localhost:${API_PORT}`,
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: `http://localhost:${API_PORT}`,
        changeOrigin: true,
        ws: true,
        secure: false,
      },
    },
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@episensor/app-framework'],
        },
      },
    },
  },
});