import { SchemaViewer } from '../components/schemaViewer.js';
import { StorageManager } from '../core/storage.js';
import { SchemaProcessor } from '../utils/schema.js';
import { DataValidator } from '../utils/validator.js';
import { DataGrid } from '../components/dataGrid.js';

export class QualityControl {
  constructor(container) {
    this.container = container;
    this.validationErrors = [];
    this.validationResult = null;
    this.storageManager = new StorageManager();
    this.targetViewer = null;
    this.targetProcessor = null;
    this.validator = new DataValidator();
    this.dataGrid = null;
    this.sourceData = null;
    // Don't call init in constructor - setup synchronously
    this.render();
    this.setupEventListeners();
    // Load schema and data asynchronously after render
    this.loadTargetSchema().catch(console.error);
    this.loadSourceData().catch(console.error);
  }

  render() {
    this.container.innerHTML = `
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-semibold mb-4">Quality Control</h2>
        <p class="text-gray-600 mb-6">Validate transformed data against the target schema.</p>

        <!-- Nested Tabs for QC -->
        <div class="border-b border-gray-200 mb-6">
          <nav class="-mb-px flex space-x-8">
            <button class="py-2 px-1 border-b-2 border-amber-500 font-medium text-sm text-amber-600">
              Data Validation
            </button>
            <button class="py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300">
              Schema Dictionary
            </button>
          </nav>
        </div>

        <!-- Data Validation Tab Content -->
        <div id="data-validation-content">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Main Grid Area -->
            <div class="lg:col-span-2">
              <div class="border rounded-lg">
                <div class="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
                  <span class="font-medium">Source Data</span>
                  <div class="text-sm text-gray-600">
                    <span id="row-count" class="mr-3">0 rows</span>
                    <span id="error-count" class="text-red-600 font-medium">0 errors</span>
                  </div>
                </div>
                <div id="validation-grid" class="h-[500px]">
                  <!-- Grid will be inserted here -->
                </div>
              </div>
            </div>

            <!-- Error Summary Panel -->
            <div class="lg:col-span-1">
              <div class="border rounded-lg">
                <div class="bg-gray-100 px-4 py-2 border-b">
                  <span class="font-medium">Validation Errors</span>
                </div>
                <div id="error-summary" class="h-[500px] overflow-auto p-4">
                  <div class="text-center text-gray-500">
                    <svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p>No validation errors</p>
                    <p class="text-sm mt-1">Your data is ready!</p>
                  </div>
                </div>
              </div>

              <!-- Export Button -->
              <button id="export-errors" class="btn-secondary w-full mt-4">
                <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Export Error Report
              </button>
            </div>
          </div>

          <!-- Validation Controls -->
          <div class="mt-6 flex justify-between items-center">
            <div class="flex space-x-2">
              <button id="run-validation" class="btn-primary">Run Validation</button>
              <button id="clear-validation" class="btn-secondary">Clear Results</button>
              <button id="export-data" class="btn-secondary">Export Data</button>
            </div>
            <div class="text-sm text-gray-600">
              <span>Validation schema: </span>
              <span id="validation-schema-name" class="font-medium">Not loaded</span>
            </div>
          </div>
        </div>

        <!-- Schema Dictionary Tab Content (Hidden by default) -->
        <div id="schema-dictionary-content" class="hidden">
          <div class="border rounded-lg">
            <div class="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
              <span class="font-medium">Target Schema Dictionary</span>
              <div id="target-schema-info" class="text-sm text-gray-600"></div>
            </div>
            <div id="schema-dictionary" class="h-[600px] overflow-auto">
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
      </div>
    `;

    this.setupNestedTabs();
  }

  setupNestedTabs() {
    const navButtons = this.container.querySelectorAll('nav button');
    const dataValidation = this.container.querySelector('#data-validation-content');
    const schemaDictionary = this.container.querySelector('#schema-dictionary-content');

    navButtons[0]?.addEventListener('click', () => {
      navButtons[0].classList.add('border-amber-500', 'text-amber-600');
      navButtons[0].classList.remove('border-transparent', 'text-gray-500');
      navButtons[1].classList.add('border-transparent', 'text-gray-500');
      navButtons[1].classList.remove('border-amber-500', 'text-amber-600');

      dataValidation?.classList.remove('hidden');
      schemaDictionary?.classList.add('hidden');
    });

    navButtons[1]?.addEventListener('click', () => {
      navButtons[1].classList.add('border-amber-500', 'text-amber-600');
      navButtons[1].classList.remove('border-transparent', 'text-gray-500');
      navButtons[0].classList.add('border-transparent', 'text-gray-500');
      navButtons[0].classList.remove('border-amber-500', 'text-amber-600');

      schemaDictionary?.classList.remove('hidden');
      dataValidation?.classList.add('hidden');
    });
  }

