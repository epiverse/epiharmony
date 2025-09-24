import './styles/main.css';
import { initHeader } from './components/header.js';
import { initDataPanel } from './components/dataPanel.js';
import { initWorkspace } from './components/workspace.js';

class EpiHarmonyApp {
  constructor() {
    this.components = {};
    this.init();
  }

  async init() {
    try {
      await this.initializeComponents();
      await this.loadInitialData();
      this.setupEventListeners();
      this.setupFloatingChat();

      console.log('epiHarmony initialized successfully');
    } catch (error) {
      console.error('Failed to initialize epiHarmony:', error);
      this.showError('Failed to initialize application. Please refresh the page.');
    }
  }

  async initializeComponents() {
    this.components.header = initHeader();
    this.components.dataPanel = initDataPanel();
    this.components.workspace = initWorkspace();
  }

  async loadInitialData() {
    const urlParams = new URLSearchParams(window.location.search);
    const blueprintUrl = urlParams.get('blueprint');

    if (blueprintUrl) {
      try {
        const response = await fetch(blueprintUrl);
        if (response.ok) {
          const blueprint = await response.json();
          console.log('Loaded blueprint from URL:', blueprintUrl);
        }
      } catch (error) {
        console.error('Failed to load blueprint from URL:', error);
      }
    }
  }

  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllDialogs();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.saveProject();
      }
    });

    window.addEventListener('beforeunload', (e) => {
      if (this.hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    });
  }

  setupFloatingChat() {
    const chatButton = document.getElementById('floating-chat');
    if (chatButton) {
      chatButton.addEventListener('click', () => {
        this.openChatDialog();
      });
    }
  }

  openChatDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    dialog.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div class="bg-amber-600 text-white px-6 py-4 flex justify-between items-center">
          <h3 class="text-xl font-semibold">AI Assistant</h3>
          <button class="text-white hover:text-gray-200">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="p-6">
          <div class="h-96 overflow-auto mb-4 border rounded-lg p-4 bg-gray-50">
            <div class="text-center text-gray-500">
              <svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
              <p>Start a conversation with the AI assistant</p>
              <p class="text-sm mt-1">Ask questions about data harmonization</p>
            </div>
          </div>
          <div class="flex space-x-2">
            <input
              type="text"
              placeholder="Type your message..."
              class="input-field flex-1"
            >
            <button class="btn-primary">Send</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    const closeButton = dialog.querySelector('button');
    closeButton.addEventListener('click', () => {
      dialog.remove();
    });

    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        dialog.remove();
      }
    });
  }

  closeAllDialogs() {
    document.querySelectorAll('.fixed.inset-0').forEach(dialog => {
      dialog.remove();
    });
  }

  async saveProject() {
    console.log('Saving project...');
    this.components.workspace.showNotification('Project saved', 'success');
  }

  hasUnsavedChanges() {
    return false;
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
      errorDiv.classList.add('opacity-0', 'transition-opacity', 'duration-500');
      setTimeout(() => errorDiv.remove(), 500);
    }, 5000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.epiHarmony = new EpiHarmonyApp();
});