import { defineConfig } from 'vite'

export default defineConfig({
  base: '/epiharmony/',
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['@google/generative-ai', 'ag-grid-community', 'ajv'],
          'editor': ['codemirror', '@codemirror/lang-javascript', '@codemirror/view', '@codemirror/state'],
          'data': ['idb', '@babycommando/entity-db'],
          'webr': ['webr']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  worker: {
    format: 'es'
  }
})