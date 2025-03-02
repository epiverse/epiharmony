import './style.css';
import { ui } from './src/gui.js';

import {
  saveConfigRecord,
  getConfigRecord,
  deleteConfigRecord,
  clearConfigStore,
  saveDataRecord,
  clearDataStore,
  getDataRecord
} from './src/db.js';

import { OpenAI } from 'openai';
import { Ajv } from 'ajv';


let openaiClient = null;

function init() {
  ui('app');
  setupConfigSection();
  setupNavigation();
}

/*--------------------------------------
  NAVIGATION SETUP
---------------------------------------*/
function setupNavigation() {
  const appMap = {
    'Vocabulary Mapper': document.getElementById('vocabulary-mapper-app'),
    'Data Transform': document.getElementById('data-transform-app'),
    'Quality Control': document.getElementById('quality-control-app')
  };

  // Dropdown listener (mobile users)
  const navSelect = document.getElementById('nav-select');
  navSelect.addEventListener('change', (event) => {
    const selectedTab = event.target.value;
    // Hide all app containers
    Object.values(appMap).forEach((div) => div.classList.add('hidden'));
    // Display the selected tab's container
    if (appMap[selectedTab]) {
      appMap[selectedTab].classList.remove('hidden');
    }
  });

  // Tabs listener (desktop users)
  const tabLinks = document.querySelectorAll('.tab-link');
  tabLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();

      // Reset all tabs to default style
      tabLinks.forEach((otherLink) => {
        otherLink.classList.remove(
          'border-2',
          'border-amber-500',
          'text-amber-600',
          'rounded-t-md'
        );
        otherLink.classList.add(
          'border-transparent',
          'text-gray-500',
          'hover:text-gray-600',
          'hover:border-gray-300'
        );
        const icon = otherLink.querySelector('.logo-icon');
        if (icon) {
          icon.classList.remove('text-amber-600');
          icon.classList.add('text-gray-500', 'group-hover:text-gray-600');
        }
        otherLink.removeAttribute('aria-current');
      });

      // Apply the selected style to the clicked tab
      link.classList.remove(
        'border-transparent',
        'text-gray-500',
        'hover:text-gray-600',
        'hover:border-gray-300'
      );
      link.classList.add(
        'border-2',
        'border-amber-500',
        'text-amber-600',
        'rounded-t-md'
      );
      const icon = link.querySelector('.logo-icon');
      if (icon) {
        icon.classList.remove('text-gray-500', 'group-hover:text-gray-600');
        icon.classList.add('text-amber-600');
      }
      link.setAttribute('aria-current', 'page');

      // Hide all content containers and then show the container for the selected tab
      Object.values(appMap).forEach((div) => div.classList.add('hidden'));
      const tabName = link.dataset.tabname;
      if (appMap[tabName]) {
        appMap[tabName].classList.remove('hidden');
      }
    });
  });

  // On page load, ensure the default selected tab's content is visible.
  const defaultTab = document.querySelector('.tab-link[aria-current="page"]');
  if (defaultTab) {
    const tabName = defaultTab.dataset.tabname;
    if (appMap[tabName]) {
      appMap[tabName].classList.remove('hidden');
    }
  }
}

/*--------------------------------------
  CONFIGURATION SECTION SETUP
---------------------------------------*/
function setupConfigSection() {
  // Toggle expand/collapse
  const toggleBtn = document.getElementById('toggle-config');
  const configContent = document.getElementById('config-content');

  configContent.style.overflow = 'hidden';
  configContent.style.maxHeight = configContent.scrollHeight + 'px';
  configContent.style.transition = 'max-height 0.2s ease-out';

  toggleBtn.addEventListener('click', () => {
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';

    if (isExpanded) {
      configContent.style.maxHeight = '0px';
      toggleBtn.textContent = 'Show configuration panel';
      toggleBtn.setAttribute('aria-expanded', 'false');
    } else {
      configContent.style.maxHeight = configContent.scrollHeight + 'px';
      toggleBtn.textContent = 'Hide configuration panel';
      toggleBtn.setAttribute('aria-expanded', 'true');
    }
  });

  // epiHarmony blueprint file upload events
  const blueprintUrlEl = document.getElementById('blueprint-url');
  const blueprintFileEl = document.getElementById('blueprint-file');
  blueprintUrlEl.addEventListener('change', loadBlueprintFromURL);
  blueprintFileEl.addEventListener('change', loadBlueprintFromFile);

  // LLM API config events
  const submitApiKeyBtn = document.getElementById('submit-api-key-btn');
  const resetApiKeyBtn = document.getElementById('reset-api-key-btn');
  submitApiKeyBtn.addEventListener('click', submitOpenAiCredentials);
  resetApiKeyBtn.addEventListener('click', forgetOpenAiCredentials);

  // Model selection
  const embeddingModelSelect = document.getElementById('embedding-model-select');
  const chatModelSelect = document.getElementById('chat-model-select');
  embeddingModelSelect.addEventListener('change', () => handleModelSelectionChange('embedding'));
  chatModelSelect.addEventListener('change', () => handleModelSelectionChange('chat'));

  // Schema & data upload events
  const sourceSchemaEl = document.getElementById('source-schema-url');
  const targetSchemaEl = document.getElementById('target-schema-url');
  sourceSchemaEl.addEventListener('change', validateSchemaOnInput.bind(null, 'sourceSchema'));
  targetSchemaEl.addEventListener('change', validateSchemaOnInput.bind(null, 'targetSchema'));

  const targetDatasetEl = document.getElementById('target-dataset');
  targetDatasetEl.addEventListener('change', loadTargetDatasetFile);

  // Configure & Reset buttons
  const configureBtn = document.getElementById('configure-epiharmony-btn');
  const resetAllBtn = document.getElementById('reset-all-btn');
  configureBtn.addEventListener('click', finalizeConfiguration);
  resetAllBtn.addEventListener('click', resetAllConfigurations);
}

