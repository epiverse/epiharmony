import { VocabularyMapper } from '../tabs/vocabularyMapper.js';
import { DataTransform } from '../tabs/dataTransform.js';
import { QualityControl } from '../tabs/qualityControl.js';

export class Workspace {
  constructor() {
    this.workspace = document.getElementById('workspace');
    this.tabButtons = document.querySelectorAll('.tab-button');
    this.tabPanels = document.querySelectorAll('.tab-panel');

    this.tabs = {
      'vocabulary-mapper': null,
      'data-transform': null,
      'quality-control': null
    };

    this.activeTab = 'vocabulary-mapper';

    this.init();
  }

  init() {
    this.setupTabNavigation();
    this.initializeTabs();
    this.loadInitialTab();
  }

  setupTabNavigation() {
    this.tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const tabName = button.dataset.tab;
        this.switchTab(tabName);
      });
    });

    this.handleKeyboardNavigation();
  }

  handleKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case '1':
            e.preventDefault();
            this.switchTab('vocabulary-mapper');
            break;
          case '2':
            e.preventDefault();
            this.switchTab('data-transform');
            break;
          case '3':
            e.preventDefault();
            this.switchTab('quality-control');
            break;
        }
      }
    });
  }

  switchTab(tabName) {
    if (!this.tabs[tabName] && this.activeTab === tabName) return;

    this.tabButtons.forEach(button => {
      const icon = button.querySelector('img');
      if (button.dataset.tab === tabName) {
        button.classList.remove('tab-inactive', 'text-gray-500', 'border-transparent');
        button.classList.add('tab-active', 'text-amber-600', 'font-semibold', 'border-amber-500');
        if (icon) {
          icon.classList.add('filter-amber');
        }
      } else {
        button.classList.remove('tab-active', 'text-amber-600', 'font-semibold', 'border-amber-500');
        button.classList.add('tab-inactive', 'text-gray-500', 'border-transparent');
        if (icon) {
          icon.classList.remove('filter-amber');
        }
      }
    });

    this.tabPanels.forEach(panel => {
      if (panel.id === `${tabName}-tab`) {
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    });

    this.activeTab = tabName;

    if (this.tabs[tabName]) {
      this.tabs[tabName].onActivate();
    }

    this.updateUrl(tabName);
  }

  initializeTabs() {
    const vocabularyMapperTab = document.getElementById('vocabulary-mapper-tab');
    if (vocabularyMapperTab) {
      this.tabs['vocabulary-mapper'] = new VocabularyMapper(vocabularyMapperTab);
    }

    const dataTransformTab = document.getElementById('data-transform-tab');
    if (dataTransformTab) {
      this.tabs['data-transform'] = new DataTransform(dataTransformTab);
    }

    const qualityControlTab = document.getElementById('quality-control-tab');
    if (qualityControlTab) {
      this.tabs['quality-control'] = new QualityControl(qualityControlTab);
    }
  }

  loadInitialTab() {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');

    if (tab && this.tabs[tab]) {
      this.switchTab(tab);
    } else {
      this.switchTab('vocabulary-mapper');
    }
  }

  updateUrl(tabName) {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('tab', tabName);

    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }

  getActiveTab() {
    return this.tabs[this.activeTab];
  }

  refreshCurrentTab() {
    if (this.tabs[this.activeTab]) {
      this.tabs[this.activeTab].refresh();
    }
  }

  enableTab(tabName) {
    const button = Array.from(this.tabButtons).find(btn => btn.dataset.tab === tabName);
    if (button) {
      button.disabled = false;
      button.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  }

  disableTab(tabName) {
    const button = Array.from(this.tabButtons).find(btn => btn.dataset.tab === tabName);
    if (button) {
      button.disabled = true;
      button.classList.add('opacity-50', 'cursor-not-allowed');
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-20 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 ${
      type === 'error' ? 'bg-red-500' :
      type === 'success' ? 'bg-green-500' :
      type === 'warning' ? 'bg-yellow-500' :
      'bg-amber-500'
    } text-white`;

    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <span>${message}</span>
        <button class="ml-4 text-white hover:text-gray-200">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    const closeBtn = notification.querySelector('button');
    closeBtn.addEventListener('click', () => {
      notification.remove();
    });

    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.classList.add('opacity-0', 'transition-opacity', 'duration-500');
        setTimeout(() => notification.remove(), 500);
      }
    }, 5000);
  }

  updateProgress(progress) {
    const progressBar = document.createElement('div');
    progressBar.className = 'fixed top-0 left-0 w-full h-1 bg-amber-200 z-50';
    progressBar.innerHTML = `
      <div class="h-full bg-amber-500 transition-all duration-300" style="width: ${progress}%"></div>
    `;

    const existing = document.querySelector('.progress-bar');
    if (existing) {
      existing.querySelector('div').style.width = `${progress}%`;
    } else {
      progressBar.classList.add('progress-bar');
      document.body.appendChild(progressBar);
    }

    if (progress >= 100) {
      setTimeout(() => {
        const bar = document.querySelector('.progress-bar');
        if (bar) bar.remove();
      }, 500);
    }
  }
}

export function initWorkspace() {
  return new Workspace();
}