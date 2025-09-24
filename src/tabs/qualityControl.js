export class QualityControl {
  constructor(container) {
    this.container = container;
    this.validationErrors = [];
    this.init();
  }

  init() {
    this.render();
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
                  <span class="font-medium">Transformed Data</span>
                  <div class="text-sm text-gray-600">
                    <span id="error-count" class="text-red-600 font-medium">0 errors</span>
                  </div>
                </div>
                <div id="validation-grid" class="h-[500px] p-4">
                  <p class="text-gray-500">No transformed data available for validation.</p>
                  <p class="text-gray-500 text-sm mt-2">Complete data transformation first.</p>
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
              <button class="btn-secondary w-full mt-4">
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
              <button class="btn-primary">Run Validation</button>
              <button class="btn-secondary">Clear Results</button>
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
            <div class="bg-gray-100 px-4 py-2 border-b">
              <span class="font-medium">Target Schema Dictionary</span>
            </div>
            <div id="schema-dictionary" class="h-[600px] p-4 overflow-auto">
              <p class="text-gray-500">No target schema loaded.</p>
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

  onActivate() {
    console.log('Quality Control tab activated');
  }

  refresh() {
    this.render();
  }
}