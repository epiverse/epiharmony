import { CodeEditor } from '../utils/codeEditor.js';
import { AIAssistant } from '../components/aiAssistant.js';
import { DataGrid } from '../components/dataGrid.js';
import { StorageManager } from '../core/storage.js';

export class DataTransform {
  constructor(container) {
    this.container = container;
    this.storage = new StorageManager();

    // View mode state (default to split view)
    this.viewMode = localStorage.getItem('dataTransformViewMode') || 'split';

    // Hardcoded mappings from Vocabulary Mapper
    this.mappings = [
      {
        id: 'dmdeduc2_education',
        name: 'DMDEDUC2 → EDUCATION',
        source: ['DMDEDUC2'],
        target: ['EDUCATION'],
        description: 'Education level transformation'
      },
      {
        id: 'bmxht_height',
        name: 'BMXHT → HEIGHT',
        source: ['BMXHT'],
        target: ['HEIGHT'],
        description: 'Height measurement transformation'
      },
      {
        id: 'alq130_alc',
        name: 'ALQ130 → ALC',
        source: ['ALQ130'],
        target: ['ALC'],
        description: 'Alcohol consumption transformation'
      },
      {
        id: 'smq_smoke',
        name: '{ SMQ020, SMQ040 } → SMOKE',
        source: ['SMQ020', 'SMQ040'],
        target: ['SMOKE'],
        description: 'Smoking status transformation'
      }
    ];

    this.currentMapping = null;
    this.currentLanguage = 'javascript';
    this.codeEditor = null;
    this.aiAssistant = null;
    this.dataGrid = null;
    this.jsWorker = null;
    this.rWorker = null;
    this.sourceData = [];
    this.transformedData = null;
    this.sourceSchema = null;
    this.targetSchema = null;
    this.transformationStates = {};
    this.consoleOutput = [];
    this.editorLocked = false;
    this.showAllColumns = false;

    this.init();
  }

  async init() {
    await this.loadData();
    await this.loadSchemas();
    this.initWorkers();
    this.render();
    this.initializeComponents();
    this.attachEventListeners();
  }

  async loadData() {
    try {
      this.sourceData = await this.storage.getSourceData() || [];
    } catch (error) {
      console.error('Failed to load source data:', error);
      this.sourceData = [];
    }
  }

  async loadSchemas() {
    try {
      const sourceSchemas = await this.storage.getSourceSchemas();
      const targetSchemas = await this.storage.getTargetSchemas();

      if (sourceSchemas?.resolvedSchema) {
        this.sourceSchema = sourceSchemas.resolvedSchema.properties || {};
      }

      if (targetSchemas?.resolvedSchema) {
        this.targetSchema = targetSchemas.resolvedSchema.properties || {};
      }
    } catch (error) {
      console.error('Failed to load schemas:', error);
    }
  }

  initWorkers() {
    // Initialize JavaScript worker
    this.jsWorker = new Worker(new URL('../workers/jsExecutor.worker.js', import.meta.url), {
      type: 'module'
    });

    this.jsWorker.addEventListener('message', (event) => {
      this.handleWorkerMessage(event.data, 'javascript');
    });

    // Initialize R worker
    this.rWorker = new Worker(new URL('../workers/rExecutor.worker.js', import.meta.url), {
      type: 'module'
    });

    this.rWorker.addEventListener('message', (event) => {
      this.handleWorkerMessage(event.data, 'r');
    });

    // Initialize WebR
    this.rWorker.postMessage({ type: 'init' });
  }