/*--------------------------------------
  LOADING BLUEPRINT
---------------------------------------*/
async function loadBlueprintFromURL() {
  const url = this.value.trim();
  if (!url) return; // no URL typed

  const blueprintMessage = document.getElementById('blueprint-message');
  const blueprintError = document.getElementById('blueprint-error-container');
  clearMessage(blueprintMessage);
  clearMessage(blueprintError);

  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Failed to fetch file: ${resp.status} ${resp.statusText}`);
    }
    const jsonData = await resp.json();

    // If the JSON is loaded successfully, store it into IndexedDB
    await saveConfigRecord({ id: 'blueprint', data: jsonData });

    showSuccess(blueprintMessage, 'Blueprint JSON loaded successfully from URL and stored!');
  } catch (err) {
    showError(blueprintError, err.message);
  }
}

async function loadBlueprintFromFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const blueprintMessage = document.getElementById('blueprint-message');
  const blueprintError = document.getElementById('blueprint-error-container');
  clearMessage(blueprintMessage);
  clearMessage(blueprintError);

  if (!file.name.endsWith('.json')) {
    showError(blueprintError, 'Please upload a valid JSON file!');
    return;
  }
  try {
    const text = await file.text();
    const jsonData = JSON.parse(text);
    await saveConfigRecord({ id: 'blueprint', data: jsonData });

    showSuccess(blueprintMessage, 'Blueprint JSON file uploaded and stored successfully!');
  } catch (err) {
    showError(blueprintError, `Error parsing uploaded file: ${err.message}`);
  }
}

/*--------------------------------------
  LLM API CREDENTIALS
---------------------------------------*/
async function validateOpenAiApiKey(baseUrl, apiKey) {
  try {
    const testClient = new OpenAI({
      baseURL: baseUrl,
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
    await testClient.models.list();  // If fails, consider API key invalid
    return true;
  } catch (error) {
    console.error('Error checking API key:', error);
    return false;
  }
}

async function createGlobalOpenAiClient(baseUrl, apiKey) {
  openaiClient = new OpenAI({
    baseURL: baseUrl,
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });
  await populateModelsDropdown();
}

async function submitOpenAiCredentials() {
  const msgEl = document.getElementById('llm-api-key-message');
  clearMessage(msgEl);

  const baseUrlField = document.getElementById('llm-base-url');
  const apiKeyField = document.getElementById('llm-api-key');
  if (!baseUrlField || !apiKeyField) {
    showError(msgEl, 'Missing input fields for base URL or API key.');
    return;
  }

  const baseUrl = baseUrlField.value.trim();
  const apiKey = apiKeyField.value.trim();
  if (!baseUrl || !apiKey) {
    showError(msgEl, 'Please provide both Base URL and API key.');
    return;
  }

  const isValid = await validateOpenAiApiKey(baseUrl, apiKey);
  if (!isValid) {
    showError(msgEl, 'Invalid API credentials. Please check your base URL and key.');
    return;
  }

  // If valid, store them
  try {
    await saveConfigRecord({ id: 'apiConfig', baseUrl, apiKey });
    await createGlobalOpenAiClient(baseUrl, apiKey);
    showSuccess(msgEl, 'Your OpenAI credentials are valid and have been saved successfully!');
  } catch (err) {
    showError(msgEl, `Error saving credentials: ${err.message}`);
  }
}

async function forgetOpenAiCredentials() {
  const msgEl = document.getElementById('llm-api-key-message');
  clearMessage(msgEl);

  try {
    await deleteConfigRecord('apiConfig');
    openaiClient = null;
    const baseUrlField = document.getElementById('llm-base-url');
    const apiKeyField = document.getElementById('llm-api-key');
    if (baseUrlField) baseUrlField.value = 'https://api.openai.com/v1';
    if (apiKeyField) apiKeyField.value = '';

    await deleteConfigRecord('model-embedding');
    await deleteConfigRecord('model-chat');

    showSuccess(msgEl, 'OpenAI credentials have been removed.');
  } catch (err) {
    showError(msgEl, `Error removing credentials: ${err.message}`);
  }
}

/*--------------------------------------
  POPULATE & STORE MODEL SELECTION
---------------------------------------*/
async function populateModelsDropdown() {
  if (!openaiClient) return;

  const embeddingSelect = document.getElementById('embedding-model-select');
  const chatSelect = document.getElementById('chat-model-select');
  if (!embeddingSelect || !chatSelect) return;

  embeddingSelect.innerHTML = '';
  chatSelect.innerHTML = '';

  try {
    const resp = await openaiClient.models.list();
    const modelIds = resp.data.map((m) => m.id).sort();

    if (!modelIds.length) {
      embeddingSelect.innerHTML = `<option disabled selected>No models found</option>`;
      chatSelect.innerHTML = `<option disabled selected>No models found</option>`;
      return;
    }

    // Populate dropdowns
    modelIds.forEach((id) => {
      const opt1 = document.createElement('option');
      opt1.value = id;
      opt1.textContent = id;
      embeddingSelect.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = id;
      opt2.textContent = id;
      chatSelect.appendChild(opt2);
    });

    // Let's pick default embedding
    let embeddingModelToSelect = '';
    if (modelIds.includes('text-embedding-3-large')) {
      embeddingModelToSelect = 'text-embedding-3-large';
    } else if (modelIds.includes('text-embedding-3-small')) {
      embeddingModelToSelect = 'text-embedding-3-small';
    } else {
      // If neither exist, select first
      embeddingModelToSelect = modelIds[0];
    }
    embeddingSelect.value = embeddingModelToSelect;
    await saveConfigRecord({ id: 'model-embedding', name: embeddingModelToSelect });

    // Let's pick default chat model
    let chatModelToSelect = '';
    if (modelIds.includes('gpt-4o')) {
      chatModelToSelect = 'gpt-4o';
    } else if (modelIds.includes('gpt-4o-mini')) {
      chatModelToSelect = 'gpt-4o-mini';
    } else {
      chatModelToSelect = modelIds[0];
    }
    chatSelect.value = chatModelToSelect;
    await saveConfigRecord({ id: 'model-chat', name: chatModelToSelect });
  } catch (error) {
    console.error('Error populating model dropdown:', error);
    embeddingSelect.innerHTML = `<option disabled selected>Could not load models</option>`;
    chatSelect.innerHTML = `<option disabled selected>Could not load models</option>`;
  }
}

async function handleModelSelectionChange(which) {
  const selectEl = (which === 'embedding')
    ? document.getElementById('embedding-model-select')
    : document.getElementById('chat-model-select');
  if (!selectEl) return;

  const newModel = selectEl.value;
  try {
    await saveConfigRecord({ id: `model-${which}`, name: newModel });
    console.log(`Model selection updated (${which}):`, newModel);
  } catch (err) {
    console.error('Error storing model selection:', err);
  }
}

/*--------------------------------------
  VALIDATE JSON SCHEMAS
---------------------------------------*/
async function validateSchemaOnInput(which) {
  const el = (which === 'sourceSchema')
    ? document.getElementById('source-schema-url')
    : document.getElementById('target-schema-url');
  if (!el) return;

  const schemasMsg = document.getElementById('schemas-message');
  clearMessage(schemasMsg);

  const url = el.value.trim();
  if (!url) return;

  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Failed to fetch schema: ${resp.status} ${resp.statusText}`);
    }
    const schemaJson = await resp.json();

    // Validate schema
    const ajv = new Ajv({ allErrors: true });
    const valid = ajv.validateSchema(schemaJson);
    if (!valid) {
      showError(schemasMsg, `Invalid JSON Schema: ${ajv.errorsText(ajv.errors)}`);
      return;
    }

    // Save to IDB
    await saveDataRecord({ id: which, data: schemaJson });
    showSuccess(schemasMsg, `${which} loaded & validated successfully!`);
  } catch (err) {
    showError(schemasMsg, err.message);
  }
}

