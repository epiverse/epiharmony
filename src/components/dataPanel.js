import { validateSchema, validateTabularSchema, loadSchemaFromUrl, SchemaProcessor } from '../utils/schema.js';
import { getGeminiService } from '../services/gemini.js';
import { StorageManager } from '../core/storage.js';

export class DataPanel {
  constructor() {
    this.panel = document.getElementById('data-panel');
    this.toggleButton = document.getElementById('toggle-panel');
    this.toggleIcon = document.getElementById('toggle-icon');
    this.toggleText = document.getElementById('toggle-text');
    this.panelContent = document.getElementById('panel-content');
    this.isCollapsed = false;

    this.storageManager = new StorageManager();
    this.geminiService = null;

    this.init();
  }

  init() {
    this.setupToggleButton();
    this.setupBlueprintHandlers();
    this.setupSchemaHandlers();
    this.setupDataUpload();
    this.setupAIConfiguration();
    // Load saved configuration asynchronously
    this.loadSavedConfiguration().catch(console.error);
  }

  setupToggleButton() {
    if (!this.toggleButton) return;

    this.toggleButton.addEventListener('click', () => {
      this.togglePanel();
    });
  }

  togglePanel() {
    this.isCollapsed = !this.isCollapsed;

    if (this.isCollapsed) {
      // First set max-height for animation
      this.panelContent.style.maxHeight = this.panelContent.scrollHeight + 'px';
      // Force a reflow to ensure the max-height is applied
      this.panelContent.offsetHeight;
      // Then collapse
      this.panelContent.classList.add('opacity-0');
      this.panelContent.style.maxHeight = '0';
      this.toggleIcon.classList.add('rotate-180');
      this.toggleText.textContent = 'Show Configuration Panel';

      // Hide completely after animation
      setTimeout(() => {
        if (this.isCollapsed) {
          this.panelContent.classList.add('invisible');
        }
      }, 300);
    } else {
      // Show and expand
      this.panelContent.classList.remove('invisible');
      this.panelContent.classList.remove('opacity-0');
      this.panelContent.style.maxHeight = this.panelContent.scrollHeight + 'px';
      this.toggleIcon.classList.remove('rotate-180');
      this.toggleText.textContent = 'Hide Configuration Panel';

      // Remove max-height after animation to allow dynamic content
      setTimeout(() => {
        if (!this.isCollapsed) {
          this.panelContent.style.maxHeight = 'none';
        }
      }, 300);
    }
  }

