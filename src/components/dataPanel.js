import { validateSchema, loadSchemaFromUrl } from '../utils/schema.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
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
    this.genAI = null;

    this.init();
  }

  init() {
    this.setupToggleButton();
    this.setupBlueprintHandlers();
    this.setupSchemaHandlers();
    this.setupDataUpload();
    this.setupAIConfiguration();
    this.loadSavedConfiguration();
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
      this.panelContent.classList.add('hidden');
      this.toggleIcon.classList.add('rotate-180');
      this.toggleText.textContent = 'Show Configuration Panel';
    } else {
      this.panelContent.classList.remove('hidden');
      this.toggleIcon.classList.remove('rotate-180');
      this.toggleText.textContent = 'Hide Configuration Panel';
    }
  }

  setupBlueprintHandlers() {
    const createNewBtn = this.panel.querySelector('button:contains("Create New")');
    const uploadBtn = this.panel.querySelector('button:contains("Upload File")');
    const loadUrlBtn = this.panel.querySelector('button:contains("Load")');
    const clearBtn = this.panel.querySelector('button:contains("Clear Project")');

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
        embeddingModel: 'text-embedding-004',
        chatModel: 'gemini-1.5-flash'
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
  }

  setupSchemaInput(type) {
    const container = document.getElementById(`${type}-schema-inputs`);
    const addButton = container?.nextElementSibling;
    const statusDiv = document.getElementById(`${type}-schema-status`);

    if (addButton) {
      addButton.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'url';
        input.placeholder = `Enter ${type} schema URL...`;
        input.className = 'input-field';
        input.addEventListener('blur', () => this.validateSchemaUrl(input, type));
        container.appendChild(input);
      });
    }

    const initialInput = container?.querySelector('input');
    if (initialInput) {
      initialInput.addEventListener('blur', () => this.validateSchemaUrl(initialInput, type));
    }
  }

  async validateSchemaUrl(input, type) {
    const url = input.value;
    if (!url) return;

    const statusDiv = document.getElementById(`${type}-schema-status`);

    try {
      statusDiv.innerHTML = '<span class="text-amber-600">Loading schema...</span>';
      const schema = await loadSchemaFromUrl(url);

      if (validateSchema(schema)) {
        statusDiv.innerHTML = '<span class="success-message">✓ Schema loaded successfully</span>';
        await this.saveSchemaUrl(type, url);
      } else {
        statusDiv.innerHTML = '<span class="error-message">✗ Invalid schema format</span>';
      }
    } catch (error) {
      statusDiv.innerHTML = `<span class="error-message">✗ ${error.message}</span>`;
    }
  }

  async saveSchemaUrl(type, url) {
    const blueprint = await this.storageManager.getBlueprint();
    if (blueprint) {
      if (!blueprint.schemas[type].urls.includes(url)) {
        blueprint.schemas[type].urls.push(url);
      }
      await this.storageManager.saveBlueprint(blueprint);
    }
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
            statusDiv.innerHTML = `<span class="success-message">✓ Loaded ${data.length} rows</span>`;
          } catch (error) {
            statusDiv.innerHTML = `<span class="error-message">✗ ${error.message}</span>`;
          }
        }
      });
    }
  }

  async parseDataFile(file) {
    const text = await file.text();
    const extension = file.name.split('.').pop().toLowerCase();

    if (extension === 'json') {
      return JSON.parse(text);
    } else if (extension === 'csv' || extension === 'tsv') {
      const delimiter = extension === 'tsv' ? '\t' : ',';
      return this.parseCSV(text, delimiter);
    } else {
      throw new Error('Unsupported file format');
    }
  }

  parseCSV(text, delimiter) {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(delimiter).map(h => h.trim());

    return lines.slice(1).map(line => {
      const values = line.split(delimiter);
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || '';
      });
      return row;
    });
  }

  setupAIConfiguration() {
    const apiKeyInput = this.panel.querySelector('input[type="password"]');
    const statusDiv = document.getElementById('api-key-status');
    const forgetBtn = this.panel.querySelector('button:contains("Forget API Key")');
    const embeddingSelect = this.panel.querySelector('select:first-of-type');
    const chatSelect = this.panel.querySelector('select:last-of-type');

    if (apiKeyInput) {
      apiKeyInput.addEventListener('blur', async () => {
        await this.validateAPIKey(apiKeyInput.value);
      });
    }

    if (forgetBtn) {
      forgetBtn.addEventListener('click', async () => {
        await this.storageManager.clearAPIKey();
        apiKeyInput.value = '';
        statusDiv.innerHTML = '';
        this.showStatus('API key removed', 'success');
      });
    }

    if (embeddingSelect) {
      embeddingSelect.addEventListener('change', async (e) => {
        await this.updateAIConfig('embeddingModel', e.target.value);
      });
    }

    if (chatSelect) {
      chatSelect.addEventListener('change', async (e) => {
        await this.updateAIConfig('chatModel', e.target.value);
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

      this.genAI = new GoogleGenerativeAI(apiKey);
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const result = await model.generateContent('Test');

      await this.storageManager.saveAPIKey(apiKey);
      statusDiv.innerHTML = '<span class="success-message">✓ API key validated</span>';

      await this.loadAvailableModels();
    } catch (error) {
      statusDiv.innerHTML = '<span class="error-message">✗ Invalid API key</span>';
      this.genAI = null;
    }
  }

  async loadAvailableModels() {
    try {
      const models = await this.genAI.listModels();

      const embeddingSelect = this.panel.querySelector('select:first-of-type');
      const chatSelect = this.panel.querySelector('select:last-of-type');

      if (embeddingSelect) {
        embeddingSelect.innerHTML = '';
        models
          .filter(m => m.supportedGenerationMethods?.includes('embedContent'))
          .forEach(model => {
            const option = document.createElement('option');
            option.value = model.name.split('/').pop();
            option.textContent = model.displayName || model.name;
            embeddingSelect.appendChild(option);
          });
      }

      if (chatSelect) {
        chatSelect.innerHTML = '';
        models
          .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
          .forEach(model => {
            const option = document.createElement('option');
            option.value = model.name.split('/').pop();
            option.textContent = model.displayName || model.name;
            chatSelect.appendChild(option);
          });
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
      const embeddingSelect = this.panel.querySelector('select:first-of-type');
      const chatSelect = this.panel.querySelector('select:last-of-type');

      if (embeddingSelect && blueprint.aiConfig.embeddingModel) {
        embeddingSelect.value = blueprint.aiConfig.embeddingModel;
      }

      if (chatSelect && blueprint.aiConfig.chatModel) {
        chatSelect.value = blueprint.aiConfig.chatModel;
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
}

export function initDataPanel() {
  return new DataPanel();
}