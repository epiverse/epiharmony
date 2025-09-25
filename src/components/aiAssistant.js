import { getGeminiService } from '../services/gemini.js';
import { StorageManager } from '../core/storage.js';
import { buildPromptWithExamples, formatSchemaForPrompt } from '../utils/transformPrompts.js';

export class AIAssistant {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onCodeGenerated: null,
      mapping: null,
      sourceSchema: null,
      targetSchema: null,
      ...options
    };
    this.storage = new StorageManager();
    this.geminiService = null;
    this.systemPrompt = '';
    this.attachedFiles = [];
    this.useGoogleSearch = true;
    this.useUrlContext = true;
    this.chatHistories = {}; // Separate chat history per mapping
    this.currentMappingId = null;
    this.streamingMessageId = null; // Track streaming message
    this.isExpanded = false;
    this.isGenerating = false;
    this.isStreaming = false;
    this.currentStreamController = null;
    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.initGeminiService();
    this.render();
    this.attachEventListeners();
  }

  async loadSettings() {
    try {
      const settings = await this.storage.getAIAssistantSettings();
      if (settings) {
        this.systemPrompt = settings.systemPrompt || this.getDefaultSystemPrompt();
        this.useGoogleSearch = settings.useGoogleSearch !== undefined ? settings.useGoogleSearch : true;
        this.useUrlContext = settings.useUrlContext !== undefined ? settings.useUrlContext : true;
        this.attachedFiles = settings.attachedFiles || [];
      } else {
        this.systemPrompt = this.getDefaultSystemPrompt();
      }
    } catch (error) {
      console.error('Failed to load AI assistant settings:', error);
      this.systemPrompt = this.getDefaultSystemPrompt();
    }
  }

  async saveSettings() {
    try {
      await this.storage.saveAIAssistantSettings({
        systemPrompt: this.systemPrompt,
        useGoogleSearch: this.useGoogleSearch,
        useUrlContext: this.useUrlContext,
        attachedFiles: this.attachedFiles
      });
    } catch (error) {
      console.error('Failed to save AI assistant settings:', error);
    }
  }

  async initGeminiService() {
    try {
      const apiKey = await this.storage.getAPIKey();
      if (apiKey) {
        this.geminiService = getGeminiService(apiKey);
      }
    } catch (error) {
      console.error('Failed to initialize Gemini service:', error);
    }
  }

  getDefaultSystemPrompt() {
    const language = this.options.language || 'javascript';
    return buildPromptWithExamples(language, false); // Get prompt without examples for default
  }

  render() {
    this.container.innerHTML = `
      <div class="ai-assistant bg-white border rounded-lg shadow-sm">
        <!-- Header -->
        <div class="ai-assistant-header p-4 border-b bg-gradient-to-r from-amber-50 to-amber-100 rounded-t-lg">
          <div class="flex justify-between items-center">
            <h3 class="font-semibold text-lg flex items-center">
              <svg class="w-5 h-5 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              AI Assistant
            </h3>
            <button class="toggle-expand text-gray-500 hover:text-gray-700">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${this.isExpanded ? 'M19 9l-7 7-7-7' : 'M5 15l7-7 7 7'}"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- System Prompt Section (Collapsible) -->
        <div class="system-prompt-section ${this.isExpanded ? '' : 'hidden'}">
          <div class="p-4 bg-gray-50 border-b">
            <div class="flex justify-between items-center mb-2">
              <label class="text-sm font-medium text-gray-700">System Prompt</label>
              <button class="reset-prompt text-xs text-amber-600 hover:text-amber-700">Reset to Default</button>
            </div>
            <textarea
              class="system-prompt w-full p-3 border rounded-lg text-sm font-mono resize-none"
              rows="6"
              placeholder="Enter system prompt..."
            >${this.systemPrompt}</textarea>
          </div>

          <!-- Context Settings -->
          <div class="p-4 bg-gray-50 border-b">
            <div class="space-y-3">
              <!-- File Attachments -->
              <div>
                <label class="text-sm font-medium text-gray-700 mb-2 block">Persistent Context Files</label>
                <div class="attached-files-list space-y-2 mb-2">
                  ${this.renderAttachedFiles()}
                </div>
                <label class="attach-file-btn inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 cursor-pointer">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                  </svg>
                  Attach File
                  <input type="file" class="hidden" accept=".txt,.json,.csv,.md,.js,.r" multiple>
                </label>
              </div>

              <!-- Toggle Switches -->
              <div class="flex items-center justify-between">
                <label class="flex items-center cursor-pointer">
                  <input type="checkbox" class="google-search-toggle mr-2" ${this.useGoogleSearch ? 'checked' : ''}>
                  <span class="text-sm text-gray-700">Enable Google Search</span>
                </label>
                <label class="flex items-center cursor-pointer">
                  <input type="checkbox" class="url-context-toggle mr-2" ${this.useUrlContext ? 'checked' : ''}>
                  <span class="text-sm text-gray-700">Enable URL Context</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Chat Interface -->
        <div class="chat-interface p-4">
          <!-- Chat History -->
          <div class="chat-history mb-4 max-h-64 overflow-y-auto space-y-3 ${this.getCurrentChatHistory().length === 0 ? 'hidden' : ''}">
            ${this.renderChatHistory()}
          </div>

          <!-- Streaming Message -->
          <div class="streaming-message ${this.isStreaming ? '' : 'hidden'}"></div>

          <!-- Input Area -->
          <div class="space-y-3">
            <div class="message-input-container">
              <textarea
                class="message-input w-full p-3 border rounded-lg resize-none"
                rows="3"
                placeholder="Ask the AI to help generate transformation code..."
                ${this.isGenerating ? 'disabled' : ''}
              ></textarea>
              <div class="temp-attachments mt-2 flex flex-wrap gap-2"></div>
            </div>

            <div class="flex gap-2">
              <button class="generate-btn btn-primary flex-1 ${this.isGenerating ? 'opacity-50 cursor-not-allowed' : ''}" ${this.isGenerating ? 'disabled' : ''}>
                ${this.isGenerating ? `
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...` : 'Generate Code'}
              </button>
              ${this.isStreaming ? `
              <button class="stop-streaming-btn btn-danger px-4" title="Stop generation">
                ⏹
              </button>` : ''}
              <label class="btn-secondary px-4 cursor-pointer">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                </svg>
                <input type="file" class="hidden temp-file-input" accept=".txt,.json,.csv,.md,.js,.r" multiple>
              </label>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderAttachedFiles() {
    if (this.attachedFiles.length === 0) {
      return '<p class="text-sm text-gray-500">No files attached</p>';
    }

    return this.attachedFiles.map((file, index) => `
      <div class="attached-file flex items-center justify-between p-2 bg-white border rounded" data-index="${index}">
        <span class="text-sm truncate flex-1">${file.name}</span>
        <button class="remove-file ml-2 text-red-500 hover:text-red-700">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `).join('');
  }

  getCurrentChatHistory() {
    if (!this.currentMappingId || !this.chatHistories[this.currentMappingId]) {
      return [];
    }
    return this.chatHistories[this.currentMappingId];
  }

  renderChatHistory() {
    const chatHistory = this.getCurrentChatHistory();
    return chatHistory.map(entry => `
      <div class="chat-entry ${entry.role === 'user' ? 'text-right' : 'text-left'}">
        <div class="inline-block max-w-[80%] p-3 rounded-lg ${
          entry.role === 'user'
            ? 'bg-amber-100 text-gray-800'
            : 'bg-gray-100 text-gray-800'
        }">
          <p class="text-sm whitespace-pre-wrap">${this.escapeHtml(entry.content)}</p>
        </div>
      </div>
    `).join('');
  }

  attachEventListeners() {
    const toggleBtn = this.container.querySelector('.toggle-expand');
    toggleBtn?.addEventListener('click', () => {
      this.isExpanded = !this.isExpanded;
      this.render();
      this.attachEventListeners();
    });

    const systemPromptInput = this.container.querySelector('.system-prompt');
    systemPromptInput?.addEventListener('change', () => {
      this.systemPrompt = systemPromptInput.value;
      this.saveSettings();
    });

    const resetPromptBtn = this.container.querySelector('.reset-prompt');
    resetPromptBtn?.addEventListener('click', () => {
      this.systemPrompt = this.getDefaultSystemPrompt();
      this.render();
      this.attachEventListeners();
      this.saveSettings();
    });

    const attachFileInput = this.container.querySelector('.attach-file-btn input');
    attachFileInput?.addEventListener('change', async (e) => {
      await this.handleFileAttachment(e.target.files, true);
    });

    const tempFileInput = this.container.querySelector('.temp-file-input');
    tempFileInput?.addEventListener('change', async (e) => {
      await this.handleFileAttachment(e.target.files, false);
    });

    const removeFileButtons = this.container.querySelectorAll('.remove-file');
    removeFileButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.closest('.attached-file').dataset.index);
        this.attachedFiles.splice(index, 1);
        this.render();
        this.attachEventListeners();
        this.saveSettings();
      });
    });

    const googleSearchToggle = this.container.querySelector('.google-search-toggle');
    googleSearchToggle?.addEventListener('change', (e) => {
      this.useGoogleSearch = e.target.checked;
      this.saveSettings();
    });

    const urlContextToggle = this.container.querySelector('.url-context-toggle');
    urlContextToggle?.addEventListener('change', (e) => {
      this.useUrlContext = e.target.checked;
      this.saveSettings();
    });

    const generateBtn = this.container.querySelector('.generate-btn');
    generateBtn?.addEventListener('click', () => {
      this.generateCode();
    });

    const stopStreamingBtn = this.container.querySelector('.stop-streaming-btn');
    stopStreamingBtn?.addEventListener('click', () => {
      this.stopStreaming();
    });

    const messageInput = this.container.querySelector('.message-input');
    messageInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        this.generateCode();
      }
    });
  }

  async handleFileAttachment(files, isPersistent) {
    if (!files || files.length === 0) return;

    for (const file of files) {
      try {
        const content = await this.readFile(file);
        const fileObj = {
          name: file.name,
          type: file.type,
          size: file.size,
          content: content
        };

        if (isPersistent) {
          this.attachedFiles.push(fileObj);
        } else {
          this.displayTempAttachment(fileObj);
        }
      } catch (error) {
        console.error('Failed to read file:', error);
      }
    }

    if (isPersistent) {
      this.render();
      this.attachEventListeners();
      this.saveSettings();
    }
  }

  displayTempAttachment(file) {
    const container = this.container.querySelector('.temp-attachments');
    const element = document.createElement('div');
    element.className = 'inline-flex items-center px-2 py-1 bg-amber-100 rounded text-sm';
    element.innerHTML = `
      <span class="mr-1">${file.name}</span>
      <button class="text-amber-700 hover:text-amber-900">×</button>
    `;
    element.querySelector('button').addEventListener('click', () => {
      element.remove();
    });
    container.appendChild(element);
  }

  async readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  async generateCode(useStreaming = true) {
    if (!this.geminiService) {
      alert('Please configure Gemini API key in the Data Panel first');
      return;
    }

    if (!this.options.mapping) {
      alert('Please select a mapping first');
      return;
    }

    const messageInput = this.container.querySelector('.message-input');
    const userMessage = messageInput?.value.trim() || `Generate transformation code for mapping: ${this.options.mapping.name || 'selected mapping'}`;

    if (useStreaming && this.options.onEditorLock && this.options.onCodeUpdate) {
      await this.generateCodeWithStreaming(userMessage);
    } else {
      await this.generateCodeNormal(userMessage);
    }
  }

  async generateCodeNormal(userMessage) {
    this.isGenerating = true;
    this.render();
    this.attachEventListeners();

    try {
      const prompt = this.buildPrompt(userMessage, false);
      const response = await this.geminiService.generateContent(prompt, {
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      });

      // Add to chat history for current mapping
      if (this.currentMappingId && this.chatHistories[this.currentMappingId]) {
        this.chatHistories[this.currentMappingId].push(
          { role: 'user', content: userMessage },
          { role: 'assistant', content: response }
        );
      }

      const codeMatch = response.match(/```(?:javascript|js|r|R)\n([\s\S]*?)```/);
      if (codeMatch && this.options.onCodeGenerated) {
        this.options.onCodeGenerated(codeMatch[1].trim());
      }

      const messageInput = this.container.querySelector('.message-input');
      if (messageInput) messageInput.value = '';

      this.isGenerating = false;
      this.render();
      this.attachEventListeners();

    } catch (error) {
      console.error('Failed to generate code:', error);
      alert('Failed to generate code: ' + error.message);
      this.isGenerating = false;
      this.render();
      this.attachEventListeners();
    }
  }

  async generateCodeWithStreaming(userMessage) {
    this.isGenerating = true;
    this.isStreaming = true;

    // Add user message to chat history immediately
    if (this.currentMappingId && this.chatHistories[this.currentMappingId]) {
      this.chatHistories[this.currentMappingId].push(
        { role: 'user', content: userMessage }
      );
    }

    // Create a unique ID for the streaming message
    this.streamingMessageId = 'stream-' + Date.now();

    this.render();
    this.attachEventListeners();

    // Lock the editor
    this.options.onEditorLock?.(true);

    try {
      const prompt = this.buildPrompt(userMessage, false);
      const stream = await this.geminiService.generateContentStream(prompt, {
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      });

      let accumulatedText = '';
      let extractedCode = '';
      const language = this.options.language || 'javascript';

      // Store abort controller for stopping
      this.currentStreamController = new AbortController();

      // Get the streaming message element
      const streamingElement = this.container.querySelector('.streaming-message');
      if (streamingElement) {
        streamingElement.innerHTML = `
          <div class="chat-entry text-left">
            <div class="inline-block max-w-[80%] p-3 rounded-lg bg-gray-100 text-gray-800">
              <p class="text-sm whitespace-pre-wrap streaming-content"></p>
            </div>
          </div>
        `;
      }

      for await (const chunk of stream) {
        if (this.currentStreamController.signal.aborted) {
          break;
        }

        const chunkText = chunk.text;
        accumulatedText += chunkText;

        // Update streaming message in chat
        const streamingContent = this.container.querySelector('.streaming-content');
        if (streamingContent) {
          streamingContent.textContent = accumulatedText;

          // Auto-scroll to bottom
          const chatHistory = this.container.querySelector('.chat-history');
          if (chatHistory) {
            chatHistory.scrollTop = chatHistory.scrollHeight;
          }
        }

        // Try to extract code from accumulated text
        const codeMatch = accumulatedText.match(new RegExp('```(?:' + language + '|js|r|R)\\n([\\s\\S]*?)(?:```|$)'));
        if (codeMatch) {
          extractedCode = codeMatch[1];
          // Update editor with current code
          this.options.onCodeUpdate?.(extractedCode);
        }
      }

      // Add assistant message to chat history
      if (this.currentMappingId && this.chatHistories[this.currentMappingId]) {
        this.chatHistories[this.currentMappingId].push(
          { role: 'assistant', content: accumulatedText }
        );
      }

      // Final update to editor with complete code after streaming
      if (extractedCode && this.options.onCodeGenerated) {
        this.options.onCodeGenerated(extractedCode);
      }

      const messageInput = this.container.querySelector('.message-input');
      if (messageInput) messageInput.value = '';

    } catch (error) {
      console.error('Failed to generate code with streaming:', error);
      alert('Failed to generate code: ' + error.message);
    } finally {
      // Unlock the editor
      this.options.onEditorLock?.(false);
      this.isGenerating = false;
      this.isStreaming = false;
      this.currentStreamController = null;
      this.streamingMessageId = null;
      this.render();
      this.attachEventListeners();
    }
  }

  stopStreaming() {
    if (this.currentStreamController) {
      this.currentStreamController.abort();
      this.currentStreamController = null;
    }
    this.isStreaming = false;
    this.options.onEditorLock?.(false);
  }

  buildPrompt(userMessage, includeExamples = false) {
    const language = this.options.language || 'javascript';
    let prompt = includeExamples ? buildPromptWithExamples(language, true) : this.systemPrompt;
    prompt += '\n\n';

    // Include current code if available
    const currentCode = this.options.getCurrentCode?.();
    if (currentCode && currentCode.trim()) {
      prompt += '\n**Current Code in Editor:**\n```' + language + '\n' + currentCode + '\n```\n';
      prompt += 'Please modify or improve the above code based on the request.\n\n';
    }

    if (this.options.mapping) {
      prompt += `Current Mapping:\n`;
      prompt += `Source fields: ${JSON.stringify(this.options.mapping.source)}\n`;
      prompt += `Target fields: ${JSON.stringify(this.options.mapping.target)}\n\n`;
    }

    if (this.options.sourceSchema && this.options.mapping) {
      prompt += '**Source Schema Properties:**\n```json\n';
      prompt += formatSchemaForPrompt(this.options.sourceSchema, this.options.mapping.source);
      prompt += '```\n\n';
    }

    if (this.options.targetSchema && this.options.mapping) {
      prompt += '**Target Schema Properties:**\n```json\n';
      prompt += formatSchemaForPrompt(this.options.targetSchema, this.options.mapping.target);
      prompt += '```\n\n';
    }

    if (this.attachedFiles.length > 0) {
      prompt += 'Attached Context Files:\n';
      this.attachedFiles.forEach(file => {
        prompt += `--- ${file.name} ---\n${file.content}\n\n`;
      });
    }

    const tempAttachments = this.container.querySelectorAll('.temp-attachments div');
    if (tempAttachments.length > 0) {
      prompt += 'Additional Context:\n';
    }

    if (userMessage) {
      prompt += `**User Request:** ${userMessage}\n`;
    }

    return prompt;
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

  updateMapping(mapping) {
    this.options.mapping = mapping;

    // Switch to this mapping's chat history
    if (mapping && mapping.id) {
      this.currentMappingId = mapping.id;

      // Initialize chat history for this mapping if it doesn't exist
      if (!this.chatHistories[mapping.id]) {
        this.chatHistories[mapping.id] = [];
      }
    }

    // Re-render to show the correct chat history
    this.render();
    this.attachEventListeners();
  }

  updateSchemas(sourceSchema, targetSchema) {
    this.options.sourceSchema = sourceSchema;
    this.options.targetSchema = targetSchema;
  }

  updateLanguage(language) {
    this.options.language = language;
    // Always update system prompt when language changes to get correct language-specific prompt
    this.systemPrompt = this.getDefaultSystemPrompt();
    this.render();
    this.attachEventListeners();
    this.saveSettings();
  }
}