  setupBlueprintHandlers() {
    const createNewBtn = document.getElementById('btn-create-new');
    const uploadBtn = document.getElementById('btn-upload-file');
    const loadUrlBtn = document.getElementById('btn-load-blueprint');
    const clearBtn = document.getElementById('btn-clear-project');

    if (createNewBtn) {
      createNewBtn.addEventListener('click', () => this.createNewBlueprint());
    }

    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => this.uploadBlueprint());
    }

    if (loadUrlBtn) {
      loadUrlBtn.addEventListener('click', () => this.loadBlueprintFromUrl());
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearProject());
    }
  }

  async createNewBlueprint() {
    const blueprint = {
      version: '1.0',
      created: new Date().toISOString(),
      schemas: {
        source: { urls: [], mainSchemaIndex: 0 },
        target: { urls: [], mainSchemaIndex: 0 }
      },
      mappings: [],
      aiConfig: {
        embeddingModel: 'gemini-embedding-001',
        chatModel: 'gemini-2.5-flash',
        embeddingDimension: 3072
      }
    };

    await this.storageManager.saveBlueprint(blueprint);
    this.showStatus('New blueprint created', 'success');
  }

  async uploadBlueprint() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const text = await file.text();
          const blueprint = JSON.parse(text);
          await this.storageManager.saveBlueprint(blueprint);
          this.showStatus('Blueprint loaded successfully', 'success');
          this.loadBlueprintToUI(blueprint);
        } catch (error) {
          this.showStatus('Failed to load blueprint: ' + error.message, 'error');
        }
      }
    });

    input.click();
  }

  async loadBlueprintFromUrl() {
    const urlInput = this.panel.querySelector('input[type="url"][placeholder*="Load from URL"]');
    const url = urlInput?.value;

    if (!url) {
      this.showStatus('Please enter a URL', 'error');
      return;
    }

    try {
      const response = await fetch(url);
      const blueprint = await response.json();
      await this.storageManager.saveBlueprint(blueprint);

      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set('blueprint', url);
      window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);

      this.showStatus('Blueprint loaded from URL', 'success');
      this.loadBlueprintToUI(blueprint);
    } catch (error) {
      this.showStatus('Failed to load blueprint from URL: ' + error.message, 'error');
    }
  }

  async clearProject() {
    if (confirm('Are you sure you want to clear the current project? This cannot be undone.')) {
      await this.storageManager.clearProject();
      this.showStatus('Project cleared', 'success');
      window.location.reload();
    }
  }

  setupSchemaHandlers() {
    this.setupSchemaInput('source');
    this.setupSchemaInput('target');
    this.addLoadSchemasButtons();
  }

  setupSchemaInput(type) {
    const container = document.getElementById(`${type}-schema-inputs`);
    const addButton = container?.nextElementSibling;

    if (addButton) {
      addButton.addEventListener('click', () => {
        this.addSchemaUrlInput(type, container);
      });
    }
  }

  addSchemaUrlInput(type, container, value = '', isFirst = false) {
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'flex items-center gap-2 mb-2';

    const input = document.createElement('input');
    input.type = 'url';
    input.placeholder = `Enter ${type} schema URL...`;
    input.className = 'input-field flex-grow';
    input.value = value;

    inputWrapper.appendChild(input);

    // Only add remove button if not the first input
    if (!isFirst) {
      const removeBtn = document.createElement('button');
      removeBtn.className = 'w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 font-bold text-white flex items-center justify-center text-sm transition-colors';
      removeBtn.innerHTML = '<span class="leading-none">-</span>';
      removeBtn.title = 'Remove this URL';
      removeBtn.addEventListener('click', () => {
        inputWrapper.remove();
      });
      inputWrapper.appendChild(removeBtn);
    }

    container.appendChild(inputWrapper);
    return input;
  }

  addLoadSchemasButtons() {
    // Add Load Schemas buttons for both source and target
    ['source', 'target'].forEach(type => {
      const statusDiv = document.getElementById(`${type}-schema-status`);

      // Check if button already exists
      const existingBtn = document.getElementById(`load-${type}-schemas-btn`);
      if (!existingBtn && statusDiv) {
        // Create button container
        const btnContainer = document.createElement('div');
        btnContainer.className = 'mt-3 flex items-center gap-3';

        // Create Load button
        const loadBtn = document.createElement('button');
        loadBtn.id = `load-${type}-schemas-btn`;
        loadBtn.className = 'btn-primary text-sm';
        loadBtn.textContent = `Load ${type === 'source' ? 'Source' : 'Target'} Schemas`;
        loadBtn.addEventListener('click', () => this.loadSchemas(type));

        // Create Clear button
        const clearBtn = document.createElement('button');
        clearBtn.id = `clear-${type}-schemas-btn`;
        clearBtn.className = 'btn-secondary text-sm';
        clearBtn.textContent = 'Clear';
        clearBtn.style.display = 'none'; // Initially hidden
        clearBtn.addEventListener('click', () => this.clearSchemas(type));

        btnContainer.appendChild(loadBtn);
        btnContainer.appendChild(clearBtn);

        // Insert after status div
        statusDiv.parentNode.insertBefore(btnContainer, statusDiv.nextSibling);
      }
    });
  }

  async loadSchemas(type) {
    const container = document.getElementById(`${type}-schema-inputs`);
    const statusDiv = document.getElementById(`${type}-schema-status`);
    const loadBtn = document.getElementById(`load-${type}-schemas-btn`);

    if (!container || !statusDiv) return;

    // Get all URL inputs from the wrapper divs
    const inputs = container.querySelectorAll('input[type="url"]');
    const urls = Array.from(inputs)
      .map(input => input.value.trim())
      .filter(url => url !== '');

    if (urls.length === 0) {
      this.showSchemaStatus(statusDiv, 'Please enter at least one schema URL', 'error');
      return;
    }

    // Disable button during loading
    loadBtn.disabled = true;
    loadBtn.textContent = 'Loading...';

    try {
      this.showSchemaStatus(statusDiv, 'Loading schemas...', 'loading');

      const processor = new SchemaProcessor();
      const result = await processor.loadMultipleSchemas(urls, type);

      // Show success message
      let message = `✓ Loaded ${result.loaded.length} schema${result.loaded.length !== 1 ? 's' : ''}`;
      if (result.errors.length > 0) {
        message += ` (${result.errors.length} failed)`;
      }

      const properties = processor.extractProperties(result.resolvedSchema);
      message += ` - ${properties.length} variables found`;

      this.showSchemaStatus(statusDiv, message, 'success');

      // Show the Clear button after successful load
      const clearBtn = document.getElementById(`clear-${type}-schemas-btn`);
      if (clearBtn) {
        clearBtn.style.display = 'inline-block';
      }

      // Save to storage
      await this.storageManager.saveSchemas(type, {
        urls,
        loaded: result.loaded,
        mainSchema: result.mainSchema,
        resolvedSchema: result.resolvedSchema,
        allSchemas: result.allSchemas,
        processor: {
          schemas: Array.from(processor.schemas.entries()),
          mainSchemaId: processor.mainSchema?.$id || urls[0]
        }
      });

      // Update blueprint
      const blueprint = await this.storageManager.getBlueprint() || this.createDefaultBlueprint();
      blueprint.schemas[type].urls = urls;
      blueprint.schemas[type].mainSchemaIndex = result.loaded.findIndex(l => l.schema === result.mainSchema);
      await this.storageManager.saveBlueprint(blueprint);

      // Show main schema selector only if multiple valid tabular schemas loaded from multiple URLs
      const validSchemas = result.allSchemas.filter(schema => {
        const validation = validateTabularSchema(schema);
        return validation.valid;
      });

      if (urls.length > 1 && validSchemas.length > 1) {
        this.showMainSchemaSelector(type, processor, statusDiv);
      } else {
        // Remove any existing selector
        const existingSelector = document.getElementById(`${type}-main-schema-selector`);
        if (existingSelector) {
          existingSelector.remove();
        }
      }

      // Show any load errors
      if (result.errors.length > 0) {
        const errorMessages = result.errors.map(e => `${e.url}: ${e.error}`).join('<br>');
        setTimeout(() => {
          this.showSchemaStatus(
            statusDiv,
            `<div class="mt-2 text-xs">Failed to load:<br>${errorMessages}</div>`,
            'error'
          );
        }, 3000);
      }

      // Notify other components
      window.dispatchEvent(new CustomEvent('schemas-loaded', {
        detail: { type, processor, result }
      }));

    } catch (error) {
      this.showSchemaStatus(statusDiv, error.message, 'error');
    } finally {
      loadBtn.disabled = false;
      loadBtn.textContent = `Load ${type === 'source' ? 'Source' : 'Target'} Schemas`;
    }
  }

  showMainSchemaSelector(type, processor, statusDiv) {
    // Remove any existing selector first
    const existingSelector = document.getElementById(`${type}-main-schema-selector`);
    if (existingSelector) {
      existingSelector.remove();
    }

    // Create main schema selector above buttons but below message
    const selectorDiv = document.createElement('div');
    selectorDiv.id = `${type}-main-schema-selector`;
    selectorDiv.className = 'mt-3 mb-2 px-1';
    selectorDiv.innerHTML = `
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-600 whitespace-nowrap flex-shrink-0">Main schema:</label>
        <select id="${type}-main-schema-select" class="text-sm border rounded px-2 py-1 w-full max-w-[200px]">
          <option>Loading...</option>
        </select>
      </div>
    `;

    // Insert after status div but before buttons
    const btnContainer = statusDiv.nextElementSibling;
    if (btnContainer) {
      statusDiv.parentNode.insertBefore(selectorDiv, btnContainer);
    }

    const select = document.getElementById(`${type}-main-schema-select`);
    if (!select) return;

    const schemas = processor.getSchemaList();

    select.innerHTML = schemas.map(schema => `
      <option value="${schema.id}" ${schema.isMain ? 'selected' : ''}>
        ${schema.title}
      </option>
    `).join('');

    select.addEventListener('change', async (e) => {
      const success = processor.setMainSchema(e.target.value);
      if (success) {
        const statusDiv = document.getElementById(`${type}-schema-status`);
        const properties = processor.extractProperties(processor.resolvedSchema);
        this.showSchemaStatus(
          statusDiv,
          `✓ Main schema changed - ${properties.length} variables`,
          'success'
        );

        // Update storage
        const stored = await this.storageManager.getSchemas(type);
        if (stored) {
          stored.mainSchema = processor.mainSchema;
          stored.resolvedSchema = processor.resolvedSchema;
          stored.processor.mainSchemaId = e.target.value;
          await this.storageManager.saveSchemas(type, stored);
        }

        // Notify other components
        window.dispatchEvent(new CustomEvent('schemas-loaded', {
          detail: { type, processor, mainChanged: true }
        }));
      }
    });

    // Selector is already visible
  }

  showSchemaStatus(statusDiv, message, type = 'info') {
    const bgColor = type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                    type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                    type === 'loading' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                    'bg-gray-50 border-gray-200 text-gray-800';

    statusDiv.innerHTML = `
      <div class="mt-2 px-3 py-2 border rounded-lg text-sm ${bgColor}">
        ${type === 'loading' ? '<span class="inline-block animate-pulse">⏳</span> ' : ''}
        ${message}
      </div>
    `;
  }

  createDefaultBlueprint() {
    return {
      version: '1.0',
      created: new Date().toISOString(),
      schemas: {
        source: { urls: [], mainSchemaIndex: 0 },
        target: { urls: [], mainSchemaIndex: 0 }
      },
      mappings: [],
      aiConfig: {
        embeddingModel: 'gemini-embedding-001',
        chatModel: 'gemini-2.5-flash',
        embeddingDimension: 3072
      }
    };
  }

  setupDataUpload() {
    const fileInput = this.panel.querySelector('input[type="file"]');
    const statusDiv = document.getElementById('data-status');

    if (fileInput) {
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
          try {
            statusDiv.innerHTML = '<span class="text-amber-600">Loading data...</span>';
            const data = await this.parseDataFile(file);
            await this.storageManager.saveSourceData(data);

            // Create status with clear button
            const columns = data.length > 0 ? Object.keys(data[0]).length : 0;
            statusDiv.innerHTML = `
              <div class="flex items-center justify-between">
                <span class="success-message">✓ Loaded ${data.length} rows × ${columns} columns</span>
                <button id="clear-source-data" class="text-xs text-red-600 hover:text-red-700">Clear</button>
              </div>
            `;

            // Setup clear button
            const clearBtn = document.getElementById('clear-source-data');
            if (clearBtn) {
              clearBtn.addEventListener('click', () => this.clearSourceData());
            }

            // Emit event for other components
            window.dispatchEvent(new CustomEvent('source-data-loaded', {
              detail: { data, rowCount: data.length, columnCount: columns }
            }));
          } catch (error) {
            statusDiv.innerHTML = `<span class="error-message">✗ ${error.message}</span>`;
          }
        }
      });
    }
  }

  async clearSourceData() {
    await this.storageManager.saveSourceData(null);
    const fileInput = this.panel.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
    const statusDiv = document.getElementById('data-status');
    if (statusDiv) {
      statusDiv.innerHTML = '';
    }

    // Emit event for other components
    window.dispatchEvent(new CustomEvent('source-data-cleared'));
    this.showStatus('Source data cleared', 'success');
  }

  async parseDataFile(file) {
    const text = await file.text();
    const extension = file.name.split('.').pop().toLowerCase();

    if (extension === 'json') {
      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        throw new Error('JSON file must contain an array of objects');
      }
      return data;
    } else if (extension === 'csv' || extension === 'tsv') {
      const delimiter = extension === 'tsv' ? '\t' : ',';
      return this.parseCSV(text, delimiter);
    } else {
      throw new Error('Unsupported file format. Please use CSV, TSV, or JSON.');
    }
  }

  parseCSV(text, delimiter) {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    // Parse headers
    const headers = this.parseCSVLine(lines[0], delimiter);
    if (headers.length === 0) {
      throw new Error('No headers found in CSV file');
    }

    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i], delimiter);
      if (values.length === 0) continue; // Skip empty lines

      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }

    return data;
  }

  parseCSVLine(line, delimiter) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        // Field separator
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // Add last field
    if (current || result.length > 0) {
      result.push(current.trim());
    }

    return result;
  }

  setupAIConfiguration() {
    const apiKeyInput = this.panel.querySelector('input[type="password"]');
    const statusDiv = document.getElementById('api-key-status');
    const forgetBtn = document.getElementById('btn-forget-api');
    const embeddingSelect = document.getElementById('embedding-model-select');
    const dimensionSelect = document.getElementById('embedding-dimension-select');
    const chatSelect = document.getElementById('chat-model-select');
    const testEmbeddingBtn = document.getElementById('btn-test-embedding');
    const testChatBtn = document.getElementById('btn-test-chat');

    if (apiKeyInput) {
      apiKeyInput.addEventListener('blur', async () => {
        await this.validateAPIKey(apiKeyInput.value);
      });
    }

    if (forgetBtn) {
      forgetBtn.addEventListener('click', async () => {
        await this.storageManager.clearAPIKey();
        this.geminiService = null;
        apiKeyInput.value = '';
        statusDiv.innerHTML = '';
        this.showStatus('API key removed', 'success');
      });
    }

    if (embeddingSelect) {
      embeddingSelect.addEventListener('change', async (e) => {
        await this.updateAIConfig('embeddingModel', e.target.value);
        if (this.geminiService) {
          this.geminiService.setModels(e.target.value, null);
        }
      });
    }

    if (dimensionSelect) {
      dimensionSelect.addEventListener('change', async (e) => {
        await this.updateAIConfig('embeddingDimension', parseInt(e.target.value));
        if (this.geminiService) {
          this.geminiService.setEmbeddingDimension(parseInt(e.target.value));
        }
      });
    }

    if (chatSelect) {
      chatSelect.addEventListener('change', async (e) => {
        await this.updateAIConfig('chatModel', e.target.value);
        if (this.geminiService) {
          this.geminiService.setModels(null, e.target.value);
        }
      });
    }

    if (testEmbeddingBtn) {
      testEmbeddingBtn.addEventListener('click', async () => {
        if (this.geminiService) {
          testEmbeddingBtn.disabled = true;
          testEmbeddingBtn.textContent = 'Testing...';
          const result = await this.geminiService.testEmbedding();
          testEmbeddingBtn.disabled = false;
          testEmbeddingBtn.textContent = 'Test Embedding';
          if (result.success) {
            this.showStatus('Embedding test successful! Check console for details.', 'success');
          } else {
            this.showStatus(`Embedding test failed: ${result.error}`, 'error');
          }
        } else {
          this.showStatus('Please enter and validate an API key first', 'error');
        }
      });
    }

    if (testChatBtn) {
      testChatBtn.addEventListener('click', async () => {
        if (this.geminiService) {
          testChatBtn.disabled = true;
          testChatBtn.textContent = 'Testing...';
          const result = await this.geminiService.testChat();
          testChatBtn.disabled = false;
          testChatBtn.textContent = 'Test Chat';
          if (result.success) {
            this.showStatus('Chat test successful! Check console for details.', 'success');
          } else {
            this.showStatus(`Chat test failed: ${result.error}`, 'error');
          }
        } else {
          this.showStatus('Please enter and validate an API key first', 'error');
        }
      });
    }
  }

  async validateAPIKey(apiKey) {
    const statusDiv = document.getElementById('api-key-status');

    if (!apiKey) {
      statusDiv.innerHTML = '';
      return;
    }

    try {
      statusDiv.innerHTML = '<span class="text-amber-600">Validating API key...</span>';

      this.geminiService = getGeminiService(apiKey);
      await this.geminiService.validateApiKey();

      await this.storageManager.saveAPIKey(apiKey);
      statusDiv.innerHTML = '<span class="success-message">✓ API key validated</span>';

      // Load saved AI config
      const blueprint = await this.storageManager.getBlueprint();
      if (blueprint?.aiConfig) {
        if (blueprint.aiConfig.embeddingModel) {
          this.geminiService.setModels(blueprint.aiConfig.embeddingModel, null);
        }
        if (blueprint.aiConfig.chatModel) {
          this.geminiService.setModels(null, blueprint.aiConfig.chatModel);
        }
        if (blueprint.aiConfig.embeddingDimension) {
          this.geminiService.setEmbeddingDimension(blueprint.aiConfig.embeddingDimension);
        }
      }

      await this.loadAvailableModels();
    } catch (error) {
      statusDiv.innerHTML = '<span class="error-message">✗ Invalid API key</span>';
      this.geminiService = null;
    }
  }

  async loadAvailableModels() {
    if (!this.geminiService) return;

    try {
      const { embeddingModels, chatModels } = await this.geminiService.listModels();

      const embeddingSelect = document.getElementById('embedding-model-select');
      const chatSelect = document.getElementById('chat-model-select');

      if (embeddingSelect && embeddingModels.length > 0) {
        const currentValue = embeddingSelect.value;
        embeddingSelect.innerHTML = '';

        embeddingModels.forEach(model => {
          const option = document.createElement('option');
          option.value = model.name;
          option.textContent = model.displayName || model.name;
          if (model.description) {
            option.title = model.description;
          }
          embeddingSelect.appendChild(option);
        });

        // Restore previous selection or set default
        if (currentValue && Array.from(embeddingSelect.options).some(opt => opt.value === currentValue)) {
          embeddingSelect.value = currentValue;
        } else {
          embeddingSelect.value = 'gemini-embedding-001';
        }

        // Update the gemini service with the current selection
        if (this.geminiService) {
          this.geminiService.setModels(embeddingSelect.value, null);
        }
      }

      if (chatSelect && chatModels.length > 0) {
        const currentValue = chatSelect.value;
        chatSelect.innerHTML = '';

        chatModels.forEach(model => {
          const option = document.createElement('option');
          option.value = model.name;
          option.textContent = model.displayName || model.name;
          if (model.description) {
            option.title = model.description;
          }
          chatSelect.appendChild(option);
        });

        // Restore previous selection or set default
        if (currentValue && Array.from(chatSelect.options).some(opt => opt.value === currentValue)) {
          chatSelect.value = currentValue;
        } else {
          chatSelect.value = 'gemini-2.5-flash';
        }

        // Update the gemini service with the current selection
        if (this.geminiService) {
          this.geminiService.setModels(null, chatSelect.value);
        }
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  }

  async updateAIConfig(key, value) {
    const blueprint = await this.storageManager.getBlueprint();
    if (blueprint) {
      blueprint.aiConfig[key] = value;
      await this.storageManager.saveBlueprint(blueprint);
    }
  }

  async loadSavedConfiguration() {
    const blueprint = await this.storageManager.getBlueprint();
    if (blueprint) {
      this.loadBlueprintToUI(blueprint);
    }

    const apiKey = await this.storageManager.getAPIKey();
    if (apiKey) {
      const apiKeyInput = this.panel.querySelector('input[type="password"]');
      if (apiKeyInput) {
        apiKeyInput.value = apiKey;
        await this.validateAPIKey(apiKey);
      }
    }

    // Load saved schemas
    await this.loadSavedSchemas('source');
    await this.loadSavedSchemas('target');

    // Load saved source data
    await this.loadSavedSourceData();
  }

  async loadSavedSourceData() {
    const data = await this.storageManager.getSourceData();
    if (data && Array.isArray(data) && data.length > 0) {
      const statusDiv = document.getElementById('data-status');
      if (statusDiv) {
        const columns = Object.keys(data[0]).length;
        statusDiv.innerHTML = `
          <div class="flex items-center justify-between">
            <span class="success-message">✓ Loaded ${data.length} rows × ${columns} columns</span>
            <button id="clear-source-data" class="text-xs text-red-600 hover:text-red-700">Clear</button>
          </div>
        `;

        // Setup clear button
        const clearBtn = document.getElementById('clear-source-data');
        if (clearBtn) {
          clearBtn.addEventListener('click', () => this.clearSourceData());
        }
      }

      // Emit event for other components
      window.dispatchEvent(new CustomEvent('source-data-loaded', {
        detail: { data, rowCount: data.length, columnCount: Object.keys(data[0]).length, fromStorage: true }
      }));
    }
  }

  async loadSavedSchemas(type) {
    const stored = await this.storageManager.getSchemas(type);
    if (stored && stored.resolvedSchema) {
      const container = document.getElementById(`${type}-schema-inputs`);
      const statusDiv = document.getElementById(`${type}-schema-status`);

      // Restore all URLs to the input fields
      if (stored.urls && stored.urls.length > 0 && container) {
        // Clear container and re-add all URLs
        container.innerHTML = '';

        // Add input for each URL (first one without remove button)
        stored.urls.forEach((url, index) => {
          this.addSchemaUrlInput(type, container, url, index === 0);
        });
      }

      // Recreate processor from stored data
      const processor = new SchemaProcessor();
      if (stored.processor && stored.processor.schemas) {
        stored.processor.schemas.forEach(([id, schema]) => {
          processor.schemas.set(id, schema);
        });
        processor.mainSchema = stored.mainSchema;
        processor.resolvedSchema = stored.resolvedSchema;
      }

      // Show status
      const properties = processor.extractProperties(stored.resolvedSchema);
      this.showSchemaStatus(
        statusDiv,
        `✓ ${stored.loaded.length} schema${stored.loaded.length !== 1 ? 's' : ''} loaded - ${properties.length} variables`,
        'success'
      );

      // Show the Clear button for saved schemas
      const clearBtn = document.getElementById(`clear-${type}-schemas-btn`);
      if (clearBtn) {
        clearBtn.style.display = 'inline-block';
      }

      // Show selector if multiple URLs with multiple schemas
      if (stored.urls && stored.urls.length > 1 && stored.allSchemas && stored.allSchemas.length > 1) {
        const validSchemas = stored.allSchemas.filter(schema => {
          const validation = validateTabularSchema(schema);
          return validation.valid;
        });
        if (validSchemas.length > 1) {
          this.showMainSchemaSelector(type, processor, statusDiv);
        }
      }

      // Notify other components
      window.dispatchEvent(new CustomEvent('schemas-loaded', {
        detail: { type, processor, result: stored, fromStorage: true }
      }));
    }
  }

  loadBlueprintToUI(blueprint) {
    if (blueprint.schemas?.source?.urls) {
      blueprint.schemas.source.urls.forEach((url, index) => {
        const inputs = document.querySelectorAll('#source-schema-inputs input');
        if (inputs[index]) {
          inputs[index].value = url;
        }
      });
    }

    if (blueprint.schemas?.target?.urls) {
      blueprint.schemas.target.urls.forEach((url, index) => {
        const inputs = document.querySelectorAll('#target-schema-inputs input');
        if (inputs[index]) {
          inputs[index].value = url;
        }
      });
    }

    if (blueprint.aiConfig) {
      const embeddingSelect = document.getElementById('embedding-model-select');
      const chatSelect = document.getElementById('chat-model-select');
      const dimensionSelect = document.getElementById('embedding-dimension-select');

      if (embeddingSelect && blueprint.aiConfig.embeddingModel) {
        embeddingSelect.value = blueprint.aiConfig.embeddingModel;
      }

      if (chatSelect && blueprint.aiConfig.chatModel) {
        chatSelect.value = blueprint.aiConfig.chatModel;
      }

      if (dimensionSelect && blueprint.aiConfig.embeddingDimension) {
        dimensionSelect.value = blueprint.aiConfig.embeddingDimension;
      }
    }
  }

  showStatus(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-4 px-4 py-2 rounded-lg shadow-md z-50 ${
      type === 'error' ? 'bg-red-500' :
      type === 'success' ? 'bg-green-500' :
      'bg-amber-500'
    } text-white`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('opacity-0', 'transition-opacity', 'duration-500');
      setTimeout(() => notification.remove(), 500);
    }, 3000);
  }

  async clearSchemas(type) {
    try {
      // Clear from storage
      if (type === 'source') {
        await this.storageManager.clearSourceSchemas();
      } else if (type === 'target') {
        await this.storageManager.clearTargetSchemas();
      }

      // Clear UI elements
      const statusDiv = document.getElementById(`${type}-schema-status`);
      const selectorDiv = document.getElementById(`${type}-main-schema-selector`);
      const clearBtn = document.getElementById(`clear-${type}-schemas-btn`);
      const container = document.getElementById(`${type}-schema-inputs`);

      if (statusDiv) {
        statusDiv.innerHTML = '';
      }

      if (selectorDiv) {
        selectorDiv.remove();
      }

      if (clearBtn) {
        clearBtn.style.display = 'none';
      }

      // Clear and reset input fields to just one empty input
      if (container) {
        container.innerHTML = '';
        // Add a single empty input (as first input, no remove button)
        this.addSchemaUrlInput(type, container, '', true);
      }

      // Emit event to notify other components
      window.dispatchEvent(new CustomEvent('schemas-cleared', {
        detail: { type }
      }));

      this.showStatus(`${type.charAt(0).toUpperCase() + type.slice(1)} schemas cleared`, 'success');
    } catch (error) {
      console.error(`Failed to clear ${type} schemas:`, error);
      this.showStatus(`Failed to clear ${type} schemas: ${error.message}`, 'error');
    }
  }
}

export function initDataPanel() {
  return new DataPanel();
}