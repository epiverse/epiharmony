export class DataTransform {
  constructor(container) {
    this.container = container;
    this.currentMapping = null;
    this.editor = null;
    this.init();
  }

  init() {
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-semibold mb-4">Data Transform</h2>
        <p class="text-gray-600 mb-6">Generate and apply transformation code to harmonize your data.</p>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Left Column: Code Editor -->
          <div class="space-y-4">
            <!-- Mapping Selector -->
            <div>
              <label class="block text-sm font-medium mb-2">Select Mapping</label>
              <select class="input-field">
                <option value="">No mappings available</option>
              </select>
            </div>

            <!-- Code Editor -->
            <div class="border rounded-lg">
              <div class="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
                <span class="font-medium">Code Editor</span>
                <div class="space-x-2">
                  <select class="px-2 py-1 text-sm border rounded">
                    <option value="javascript">JavaScript</option>
                    <option value="r">R</option>
                  </select>
                  <button class="text-sm text-amber-600 hover:text-amber-700">
                    <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
                    </svg>
                    Pop out
                  </button>
                </div>
              </div>
              <div id="code-editor" class="h-96 p-4 font-mono text-sm bg-white">
                <pre>// Transformation code will appear here
// Select a mapping to get started</pre>
              </div>
            </div>

            <!-- Console -->
            <div class="border rounded-lg">
              <div class="bg-gray-100 px-4 py-2 border-b">
                <span class="font-medium">Console Output</span>
              </div>
              <div id="console-output" class="h-32 p-4 bg-gray-900 text-green-400 font-mono text-sm overflow-auto">
                <span class="text-gray-500">Console output will appear here...</span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex space-x-2">
              <button class="btn-primary flex-1">Run Code</button>
              <button class="btn-secondary flex-1">Apply Transform</button>
              <button class="btn-secondary">Reset</button>
            </div>
          </div>

          <!-- Right Column: Data Preview -->
          <div class="space-y-4">
            <div class="border rounded-lg">
              <div class="bg-gray-100 px-4 py-2 border-b">
                <span class="font-medium">Data Preview</span>
              </div>
              <div id="data-preview" class="h-[600px] p-4">
                <p class="text-gray-500">No data loaded. Upload source data in the configuration panel to see a preview.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- AI Chat Section -->
        <div class="mt-6 border rounded-lg p-4">
          <h3 class="font-semibold mb-4">AI Assistant</h3>
          <div class="space-y-4">
            <textarea
              placeholder="Ask the AI to help generate transformation code..."
              class="input-field h-20 resize-none"
            ></textarea>
            <button class="btn-primary">Generate Code</button>
          </div>
        </div>
      </div>
    `;
  }

  onActivate() {
    console.log('Data Transform tab activated');
  }

  refresh() {
    this.render();
  }
}