  render() {
    const gridClass = this.viewMode === 'split' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1';

    this.container.innerHTML = `
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h2 class="text-2xl font-semibold">Data Transform</h2>
            <p class="text-gray-600 mt-1">Generate and apply transformation code to harmonize your data.</p>
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

        <!-- Mapping Selector (moved to top) -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">Select Mapping</label>
          <select id="mapping-selector" class="input-field">
            <option value="">Select a mapping...</option>
            ${this.mappings.map(m => `
              <option value="${m.id}">${m.name}</option>
            `).join('')}
          </select>
        </div>

        <div class="grid ${gridClass} gap-6 transition-all duration-300">
          ${this.viewMode === 'stacked' ? `
          <!-- Stacked View: Data Preview First -->
          <div class="space-y-4">

            <div class="border rounded-lg">
              <div class="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
                <span class="font-medium">Data Preview</span>
                <div class="flex items-center space-x-2">
                  <button id="toggle-columns" class="text-sm px-2 py-1 bg-white border rounded hover:bg-gray-50 hidden">
                    Show All Columns
                  </button>
                  <button id="expand-preview-btn" class="text-sm text-amber-600 hover:text-amber-700">
                    <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
                    </svg>
                    Expand
                  </button>
                  <span id="data-status" class="text-sm text-gray-600"></span>
                </div>
              </div>
              <div id="data-preview-container" class="${this.viewMode === 'split' ? 'h-[528px]' : 'h-96'}">
                ${this.sourceData.length === 0 ?
                  '<div class="p-4 text-gray-500">No data loaded. Upload source data in the configuration panel to see a preview.</div>' :
                  '<div class="ag-theme-quartz h-full"></div>'
                }
              </div>
            </div>
          </div>

          <div class="space-y-4">
          ` : ''}
          <!-- Code Editor and Console -->
          <div class="space-y-4">
            <div class="border rounded-lg">
              <div class="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
                <span class="font-medium">Code Editor</span>
                <div class="space-x-2 flex items-center">
                  <select id="language-selector" class="px-2 py-1 text-sm border rounded">
                    <option value="javascript">JavaScript</option>
                    <option value="r">R</option>
                  </select>
                  <button id="fullscreen-btn" class="text-sm text-amber-600 hover:text-amber-700">
                    <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
                    </svg>
                    Expand
                  </button>
                </div>
              </div>
              <div id="code-editor-container" class="${this.viewMode === 'split' ? 'h-96' : 'h-80'} overflow-auto"></div>
            </div>

            <div class="border rounded-lg">
              <div class="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
                <span class="font-medium">Console Output</span>
                <button id="clear-console" class="text-sm text-gray-600 hover:text-gray-800">Clear</button>
              </div>
              <div id="console-output" class="h-32 p-4 bg-gray-900 text-green-400 font-mono text-sm overflow-auto">
                <div class="console-content"></div>
              </div>
            </div>

            <div class="flex space-x-2">
              <button id="run-code" class="btn-primary flex-1">Run Code</button>
              <button id="apply-transform" class="btn-secondary flex-1">Apply Transform</button>
              <button id="reset-transform" class="btn-secondary">Reset</button>
            </div>
          </div>

          ${this.viewMode === 'split' ? `
          <!-- Split View: Data Preview on Right -->
          <div class="space-y-4">
            <div class="border rounded-lg">
              <div class="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
                <span class="font-medium">Data Preview</span>
                <div class="flex items-center space-x-2">
                  <button id="toggle-columns" class="text-sm px-2 py-1 bg-white border rounded hover:bg-gray-50 hidden">
                    Show All Columns
                  </button>
                  <button id="expand-preview-btn" class="text-sm text-amber-600 hover:text-amber-700">
                    <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
                    </svg>
                    Expand
                  </button>
                  <span id="data-status" class="text-sm text-gray-600"></span>
                </div>
              </div>
              <div id="data-preview-container" class="h-[528px]">
                ${this.sourceData.length === 0 ?
                  '<div class="p-4 text-gray-500">No data loaded. Upload source data in the configuration panel to see a preview.</div>' :
                  '<div class="ag-theme-quartz h-full"></div>'
                }
              </div>
            </div>
          </div>
          ` : ''}
        </div>

        <!-- AI Chat Section -->
        <div id="ai-assistant-container" class="mt-6"></div>
      </div>

      <!-- Fullscreen Modal for Code Editor -->
      <div id="fullscreen-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50">
        <div class="bg-white m-8 rounded-lg shadow-xl h-[calc(100vh-4rem)]">
          <div class="flex justify-between items-center p-4 border-b">
            <h3 class="font-semibold">Code Editor - Fullscreen</h3>
            <button id="close-fullscreen" class="text-gray-500 hover:text-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div id="fullscreen-editor-container" class="h-[calc(100%-5rem)] overflow-auto"></div>
        </div>
      </div>

      <!-- Fullscreen Modal for Data Preview -->
      <div id="preview-fullscreen-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50">
        <div class="bg-white m-8 rounded-lg shadow-xl h-[calc(100vh-4rem)]">
          <div class="flex justify-between items-center p-4 border-b">
            <h3 class="font-semibold">Data Preview - Fullscreen</h3>
            <button id="close-preview-fullscreen" class="text-gray-500 hover:text-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div id="fullscreen-preview-container" class="h-[calc(100%-5rem)] overflow-auto ag-theme-quartz"></div>
        </div>
      </div>
    `;
  }

