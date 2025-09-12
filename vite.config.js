import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        // No input files needed for Chrome extension
      },
      output: {
        // Output to dist directory
        dir: 'dist'
      }
    }
  }
});
