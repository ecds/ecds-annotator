import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    lib: {
      entry: 'src/index.jsx',
      name: 'ECDSAnnotator',
      fileName: (format) => `ecds-annotator.${format}.js`,
      formats: ['es', 'umd'],
    },
    sourcemap: true,
  },
});
