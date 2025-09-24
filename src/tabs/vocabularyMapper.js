import { SchemaViewer } from '../components/schemaViewer.js';
import { StorageManager } from '../core/storage.js';
import { SchemaProcessor } from '../utils/schema.js';

export class VocabularyMapper {
  constructor(container) {
    this.container = container;
    this.mappings = [];
    this.currentMappingIndex = 0;
    this.storageManager = new StorageManager();
    this.sourceViewer = null;
    this.targetViewer = null;
    this.sourceProcessor = null;
    this.targetProcessor = null;
    // Don't call init in constructor - it will be called after construction
    this.render();
    this.setupEventListeners();
    // Load schemas asynchronously after render
    this.loadSchemas().catch(console.error);
  }

  render() {
    this.container.innerHTML = `
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-semibold mb-4">Vocabulary Mapper</h2>
        <p class="text-gray-600 mb-6">Map concepts between source and target schemas with AI assistance.</p>

        <div class="space-y-6">
          <!-- Schema Viewers -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div class="border rounded-lg">
              <div class="bg-gray-50 px-4 py-3 border-b">
                <h3 class="font-semibold">Source Schema</h3>
                <div id="source-schema-count" class="text-sm text-gray-600 mt-1"></div>
              </div>
              <div id="source-schema-viewer" class="h-96 overflow-auto p-4">
                <div class="text-gray-500 text-center py-8">
                  <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <p>No source schema loaded</p>
                  <p class="text-sm mt-2">Load a source schema from the Configuration Panel</p>
                </div>
              </div>
            </div>

            <div class="border rounded-lg">
              <div class="bg-gray-50 px-4 py-3 border-b">
                <h3 class="font-semibold">Target Schema</h3>
                <div id="target-schema-count" class="text-sm text-gray-600 mt-1"></div>
              </div>
              <div id="target-schema-viewer" class="h-96 overflow-auto p-4">
                <div class="text-gray-500 text-center py-8">
                  <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <p>No target schema loaded</p>
                  <p class="text-sm mt-2">Load a target schema from the Configuration Panel</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Mapping Workbench -->
          <div class="border rounded-lg p-4">
            <h3 class="font-semibold mb-4">Mapping Workbench</h3>

            <div class="flex items-center justify-between mb-4">
              <button class="btn-secondary">Previous</button>
              <span class="text-gray-600">No mappings</span>
              <button class="btn-secondary">Next</button>
            </div>

            <div class="flex space-x-2">
              <button class="btn-primary">Accept</button>
              <button class="btn-danger">Reject</button>
              <button class="btn-secondary">Flag for Review</button>
            </div>
          </div>

          <!-- Manual Mapping -->
          <div class="border rounded-lg p-4">
            <h3 class="font-semibold mb-4">Manual Mapping</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input type="text" placeholder="Search source concepts..." class="input-field mb-2">
                <div class="border rounded h-32 overflow-auto p-2">
                  <p class="text-gray-500 text-sm">Selected source concepts will appear here</p>
                </div>
              </div>

              <div>
                <input type="text" placeholder="Search target concepts..." class="input-field mb-2">
                <div class="border rounded h-32 overflow-auto p-2">
                  <p class="text-gray-500 text-sm">Selected target concepts will appear here</p>
                </div>
              </div>
            </div>

            <button class="btn-primary w-full mt-4">Create Manual Mapping</button>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // Listen for schema load events from dataPanel
    window.addEventListener('schemas-loaded', async (event) => {
      const { type, processor, result } = event.detail;
      if (type === 'source') {
        await this.loadSourceSchema();
      } else if (type === 'target') {
        await this.loadTargetSchema();
      }
    });

    // Listen for schema clear events
    window.addEventListener('schemas-cleared', async (event) => {
      const { type } = event.detail;
      if (type === 'source') {
        this.clearSourceSchema();
      } else if (type === 'target') {
        this.clearTargetSchema();
      }
    });
  }

  async loadSchemas() {
    await this.loadSourceSchema();
    await this.loadTargetSchema();
  }

  async loadSourceSchema() {
    const stored = await this.storageManager.getSourceSchemas();
    if (stored && stored.resolvedSchema) {
      // Recreate processor
      this.sourceProcessor = new SchemaProcessor();
      if (stored.processor && stored.processor.schemas) {
        stored.processor.schemas.forEach(([id, schema]) => {
          this.sourceProcessor.schemas.set(id, schema);
        });
        this.sourceProcessor.mainSchema = stored.mainSchema;
        this.sourceProcessor.resolvedSchema = stored.resolvedSchema;
      }

      // Create viewer
      const viewerContainer = document.getElementById('source-schema-viewer');
      if (viewerContainer) {
        this.sourceViewer = new SchemaViewer(viewerContainer, {
          searchable: true,
          emptyMessage: 'No source schema loaded'
        });
        this.sourceViewer.setSchema(stored.resolvedSchema, this.sourceProcessor);

        // Update count
        const countEl = document.getElementById('source-schema-count');
        if (countEl) {
          const count = this.sourceViewer.getPropertyCount();
          countEl.textContent = `${count} variable${count !== 1 ? 's' : ''}`;
        }
      }
    }
  }

  async loadTargetSchema() {
    const stored = await this.storageManager.getTargetSchemas();
    if (stored && stored.resolvedSchema) {
      // Recreate processor
      this.targetProcessor = new SchemaProcessor();
      if (stored.processor && stored.processor.schemas) {
        stored.processor.schemas.forEach(([id, schema]) => {
          this.targetProcessor.schemas.set(id, schema);
        });
        this.targetProcessor.mainSchema = stored.mainSchema;
        this.targetProcessor.resolvedSchema = stored.resolvedSchema;
      }

      // Create viewer
      const viewerContainer = document.getElementById('target-schema-viewer');
      if (viewerContainer) {
        this.targetViewer = new SchemaViewer(viewerContainer, {
          searchable: true,
          emptyMessage: 'No target schema loaded'
        });
        this.targetViewer.setSchema(stored.resolvedSchema, this.targetProcessor);

        // Update count
        const countEl = document.getElementById('target-schema-count');
        if (countEl) {
          const count = this.targetViewer.getPropertyCount();
          countEl.textContent = `${count} variable${count !== 1 ? 's' : ''}`;
        }
      }
    }
  }

  async onActivate() {
    console.log('Vocabulary Mapper tab activated');
    // Reload schemas in case they were updated while on another tab
    await this.loadSchemas();
  }

  clearSourceSchema() {
    this.sourceProcessor = null;
    this.sourceViewer = null;

    const viewerContainer = document.getElementById('source-schema-viewer');
    if (viewerContainer) {
      viewerContainer.innerHTML = `
        <div class="text-gray-500 text-center py-8">
          <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <p>No source schema loaded</p>
          <p class="text-sm mt-2">Load a source schema from the Configuration Panel</p>
        </div>
      `;
    }

    const countEl = document.getElementById('source-schema-count');
    if (countEl) {
      countEl.textContent = '';
    }
  }

  clearTargetSchema() {
    this.targetProcessor = null;
    this.targetViewer = null;

    const viewerContainer = document.getElementById('target-schema-viewer');
    if (viewerContainer) {
      viewerContainer.innerHTML = `
        <div class="text-gray-500 text-center py-8">
          <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <p>No target schema loaded</p>
          <p class="text-sm mt-2">Load a target schema from the Configuration Panel</p>
        </div>
      `;
    }

    const countEl = document.getElementById('target-schema-count');
    if (countEl) {
      countEl.textContent = '';
    }
  }

  refresh() {
    this.render();
    this.setupEventListeners();
    this.loadSchemas();
  }
}