import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `vite build --mode single` inlines everything into one index.html that opens
// straight from disk (file://) – handy for reviewing renders without a server.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), mode === 'single' && viteSingleFile()].filter(Boolean),
  build: {
    chunkSizeWarningLimit: 1600,
    outDir: mode === 'single' ? 'dist-single' : 'dist',
  },
}));
