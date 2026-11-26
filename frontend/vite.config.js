import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 5173,
    proxy: {
      '/api': { target: process.env.VITE_DEV_API || 'http://127.0.0.1:3101', changeOrigin: true },
    },
  },
  preview: { port: 4173, host: '0.0.0.0', allowedHosts: true },
  build: { outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 800 },
});