/*--------------------------------------
  LOAD TARGET DATASET
---------------------------------------*/
async function loadTargetDatasetFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const datasetMessage = document.getElementById('dataset-message');
  clearMessage(datasetMessage);

  if (!file.name.endsWith('.json')) {
    showError(datasetMessage, 'Please upload a valid JSON file for the dataset!');
    return;
  }
  try {
    const text = await file.text();
    const jsonData = JSON.parse(text);
    await saveDataRecord({ id: 'targetDataset', data: jsonData });
    showSuccess(datasetMessage, 'Target dataset file uploaded & parsed successfully!');
  } catch (err) {
    showError(datasetMessage, `Error parsing uploaded dataset file: ${err.message}`);
  }
}

/*--------------------------------------
  FINALIZE CONFIGURATION
---------------------------------------*/
async function finalizeConfiguration() {
  const missing = [];

  // Check blueprint
  let blueprintRecord = await getConfigRecord('blueprint');
  if (!blueprintRecord) {
    blueprintRecord = { id: 'blueprint', data: {} };
    await saveConfigRecord(blueprintRecord);
  }

  // Check if LLM credentials exist
  const apiConfig = await getConfigRecord('apiConfig');
  if (!apiConfig) {
    missing.push('LLM API Configuration');
  }

  // Check if model selection is stored
  const embedModel = await getConfigRecord('model-embedding');
  if (!embedModel) missing.push('Embedding Model');
  const chatModel = await getConfigRecord('model-chat');
  if (!chatModel) missing.push('Chat Model');

  // Check source & target schemas
  const sourceSchema = await getDataRecord('sourceSchema');
  if (!sourceSchema) missing.push('Source Schema');
  const targetSchema = await getDataRecord('targetSchema');
  if (!targetSchema) missing.push('Target Schema');

  // Target dataset is optional

  if (missing.length > 0) {
    showMissingInfoModal(missing);
  }
}

