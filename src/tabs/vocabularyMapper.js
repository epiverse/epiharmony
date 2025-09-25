import { SchemaViewer } from '../components/schemaViewer.js';
import { StorageManager } from '../core/storage.js';
import { SchemaProcessor } from '../utils/schema.js';
import { getVocabularyMappingService } from '../services/vocabularyMappingService.js';

export class VocabularyMapper {
  constructor(container) {
    this.container = container;
    this.mappings = [];
    this.candidateMappings = [];
    this.currentMappingIndex = 0;
    this.storageManager = new StorageManager();
    this.mappingService = getVocabularyMappingService();
    this.sourceViewer = null;
    this.targetViewer = null;
    this.sourceProcessor = null;
    this.targetProcessor = null;
    this.isGenerating = false;
    this.sourceProperties = [];
    this.targetProperties = [];
    this.selectedSourceProperties = new Set();
    this.selectedTargetProperties = new Set();
    // Targeted mapping state
    this.targetedMappingState = {
      targetProperty: null,
      candidates: [],
      analysis: null,
      chatHistory: [],
      selectedCandidates: new Set()
    };
    // View mode state (default to split view)
    this.viewMode = localStorage.getItem('vocabularyMapperViewMode') || 'split';
    // Don't call init in constructor - it will be called after construction
    this.render();
    this.setupEventListeners();
    // Load schemas asynchronously after render
    this.loadSchemas().catch(console.error);
    // Initialize mapping service
    this.initializeMappingService().catch(console.error);
  }

