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

          <!-- Mapping Progress -->
          <div class="border rounded-lg p-4 mb-4">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-semibold">Mapping Progress</h3>
              <div class="flex items-center space-x-2">
                <button id="generate-mappings-btn" class="btn-primary">
                  <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                  Generate All
                </button>
                <button id="clear-mappings-btn" class="btn-secondary">Clear All</button>
              </div>
            </div>

            <!-- Visual Progress Bar -->
            <div id="mapping-progress-bar" class="mb-3">
              <div class="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span id="mapping-stats"></span>
                <span id="mapping-percentage">0% complete</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-6 overflow-hidden flex">
                <div id="progress-accepted" class="bg-green-500 h-6 transition-all duration-300" style="width: 0%" title="Accepted"></div>
                <div id="progress-flagged" class="bg-yellow-500 h-6 transition-all duration-300" style="width: 0%" title="Flagged"></div>
                <div id="progress-rejected" class="bg-red-500 h-6 transition-all duration-300" style="width: 0%" title="Rejected"></div>
                <div id="progress-pending" class="bg-gray-400 h-6 transition-all duration-300" style="width: 100%" title="Pending"></div>
              </div>
              <div class="flex items-center justify-between mt-2">
                <div class="flex space-x-4 text-xs">
                  <span class="flex items-center"><span class="w-3 h-3 bg-green-500 rounded-full mr-1"></span>Accepted</span>
                  <span class="flex items-center"><span class="w-3 h-3 bg-yellow-500 rounded-full mr-1"></span>Flagged</span>
                  <span class="flex items-center"><span class="w-3 h-3 bg-red-500 rounded-full mr-1"></span>Rejected</span>
                  <span class="flex items-center"><span class="w-3 h-3 bg-gray-400 rounded-full mr-1"></span>Pending</span>
                </div>
              </div>
            </div>

            <!-- Generation Progress (hidden by default) -->
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

          <!-- AI Mapping Assistant -->
          <div class="border rounded-lg p-4 mb-4">
            <h3 class="font-semibold mb-4">AI Mapping Assistant</h3>

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
                  <input id="k-value-slider" type="range" min="1" max="50" value="20" class="flex-1">
                  <span id="k-value-display" class="w-12 text-center font-medium">20</span>
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
                <h4 class="font-medium mb-2">AI Conversation</h4>
                <div id="chat-container" class="border rounded-lg bg-white">
                  <div id="chat-messages" class="p-4 h-64 overflow-auto bg-gradient-to-b from-gray-50 to-white space-y-3">
                    <div class="text-center text-gray-500 text-sm py-8">
                      <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z"></path>
                      </svg>
                      <p>Start by finding related concepts above</p>
                      <p class="text-xs mt-1">Then continue the conversation here to refine the mapping</p>
                    </div>
                  </div>
                  <div class="border-t bg-gray-50 p-3">
                    <div class="flex space-x-2">
                      <input id="chat-input" type="text" placeholder="Ask for clarification or provide additional context..." class="input-field flex-1 bg-white">
                      <button id="send-chat" class="btn-primary" disabled>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Mapping Actions -->
              <div class="mb-4">
                <h4 class="font-medium mb-2">Mapping Decision</h4>
                <div class="border rounded-lg p-4 bg-gray-50">
                  <!-- Current Selection Summary -->
                  <div id="mapping-summary" class="mb-4 p-3 bg-white rounded-lg">
                    <div class="text-sm text-gray-600 mb-2">Selected Mapping:</div>
                    <div id="selected-mapping-display" class="font-mono text-sm">No mapping selected yet</div>
                  </div>

                  <!-- Confidence and Comment -->
                  <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label class="block text-sm font-medium mb-1">Confidence Level</label>
                      <select id="mapping-confidence-select" class="input-field">
                        <option value="low">Low</option>
                        <option value="medium" selected>Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-1">Comment (Optional)</label>
                      <input id="mapping-comment" type="text" placeholder="Add notes or reasoning..." class="input-field">
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="grid grid-cols-2 gap-2">
                    <button id="accept-mapping" class="btn-primary" disabled>
                      <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Accept
                    </button>
                    <button id="modify-mapping" class="btn-secondary" disabled>
                      <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                      Modify
                    </button>
                    <button id="flag-mapping" class="btn-secondary" disabled>
                      <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path>
                      </svg>
                      Flag for Review
                    </button>
                    <button id="reject-mapping" class="btn-danger" disabled>
                      <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                      Reject
                    </button>
                    <button id="skip-mapping" class="btn-secondary col-span-2" disabled>
                      <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Skip AI - Map Manually
                    </button>
                  </div>

                  <!-- Manual Mapping (Initially Hidden) -->
                  <div id="manual-mapping-panel" class="hidden mt-4 pt-4 border-t">
                    <h5 class="text-sm font-medium mb-3">Modify Mapping Selection</h5>

                    <!-- Search input -->
                    <div class="mb-3">
                      <input
                        id="manual-mapping-search"
                        type="text"
                        placeholder="Search source properties..."
                        class="input-field w-full"
                      >
                      <div id="manual-mapping-count" class="text-xs text-gray-600 mt-1"></div>
                    </div>

                    <!-- Checkbox sections -->
                    <div class="border rounded-lg max-h-96 overflow-auto bg-gray-50">
                      <!-- AI Recommended Section -->
                      <div id="manual-recommended-section" class="border-b bg-green-50">
                        <div class="sticky top-0 bg-green-100 px-3 py-2 font-medium text-sm text-green-800 border-b border-green-200">
                          <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          AI Recommended
                        </div>
                        <div id="manual-recommended-checkboxes" class="p-3 space-y-2">
                          <!-- Populated with recommended checkboxes -->
                        </div>
                      </div>

                      <!-- All Other Properties Section -->
                      <div id="manual-other-section">
                        <div class="sticky top-0 bg-gray-100 px-3 py-2 font-medium text-sm text-gray-700 border-b">
                          All Source Properties
                        </div>
                        <div id="manual-other-checkboxes" class="p-3 space-y-2">
                          <!-- Populated with other checkboxes -->
                        </div>
                      </div>
                    </div>

                    <button id="apply-manual-mapping" class="btn-primary w-full mt-3">Apply Manual Selection</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Manual Mapping (Standalone) -->
          <div class="border rounded-lg p-4 mb-4">
            <h3 class="font-semibold mb-4 flex items-center justify-between">
              <span>Manual Mapping</span>
              <span class="text-sm text-gray-600">Create mappings without AI assistance</span>
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Source Properties -->
              <div>
                <label class="block text-sm font-medium mb-2">Source Properties</label>
                <input id="manual-source-search" type="text" placeholder="Search source properties..." class="input-field mb-2">
                <div id="manual-source-list" class="border rounded-lg h-48 overflow-auto p-2 bg-gray-50">
                  <!-- Will be populated with checkboxes -->
                  <div class="text-gray-500 text-sm text-center py-8">No source schema loaded</div>
                </div>
                <div id="manual-source-selected" class="text-sm text-gray-600 mt-1">0 selected</div>
              </div>

              <!-- Target Properties -->
              <div>
                <label class="block text-sm font-medium mb-2">Target Properties</label>
                <input id="manual-target-search" type="text" placeholder="Search target properties..." class="input-field mb-2">
                <div id="manual-target-list" class="border rounded-lg h-48 overflow-auto p-2 bg-gray-50">
                  <!-- Will be populated with checkboxes -->
                  <div class="text-gray-500 text-sm text-center py-8">No target schema loaded</div>
                </div>
                <div id="manual-target-selected" class="text-sm text-gray-600 mt-1">0 selected</div>
              </div>
            </div>

            <!-- Description and Create Button -->
            <div class="mt-4">
              <label class="block text-sm font-medium mb-2">Mapping Description (Optional)</label>
              <input id="manual-mapping-description" type="text" placeholder="Add notes about this mapping..." class="input-field mb-3">

              <button id="create-manual-mapping-btn" class="btn-primary w-full" disabled>
                <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Create Manual Mapping
              </button>
            </div>
          </div>

          <!-- Mappings Summary -->
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

    // New mapping action buttons
    const acceptBtn = document.getElementById('accept-mapping');
    const modifyBtn = document.getElementById('modify-mapping');
    const flagBtn = document.getElementById('flag-mapping');
    const rejectBtn = document.getElementById('reject-mapping');
    const skipBtn = document.getElementById('skip-mapping');
    const applyManualBtn = document.getElementById('apply-manual-mapping');

    if (acceptBtn) {
      acceptBtn.addEventListener('click', () => this.acceptTargetedMappingWithComment());
    }
    if (modifyBtn) {
      modifyBtn.addEventListener('click', () => this.modifyTargetedMapping());
    }
    if (flagBtn) {
      flagBtn.addEventListener('click', () => this.flagTargetedMappingWithComment());
    }
    if (rejectBtn) {
      rejectBtn.addEventListener('click', () => this.rejectTargetedMappingWithComment());
    }
    if (skipBtn) {
      skipBtn.addEventListener('click', () => this.skipToManualMapping());
    }
    if (applyManualBtn) {
      applyManualBtn.addEventListener('click', () => this.applyManualTargetedMapping());
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

    // Manual Mapping Section
    this.setupManualMappingListeners();

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

      // Extract properties for the mapping functionality
      this.sourceProperties = this.extractPropertiesFromSchema(
        this.sourceProcessor.resolvedSchema
      );

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

      // Extract properties for the mapping functionality
      this.targetProperties = this.extractPropertiesFromSchema(
        this.targetProcessor.resolvedSchema
      );

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

      // Update stats to show proper pending count
      this.updateStats();
      // Populate target selector for targeted mapping
      this.populateTargetSelector();
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

    // Update stats to reflect the current target properties count
    this.updateStats();

    // Update manual mapping lists
    this.populateManualMappingLists();
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
    if (progress.phase === 'cached') {
      this.updateProgress(50, 'Using cached embeddings - no API calls needed!');
      setTimeout(() => {
        this.updateProgress(100, 'Cache loaded successfully');
      }, 500);
    } else if (progress.phase === 'source') {
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
    if (this.candidateMappings.length > 0 || this.mappingService.getCacheInfo().source || this.mappingService.getCacheInfo().target) {
      if (!confirm('Are you sure you want to clear all mappings and the vector cache? This will require regenerating embeddings next time.')) {
        return;
      }
    }

    // Clear mappings
    await this.mappingService.clearMappings();
    this.candidateMappings = [];
    this.currentMappingIndex = 0;

    // Clear vector cache
    await this.mappingService.clearVectorCache();

    // Update UI
    this.updateMappingDisplay();
    this.updateStats();
    this.updateProgressBar();

    console.log('Mappings and vector cache cleared');
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
  updateProgressBar() {
    const total = this.targetProperties.length;
    if (total === 0) return;

    const accepted = this.candidateMappings.filter(m => m.status === 'accepted').length;
    const flagged = this.candidateMappings.filter(m => m.status === 'flagged').length;
    const rejected = this.candidateMappings.filter(m => m.status === 'rejected').length;
    const pending = total - accepted - flagged - rejected;

    // Calculate percentages
    const acceptedPct = (accepted / total) * 100;
    const flaggedPct = (flagged / total) * 100;
    const rejectedPct = (rejected / total) * 100;
    const pendingPct = (pending / total) * 100;

    // Update progress bars
    const acceptedBar = document.getElementById('progress-accepted');
    const flaggedBar = document.getElementById('progress-flagged');
    const rejectedBar = document.getElementById('progress-rejected');
    const pendingBar = document.getElementById('progress-pending');

    if (acceptedBar) acceptedBar.style.width = `${acceptedPct}%`;
    if (flaggedBar) flaggedBar.style.width = `${flaggedPct}%`;
    if (rejectedBar) rejectedBar.style.width = `${rejectedPct}%`;
    if (pendingBar) pendingBar.style.width = `${pendingPct}%`;

    // Update percentage text
    const percentageEl = document.getElementById('mapping-percentage');
    if (percentageEl) {
      const completePct = ((accepted + flagged + rejected) / total * 100).toFixed(1);
      percentageEl.textContent = `${completePct}% complete`;
    }
  }

  updateStats() {
    const statsEl = document.getElementById('mapping-stats');
    if (!statsEl) return;

    let accepted, rejected, flagged, pending;

    // If no mappings have been generated yet, show total target properties as pending
    if (this.candidateMappings.length === 0) {
      const totalTargetProperties = this.targetProperties.length;
      accepted = 0;
      rejected = 0;
      flagged = 0;
      pending = totalTargetProperties;

      statsEl.innerHTML = `
        <span class="text-green-600">0 accepted</span>,
        <span class="text-red-600">0 rejected</span>,
        <span class="text-amber-600">0 flagged</span>,
        <span class="text-gray-600">${totalTargetProperties} pending</span>
      `;
    } else {
      accepted = this.candidateMappings.filter(m => m.status === 'accepted').length;
      rejected = this.candidateMappings.filter(m => m.status === 'rejected').length;
      flagged = this.candidateMappings.filter(m => m.status === 'flagged').length;
      pending = this.candidateMappings.filter(m => m.status === 'pending').length;

      statsEl.innerHTML = `
        <span class="text-green-600">${accepted} accepted</span>,
        <span class="text-red-600">${rejected} rejected</span>,
        <span class="text-amber-600">${flagged} flagged</span>,
        <span class="text-gray-600">${pending} pending</span>
      `;
    }

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

        // Load prompt when panel is shown for the first time
        if (!panel.classList.contains('hidden')) {
          this.loadCustomPrompt();
        }
      });
    }

    // Load existing custom prompt initially
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
      } else {
        // Load default prompt if no custom prompt exists
        if (this.mappingService && this.mappingService.getDefaultPrompt) {
          const defaultPrompt = this.mappingService.getDefaultPrompt();
          textarea.value = defaultPrompt;
          this.updatePromptStatus('Using default prompt', 'info');
        }
      }
    } catch (error) {
      console.error('Failed to load custom prompt:', error);
      // Load default prompt on error
      if (this.mappingService && this.mappingService.getDefaultPrompt) {
        const defaultPrompt = this.mappingService.getDefaultPrompt();
        textarea.value = defaultPrompt;
        this.updatePromptStatus('Using default prompt', 'info');
      }
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

    // Target concept selector - clear UI when changed
    const targetSelector = document.getElementById('target-concept-select');
    if (targetSelector) {
      targetSelector.addEventListener('change', () => {
        this.clearTargetedMappingUI();
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

  clearTargetedMappingUI() {
    // Hide results section
    document.getElementById('targeted-results')?.classList.add('hidden');

    // Clear chat messages
    const chatContainer = document.getElementById('chat-messages');
    if (chatContainer) {
      chatContainer.innerHTML = `
        <div class="text-center text-gray-500 text-sm py-8">
          <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z"></path>
          </svg>
          <p>Start by finding related concepts above</p>
          <p class="text-xs mt-1">Then continue the conversation here to refine the mapping</p>
        </div>
      `;
    }

    // Clear analysis display
    const analysisPanel = document.getElementById('analysis-panel');
    if (analysisPanel) {
      const summaryEl = document.getElementById('analysis-summary');
      const fullEl = document.getElementById('analysis-full');
      if (summaryEl) summaryEl.innerHTML = '';
      if (fullEl) fullEl.innerHTML = '';
    }

    // Clear related concepts list
    const conceptsList = document.getElementById('related-concepts-list');
    if (conceptsList) {
      conceptsList.innerHTML = '';
    }

    // Reset state
    this.targetedMappingState = {
      targetProperty: null,
      candidates: [],
      analysis: null,
      chatHistory: [],
      selectedCandidates: new Set()
    };

    // Disable action buttons
    this.disableActionButtons();

    // Disable chat interface
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-chat');
    if (chatInput) chatInput.disabled = true;
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }

    // Clear mapping summary
    const summaryEl = document.getElementById('selected-mapping-display');
    if (summaryEl) {
      summaryEl.innerHTML = 'No mapping selected yet';
    }

    // Reset progress bar
    const progressBar = document.getElementById('targeted-progress-bar');
    if (progressBar) {
      progressBar.style.width = '0%';
    }
  }

  async findRelatedConcepts() {
    const selector = document.getElementById('target-concept-select');
    const kSlider = document.getElementById('k-value-slider');

    if (!selector || !selector.value) return;

    const targetProp = this.targetProperties.find(p => p.name === selector.value);
    if (!targetProp) return;

    const k = parseInt(kSlider?.value || '20');

    // Reset progress bar and show
    this.updateTargetedProgress(0, 'Initializing search...');
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
            // Ensure we have a valid percent value
            const percent = progress.percent || 50;
            this.updateTargetedProgress(percent, progress.message || 'Processing...');
          }
        }
      );

      this.targetedMappingState.targetProperty = targetProp;
      this.targetedMappingState.candidates = result.candidates;

      // Display candidates
      this.displayRelatedConcepts(result.candidates);

      // Update progress for next phase
      this.updateTargetedProgress(60, 'Found candidates, analyzing with AI...');

      // Analyze with LLM
      const analysis = await this.mappingService.analyzeMappingWithReasoning(
        targetProp,
        result.candidates
      );

      this.targetedMappingState.analysis = analysis;
      this.displayAnalysis(analysis);

      // Complete progress
      this.updateTargetedProgress(100, 'Analysis complete!');

      // Show results and enable action buttons
      document.getElementById('targeted-results')?.classList.remove('hidden');
      this.enableActionButtons();
      this.updateMappingSummary();

      // Hide progress after a short delay
      setTimeout(() => {
        this.showTargetedProgress(false);
      }, 1000);

      // Enable chat interface
      const chatInput = document.getElementById('chat-input');
      const sendBtn = document.getElementById('send-chat');
      if (chatInput) chatInput.disabled = false;
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      }

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

    // Remove initial placeholder if it exists
    const placeholder = messagesEl?.querySelector('.text-center.text-gray-500');
    if (placeholder) placeholder.remove();

    // Add user message to chat with bubble styling
    if (messagesEl) {
      messagesEl.innerHTML += `
        <div class="flex justify-end mb-3">
          <div class="max-w-xs lg:max-w-md">
            <div class="text-xs text-gray-500 mb-1 text-right">You</div>
            <div class="bg-amber-100 rounded-lg p-3 shadow-sm">
              ${userMessage}
            </div>
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

      // Add assistant response to chat with bubble styling
      if (messagesEl) {
        messagesEl.innerHTML += `
          <div class="flex justify-start mb-3">
            <div class="max-w-xs lg:max-w-md">
              <div class="text-xs text-gray-500 mb-1">AI Assistant</div>
              <div class="bg-gray-100 rounded-lg p-3 shadow-sm">
                ${response.assistantResponse}
              </div>
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
    // Get manually selected checkboxes
    const checkboxes = document.querySelectorAll('.manual-source-checkbox:checked');
    const selected = Array.from(checkboxes).map(cb => cb.value);

    if (selected.length === 0) {
      alert('Please select at least one source property.');
      return;
    }

    let targetProp = this.targetedMappingState.targetProperty;
    if (!targetProp) {
      // If no target property was selected in AI assistant, get it from the selector
      const selector = document.getElementById('target-concept-select');
      if (!selector || !selector.value) {
        alert('Please select a target property first.');
        return;
      }
      const targetPropName = selector.value;
      targetProp = { name: targetPropName };
    }

    // Get confidence and comment from the unified fields
    const confidenceEl = document.getElementById('mapping-confidence-select');
    const commentEl = document.getElementById('mapping-comment');

    const confidenceValue = confidenceEl?.value || 'medium';
    const confidence = confidenceValue === 'high' ? 0.9 :
                      confidenceValue === 'medium' ? 0.7 : 0.5;

    // Determine mapping type based on selection
    const mappingType = selected.length > 1 ? 'many-to-one' : 'one-to-one';

    const mapping = {
      id: `manual-${Date.now()}`,
      source: selected,
      target: [targetProp.name],
      type: mappingType,
      confidence: confidence,
      confidenceLevel: confidenceValue,
      description: commentEl?.value || 'Manual mapping',
      status: 'accepted',
      displayName: `${selected.join(', ')} → ${targetProp.name}`
    };

    this.candidateMappings.push(mapping);
    this.updateStats();
    this.updateAcceptedMappingsList();
    this.updateProgressBar();

    alert(`Manual mapping created: ${mapping.displayName}`);
    this.clearTargetedMapping();
  }

  // New streamlined action methods
  acceptTargetedMappingWithComment() {
    if (!this.targetedMappingState.analysis) {
      alert('Please find related concepts first');
      return;
    }

    const confidence = document.getElementById('mapping-confidence-select')?.value || 'medium';
    const comment = document.getElementById('mapping-comment')?.value || '';

    this.applyMappingDecision('accepted', confidence, comment);
  }

  modifyTargetedMapping() {
    // Show manual selection panel to allow modification
    const manualPanel = document.getElementById('manual-mapping-panel');
    if (manualPanel) {
      manualPanel.classList.remove('hidden');

      // Clear search field
      const searchInput = document.getElementById('manual-mapping-search');
      if (searchInput) searchInput.value = '';

      this.populateManualCheckboxes();
    }
  }

  flagTargetedMappingWithComment() {
    if (!this.targetedMappingState.analysis) {
      alert('Please find related concepts first');
      return;
    }

    const confidence = document.getElementById('mapping-confidence-select')?.value || 'medium';
    const comment = document.getElementById('mapping-comment')?.value || '';

    this.applyMappingDecision('flagged', confidence, comment);
  }

  rejectTargetedMappingWithComment() {
    if (!this.targetedMappingState.analysis) {
      alert('Please find related concepts first');
      return;
    }

    const confidence = document.getElementById('mapping-confidence-select')?.value || 'low';
    const comment = document.getElementById('mapping-comment')?.value || '';

    this.applyMappingDecision('rejected', confidence, comment);
  }

  skipToManualMapping() {
    const manualPanel = document.getElementById('manual-mapping-panel');
    if (manualPanel) {
      manualPanel.classList.remove('hidden');

      // Clear search field
      const searchInput = document.getElementById('manual-mapping-search');
      if (searchInput) searchInput.value = '';

      this.populateManualCheckboxes();
    }
  }

  populateManualCheckboxes() {
    if (!this.sourceProperties.length) return;

    // Get AI recommended properties
    const recommendation = this.targetedMappingState.analysis?.analysis?.recommendation;
    const recommendedProps = recommendation?.sourceProperties || [];

    // Separate properties into recommended and others
    const recommendedSet = new Set(recommendedProps);
    const recommended = [];
    const others = [];

    this.sourceProperties.forEach(prop => {
      if (recommendedSet.has(prop.name)) {
        recommended.push(prop);
      } else {
        others.push(prop);
      }
    });

    // Sort both lists alphabetically
    recommended.sort((a, b) => a.name.localeCompare(b.name));
    others.sort((a, b) => a.name.localeCompare(b.name));

    // Populate recommended section
    const recommendedContainer = document.getElementById('manual-recommended-checkboxes');
    if (recommendedContainer) {
      if (recommended.length > 0) {
        recommendedContainer.innerHTML = recommended.map(prop => `
          <label class="flex items-start p-2 hover:bg-green-100 rounded cursor-pointer">
            <input type="checkbox" value="${prop.name}" class="mt-1 mr-3 manual-source-checkbox" checked>
            <div class="flex-1">
              <span class="font-mono text-sm font-medium">${prop.name}</span>
              <span class="text-green-600 text-xs ml-2">(${prop.type})</span>
              ${prop.description ? `<div class="text-xs text-gray-600 mt-1">${prop.description}</div>` : ''}
            </div>
          </label>
        `).join('');
        document.getElementById('manual-recommended-section')?.classList.remove('hidden');
      } else {
        recommendedContainer.innerHTML = '<p class="text-sm text-gray-500">No AI recommendations available</p>';
      }
    }

    // Populate other properties section
    const othersContainer = document.getElementById('manual-other-checkboxes');
    if (othersContainer) {
      othersContainer.innerHTML = others.map(prop => `
        <label class="flex items-start p-2 hover:bg-gray-100 rounded cursor-pointer">
          <input type="checkbox" value="${prop.name}" class="mt-1 mr-3 manual-source-checkbox">
          <div class="flex-1">
            <span class="font-mono text-sm">${prop.name}</span>
            <span class="text-gray-500 text-xs ml-2">(${prop.type})</span>
            ${prop.description ? `<div class="text-xs text-gray-600 mt-1">${prop.description}</div>` : ''}
          </div>
        </label>
      `).join('');
    }

    // Update count
    this.updateManualMappingCount();

    // Set up search listener
    this.setupManualMappingSearch();
  }

  updateManualMappingCount() {
    const countEl = document.getElementById('manual-mapping-count');
    if (!countEl) return;

    const total = document.querySelectorAll('.manual-source-checkbox').length;
    const checked = document.querySelectorAll('.manual-source-checkbox:checked').length;
    const visible = document.querySelectorAll('.manual-source-checkbox:not([style*="none"])').length;

    countEl.textContent = `${checked} selected, ${visible} visible of ${total} total`;
  }

  setupManualMappingSearch() {
    const searchInput = document.getElementById('manual-mapping-search');
    if (!searchInput) return;

    // Remove any existing listeners
    searchInput.removeEventListener('input', this.handleManualMappingSearch);

    // Add new listener
    this.handleManualMappingSearch = (e) => {
      const searchTerm = e.target.value.toLowerCase().trim();

      // Get all checkbox labels
      const labels = document.querySelectorAll('#manual-mapping-panel label');

      labels.forEach(label => {
        const text = label.textContent.toLowerCase();

        if (searchTerm === '' || text.includes(searchTerm)) {
          label.style.display = '';
        } else {
          label.style.display = 'none';
        }
      });

      // Update count
      this.updateManualMappingCount();

      // Hide/show sections if empty
      const recommendedVisible = document.querySelectorAll('#manual-recommended-checkboxes label:not([style*="none"])').length;
      const othersVisible = document.querySelectorAll('#manual-other-checkboxes label:not([style*="none"])').length;

      document.getElementById('manual-recommended-section').style.display = recommendedVisible > 0 ? '' : 'none';
      document.getElementById('manual-other-section').style.display = othersVisible > 0 ? '' : 'none';
    };

    searchInput.addEventListener('input', this.handleManualMappingSearch);

    // Add checkbox change listeners
    const checkboxes = document.querySelectorAll('.manual-source-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => this.updateManualMappingCount());
    });
  }

  applyMappingDecision(status, confidence, comment) {
    const targetProp = this.targetedMappingState.targetProperty;
    if (!targetProp) return;

    const recommendation = this.targetedMappingState.analysis?.analysis?.recommendation;
    if (!recommendation) return;

    // Determine source properties
    let sourceProps = recommendation.sourceProperties || [];
    if (!sourceProps.length && this.targetedMappingState.candidates.length > 0) {
      sourceProps = [this.targetedMappingState.candidates[0].property.name];
    }

    // Create mapping
    const mapping = {
      id: `targeted-${Date.now()}`,
      source: sourceProps,
      target: [targetProp.name],
      type: recommendation.type || 'unknown',
      confidence: confidence === 'high' ? 0.9 : confidence === 'medium' ? 0.7 : 0.5,
      confidenceLevel: confidence,
      description: comment || recommendation.rationale || 'AI-assisted mapping',
      status: status,
      displayName: `${sourceProps.join(', ')} → ${targetProp.name}`
    };

    // Add to mappings
    this.candidateMappings.push(mapping);
    this.updateStats();
    this.updateAcceptedMappingsList();
    this.updateProgressBar();

    // Show success message
    const actionText = status === 'accepted' ? 'accepted' : status === 'flagged' ? 'flagged for review' : 'rejected';
    alert(`Mapping ${actionText}: ${mapping.displayName}`);

    // Clear the targeted mapping state
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
    document.getElementById('manual-mapping-panel')?.classList.add('hidden');

    // Clear selections
    const targetSelect = document.getElementById('target-concept-select');
    if (targetSelect) targetSelect.value = '';

    // Reset chat messages to placeholder
    const messagesEl = document.getElementById('chat-messages');
    if (messagesEl) {
      messagesEl.innerHTML = `
        <div class="text-center text-gray-500 text-sm py-8">
          <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z"></path>
          </svg>
          <p>Start by finding related concepts above</p>
          <p class="text-xs mt-1">Then continue the conversation here to refine the mapping</p>
        </div>
      `;
    }

    // Disable action buttons
    this.disableActionButtons();

    // Clear mapping summary
    const summaryEl = document.getElementById('selected-mapping-display');
    if (summaryEl) summaryEl.textContent = 'No mapping selected yet';
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

  enableActionButtons() {
    const buttons = ['accept-mapping', 'modify-mapping', 'flag-mapping', 'reject-mapping', 'skip-mapping'];
    buttons.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
      }
    });
  }

  disableActionButtons() {
    const buttons = ['accept-mapping', 'modify-mapping', 'flag-mapping', 'reject-mapping', 'skip-mapping'];
    buttons.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');
      }
    });
  }

  updateMappingSummary() {
    const summaryEl = document.getElementById('selected-mapping-display');
    if (!summaryEl || !this.targetedMappingState.analysis) return;

    const recommendation = this.targetedMappingState.analysis.analysis.recommendation;
    const sourceProps = recommendation.sourceProperties ||
                       this.targetedMappingState.candidates.slice(0, 3).map(c => c.property.name);
    const targetProp = this.targetedMappingState.targetProperty?.name;

    summaryEl.innerHTML = `
      <div class="flex items-center justify-between">
        <span>${sourceProps.join(', ')} → ${targetProp}</span>
        <span class="text-xs px-2 py-1 rounded ${
          recommendation.confidence === 'High' ? 'bg-green-100 text-green-700' :
          recommendation.confidence === 'Medium' ? 'bg-amber-100 text-amber-700' :
          'bg-red-100 text-red-700'
        }">
          ${recommendation.confidence || 'Unknown'} Confidence
        </span>
      </div>
      <div class="text-xs text-gray-600 mt-1">${recommendation.type || 'Unknown type'}</div>
    `;
  }

  // Manual Mapping Methods
  setupManualMappingListeners() {
    // Search inputs
    const sourceSearch = document.getElementById('manual-source-search');
    const targetSearch = document.getElementById('manual-target-search');

    if (sourceSearch) {
      sourceSearch.addEventListener('input', () => this.filterManualSourceProperties());
    }
    if (targetSearch) {
      targetSearch.addEventListener('input', () => this.filterManualTargetProperties());
    }

    // Checkbox change listeners (using event delegation)
    const sourceList = document.getElementById('manual-source-list');
    const targetList = document.getElementById('manual-target-list');

    if (sourceList) {
      sourceList.addEventListener('change', (e) => {
        if (e.target.classList.contains('manual-source-prop-checkbox')) {
          this.updateManualSelectionCount('source');
        }
      });
    }

    if (targetList) {
      targetList.addEventListener('change', (e) => {
        if (e.target.classList.contains('manual-target-prop-checkbox')) {
          this.updateManualSelectionCount('target');
        }
      });
    }

    // Create button
    const createBtn = document.getElementById('create-manual-mapping-btn');
    if (createBtn) {
      createBtn.addEventListener('click', () => this.createStandaloneManualMapping());
    }
  }

  populateManualMappingLists() {
    this.populateManualSourceList();
    this.populateManualTargetList();
  }

  populateManualSourceList() {
    const listEl = document.getElementById('manual-source-list');
    if (!listEl || this.sourceProperties.length === 0) return;

    listEl.innerHTML = this.sourceProperties.map(prop => `
      <label class="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded cursor-pointer">
        <input type="checkbox" class="manual-source-prop-checkbox" value="${prop.name}" data-prop="${JSON.stringify(prop).replace(/"/g, '&quot;')}">
        <span class="text-sm">
          <span class="font-medium">${prop.name}</span>
          ${prop.description ? `<span class="text-gray-500 ml-1">(${prop.description})</span>` : ''}
        </span>
      </label>
    `).join('');

    // Update selected count
    this.updateManualSelectionCount('source');
  }

  populateManualTargetList() {
    const listEl = document.getElementById('manual-target-list');
    if (!listEl || this.targetProperties.length === 0) return;

    listEl.innerHTML = this.targetProperties.map(prop => `
      <label class="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded cursor-pointer">
        <input type="checkbox" class="manual-target-prop-checkbox" value="${prop.name}" data-prop="${JSON.stringify(prop).replace(/"/g, '&quot;')}">
        <span class="text-sm">
          <span class="font-medium">${prop.name}</span>
          ${prop.description ? `<span class="text-gray-500 ml-1">(${prop.description})</span>` : ''}
        </span>
      </label>
    `).join('');

    // Update selected count
    this.updateManualSelectionCount('target');
  }

  filterManualSourceProperties() {
    const searchInput = document.getElementById('manual-source-search');
    const searchTerm = searchInput?.value.toLowerCase() || '';

    const checkboxes = document.querySelectorAll('.manual-source-prop-checkbox');
    checkboxes.forEach(checkbox => {
      const label = checkbox.closest('label');
      const propName = checkbox.value.toLowerCase();
      const visible = propName.includes(searchTerm);
      label.style.display = visible ? '' : 'none';
    });
  }

  filterManualTargetProperties() {
    const searchInput = document.getElementById('manual-target-search');
    const searchTerm = searchInput?.value.toLowerCase() || '';

    const checkboxes = document.querySelectorAll('.manual-target-prop-checkbox');
    checkboxes.forEach(checkbox => {
      const label = checkbox.closest('label');
      const propName = checkbox.value.toLowerCase();
      const visible = propName.includes(searchTerm);
      label.style.display = visible ? '' : 'none';
    });
  }

  updateManualSelectionCount(type) {
    const checkboxes = document.querySelectorAll(`.manual-${type}-prop-checkbox:checked`);
    const countEl = document.getElementById(`manual-${type}-selected`);
    if (countEl) {
      countEl.textContent = `${checkboxes.length} selected`;
    }

    // Enable/disable create button
    this.updateCreateManualMappingButton();
  }

  updateCreateManualMappingButton() {
    const sourceChecked = document.querySelectorAll('.manual-source-prop-checkbox:checked').length;
    const targetChecked = document.querySelectorAll('.manual-target-prop-checkbox:checked').length;
    const createBtn = document.getElementById('create-manual-mapping-btn');

    if (createBtn) {
      createBtn.disabled = sourceChecked === 0 || targetChecked === 0;
      if (createBtn.disabled) {
        createBtn.classList.add('opacity-50', 'cursor-not-allowed');
      } else {
        createBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      }
    }
  }

  async createStandaloneManualMapping() {
    const sourceCheckboxes = document.querySelectorAll('.manual-source-prop-checkbox:checked');
    const targetCheckboxes = document.querySelectorAll('.manual-target-prop-checkbox:checked');

    if (sourceCheckboxes.length === 0 || targetCheckboxes.length === 0) {
      alert('Please select at least one source and one target property.');
      return;
    }

    const description = document.getElementById('manual-mapping-description')?.value || '';

    // Get selected properties
    const sourceProps = Array.from(sourceCheckboxes).map(cb => cb.value);
    const targetProps = Array.from(targetCheckboxes).map(cb => cb.value);

    // Create the mapping
    const mapping = {
      sourceProperties: sourceProps,
      targetProperties: targetProps,
      status: 'accepted',
      confidence: 'manual',
      type: 'Manual',
      description: description || `Manual mapping: ${sourceProps.join(', ')} → ${targetProps.join(', ')}`
    };

    // Add to candidateMappings
    this.candidateMappings.push(mapping);

    // Update displays
    this.updateProgressBar();
    this.updateStats();
    this.updateAcceptedMappingsList();

    // Clear selections
    sourceCheckboxes.forEach(cb => cb.checked = false);
    targetCheckboxes.forEach(cb => cb.checked = false);
    document.getElementById('manual-mapping-description').value = '';
    this.updateManualSelectionCount('source');
    this.updateManualSelectionCount('target');

    // Show success message
    const descriptionInput = document.getElementById('manual-mapping-description');
    if (descriptionInput) {
      const originalPlaceholder = descriptionInput.placeholder;
      descriptionInput.placeholder = 'Mapping created successfully!';
      descriptionInput.classList.add('text-green-600');
      setTimeout(() => {
        descriptionInput.placeholder = originalPlaceholder;
        descriptionInput.classList.remove('text-green-600');
      }, 2000);
    }
  }
}