  async initializeComponents() {
    // Initialize Code Editor
    const editorContainer = document.getElementById('code-editor-container');
    if (editorContainer) {
      this.codeEditor = new CodeEditor(editorContainer, {
        language: this.currentLanguage,
        onChange: (code) => {
          if (this.currentMapping) {
            this.transformationStates[this.currentMapping.id] = {
              ...this.transformationStates[this.currentMapping.id],
              code: code
            };
          }
        }
      });
      await this.codeEditor.createEditor(this.getInitialCode());
    }

    // Initialize AI Assistant
    const aiContainer = document.getElementById('ai-assistant-container');
    if (aiContainer) {
      this.aiAssistant = new AIAssistant(aiContainer, {
        language: this.currentLanguage,
        mapping: this.currentMapping,
        sourceSchema: this.sourceSchema,
        targetSchema: this.targetSchema,
        onCodeGenerated: (code) => {
          if (this.codeEditor) {
            this.codeEditor.setValue(code);
          }
        },
        onEditorLock: (locked) => {
          this.setEditorLocked(locked);
        },
        getCurrentCode: () => {
          return this.codeEditor?.getValue() || '';
        },
        onCodeUpdate: (code) => {
          if (this.codeEditor && !this.editorLocked) {
            this.codeEditor.setValue(code);
          }
        }
      });
    }

    // Initialize Data Grid
    if (this.sourceData.length > 0) {
      const gridContainer = document.querySelector('#data-preview-container .ag-theme-quartz');
      if (gridContainer) {
        this.dataGrid = new DataGrid(gridContainer, {
          height: '100%'
        });
        this.dataGrid.init(this.getDisplayData());
        this.updateDataStatus();
      }
    }
  }