/*--------------------------------------
  RESET ALL CONFIGURATIONS
---------------------------------------*/
async function resetAllConfigurations() {
  if (!confirm('This will clear all configuration. Are you sure?')) return;

  await clearConfigStore();
  await clearDataStore();

  // Reset UI fields
  document.getElementById('blueprint-url').value = '';
  document.getElementById('blueprint-file').value = '';
  document.getElementById('llm-base-url').value = 'https://api.openai.com/v1';
  document.getElementById('llm-api-key').value = '';
  document.getElementById('embedding-model-select').innerHTML = `<option disabled selected>Loading...</option>`;
  document.getElementById('chat-model-select').innerHTML = `<option disabled selected>Loading...</option>`;
  document.getElementById('source-schema-url').value = '';
  document.getElementById('target-schema-url').value = '';
  document.getElementById('target-dataset').value = '';

  alert('All configurations have been reset.');
}

/*--------------------------------------
  UTILITIES: Show error/success messages
---------------------------------------*/
function showError(containerEl, errorText) {
  if (!containerEl) return;
  containerEl.innerHTML = `
    <div class="bg-red-50 border border-red-300 text-red-800 rounded-lg p-3 text-sm relative">
      <button class="absolute top-2 right-2 bg-white text-gray-500 border border-gray-400 hover:text-gray-600 
                     hover:bg-gray-50 rounded px-2 py-1 text-xs copy-error-button">
        Copy
      </button>
      <div class="error-text">${errorText}</div>
    </div>
  `;
  containerEl.classList.remove('hidden');

  // Handle copy
  const copyBtn = containerEl.querySelector('.copy-error-button');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(errorText);
        copyBtn.textContent = '✓';
        setTimeout(() => copyBtn.textContent = 'Copy', 1000);
      } catch (err) {
        copyBtn.textContent = '!';
        setTimeout(() => copyBtn.textContent = 'Copy', 1000);
      }
    });
  }
}

function showSuccess(containerEl, msg) {
  if (!containerEl) return;
  containerEl.innerHTML = `
    <div class="bg-green-50 border border-green-300 text-green-800 rounded-lg p-3 text-sm">
      ${msg}
    </div>
  `;
  containerEl.classList.remove('hidden');
}

function clearMessage(containerEl) {
  if (!containerEl) return;
  containerEl.innerHTML = '';
  containerEl.classList.add('hidden');
}

/*--------------------------------------
  MISSING INFO MODAL
---------------------------------------*/
function showMissingInfoModal(missingItems) {
  // Simple version
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

  const modal = document.createElement('div');
  modal.className = 'bg-white rounded-lg p-4 max-w-md w-full';
  modal.innerHTML = `
    <h2 class="text-lg font-semibold mb-2">Information Missing</h2>
    <p class="mb-3">Please provide the following information before continuing:</p>
    <ul class="list-disc ml-6 mb-4">
      ${missingItems.map(i => `<li>${i}</li>`).join('')}
    </ul>
    <div class="flex justify-end">
      <button id="missing-modal-ok" class="bg-amber-800 hover:bg-amber-700 text-white px-4 py-2 rounded">
        OK
      </button>
    </div>
  `;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const closeBtn = modal.querySelector('#missing-modal-ok');
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
}

document.addEventListener('DOMContentLoaded', init);