  setupEventListeners() {
    // Listen for schema load events
    window.addEventListener('schemas-loaded', async (event) => {
      const { type } = event.detail;
      if (type === 'target') {
        await this.loadTargetSchema();
      }
    });

    // Listen for schema clear events
    window.addEventListener('schemas-cleared', async (event) => {
      const { type } = event.detail;
      if (type === 'target') {
        this.clearTargetSchema();
      }
    });

    // Listen for data load events
    window.addEventListener('source-data-loaded', async (event) => {
      this.sourceData = event.detail.data;
      await this.loadSourceData();
    });

    // Listen for data clear events
    window.addEventListener('source-data-cleared', () => {
      this.clearSourceData();
    });

    // Setup validation buttons
    const runBtn = document.getElementById('run-validation');
    const clearBtn = document.getElementById('clear-validation');
    const exportDataBtn = document.getElementById('export-data');
    const exportErrorsBtn = document.getElementById('export-errors');

    if (runBtn) {
      runBtn.addEventListener('click', () => this.runValidation());
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearValidation());
    }

    if (exportDataBtn) {
      exportDataBtn.addEventListener('click', () => this.exportData());
    }

    if (exportErrorsBtn) {
      exportErrorsBtn.addEventListener('click', () => this.exportErrors());
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

      // Create viewer for Schema Dictionary tab
      const viewerContainer = document.getElementById('schema-dictionary');
      if (viewerContainer) {
        this.targetViewer = new SchemaViewer(viewerContainer, {
          searchable: true,
          title: '',
          emptyMessage: 'No target schema loaded'
        });
        this.targetViewer.setSchema(stored.resolvedSchema, this.targetProcessor);

        // Update info
        const infoEl = document.getElementById('target-schema-info');
        if (infoEl) {
          const count = this.targetViewer.getPropertyCount();
          infoEl.textContent = `${count} variable${count !== 1 ? 's' : ''}`;
        }

        // Update validation schema name
        const schemaNameEl = document.getElementById('validation-schema-name');
        if (schemaNameEl) {
          schemaNameEl.textContent = stored.mainSchema?.title || 'Target Schema Loaded';
        }
      }
    }
  }

  async onActivate() {
    console.log('Quality Control tab activated');
    // Reload schema in case it was updated
    await this.loadTargetSchema();
    // Also reload source data
    await this.loadSourceData();
  }

  clearTargetSchema() {
    this.targetProcessor = null;
    this.targetViewer = null;

    const viewerContainer = document.getElementById('schema-dictionary');
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

    const infoEl = document.getElementById('target-schema-info');
    if (infoEl) {
      infoEl.textContent = '';
    }

    const schemaNameEl = document.getElementById('validation-schema-name');
    if (schemaNameEl) {
      schemaNameEl.textContent = 'Not loaded';
    }
  }

  refresh() {
    this.render();
    this.setupEventListeners();
    this.loadTargetSchema();
    this.loadSourceData();
  }

  async loadSourceData() {
    // Try to get source data from storage if not already loaded
    if (!this.sourceData) {
      this.sourceData = await this.storageManager.getSourceData();
    }

    if (!this.sourceData || !Array.isArray(this.sourceData) || this.sourceData.length === 0) {
      this.showEmptyDataMessage();
      return;
    }

    // Update row count
    const rowCountEl = document.getElementById('row-count');
    if (rowCountEl) {
      rowCountEl.textContent = `${this.sourceData.length} rows`;
    }

    // Initialize data grid
    const gridContainer = document.getElementById('validation-grid');
    if (gridContainer) {
      if (!this.dataGrid) {
        this.dataGrid = new DataGrid(gridContainer, {
          showStatusColumn: true,
          height: '500px'
        });
      }
      this.dataGrid.init(this.sourceData);
    }
  }

  clearSourceData() {
    this.sourceData = null;
    this.clearValidation();
    this.showEmptyDataMessage();

    // Update row count
    const rowCountEl = document.getElementById('row-count');
    if (rowCountEl) {
      rowCountEl.textContent = '0 rows';
    }

    if (this.dataGrid) {
      this.dataGrid.destroy();
      this.dataGrid = null;
    }
  }

  showEmptyDataMessage() {
    const gridContainer = document.getElementById('validation-grid');
    if (gridContainer) {
      gridContainer.innerHTML = `
        <div class="flex items-center justify-center h-full">
          <div class="text-center">
            <p class="text-gray-500">No source data loaded</p>
            <p class="text-gray-500 text-sm mt-2">Load data from the Configuration Panel</p>
          </div>
        </div>
      `;
    }
  }

  async runValidation() {
    if (!this.sourceData) {
      this.showNotification('No source data to validate', 'error');
      return;
    }

    if (!this.targetProcessor || !this.targetProcessor.resolvedSchema) {
      this.showNotification('No target schema loaded', 'error');
      return;
    }

    try {
      // Set schema for validator
      this.validator.setSchema(this.targetProcessor.resolvedSchema);

      // Run validation
      this.validationResult = this.validator.validateData(this.sourceData);

      // Update UI with results
      this.displayValidationResults();

      // Show notification
      if (this.validationResult.valid) {
        this.showNotification('✓ Validation passed! All data is valid.', 'success');
      } else {
        this.showNotification(`Found ${this.validationResult.errorCount} validation errors`, 'warning');
      }
    } catch (error) {
      console.error('Validation error:', error);
      this.showNotification('Validation failed: ' + error.message, 'error');
    }
  }

  displayValidationResults() {
    if (!this.validationResult) return;

    // Update error count
    const errorCountEl = document.getElementById('error-count');
    if (errorCountEl) {
      errorCountEl.textContent = `${this.validationResult.errorCount} errors`;
      errorCountEl.className = this.validationResult.errorCount > 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium';
    }

    // Set validation errors on grid
    if (this.dataGrid) {
      this.dataGrid.setValidationErrors(this.validationResult.errors);
    }

    // Update error summary panel
    this.updateErrorSummary();
  }

  updateErrorSummary() {
    const summaryContainer = document.getElementById('error-summary');
    if (!summaryContainer) return;

    if (!this.validationResult || this.validationResult.errors.length === 0) {
      summaryContainer.innerHTML = `
        <div class="text-center text-gray-500">
          <svg class="w-12 h-12 mx-auto mb-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p class="text-green-600 font-medium">No validation errors</p>
          <p class="text-sm mt-1">Your data is valid!</p>
        </div>
      `;
      return;
    }

    // Get validation stats
    const stats = this.validator.getValidationStats(this.validationResult);

    let html = `
      <div class="space-y-4">
        <!-- Stats Overview -->
        <div class="bg-gray-50 rounded-lg p-3">
          <h4 class="font-medium text-sm mb-2">Validation Summary</h4>
          <div class="text-xs space-y-1">
            <div>Total Rows: <span class="font-semibold">${stats.totalRows}</span></div>
            <div>Valid Rows: <span class="font-semibold text-green-600">${stats.validRows}</span></div>
            <div>Invalid Rows: <span class="font-semibold text-red-600">${stats.invalidRows}</span></div>
            <div>Success Rate: <span class="font-semibold">${stats.validationRate}</span></div>
          </div>
        </div>

        <!-- Error Types -->
        <div>
          <h4 class="font-medium text-sm mb-2">Error Types</h4>
          <div class="space-y-2">
    `;

    // Group and display errors by type
    this.validationResult.summary.forEach(item => {
      html += `
        <div class="border rounded p-2 hover:bg-amber-50 cursor-pointer transition-colors"
             onclick="window.dispatchEvent(new CustomEvent('filter-errors', { detail: { errorType: '${item.errorType}', column: '${item.column}' } }))">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <div class="font-medium text-sm">${item.column}</div>
              <div class="text-xs text-gray-600">${item.errorType}</div>
              <div class="text-xs text-gray-500 mt-1">${item.message}</div>
            </div>
            <span class="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">${item.count}</span>
          </div>
        </div>
      `;
    });

    html += `
          </div>
        </div>
      </div>
    `;

    summaryContainer.innerHTML = html;

    // Setup click handlers for error filtering
    window.addEventListener('filter-errors', (event) => {
      if (this.dataGrid) {
        this.dataGrid.filterByErrors(event.detail.errorType, event.detail.column);
      }
    });
  }

  clearValidation() {
    this.validationResult = null;
    this.validationErrors = [];

    // Clear grid errors
    if (this.dataGrid) {
      this.dataGrid.setValidationErrors([]);
      this.dataGrid.clearFilters();
    }

    // Reset error count
    const errorCountEl = document.getElementById('error-count');
    if (errorCountEl) {
      errorCountEl.textContent = '0 errors';
      errorCountEl.className = 'text-gray-600';
    }

    // Clear error summary
    const summaryContainer = document.getElementById('error-summary');
    if (summaryContainer) {
      summaryContainer.innerHTML = `
        <div class="text-center text-gray-500">
          <svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p>No validation errors</p>
          <p class="text-sm mt-1">Run validation to check your data</p>
        </div>
      `;
    }
  }

  exportData() {
    if (!this.dataGrid) {
      this.showNotification('No data to export', 'error');
      return;
    }

    this.dataGrid.exportData('source-data.csv');
    this.showNotification('Data exported successfully', 'success');
  }

  exportErrors() {
    if (!this.validationResult || this.validationResult.errors.length === 0) {
      this.showNotification('No errors to export', 'info');
      return;
    }

    this.validator.exportErrorsToCSV(this.validationResult.errors, 'validation-errors.csv');
    this.showNotification('Error report exported successfully', 'success');
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-4 px-4 py-2 rounded-lg shadow-md z-50 ${
      type === 'error' ? 'bg-red-500' :
      type === 'success' ? 'bg-green-500' :
      type === 'warning' ? 'bg-amber-500' :
      'bg-blue-500'
    } text-white`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('opacity-0', 'transition-opacity', 'duration-500');
      setTimeout(() => notification.remove(), 500);
    }, 3000);
  }
}