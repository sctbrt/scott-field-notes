import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 8002,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        'field-note': 'field-note.html',
        'nav-test': 'nav-test.html',
        'workbench': 'workbench.html',
      },
    },
  },
});
