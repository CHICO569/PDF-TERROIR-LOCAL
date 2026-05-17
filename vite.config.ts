import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      external: [],
    },
  },
  optimizeDeps: {
    exclude: ['mupdf', 'qpdf-wasm'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});