  render() {
    const gridClass = this.viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1';

    this.container.innerHTML = `
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h2 class="text-2xl font-semibold">Vocabulary Mapper</h2>
            <p class="text-gray-600 mt-1">Map concepts between source and target schemas with AI assistance.</p>
          </div>

          <!-- View Mode Toggle -->
          <div class="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              id="split-view-btn"
              class="view-toggle-btn ${this.viewMode === 'split' ? 'active' : ''}"
              title="Side-by-side view"
            >
              <svg class="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="4" y="4" width="7" height="16" rx="1"></rect>
                  <rect x="13" y="4" width="7" height="16" rx="1"></rect>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16"></path>
                </svg>
              Split
            </button>
            <button
              id="stacked-view-btn"
              class="view-toggle-btn ${this.viewMode === 'stacked' ? 'active' : ''}"
              title="Stacked view"
            >
              <svg class="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
              Stacked
            </button>
          </div>
        </div>

        <div class="space-y-6">
          <!-- Schema Viewers -->
          <div class="grid ${gridClass} gap-4 transition-all duration-300">
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
          </div>

          <!-- Mapping Generation -->
          <div class="border rounded-lg p-4 mb-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold">Mapping Generation</h3>
              <div class="flex items-center space-x-2">
                <span id="mapping-stats" class="text-sm text-gray-600"></span>
                <button id="generate-mappings-btn" class="btn-primary">
                  <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                  Generate Mappings
                </button>
                <button id="clear-mappings-btn" class="btn-secondary">Clear All</button>
              </div>
            </div>

            <!-- Progress Indicator -->
            <div id="generation-progress" class="hidden">
              <div class="bg-gray-100 rounded-lg p-4">
                <div class="flex items-center justify-between mb-2">
                  <span id="progress-message" class="text-sm">Initializing...</span>
                  <button id="cancel-generation-btn" class="text-red-600 hover:text-red-700 text-sm">Cancel</button>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div id="progress-bar" class="bg-amber-600 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- AI Prompt Configuration -->
          <div class="border rounded-lg p-4 mb-4">
            <h3 class="font-semibold mb-4 cursor-pointer flex items-center justify-between" id="toggle-prompt-editor">
              <span>AI Prompt Configuration</span>
              <span id="prompt-toggle-icon" class="text-gray-500">▶</span>
            </h3>
            <div id="prompt-editor-panel" class="hidden">
              <div class="mb-3">
                <label class="text-sm text-gray-600">
                  Customize the AI prompt to control how mappings are analyzed. Focus on parsimony by instructing the AI to find minimal sufficient mappings.
                </label>
              </div>
              <textarea id="custom-prompt"
                       class="w-full h-64 p-3 border rounded font-mono text-xs bg-gray-50"
                       placeholder="Enter custom prompt or leave empty to use default..."></textarea>
              <div class="flex space-x-2 mt-3">
                <button id="save-prompt" class="btn-primary">Save Custom Prompt</button>
                <button id="reset-prompt" class="btn-secondary">Reset to Default</button>
                <button id="test-prompt" class="btn-secondary">Test with Current Analysis</button>
              </div>
              <div id="prompt-status" class="text-sm mt-2"></div>
            </div>
          </div>

          <!-- Targeted Mapping Assistant -->
          <div class="border rounded-lg p-4 mb-4">
            <h3 class="font-semibold mb-4">Targeted Mapping Assistant</h3>

            <!-- Controls -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium mb-2">Target Concept</label>
                <select id="target-concept-select" class="input-field">
                  <option value="">Select target property...</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Number of Candidates (K)</label>
                <div class="flex items-center space-x-2">
                  <input id="k-value-slider" type="range" min="3" max="20" value="10" class="flex-1">
                  <span id="k-value-display" class="w-8 text-center font-medium">10</span>
                </div>
              </div>

              <div class="flex items-end">
                <button id="find-related-btn" class="btn-primary w-full" disabled>
                  <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                  Find Related Concepts
                </button>
              </div>
            </div>

            <!-- Progress for targeted search -->
            <div id="targeted-progress" class="hidden mb-4">
              <div class="bg-gray-100 rounded-lg p-3">
                <div class="flex items-center justify-between mb-2">
                  <span id="targeted-progress-message" class="text-sm">Finding related concepts...</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div id="targeted-progress-bar" class="bg-amber-600 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
              </div>
            </div>

            <!-- Results -->
            <div id="targeted-results" class="hidden">
              <!-- Related Concepts -->
              <div class="mb-4">
                <h4 class="font-medium mb-2">Related Source Concepts</h4>
                <div id="related-concepts-list" class="border rounded-lg p-4 max-h-64 overflow-auto">
                  <!-- Will be populated dynamically -->
                </div>
              </div>

              <!-- LLM Analysis -->
              <div class="mb-4">
                <div class="flex items-center justify-between mb-2">
                  <h4 class="font-medium">AI Analysis</h4>
                  <button id="toggle-analysis" class="text-sm text-amber-600 hover:text-amber-700">
                    Show Full Analysis
                  </button>
                </div>
                <div id="analysis-panel" class="border rounded-lg p-4">
                  <div id="analysis-summary" class="space-y-2">
                    <!-- Summary view -->
                  </div>
                  <div id="analysis-full" class="hidden space-y-4 mt-4 pt-4 border-t">
                    <!-- Full analysis -->
                  </div>
                </div>
              </div>

              <!-- Chat Interface -->
              <div class="mb-4">
                <h4 class="font-medium mb-2">Refine with AI</h4>
                <div id="chat-container" class="border rounded-lg">
                  <div id="chat-messages" class="p-4 h-48 overflow-auto bg-gray-50">
                    <!-- Chat messages -->
                  </div>
                  <div class="border-t p-3">
                    <div class="flex space-x-2">
                      <input id="chat-input" type="text" placeholder="Ask about the mapping..." class="input-field flex-1">
                      <button id="send-chat" class="btn-secondary">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Manual Override -->
              <div class="mb-4">
                <h4 class="font-medium mb-2">Manual Selection</h4>
                <div class="border rounded-lg p-4">
                  <div id="manual-selection-list" class="space-y-2 mb-4">
                    <!-- Checkboxes for manual selection -->
                  </div>
                  <div class="grid grid-cols-3 gap-4 mb-4">
                    <select id="manual-mapping-type" class="input-field">
                      <option value="one-to-one">One-to-One</option>
                      <option value="many-to-one">Many-to-One</option>
                      <option value="one-to-many">One-to-Many</option>
                    </select>
                    <select id="manual-confidence" class="input-field">
                      <option value="low">Low</option>
                      <option value="medium" selected>Medium</option>
                      <option value="high">High</option>
                    </select>
                    <input id="manual-description" type="text" placeholder="Description" class="input-field">
                  </div>
                  <div class="border-t pt-4">
                    <h5 class="text-sm font-medium mb-2">Accept AI Recommendation</h5>
                    <div class="grid grid-cols-2 gap-4 mb-3">
                      <select id="ai-confidence" class="input-field">
                        <option value="low">Low Confidence</option>
                        <option value="medium">Medium Confidence</option>
                        <option value="high" selected>High Confidence</option>
                      </select>
                      <select id="ai-action" class="input-field">
                        <option value="accept">Accept</option>
                        <option value="flag">Flag for Review</option>
                        <option value="reject">Reject</option>
                      </select>
                    </div>
                    <button id="accept-targeted" class="btn-primary w-full mb-3">Apply AI Recommendation</button>
                  </div>
                  <div class="border-t pt-4">
                    <h5 class="text-sm font-medium mb-2">Apply Manual Override</h5>
                    <button id="apply-manual" class="btn-secondary w-full">Apply Manual Selection</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Mapping Workbench -->
          <div class="border rounded-lg p-4">
            <h3 class="font-semibold mb-4">Mapping Workbench</h3>

            <!-- Current Mapping Display -->
            <div id="current-mapping-display" class="mb-4">
              <div class="bg-gray-50 rounded-lg p-4">
                <div id="no-mappings-message" class="text-gray-500 text-center py-8">
                  <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                  </svg>
                  <p>No mappings generated yet</p>
                  <p class="text-sm mt-2">Click "Generate Mappings" to start</p>
                </div>

                <div id="mapping-details" class="hidden">
                  <div class="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label class="text-sm font-medium text-gray-600">Source</label>
                      <div id="mapping-source" class="font-mono text-sm bg-white rounded p-2 border"></div>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-gray-600">Target</label>
                      <div id="mapping-target" class="font-mono text-sm bg-white rounded p-2 border"></div>
                    </div>
                  </div>
                  <div class="grid grid-cols-3 gap-4">
                    <div>
                      <label class="text-sm font-medium text-gray-600">Type</label>
                      <div id="mapping-type" class="text-sm"></div>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-gray-600">Confidence</label>
                      <div id="mapping-confidence" class="text-sm"></div>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-gray-600">Status</label>
                      <div id="mapping-status" class="text-sm"></div>
                    </div>
                  </div>
                  <div class="mt-3">
                    <label class="text-sm font-medium text-gray-600">Description</label>
                    <div id="mapping-description" class="text-sm text-gray-700 mt-1"></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between mb-4">
              <button id="prev-mapping-btn" class="btn-secondary" disabled>Previous</button>
              <span id="mapping-counter" class="text-gray-600">No mappings</span>
              <button id="next-mapping-btn" class="btn-secondary" disabled>Next</button>
            </div>

            <div class="flex space-x-2">
              <button id="accept-mapping-btn" class="btn-primary" disabled>Accept</button>
              <button id="reject-mapping-btn" class="btn-danger" disabled>Reject</button>
              <button id="flag-mapping-btn" class="btn-secondary" disabled>Flag for Review</button>
            </div>
          </div>

          <!-- Manual Mapping -->
          <div class="border rounded-lg p-4">
            <h3 class="font-semibold mb-4">Manual Mapping</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input id="source-search" type="text" placeholder="Search source concepts..." class="input-field mb-2">
                <div id="source-properties-list" class="border rounded h-32 overflow-auto p-2">
                  <p class="text-gray-500 text-sm">Loading source properties...</p>
                </div>
                <div id="selected-source-properties" class="mt-2">
                  <label class="text-sm font-medium text-gray-600">Selected:</label>
                  <div class="flex flex-wrap gap-1 mt-1"></div>
                </div>
              </div>

              <div>
                <input id="target-search" type="text" placeholder="Search target concepts..." class="input-field mb-2">
                <div id="target-properties-list" class="border rounded h-32 overflow-auto p-2">
                  <p class="text-gray-500 text-sm">Loading target properties...</p>
                </div>
                <div id="selected-target-properties" class="mt-2">
                  <label class="text-sm font-medium text-gray-600">Selected:</label>
                  <div class="flex flex-wrap gap-1 mt-1"></div>
                </div>
              </div>
            </div>

            <div class="mt-4">
              <input id="manual-mapping-description" type="text" placeholder="Mapping description (optional)" class="input-field">
            </div>

            <button id="create-manual-mapping-btn" class="btn-primary w-full mt-4">Create Manual Mapping</button>
          </div>

          <!-- Accepted Mappings Summary -->
          <div class="border rounded-lg p-4">
            <h3 class="font-semibold mb-4">Accepted Mappings Summary</h3>
            <div id="accepted-mappings-list" class="space-y-2 max-h-64 overflow-auto">
              <p class="text-gray-500 text-sm text-center py-4">No accepted mappings yet</p>
            </div>
            <div class="flex space-x-2 mt-4">
              <button id="export-mappings-btn" class="btn-secondary flex-1" disabled>
                <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Export Mappings
              </button>
              <button id="apply-to-transform-btn" class="btn-primary flex-1" disabled>
                <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
                Apply to Transform
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // View toggle buttons
    const splitBtn = document.getElementById('split-view-btn');
    const stackedBtn = document.getElementById('stacked-view-btn');

    if (splitBtn) {
      splitBtn.addEventListener('click', () => this.setViewMode('split'));
    }

    if (stackedBtn) {
      stackedBtn.addEventListener('click', () => this.setViewMode('stacked'));
    }

    // Mapping generation
    const generateBtn = document.getElementById('generate-mappings-btn');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => this.generateMappings());
    }

    const clearBtn = document.getElementById('clear-mappings-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearMappings());
    }

    const cancelBtn = document.getElementById('cancel-generation-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.cancelGeneration());
    }

    // Mapping navigation
    const prevBtn = document.getElementById('prev-mapping-btn');
    const nextBtn = document.getElementById('next-mapping-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.previousMapping());
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextMapping());
    }

    // Mapping actions
    const acceptBtn = document.getElementById('accept-mapping-btn');
    const rejectBtn = document.getElementById('reject-mapping-btn');
    const flagBtn = document.getElementById('flag-mapping-btn');
    if (acceptBtn) {
      acceptBtn.addEventListener('click', () => this.acceptCurrentMapping());
    }
    if (rejectBtn) {
      rejectBtn.addEventListener('click', () => this.rejectCurrentMapping());
    }
    if (flagBtn) {
      flagBtn.addEventListener('click', () => this.flagCurrentMapping());
    }

    // Manual mapping
    const sourceSearch = document.getElementById('source-search');
    const targetSearch = document.getElementById('target-search');
    if (sourceSearch) {
      sourceSearch.addEventListener('input', (e) => this.filterSourceProperties(e.target.value));
    }
    if (targetSearch) {
      targetSearch.addEventListener('input', (e) => this.filterTargetProperties(e.target.value));
    }

    const createManualBtn = document.getElementById('create-manual-mapping-btn');
    if (createManualBtn) {
      createManualBtn.addEventListener('click', () => this.createManualMapping());
    }

    // Export and apply
    const exportBtn = document.getElementById('export-mappings-btn');
    const applyBtn = document.getElementById('apply-to-transform-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportMappings());
    }
    if (applyBtn) {
      applyBtn.addEventListener('click', () => this.applyToTransform());
    }

    // Prompt editor and targeted mapping controls
    this.setupPromptEditorListeners();
    this.setupTargetedMappingListeners();

    // Listen for schema load events from dataPanel
    window.addEventListener('schemas-loaded', async (event) => {
      const { type, processor, result } = event.detail;
      if (type === 'source') {
        await this.loadSourceSchema();
        this.updatePropertyLists();
      } else if (type === 'target') {
        await this.loadTargetSchema();
        this.updatePropertyLists();
      }
    });

    // Listen for schema clear events
    window.addEventListener('schemas-cleared', async (event) => {
      const { type } = event.detail;
      if (type === 'source') {
        this.clearSourceSchema();
        this.sourceProperties = [];
        this.updatePropertyLists();
      } else if (type === 'target') {
        this.clearTargetSchema();
        this.targetProperties = [];
        this.updatePropertyLists();
      }
    });
  }

  setViewMode(mode) {
    if (this.viewMode === mode) return;

    this.viewMode = mode;
    localStorage.setItem('vocabularyMapperViewMode', mode);

    // Update grid classes
    const schemaGrid = this.container.querySelector('.space-y-6 > .grid');
    if (schemaGrid) {
      if (mode === 'split') {
        schemaGrid.classList.remove('grid-cols-1');
        schemaGrid.classList.add('lg:grid-cols-2');
      } else {
        schemaGrid.classList.remove('lg:grid-cols-2');
        schemaGrid.classList.add('grid-cols-1');
      }
    }

    // Update button states
    const splitBtn = document.getElementById('split-view-btn');
    const stackedBtn = document.getElementById('stacked-view-btn');

    if (splitBtn && stackedBtn) {
      if (mode === 'split') {
        splitBtn.classList.add('active');
        stackedBtn.classList.remove('active');
      } else {
        stackedBtn.classList.add('active');
        splitBtn.classList.remove('active');
      }
    }
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

  // Initialize mapping service
  async initializeMappingService() {
    try {
      await this.mappingService.initialize();

      // Load existing mappings
      const existingMappings = await this.mappingService.loadMappings();
      if (existingMappings && existingMappings.length > 0) {
        this.candidateMappings = existingMappings;
        this.updateMappingDisplay();
        this.updateStats();
      }
    } catch (error) {
      console.error('Failed to initialize mapping service:', error);
    }
  }

  // Extract properties from schemas
  extractPropertiesFromSchema(schema, isSource = true) {
    const properties = [];

    if (!schema || !schema.properties) return properties;

    Object.entries(schema.properties).forEach(([key, prop]) => {
      properties.push({
        name: key,
        type: prop.type || 'unknown',
        title: prop.title || key,
        description: prop.description || '',
        enum: prop.enum || null,
        format: prop.format || null,
        schema: prop  // Include the full schema property definition
      });
    });

    return properties;
  }

  // Update property lists in manual mapping
  updatePropertyLists() {
    // Extract properties from schemas
    if (this.sourceProcessor && this.sourceProcessor.resolvedSchema) {
      this.sourceProperties = this.extractPropertiesFromSchema(
        this.sourceProcessor.resolvedSchema
      );
    }

    if (this.targetProcessor && this.targetProcessor.resolvedSchema) {
      this.targetProperties = this.extractPropertiesFromSchema(
        this.targetProcessor.resolvedSchema
      );
    }

    // Update UI
    this.renderPropertyList('source');
    this.renderPropertyList('target');

    // Populate target selector for targeted mapping
    this.populateTargetSelector();
  }

  // Render property list for manual mapping
  renderPropertyList(type) {
    const properties = type === 'source' ? this.sourceProperties : this.targetProperties;
    const container = document.getElementById(`${type}-properties-list`);

    if (!container) return;

    if (properties.length === 0) {
      container.innerHTML = `<p class="text-gray-500 text-sm">No ${type} schema loaded</p>`;
      return;
    }

    container.innerHTML = properties.map(prop => `
      <div class="property-item cursor-pointer hover:bg-amber-50 p-2 rounded" data-property="${prop.name}" data-type="${type}">
        <input type="checkbox" class="mr-2" data-property-check="${prop.name}" data-type="${type}">
        <span class="font-mono text-sm">${prop.name}</span>
        <span class="text-gray-500 text-xs ml-2">(${prop.type})</span>
        ${prop.description ? `<div class="text-xs text-gray-600 ml-6">${prop.description}</div>` : ''}
      </div>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.property-item').forEach(item => {
      const checkbox = item.querySelector('input[type="checkbox"]');

      item.addEventListener('click', (e) => {
        if (e.target !== checkbox) {
          checkbox.checked = !checkbox.checked;
        }
        this.updateSelectedProperties(type);
      });

      checkbox.addEventListener('change', () => {
        this.updateSelectedProperties(type);
      });
    });
  }

  // Update selected properties display
  updateSelectedProperties(type) {
    const container = document.getElementById(`${type}-properties-list`);
    const selectedContainer = document.querySelector(`#selected-${type}-properties .flex`);

    if (!container || !selectedContainer) return;

    const selected = type === 'source' ? this.selectedSourceProperties : this.selectedTargetProperties;
    selected.clear();

    container.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
      selected.add(checkbox.dataset.propertyCheck);
    });

    // Update display
    selectedContainer.innerHTML = Array.from(selected).map(prop => `
      <span class="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded">${prop}</span>
    `).join('');
  }

  // Filter properties in lists
  filterSourceProperties(searchTerm) {
    this.filterProperties('source', searchTerm);
  }

  filterTargetProperties(searchTerm) {
    this.filterProperties('target', searchTerm);
  }

  filterProperties(type, searchTerm) {
    const container = document.getElementById(`${type}-properties-list`);
    if (!container) return;

    const items = container.querySelectorAll('.property-item');
    const term = searchTerm.toLowerCase();

    items.forEach(item => {
      const property = item.dataset.property.toLowerCase();
      const text = item.textContent.toLowerCase();

      if (property.includes(term) || text.includes(term)) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
  }

  // Generate mappings using the service
  async generateMappings() {
    if (this.isGenerating) return;

    // Check prerequisites
    const apiKey = await this.storageManager.getApiKey();
    if (!apiKey) {
      alert('Please set your Gemini API key in the Configuration Panel first.');
      return;
    }

    if (!this.sourceProcessor || !this.targetProcessor) {
      alert('Please load both source and target schemas first.');
      return;
    }

    this.isGenerating = true;
    this.showProgress(true);
    this.updateProgress(0, 'Initializing mapping generation...');

    try {
      // Generate mappings with progress callback
      this.candidateMappings = await this.mappingService.generateMappings(
        this.sourceProcessor.resolvedSchema,
        this.targetProcessor.resolvedSchema,
        {
          k: 5, // Number of nearest neighbors
          onProgress: (progress) => {
            this.handleGenerationProgress(progress);
          }
        }
      );

      // Reset to first mapping
      this.currentMappingIndex = 0;
      this.updateMappingDisplay();
      this.updateStats();

      // Show success message
      this.showProgress(false);
      console.log(`Successfully generated ${this.candidateMappings.length} mappings`);

    } catch (error) {
      console.error('Failed to generate mappings:', error);
      alert(`Failed to generate mappings: ${error.message}`);
      this.showProgress(false);
    } finally {
      this.isGenerating = false;
    }
  }

  // Handle generation progress
  handleGenerationProgress(progress) {
    if (progress.phase === 'source') {
      const percent = (progress.processed / progress.total) * 33;
      this.updateProgress(percent, `Embedding source properties (${progress.processed}/${progress.total})...`);
    } else if (progress.phase === 'target') {
      const percent = 33 + (progress.processed / progress.total) * 33;
      this.updateProgress(percent, `Embedding target properties (${progress.processed}/${progress.total})...`);
    } else if (progress.phase === 'refining') {
      const percent = 66 + (progress.processed / progress.total) * 34;
      this.updateProgress(percent, `Refining mappings with AI (${progress.processed}/${progress.total})...`);
    }
  }

  // Show/hide progress indicator
  showProgress(show) {
    const progressDiv = document.getElementById('generation-progress');
    if (progressDiv) {
      progressDiv.classList.toggle('hidden', !show);
    }

    // Disable/enable generate button
    const generateBtn = document.getElementById('generate-mappings-btn');
    if (generateBtn) {
      generateBtn.disabled = show;
      generateBtn.classList.toggle('opacity-50', show);
      generateBtn.classList.toggle('cursor-not-allowed', show);
    }
  }

  // Update progress bar
  updateProgress(percent, message) {
    const progressBar = document.getElementById('progress-bar');
    const progressMessage = document.getElementById('progress-message');

    if (progressBar) {
      progressBar.style.width = `${percent}%`;
    }

    if (progressMessage) {
      progressMessage.textContent = message;
    }
  }

  // Cancel generation
  cancelGeneration() {
    // TODO: Implement cancellation logic in service
    this.isGenerating = false;
    this.showProgress(false);
  }

  // Clear all mappings
  async clearMappings() {
    if (this.candidateMappings.length > 0) {
      if (!confirm('Are you sure you want to clear all mappings?')) {
        return;
      }
    }

    await this.mappingService.clearMappings();
    this.candidateMappings = [];
    this.currentMappingIndex = 0;
    this.updateMappingDisplay();
    this.updateStats();
  }

  // Update mapping display
  updateMappingDisplay() {
    const noMappingsDiv = document.getElementById('no-mappings-message');
    const mappingDetailsDiv = document.getElementById('mapping-details');
    const counter = document.getElementById('mapping-counter');

    if (this.candidateMappings.length === 0) {
      if (noMappingsDiv) noMappingsDiv.classList.remove('hidden');
      if (mappingDetailsDiv) mappingDetailsDiv.classList.add('hidden');
      if (counter) counter.textContent = 'No mappings';

      // Disable navigation and action buttons
      this.setButtonStates(false);
      return;
    }

    if (noMappingsDiv) noMappingsDiv.classList.add('hidden');
    if (mappingDetailsDiv) mappingDetailsDiv.classList.remove('hidden');

    const currentMapping = this.candidateMappings[this.currentMappingIndex];

    // Update mapping details
    const sourceEl = document.getElementById('mapping-source');
    const targetEl = document.getElementById('mapping-target');
    const typeEl = document.getElementById('mapping-type');
    const confidenceEl = document.getElementById('mapping-confidence');
    const statusEl = document.getElementById('mapping-status');
    const descriptionEl = document.getElementById('mapping-description');

    if (sourceEl) sourceEl.textContent = currentMapping.source.join(', ');
    if (targetEl) targetEl.textContent = currentMapping.target.join(', ');
    if (typeEl) typeEl.textContent = currentMapping.type;
    if (confidenceEl) confidenceEl.textContent = `${Math.round(currentMapping.confidence * 100)}%`;

    if (statusEl) {
      const statusColors = {
        pending: 'text-gray-600',
        accepted: 'text-green-600',
        rejected: 'text-red-600',
        flagged: 'text-amber-600'
      };
      statusEl.className = `text-sm font-medium ${statusColors[currentMapping.status]}`;
      statusEl.textContent = currentMapping.status.charAt(0).toUpperCase() + currentMapping.status.slice(1);
    }

    if (descriptionEl) descriptionEl.textContent = currentMapping.description || 'No description';

    // Update counter
    if (counter) {
      counter.textContent = `${this.currentMappingIndex + 1} of ${this.candidateMappings.length} mappings`;
    }

    // Enable buttons
    this.setButtonStates(true);

    // Update navigation buttons
    const prevBtn = document.getElementById('prev-mapping-btn');
    const nextBtn = document.getElementById('next-mapping-btn');

    if (prevBtn) {
      prevBtn.disabled = this.currentMappingIndex === 0;
      prevBtn.classList.toggle('opacity-50', this.currentMappingIndex === 0);
    }

    if (nextBtn) {
      nextBtn.disabled = this.currentMappingIndex === this.candidateMappings.length - 1;
      nextBtn.classList.toggle('opacity-50', this.currentMappingIndex === this.candidateMappings.length - 1);
    }
  }

  // Set button states
  setButtonStates(enabled) {
    const buttons = ['accept-mapping-btn', 'reject-mapping-btn', 'flag-mapping-btn'];

    buttons.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.disabled = !enabled;
        btn.classList.toggle('opacity-50', !enabled);
        btn.classList.toggle('cursor-not-allowed', !enabled);
      }
    });
  }

  // Navigate to previous mapping
  previousMapping() {
    if (this.currentMappingIndex > 0) {
      this.currentMappingIndex--;
      this.updateMappingDisplay();
    }
  }

  // Navigate to next mapping
  nextMapping() {
    if (this.currentMappingIndex < this.candidateMappings.length - 1) {
      this.currentMappingIndex++;
      this.updateMappingDisplay();
    }
  }

  // Accept current mapping
  acceptCurrentMapping() {
    if (!this.candidateMappings[this.currentMappingIndex]) return;

    const mapping = this.candidateMappings[this.currentMappingIndex];
    this.mappingService.acceptMapping(mapping.id);
    mapping.status = 'accepted';

    this.updateMappingDisplay();
    this.updateStats();
    this.updateAcceptedMappingsList();

    // Auto-advance to next if not at end
    if (this.currentMappingIndex < this.candidateMappings.length - 1) {
      setTimeout(() => this.nextMapping(), 300);
    }
  }

  // Reject current mapping
  rejectCurrentMapping() {
    if (!this.candidateMappings[this.currentMappingIndex]) return;

    const mapping = this.candidateMappings[this.currentMappingIndex];
    this.mappingService.rejectMapping(mapping.id);
    mapping.status = 'rejected';

    this.updateMappingDisplay();
    this.updateStats();
    this.updateAcceptedMappingsList();

    // Auto-advance to next if not at end
    if (this.currentMappingIndex < this.candidateMappings.length - 1) {
      setTimeout(() => this.nextMapping(), 300);
    }
  }

  // Flag current mapping
  flagCurrentMapping() {
    if (!this.candidateMappings[this.currentMappingIndex]) return;

    const mapping = this.candidateMappings[this.currentMappingIndex];
    this.mappingService.flagMapping(mapping.id);
    mapping.status = 'flagged';

    this.updateMappingDisplay();
    this.updateStats();

    // Auto-advance to next if not at end
    if (this.currentMappingIndex < this.candidateMappings.length - 1) {
      setTimeout(() => this.nextMapping(), 300);
    }
  }

  // Update statistics
  updateStats() {
    const statsEl = document.getElementById('mapping-stats');
    if (!statsEl) return;

    const accepted = this.candidateMappings.filter(m => m.status === 'accepted').length;
    const rejected = this.candidateMappings.filter(m => m.status === 'rejected').length;
    const flagged = this.candidateMappings.filter(m => m.status === 'flagged').length;
    const pending = this.candidateMappings.filter(m => m.status === 'pending').length;

    statsEl.innerHTML = `
      <span class="text-green-600">${accepted} accepted</span>,
      <span class="text-red-600">${rejected} rejected</span>,
      <span class="text-amber-600">${flagged} flagged</span>,
      <span class="text-gray-600">${pending} pending</span>
    `;

    // Enable/disable export and apply buttons
    const exportBtn = document.getElementById('export-mappings-btn');
    const applyBtn = document.getElementById('apply-to-transform-btn');

    if (exportBtn) {
      exportBtn.disabled = accepted === 0;
      exportBtn.classList.toggle('opacity-50', accepted === 0);
    }

    if (applyBtn) {
      applyBtn.disabled = accepted === 0;
      applyBtn.classList.toggle('opacity-50', accepted === 0);
    }
  }

  // Update accepted mappings list
  updateAcceptedMappingsList() {
    const container = document.getElementById('accepted-mappings-list');
    if (!container) return;

    // Get all mappings, not just accepted ones (to show flagged ones too)
    const visibleMappings = this.candidateMappings.filter(m =>
      m.status === 'accepted' || m.status === 'flagged'
    );

    if (visibleMappings.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">No mappings yet</p>';
      return;
    }

    container.innerHTML = visibleMappings.map((mapping, index) => {
      const statusColor = mapping.status === 'flagged' ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50';
      const statusIcon = mapping.status === 'flagged' ?
        '<svg class="w-4 h-4 text-yellow-600 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>' : '';

      const confidenceDisplay = mapping.confidenceLevel ?
        `<span class="text-xs px-2 py-1 rounded ${
          mapping.confidenceLevel === 'high' ? 'bg-green-100 text-green-700' :
          mapping.confidenceLevel === 'medium' ? 'bg-amber-100 text-amber-700' :
          'bg-red-100 text-red-700'
        }">${mapping.confidenceLevel.charAt(0).toUpperCase() + mapping.confidenceLevel.slice(1)}</span>` :
        `<span class="text-xs text-gray-500">${Math.round(mapping.confidence * 100)}%</span>`;

      return `
        <div class="${statusColor} rounded p-2 border">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <span class="font-mono text-sm">
                ${statusIcon}${mapping.displayName}
              </span>
              <span class="ml-2">${confidenceDisplay}</span>
              ${mapping.status === 'flagged' ? '<span class="text-xs text-yellow-600 ml-2">(Flagged)</span>' : ''}
            </div>
            <div class="flex space-x-2">
              ${mapping.status === 'flagged' ? `
                <button class="text-green-600 hover:text-green-700 text-sm" onclick="vocabularyMapper.unflagMapping('${mapping.id}')">
                  Accept
                </button>
              ` : ''}
              <button class="text-red-600 hover:text-red-700 text-sm" onclick="vocabularyMapper.removeMapping('${mapping.id}')">
                Remove
              </button>
            </div>
          </div>
          ${mapping.description ? `<div class="text-xs text-gray-600 mt-1">${mapping.description}</div>` : ''}
        </div>
      `;
    }).join('');

    // Update export and apply buttons
    const exportBtn = document.getElementById('export-mappings-btn');
    const applyBtn = document.getElementById('apply-to-transform-btn');
    const hasAccepted = this.candidateMappings.some(m => m.status === 'accepted');

    if (exportBtn) {
      exportBtn.disabled = !hasAccepted;
    }
    if (applyBtn) {
      applyBtn.disabled = !hasAccepted;
    }
  }

  // Remove a mapping
  removeMapping(mappingId) {
    const mappingIndex = this.candidateMappings.findIndex(m => m.id === mappingId);
    if (mappingIndex !== -1) {
      // Remove from the array completely
      this.candidateMappings.splice(mappingIndex, 1);
      this.mappingService.rejectMapping(mappingId);
      this.updateStats();
      this.updateAcceptedMappingsList();
    }
  }

  // Unflag a mapping (accept it)
  unflagMapping(mappingId) {
    const mapping = this.candidateMappings.find(m => m.id === mappingId);
    if (mapping && mapping.status === 'flagged') {
      mapping.status = 'accepted';
      this.mappingService.acceptMapping(mappingId);
      this.updateStats();
      this.updateAcceptedMappingsList();
    }
  }

  // Create manual mapping
  async createManualMapping() {
    if (this.selectedSourceProperties.size === 0 || this.selectedTargetProperties.size === 0) {
      alert('Please select at least one source and one target property.');
      return;
    }

    const description = document.getElementById('manual-mapping-description')?.value || '';

    const mapping = await this.mappingService.createManualMapping(
      Array.from(this.selectedSourceProperties),
      Array.from(this.selectedTargetProperties),
      description
    );

    this.candidateMappings.push(mapping);
    this.updateStats();
    this.updateAcceptedMappingsList();

    // Clear selections
    this.selectedSourceProperties.clear();
    this.selectedTargetProperties.clear();

    const sourceContainer = document.getElementById('source-properties-list');
    const targetContainer = document.getElementById('target-properties-list');

    if (sourceContainer) {
      sourceContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    }
    if (targetContainer) {
      targetContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    }

    this.updateSelectedProperties('source');
    this.updateSelectedProperties('target');

    // Clear description
    const descInput = document.getElementById('manual-mapping-description');
    if (descInput) descInput.value = '';

    alert('Manual mapping created successfully!');
  }

  // Export mappings to JSON
  exportMappings() {
    const acceptedMappings = this.mappingService.getAcceptedMappings();

    if (acceptedMappings.length === 0) {
      alert('No accepted mappings to export.');
      return;
    }

    const exportData = {
      timestamp: new Date().toISOString(),
      mappings: acceptedMappings,
      sourceSchema: this.sourceProcessor?.mainSchema || null,
      targetSchema: this.targetProcessor?.mainSchema || null
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mappings_${new Date().toISOString().replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Apply mappings to Data Transform
  applyToTransform() {
    const acceptedMappings = this.mappingService.getAcceptedMappings();

    if (acceptedMappings.length === 0) {
      alert('No accepted mappings to apply.');
      return;
    }

    // Format mappings for Data Transform
    const formattedMappings = acceptedMappings.map(m => ({
      id: m.id,
      name: m.displayName,
      source: m.source,
      target: m.target,
      description: m.description || `${m.type} mapping`
    }));

    // Store mappings for Data Transform to access
    this.storageManager.saveMappings(formattedMappings);

    // Dispatch event to notify Data Transform
    window.dispatchEvent(new CustomEvent('mappings-updated', {
      detail: { mappings: formattedMappings }
    }));

    alert(`Applied ${formattedMappings.length} mappings to Data Transform tab.`);
  }

  refresh() {
    this.render();
    this.setupEventListeners();
    this.loadSchemas();
    this.initializeMappingService();
  }

  // ========== Targeted Mapping Methods ==========

  setupPromptEditorListeners() {
    // Toggle prompt editor panel
    const toggleBtn = document.getElementById('toggle-prompt-editor');
    const panel = document.getElementById('prompt-editor-panel');
    const icon = document.getElementById('prompt-toggle-icon');

    if (toggleBtn && panel && icon) {
      toggleBtn.addEventListener('click', () => {
        panel.classList.toggle('hidden');
        icon.textContent = panel.classList.contains('hidden') ? '▶' : '▼';
      });
    }

    // Load existing custom prompt
    this.loadCustomPrompt();

    // Save prompt button
    const saveBtn = document.getElementById('save-prompt');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveCustomPrompt());
    }

    // Reset prompt button
    const resetBtn = document.getElementById('reset-prompt');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetPrompt());
    }

    // Test prompt button
    const testBtn = document.getElementById('test-prompt');
    if (testBtn) {
      testBtn.addEventListener('click', () => this.testCustomPrompt());
    }
  }

  async loadCustomPrompt() {
    const textarea = document.getElementById('custom-prompt');
    if (!textarea) return;

    try {
      const customPrompt = await this.storageManager.getCustomPrompt();
      if (customPrompt) {
        textarea.value = customPrompt;
        this.updatePromptStatus('Custom prompt loaded', 'success');
      }
    } catch (error) {
      console.error('Failed to load custom prompt:', error);
    }
  }

  async saveCustomPrompt() {
    const textarea = document.getElementById('custom-prompt');
    if (!textarea) return;

    const prompt = textarea.value.trim();

    try {
      if (prompt) {
        await this.storageManager.saveCustomPrompt(prompt);
        this.updatePromptStatus('Custom prompt saved successfully', 'success');
      } else {
        await this.storageManager.clearCustomPrompt();
        this.updatePromptStatus('Custom prompt cleared - using default', 'info');
      }
    } catch (error) {
      console.error('Failed to save custom prompt:', error);
      this.updatePromptStatus('Failed to save prompt', 'error');
    }
  }

  async resetPrompt() {
    const textarea = document.getElementById('custom-prompt');
    if (!textarea) return;

    // Get the default prompt from the service
    const defaultPrompt = this.mappingService.getDefaultPrompt();
    textarea.value = defaultPrompt;

    await this.storageManager.clearCustomPrompt();
    this.updatePromptStatus('Reset to default prompt', 'info');
  }

  async testCustomPrompt() {
    if (!this.targetedMappingState.targetProperty || !this.targetedMappingState.candidates) {
      this.updatePromptStatus('Please run "Find Related Concepts" first', 'warning');
      return;
    }

    const textarea = document.getElementById('custom-prompt');
    const customPrompt = textarea?.value.trim();

    if (!customPrompt) {
      this.updatePromptStatus('Enter a custom prompt to test', 'warning');
      return;
    }

    this.showTargetedProgress(true, 'Testing custom prompt...');

    try {
      // Re-run analysis with the custom prompt
      const analysis = await this.mappingService.analyzeMappingWithReasoning(
        this.targetedMappingState.targetProperty,
        this.targetedMappingState.candidates,
        { skipCustomPrompt: true, customPrompt }
      );

      this.targetedMappingState.analysis = analysis;
      this.displayAnalysis(analysis);

      this.updatePromptStatus('Custom prompt tested - review results below', 'success');
      this.showTargetedProgress(false);
    } catch (error) {
      console.error('Failed to test custom prompt:', error);
      this.updatePromptStatus('Failed to test prompt: ' + error.message, 'error');
      this.showTargetedProgress(false);
    }
  }

  updatePromptStatus(message, type = 'info') {
    const statusEl = document.getElementById('prompt-status');
    if (!statusEl) return;

    const colors = {
      success: 'text-green-600',
      error: 'text-red-600',
      warning: 'text-yellow-600',
      info: 'text-gray-600'
    };

    statusEl.className = `text-sm mt-2 ${colors[type]}`;
    statusEl.textContent = message;

    // Clear message after 5 seconds
    setTimeout(() => {
      if (statusEl.textContent === message) {
        statusEl.textContent = '';
      }
    }, 5000);
  }

  setupTargetedMappingListeners() {
    // K value slider
    const kSlider = document.getElementById('k-value-slider');
    const kDisplay = document.getElementById('k-value-display');
    if (kSlider && kDisplay) {
      kSlider.addEventListener('input', (e) => {
        kDisplay.textContent = e.target.value;
      });
    }

    // Find related button
    const findBtn = document.getElementById('find-related-btn');
    if (findBtn) {
      findBtn.addEventListener('click', () => this.findRelatedConcepts());
    }

    // Toggle analysis view
    const toggleBtn = document.getElementById('toggle-analysis');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleAnalysisView());
    }

    // Chat interface
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-chat');
    if (chatInput && sendBtn) {
      sendBtn.addEventListener('click', () => this.sendChatMessage());
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.sendChatMessage();
      });
    }

    // Accept/Apply buttons
    const acceptBtn = document.getElementById('accept-targeted');
    const applyManualBtn = document.getElementById('apply-manual');
    if (acceptBtn) {
      acceptBtn.addEventListener('click', () => this.acceptTargetedMapping());
    }
    if (applyManualBtn) {
      applyManualBtn.addEventListener('click', () => this.applyManualTargetedMapping());
    }
  }

  populateTargetSelector() {
    const selector = document.getElementById('target-concept-select');
    if (!selector || !this.targetProperties.length) return;

    selector.innerHTML = `
      <option value="">Select target property...</option>
      ${this.targetProperties.map(prop => `
        <option value="${prop.name}" data-type="${prop.type}">
          ${prop.name} (${prop.type})
        </option>
      `).join('')}
    `;

    // Enable find button when selection is made
    selector.addEventListener('change', (e) => {
      const findBtn = document.getElementById('find-related-btn');
      if (findBtn) {
        findBtn.disabled = !e.target.value;
        findBtn.classList.toggle('opacity-50', !e.target.value);
        findBtn.classList.toggle('cursor-not-allowed', !e.target.value);
      }
    });
  }

  async findRelatedConcepts() {
    const selector = document.getElementById('target-concept-select');
    const kSlider = document.getElementById('k-value-slider');

    if (!selector || !selector.value) return;

    const targetProp = this.targetProperties.find(p => p.name === selector.value);
    if (!targetProp) return;

    const k = parseInt(kSlider?.value || '10');

    // Show progress
    this.showTargetedProgress(true, 'Finding related concepts...');

    try {
      // Find related concepts
      const result = await this.mappingService.findRelatedConcepts(
        targetProp,
        this.sourceProcessor.resolvedSchema,
        k,
        {
          dimension: 768,
          onProgress: (progress) => {
            this.updateTargetedProgress(progress.percent || 0, progress.message || 'Processing...');
          }
        }
      );

      this.targetedMappingState.targetProperty = targetProp;
      this.targetedMappingState.candidates = result.candidates;

      // Display candidates
      this.displayRelatedConcepts(result.candidates);

      // Analyze with LLM
      this.showTargetedProgress(true, 'Analyzing mapping options...');
      const analysis = await this.mappingService.analyzeMappingWithReasoning(
        targetProp,
        result.candidates
      );

      this.targetedMappingState.analysis = analysis;
      this.displayAnalysis(analysis);

      // Show results
      document.getElementById('targeted-results')?.classList.remove('hidden');
      this.showTargetedProgress(false);

    } catch (error) {
      console.error('Failed to find related concepts:', error);
      alert(`Failed to find related concepts: ${error.message}`);
      this.showTargetedProgress(false);
    }
  }

  displayRelatedConcepts(candidates) {
    const container = document.getElementById('related-concepts-list');
    if (!container) return;

    container.innerHTML = candidates.map((c, i) => `
      <div class="flex items-start space-x-3 mb-3 p-2 hover:bg-gray-50 rounded">
        <input type="checkbox" id="candidate-${i}" value="${c.property.name}"
               class="mt-1 candidate-checkbox" data-index="${i}">
        <label for="candidate-${i}" class="flex-1 cursor-pointer">
          <div class="flex items-center justify-between mb-1">
            <span class="font-mono text-sm font-medium">${c.property.name}</span>
            <span class="text-sm ${c.score >= 80 ? 'text-green-600' : c.score >= 60 ? 'text-amber-600' : 'text-gray-600'}">
              ${c.score}%
            </span>
          </div>
          <div class="text-xs text-gray-600">
            Type: ${c.property.type}
            ${c.property.description ? `| ${c.property.description}` : ''}
          </div>
          <div class="mt-1 bg-gray-200 rounded-full h-1.5">
            <div class="bg-amber-600 h-1.5 rounded-full" style="width: ${c.score}%"></div>
          </div>
        </label>
      </div>
    `).join('');

    // Track manual selections
    container.querySelectorAll('.candidate-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.targetedMappingState.selectedCandidates.add(e.target.value);
        } else {
          this.targetedMappingState.selectedCandidates.delete(e.target.value);
        }
        this.updateManualSelectionList();
      });
    });
  }

  displayAnalysis(analysis) {
    const summaryEl = document.getElementById('analysis-summary');
    const fullEl = document.getElementById('analysis-full');

    if (summaryEl) {
      // Use parsed source properties if available, otherwise fall back to top candidates
      const recommendedProps = analysis.analysis.recommendation.sourceProperties &&
                              analysis.analysis.recommendation.sourceProperties.length > 0
        ? analysis.analysis.recommendation.sourceProperties
        : analysis.candidates.slice(0, 3).map(c => c.property.name);

      summaryEl.innerHTML = `
        <div class="grid grid-cols-3 gap-4">
          <div>
            <span class="text-sm text-gray-600">Recommended Type:</span>
            <div class="font-medium">${analysis.analysis.recommendation.type || 'Not determined'}</div>
          </div>
          <div>
            <span class="text-sm text-gray-600">Confidence:</span>
            <div class="font-medium ${
              analysis.analysis.recommendation.confidence === 'High' ? 'text-green-600' :
              analysis.analysis.recommendation.confidence === 'Medium' ? 'text-amber-600' :
              'text-red-600'
            }">
              ${analysis.analysis.recommendation.confidence || 'Unknown'}
            </div>
          </div>
          <div>
            <span class="text-sm text-gray-600">Recommended Properties:</span>
            <div class="font-mono text-sm">
              ${recommendedProps.join(', ')}
            </div>
          </div>
        </div>
      `;

      // Pre-populate manual selection with AI recommendations
      this.prepopulateManualSelection(recommendedProps, analysis.analysis.recommendation.type);
    }

    if (fullEl) {
      fullEl.innerHTML = `
        <div class="space-y-4">
          <div>
            <h5 class="font-medium mb-2">Analysis</h5>
            <p class="text-sm text-gray-700 whitespace-pre-wrap">${analysis.analysis.analysis || analysis.rawResponse}</p>
          </div>
          <div>
            <h5 class="font-medium mb-2">Recommendation</h5>
            <p class="text-sm text-gray-700 whitespace-pre-wrap">${analysis.analysis.recommendation.rationale}</p>
          </div>
          ${analysis.analysis.transformationNotes ? `
            <div>
              <h5 class="font-medium mb-2">Transformation Notes</h5>
              <p class="text-sm text-gray-700 whitespace-pre-wrap">${analysis.analysis.transformationNotes}</p>
            </div>
          ` : ''}
        </div>
      `;
    }
  }

  toggleAnalysisView() {
    const fullEl = document.getElementById('analysis-full');
    const toggleBtn = document.getElementById('toggle-analysis');

    if (fullEl && toggleBtn) {
      fullEl.classList.toggle('hidden');
      toggleBtn.textContent = fullEl.classList.contains('hidden') ?
        'Show Full Analysis' : 'Hide Full Analysis';
    }
  }

  async sendChatMessage() {
    const input = document.getElementById('chat-input');
    const messagesEl = document.getElementById('chat-messages');

    if (!input || !input.value.trim()) return;

    const userMessage = input.value.trim();
    input.value = '';

    // Add user message to chat
    if (messagesEl) {
      messagesEl.innerHTML += `
        <div class="mb-3">
          <div class="text-xs text-gray-500 mb-1">You</div>
          <div class="bg-white rounded-lg p-3 shadow-sm">
            ${userMessage}
          </div>
        </div>
      `;
    }

    try {
      // Send to service
      const response = await this.mappingService.refineMappingWithChat({
        targetProperty: this.targetedMappingState.targetProperty,
        currentRecommendation: this.targetedMappingState.analysis?.analysis.recommendation.type || 'unknown',
        candidates: this.targetedMappingState.candidates,
        previousAnalysis: this.targetedMappingState.analysis?.rawResponse || ''
      }, userMessage);

      // Add assistant response to chat
      if (messagesEl) {
        messagesEl.innerHTML += `
          <div class="mb-3">
            <div class="text-xs text-gray-500 mb-1">AI Assistant</div>
            <div class="bg-amber-50 rounded-lg p-3 shadow-sm">
              ${response.assistantResponse}
            </div>
          </div>
        `;
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }

      this.targetedMappingState.chatHistory.push({
        user: userMessage,
        assistant: response.assistantResponse
      });

    } catch (error) {
      console.error('Failed to send chat message:', error);
      if (messagesEl) {
        messagesEl.innerHTML += `
          <div class="mb-3 text-red-600 text-sm">
            Failed to get response: ${error.message}
          </div>
        `;
      }
    }
  }

  updateManualSelectionList() {
    const listEl = document.getElementById('manual-selection-list');
    if (!listEl) return;

    const selected = Array.from(this.targetedMappingState.selectedCandidates);
    if (selected.length === 0) {
      listEl.innerHTML = '<p class="text-sm text-gray-500">No properties selected. Check boxes above to select.</p>';
    } else {
      listEl.innerHTML = `
        <div class="text-sm">
          <span class="font-medium">Selected properties:</span>
          <span class="font-mono ml-2">${selected.join(', ')}</span>
        </div>
      `;
    }
  }

  prepopulateManualSelection(recommendedProps, mappingType) {
    // Clear previous selections
    this.targetedMappingState.selectedCandidates.clear();

    // Check the recommended properties in the checkbox list
    const checkboxes = document.querySelectorAll('.candidate-checkbox');
    checkboxes.forEach(cb => {
      const propName = cb.value;
      if (recommendedProps.includes(propName)) {
        cb.checked = true;
        this.targetedMappingState.selectedCandidates.add(propName);
      } else {
        cb.checked = false;
      }
    });

    // Update the manual selection list display
    this.updateManualSelectionList();

    // Pre-select the mapping type
    const typeEl = document.getElementById('manual-mapping-type');
    if (typeEl && mappingType) {
      typeEl.value = mappingType;
    }

    // Set default confidence based on AI confidence
    const aiConfidence = this.targetedMappingState.analysis?.analysis.recommendation.confidence;
    const manualConfidenceEl = document.getElementById('manual-confidence');
    if (manualConfidenceEl && aiConfidence) {
      if (aiConfidence === 'High') {
        manualConfidenceEl.value = 'high';
      } else if (aiConfidence === 'Medium') {
        manualConfidenceEl.value = 'medium';
      } else {
        manualConfidenceEl.value = 'low';
      }
    }
  }

  acceptTargetedMapping() {
    if (!this.targetedMappingState.analysis) return;

    const recommendation = this.targetedMappingState.analysis.analysis.recommendation;
    const targetProp = this.targetedMappingState.targetProperty;
    const confidenceEl = document.getElementById('ai-confidence');
    const actionEl = document.getElementById('ai-action');

    // Use the parsed source properties from the recommendation
    let sourceProps = [];
    if (recommendation.sourceProperties && recommendation.sourceProperties.length > 0) {
      sourceProps = recommendation.sourceProperties;
    } else {
      // Fallback: determine source properties based on recommendation type
      if (recommendation.type === 'one-to-one') {
        sourceProps = [this.targetedMappingState.candidates[0]?.property.name];
      } else if (recommendation.type === 'many-to-one') {
        // Take top candidates that make sense for the mapping
        sourceProps = this.targetedMappingState.candidates
          .slice(0, 3)
          .map(c => c.property.name);
      }
    }

    // Get user-selected confidence
    const confidenceValue = confidenceEl?.value || 'medium';
    const confidence = confidenceValue === 'high' ? 0.9 :
                      confidenceValue === 'medium' ? 0.7 : 0.5;

    // Get user-selected action
    const action = actionEl?.value || 'accept';
    const status = action === 'flag' ? 'flagged' :
                  action === 'reject' ? 'rejected' : 'accepted';

    // Create and add mapping
    const mapping = {
      id: `targeted-${Date.now()}`,
      source: sourceProps,
      target: recommendation.targetProperties && recommendation.targetProperties.length > 0
        ? recommendation.targetProperties
        : [targetProp.name],
      type: recommendation.type || 'unknown',
      confidence: confidence,
      confidenceLevel: confidenceValue,
      description: recommendation.rationale || 'AI-recommended mapping',
      status: status,
      displayName: `${sourceProps.join(', ')} → ${targetProp.name}`
    };

    if (action === 'reject') {
      // For rejection, we may want to track it but not add to accepted mappings
      alert('Mapping rejected.');
    } else {
      this.candidateMappings.push(mapping);
      this.updateStats();
      this.updateAcceptedMappingsList();

      const message = action === 'flag'
        ? 'Mapping flagged for review and added to mappings list.'
        : 'Mapping accepted and added to accepted mappings list.';
      alert(message);
    }

    this.clearTargetedMapping();
  }

  applyManualTargetedMapping() {
    const selected = Array.from(this.targetedMappingState.selectedCandidates);
    if (selected.length === 0) {
      alert('Please select at least one source property.');
      return;
    }

    const targetProp = this.targetedMappingState.targetProperty;
    const typeEl = document.getElementById('manual-mapping-type');
    const confidenceEl = document.getElementById('manual-confidence');
    const descEl = document.getElementById('manual-description');

    // Get user-selected confidence
    const confidenceValue = confidenceEl?.value || 'medium';
    const confidence = confidenceValue === 'high' ? 0.9 :
                      confidenceValue === 'medium' ? 0.7 : 0.5;

    const mapping = {
      id: `manual-targeted-${Date.now()}`,
      source: selected,
      target: [targetProp.name],
      type: typeEl?.value || 'one-to-one',
      confidence: confidence,
      confidenceLevel: confidenceValue,
      description: descEl?.value || 'Manual mapping',
      status: 'accepted',
      displayName: `${selected.join(', ')} → ${targetProp.name}`
    };

    this.candidateMappings.push(mapping);
    this.updateStats();
    this.updateAcceptedMappingsList();

    alert('Manual mapping created and added to accepted mappings list.');
    this.clearTargetedMapping();
  }

  clearTargetedMapping() {
    // Clear state
    this.targetedMappingState = {
      targetProperty: null,
      candidates: [],
      analysis: null,
      chatHistory: [],
      selectedCandidates: new Set()
    };

    // Hide results
    document.getElementById('targeted-results')?.classList.add('hidden');

    // Clear selections
    document.getElementById('target-concept-select').value = '';
    document.getElementById('chat-messages').innerHTML = '';
  }

  showTargetedProgress(show, message = '') {
    const progressDiv = document.getElementById('targeted-progress');
    if (progressDiv) {
      progressDiv.classList.toggle('hidden', !show);
    }

    if (message) {
      const msgEl = document.getElementById('targeted-progress-message');
      if (msgEl) msgEl.textContent = message;
    }
  }

  updateTargetedProgress(percent, message) {
    const bar = document.getElementById('targeted-progress-bar');
    const msgEl = document.getElementById('targeted-progress-message');

    if (bar) bar.style.width = `${percent}%`;
    if (msgEl) msgEl.textContent = message;
  }
}