  attachEventListeners() {
    // View toggle buttons
    const splitBtn = document.getElementById('split-view-btn');
    const stackedBtn = document.getElementById('stacked-view-btn');

    if (splitBtn) {
      splitBtn.addEventListener('click', () => this.setViewMode('split'));
    }

    if (stackedBtn) {
      stackedBtn.addEventListener('click', () => this.setViewMode('stacked'));
    }

    // Mapping selector
    const mappingSelector = document.getElementById('mapping-selector');
    mappingSelector?.addEventListener('change', (e) => {
      const mapping = this.mappings.find(m => m.id === e.target.value);
      this.selectMapping(mapping);
    });

    // Language selector
    const languageSelector = document.getElementById('language-selector');
    languageSelector?.addEventListener('change', async (e) => {
      this.currentLanguage = e.target.value;
      if (this.codeEditor) {
        await this.codeEditor.setLanguage(this.currentLanguage);
        this.codeEditor.setValue(this.getInitialCode());
      }
      if (this.aiAssistant) {
        this.aiAssistant.updateLanguage(this.currentLanguage);
      }
    });

    // Fullscreen button for code editor
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    fullscreenBtn?.addEventListener('click', () => {
      this.toggleFullscreen(true);
    });

    // Close fullscreen for code editor
    const closeFullscreen = document.getElementById('close-fullscreen');
    closeFullscreen?.addEventListener('click', () => {
      this.toggleFullscreen(false);
    });

    // Expand preview button
    const expandPreviewBtn = document.getElementById('expand-preview-btn');
    expandPreviewBtn?.addEventListener('click', () => {
      this.togglePreviewFullscreen(true);
    });

    // Close preview fullscreen
    const closePreviewFullscreen = document.getElementById('close-preview-fullscreen');
    closePreviewFullscreen?.addEventListener('click', () => {
      this.togglePreviewFullscreen(false);
    });

    // Clear console
    const clearConsole = document.getElementById('clear-console');
    clearConsole?.addEventListener('click', () => {
      this.clearConsole();
    });

    // Run code button
    const runCodeBtn = document.getElementById('run-code');
    runCodeBtn?.addEventListener('click', () => {
      this.runCode();
    });

    // Apply transform button
    const applyTransformBtn = document.getElementById('apply-transform');
    applyTransformBtn?.addEventListener('click', () => {
      this.applyTransform();
    });

    // Reset transform button
    const resetTransformBtn = document.getElementById('reset-transform');
    resetTransformBtn?.addEventListener('click', () => {
      this.resetTransform();
    });

    // Toggle columns button
    const toggleColumnsBtn = document.getElementById('toggle-columns');
    toggleColumnsBtn?.addEventListener('click', () => {
      this.toggleColumns();
    });
  }

  toggleColumns() {
    this.showAllColumns = !this.showAllColumns;
    const btn = document.getElementById('toggle-columns');
    if (btn) {
      btn.textContent = this.showAllColumns ? 'Show Transformed Only' : 'Show All Columns';
    }

    // Update data grid with highlighting
    if (this.dataGrid) {
      const data = this.getDisplayData();
      const highlightColumns = this.getHighlightColumns();
      this.dataGrid.init(data, null, highlightColumns);
    }
  }

  getHighlightColumns() {
    if (!this.currentMapping) return [];

    const state = this.transformationStates[this.currentMapping.id];
    if (state?.applied) {
      // Highlight target columns after transformation
      return this.currentMapping.target;
    }
    return [];
  }

  updateToggleButton() {
    const btn = document.getElementById('toggle-columns');
    const state = this.currentMapping ? this.transformationStates[this.currentMapping.id] : null;

    if (btn) {
      // Show button when mapping is selected
      if (this.currentMapping) {
        btn.classList.remove('hidden');
        btn.textContent = this.showAllColumns ? 'Show Transformed Only' : 'Show All Columns';
      } else {
        btn.classList.add('hidden');
      }
    }
  }

  selectMapping(mapping) {
    this.currentMapping = mapping;
    this.showAllColumns = false; // Reset to filtered view

    if (!mapping) return;

    // Update AI Assistant context
    if (this.aiAssistant) {
      this.aiAssistant.updateMapping(mapping);
    }

    // Load saved code or initial code
    const state = this.transformationStates[mapping.id];
    const code = state?.code || this.getInitialCode();

    if (this.codeEditor) {
      this.codeEditor.setValue(code);
    }

    // Update data preview to show relevant columns with highlighting
    if (this.dataGrid) {
      const data = this.getDisplayData();
      const highlightColumns = this.getHighlightColumns();
      this.dataGrid.init(data, null, highlightColumns);
    }

    this.updateDataStatus();
    this.updateActionButtons();
    this.updateToggleButton();
  }

