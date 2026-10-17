import { defineConfig } from 'vite';

// Relative base so the bundle loads from the native WebView's local file server.
export default defineConfig({
  base: './',
  build: { outDir: 'dist', target: 'es2020' },
});
