import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/epiharmony/',
  plugins: [tailwindcss()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Vite 8 / Rolldown: the object form of manualChunks was removed.
        // Use codeSplitting.groups, whose `test` matches against module ids.
        codeSplitting: {
          groups: [
            { name: 'vendor', test: /node_modules\/(@google\/genai|ag-grid-community|ajv)\// },
            { name: 'editor', test: /node_modules\/(codemirror|@codemirror)\// },
            { name: 'data', test: /node_modules\/(idb|@babycommando\/entity-db)\// },
            { name: 'webr', test: /node_modules\/webr\// }
          ]
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