  getInitialCode() {
    if (!this.currentMapping) {
      return this.currentLanguage === 'javascript'
        ? '// Select a mapping to get started\n\nfunction transform(row) {\n  // Transformation logic here\n  return {};\n}'
        : '# Select a mapping to get started\n\ntransform <- function(row) {\n  # Transformation logic here\n  list()\n}';
    }

    const { source, target } = this.currentMapping;

    if (this.currentLanguage === 'javascript') {
      return `// Transform ${source.join(', ')} to ${target.join(', ')}
function transform(row) {
  // Access source fields: ${source.map(s => `row.${s}`).join(', ')}

  // TODO: Implement transformation logic

  return {
    ${target.map(t => `${t}: null // TODO: Calculate ${t}`).join(',\n    ')}
  };
}`;
    } else {
      return `# Transform ${source.join(', ')} to ${target.join(', ')}
transform <- function(row) {
  # Access source fields: ${source.map(s => `row$${s}`).join(', ')}

  # TODO: Implement transformation logic

  list(
    ${target.map(t => `${t} = NULL # TODO: Calculate ${t}`).join(',\n    ')}
  )
}`;
    }
  }

  getDisplayData() {
    if (!this.sourceData || this.sourceData.length === 0) return [];

    const state = this.currentMapping ? this.transformationStates[this.currentMapping.id] : null;

    // If transformation has been applied
    if (state?.applied && state?.transformedData) {
      if (this.showAllColumns) {
        // Show all columns
        return state.transformedData;
      } else {
        // Show only transformed columns
        const targetColumns = this.currentMapping.target;
        return state.transformedData.map(row => {
          const filteredRow = {};
          targetColumns.forEach(col => {
            if (col in row) {
              filteredRow[col] = row[col];
            }
          });
          return filteredRow;
        });
      }
    }

    // Before transformation - show source columns
    if (this.currentMapping) {
      if (this.showAllColumns) {
        return this.sourceData;
      } else {
        // Show only relevant source columns
        const relevantColumns = this.currentMapping.source;
        return this.sourceData.map(row => {
          const filteredRow = {};
          relevantColumns.forEach(col => {
            if (col in row) {
              filteredRow[col] = row[col];
            }
          });
          return filteredRow;
        });
      }
    }

    return this.sourceData;
  }

  async runCode() {
    if (!this.currentMapping) {
      this.addConsoleMessage('Please select a mapping first', 'error');
      return;
    }

    const code = this.codeEditor?.getValue() || '';
    if (!code.trim()) {
      this.addConsoleMessage('No code to execute', 'error');
      return;
    }

    this.clearConsole();
    this.addConsoleMessage(`Running ${this.currentLanguage} code...`, 'info');

    const worker = this.currentLanguage === 'javascript' ? this.jsWorker : this.rWorker;

    worker.postMessage({
      type: 'execute',
      code: code,
      data: this.sourceData.slice(0, 10), // Test with first 10 rows
      mapping: this.currentMapping
    });
  }

  async applyTransform() {
    if (!this.currentMapping) {
      this.addConsoleMessage('Please select a mapping first', 'error');
      return;
    }

    const code = this.codeEditor?.getValue() || '';
    if (!code.trim()) {
      this.addConsoleMessage('No code to execute', 'error');
      return;
    }

    const state = this.transformationStates[this.currentMapping.id];
    if (state?.applied) {
      this.addConsoleMessage('Transform already applied. Reset first to reapply.', 'warning');
      return;
    }

    this.clearConsole();
    this.addConsoleMessage(`Applying transformation to all ${this.sourceData.length} rows...`, 'info');

    const worker = this.currentLanguage === 'javascript' ? this.jsWorker : this.rWorker;

    worker.postMessage({
      type: 'execute',
      code: code,
      data: this.sourceData,
      mapping: this.currentMapping
    });
  }

  resetTransform() {
    if (!this.currentMapping) return;

    const state = this.transformationStates[this.currentMapping.id];
    if (state) {
      state.applied = false;
      state.transformedData = null;
    }

    this.showAllColumns = false; // Reset to filtered view

    if (this.dataGrid) {
      const data = this.getDisplayData();
      const highlightColumns = this.getHighlightColumns();
      this.dataGrid.init(data, null, highlightColumns);
    }

    this.updateDataStatus();
    this.updateActionButtons();
    this.updateToggleButton();
    this.addConsoleMessage('Transform reset', 'info');
  }

  handleWorkerMessage(data, language) {
    if (data.type === 'init') {
      if (data.success) {
        this.addConsoleMessage(`${language === 'r' ? 'WebR' : 'JavaScript worker'} initialized`, 'info');
      } else {
        this.addConsoleMessage(data.message || data.error, 'error');
      }
    } else if (data.type === 'console') {
      const content = data.content;
      this.addConsoleMessage(content.message, content.type);
    } else if (data.type === 'result') {
      if (data.success) {
        const result = data.result;

        // Display console output
        if (result.console && result.console.length > 0) {
          result.console.forEach(msg => {
            this.addConsoleMessage(msg.message, msg.type);
          });
        }

        // Display stats
        this.addConsoleMessage(`Transformation complete: ${result.stats.success}/${result.stats.total} rows processed`, 'success');

        // Display errors if any
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach(error => {
            this.addConsoleMessage(error, 'error');
          });
        }

        // Store transformed data
        if (this.currentMapping && data.mapping.id === this.currentMapping.id) {
          this.transformationStates[this.currentMapping.id] = {
            ...this.transformationStates[this.currentMapping.id],
            applied: true,
            transformedData: result.data,
            code: this.codeEditor?.getValue() || ''
          };

          // Update data grid with highlighting
          if (this.dataGrid) {
            const data = this.getDisplayData();
            const highlightColumns = this.getHighlightColumns();
            this.dataGrid.init(data, null, highlightColumns);
          }

          this.updateDataStatus();
          this.updateActionButtons();
          this.updateToggleButton();
        }
      } else {
        this.addConsoleMessage(`Error: ${data.error}`, 'error');
        if (data.stack) {
          this.addConsoleMessage(data.stack, 'error');
        }
      }
    }
  }

  addConsoleMessage(message, type = 'log') {
    const consoleContent = document.querySelector('.console-content');
    if (!consoleContent) return;

    const messageElement = document.createElement('div');
    messageElement.className = `console-message console-${type}`;

    const timestamp = new Date().toLocaleTimeString();
    messageElement.innerHTML = `<span class="text-gray-500">[${timestamp}]</span> ${this.escapeHtml(message)}`;

    consoleContent.appendChild(messageElement);

    // Scroll to bottom
    const consoleOutput = document.getElementById('console-output');
    if (consoleOutput) {
      consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    // Store in console history
    this.consoleOutput.push({ timestamp, message, type });
  }

  clearConsole() {
    const consoleContent = document.querySelector('.console-content');
    if (consoleContent) {
      consoleContent.innerHTML = '';
    }
    this.consoleOutput = [];
  }

  updateDataStatus() {
    const statusElement = document.getElementById('data-status');
    if (!statusElement) return;

    if (!this.currentMapping) {
      statusElement.textContent = `${this.sourceData.length} rows`;
      return;
    }

    const state = this.transformationStates[this.currentMapping.id];
    if (state?.applied) {
      statusElement.innerHTML = '<span class="text-green-600">✓ Transformed</span>';
    } else {
      statusElement.textContent = `${this.sourceData.length} rows`;
    }
  }

  updateActionButtons() {
    const applyBtn = document.getElementById('apply-transform');
    const resetBtn = document.getElementById('reset-transform');

    if (!this.currentMapping) {
      applyBtn?.setAttribute('disabled', 'true');
      resetBtn?.setAttribute('disabled', 'true');
      return;
    }

    const state = this.transformationStates[this.currentMapping.id];

    if (state?.applied) {
      applyBtn?.setAttribute('disabled', 'true');
      applyBtn?.classList.add('opacity-50', 'cursor-not-allowed');
      resetBtn?.removeAttribute('disabled');
      resetBtn?.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
      applyBtn?.removeAttribute('disabled');
      applyBtn?.classList.remove('opacity-50', 'cursor-not-allowed');
      resetBtn?.setAttribute('disabled', 'true');
      resetBtn?.classList.add('opacity-50', 'cursor-not-allowed');
    }
  }

  toggleFullscreen(show) {
    const modal = document.getElementById('fullscreen-modal');
    const fullscreenContainer = document.getElementById('fullscreen-editor-container');
    const normalContainer = document.getElementById('code-editor-container');

    if (!modal || !fullscreenContainer || !normalContainer) return;

    if (show) {
      modal.classList.remove('hidden');

      // Move editor to fullscreen container
      if (this.codeEditor?.view) {
        fullscreenContainer.appendChild(this.codeEditor.view.dom);
      }
    } else {
      modal.classList.add('hidden');

      // Move editor back to normal container
      if (this.codeEditor?.view) {
        normalContainer.appendChild(this.codeEditor.view.dom);
      }
    }
  }

  setViewMode(mode) {
    if (this.viewMode === mode) return;

    this.viewMode = mode;
    localStorage.setItem('dataTransformViewMode', mode);

    // Re-render to apply new layout
    this.render();
    this.initializeComponents();
    this.attachEventListeners();
  }

  togglePreviewFullscreen(show) {
    const modal = document.getElementById('preview-fullscreen-modal');
    const fullscreenContainer = document.getElementById('fullscreen-preview-container');
    const normalContainer = document.querySelector('#data-preview-container .ag-theme-quartz');

    if (!modal || !fullscreenContainer) return;

    if (show) {
      modal.classList.remove('hidden');

      // Create a new grid instance in fullscreen container
      if (this.dataGrid) {
        const tempGrid = new DataGrid(fullscreenContainer, {
          height: '100%'
        });
        tempGrid.init(this.getDisplayData(), null, this.getHighlightColumns());
        this.fullscreenGrid = tempGrid;
      }
    } else {
      modal.classList.add('hidden');

      // Destroy the fullscreen grid
      if (this.fullscreenGrid) {
        this.fullscreenGrid.destroy();
        this.fullscreenGrid = null;
      }
    }
  }

  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  setEditorLocked(locked) {
    this.editorLocked = locked;
    if (this.codeEditor) {
      this.codeEditor.setReadOnly(locked);
    }

    // Update UI to show locked state
    const editorContainer = document.getElementById('code-editor-container');
    if (editorContainer) {
      if (locked) {
        editorContainer.classList.add('opacity-75', 'pointer-events-none');
      } else {
        editorContainer.classList.remove('opacity-75', 'pointer-events-none');
      }
    }

    // Show/hide a loading indicator
    const editorHeader = document.querySelector('#code-editor-container').previousElementSibling;
    if (editorHeader) {
      const existingIndicator = document.getElementById('ai-typing-indicator');

      if (locked && !existingIndicator) {
        const indicator = document.createElement('span');
        indicator.id = 'ai-typing-indicator';
        indicator.className = 'text-sm text-amber-600 ml-2';
        indicator.innerHTML = '✨ AI is typing...';
        const titleSpan = editorHeader.querySelector('span.font-medium');
        if (titleSpan) {
          titleSpan.appendChild(indicator);
        }
      } else if (!locked && existingIndicator) {
        existingIndicator.remove();
      }
    }
  }

  onActivate() {
    console.log('Data Transform tab activated');
    this.refresh();
  }

  async refresh() {
    await this.loadData();
    await this.loadSchemas();

    // Update AI Assistant schemas
    if (this.aiAssistant) {
      this.aiAssistant.updateSchemas(this.sourceSchema, this.targetSchema);
    }

    // Refresh data grid if needed
    if (this.sourceData.length > 0 && !this.dataGrid) {
      const gridContainer = document.querySelector('#data-preview-container .ag-theme-quartz');
      if (gridContainer) {
        this.dataGrid = new DataGrid(gridContainer, {
          height: '100%'
        });
        this.dataGrid.init(this.getDisplayData());
        this.updateDataStatus();
      }
    } else if (this.dataGrid) {
      this.dataGrid.init(this.getDisplayData());
      this.updateDataStatus();
    }
  }

  destroy() {
    if (this.codeEditor) {
      this.codeEditor.destroy();
    }
    if (this.jsWorker) {
      this.jsWorker.terminate();
    }
    if (this.rWorker) {
      this.rWorker.terminate();
    }
  }
}