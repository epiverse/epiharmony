// Mapping data structure
const mapping = {
  "DMDEDUC2 → EDUCATION": {
    "targetConcepts": [
      {
        "name": "DMDEDUC2",
        "type": [
          "integer",
          "null"
        ],
        "enum": [
          1,
          2,
          3,
          4,
          5,
          7,
          9,
          null
        ],
        "enumDescriptions": [
          "Less than 9th grade",
          "9-11th grade (Includes 12th grade with no diploma)",
          "High school graduate/GED or equivalent",
          "Some college or AA degree",
          "College graduate or above",
          "Refused",
          "Don't Know",
          "Missing"
        ],
        "description": "Education level - Adults 20+. What is the highest grade or level of school completed or the highest degree received?"
      }
    ],
    "sourceConcepts": [
      {
        "name": "EDUCATION",
        "description": "Highest level of education",
        "type": ["integer", "null"],
        "enum": [1, 2, 3, 4, 5, 9, null],
        "enumDescriptions": [
          "Did not finish high school (1)", "High school (2)", "Some college (3)",
          "Completed college (4)", "Postgraduate (5)", "Unknown (9)", "Missing/not provided"
        ]
      }
    ]
  },
  "BMXHT → HEIGHT": {
    "targetConcepts": [
      {
        "name": "BMXHT",
        "type": ["number", "null"],
        "minimum": 80.7,
        "maximum": 202.7,
        "description": "Standing Height (cm). Standing Height (cm)."
      }
    ],
    "sourceConcepts": [
      {
        "name": "HEIGHT",
        "description": "Height in inches; set missing if <48 or >84.",
        "oneOf": [
          { "type": "number", "minimum": 48, "maximum": 84 },
          { "type": "null" }
        ]
      }
    ]
  },
  "ALQ130 → ALC": {
    "targetConcepts": [
      {
        "name": "ALQ130",
        "oneOf": [
          {
            "type": "integer",
            "minimum": 1,
            "maximum": 14,
            "description": "Numeric response between 1 and 14 representing average number of drinks per day."
          },
          {
            "type": "integer",
            "enum": [15],
            "enumDescriptions": ["15 drinks or more"]
          },
          {
            "type": "integer",
            "enum": [777],
            "enumDescriptions": ["Refused"]
          },
          {
            "type": "integer",
            "enum": [999],
            "enumDescriptions": ["Don't know"]
          },
          { "type": "null" }
        ],
        "description": "Avg # alcoholic drinks/day - past 12 mos."
      }
    ],
    "sourceConcepts": [
      {
        "name": "ALC",
        "type": ["number", "null"],
        "description": "Alcohol intake (grams/day). Null if missing.",
        "oneOf": [
          { "type": "number", "minimum": 0 },
          { "type": "null" }
        ]
      }
    ]
  },
  "{ SMQ020, SMQ040 } → SMOKE": {
    "targetConcepts": [
      {
        "name": "SMQ020",
        "type": ["integer", "null"],
        "enum": [1, 2, 7, 9, null],
        "enumDescriptions": ["Yes", "No", "Refused", "Don't know", "Missing"],
        "description": "Smoked at least 100 cigarettes in life."
      },
      {
        "name": "SMQ040",
        "type": ["integer", "null"],
        "enum": [1, 2, 3, 7, 9, null],
        "enumDescriptions": ["Every day", "Some days", "Not at all", "Refused", "Don't know", "Missing"],
        "description": "Do you now smoke cigarettes?"
      }
    ],
    "sourceConcepts": [
      {
        "name": "SMOKE",
        "description": "Smoking status",
        "type": ["integer", "null"],
        "enum": [0, 1, 2, null],
        "enumDescriptions": ["Never (0)", "Former (1)", "Current (2)", "Missing/unknown"]
      }
    ]
  }
};

// Target data for the spreadsheet
const targetData = [
  {
    "SEQN": 83732, "RIDAGEYR": 35, "DMDEDUC2": 7, "BMXHT": 175.2,
    "BMXBMI": 28.5, "ALQ130": 2, "SMQ020": 1, "SMQ040": 2
  },
  {
    "SEQN": 83733, "RIDAGEYR": 62, "DMDEDUC2": 3, "BMXHT": 168.0,
    "BMXBMI": 31.2, "ALQ130": null, "SMQ020": 2, "SMQ040": 3
  },
  {
    "SEQN": 83734, "RIDAGEYR": 12, "DMDEDUC2": 1, "BMXHT": 155.5,
    "BMXBMI": 22.1, "ALQ130": null, "SMQ020": null, "SMQ040": null
  },
  {
    "SEQN": 83735, "RIDAGEYR": 78, "DMDEDUC2": 2, "BMXHT": 180.1,
    "BMXBMI": 25.9, "ALQ130": 1, "SMQ020": 1, "SMQ040": 1
  },
  {
    "SEQN": 83736, "RIDAGEYR": 28, "DMDEDUC2": 5, "BMXHT": 162.3,
    "BMXBMI": 33.7, "ALQ130": 3, "SMQ020": 2, "SMQ040": 3
  },
  {
    "SEQN": 83737, "RIDAGEYR": 45, "DMDEDUC2": 4, "BMXHT": 190.0,
    "BMXBMI": 27.0, "ALQ130": 7, "SMQ020": 1, "SMQ040": 2
  },
  {
    "SEQN": 83738, "RIDAGEYR": 17, "DMDEDUC2": 3, "BMXHT": 172.8,
    "BMXBMI": 24.3, "ALQ130": null, "SMQ020": null, "SMQ040": null
  },
  {
    "SEQN": 83739, "RIDAGEYR": 80, "DMDEDUC2": 4, "BMXHT": 165.9,
    "BMXBMI": 29.8, "ALQ130": 1, "SMQ020": 2, "SMQ040": 3
  },
  {
    "SEQN": 83740, "RIDAGEYR": 55, "DMDEDUC2": 5, "BMXHT": 185.6,
    "BMXBMI": 30.1, "ALQ130": 15, "SMQ020": 1, "SMQ040": 1
  },
  {
    "SEQN": 83741, "RIDAGEYR": 22, "DMDEDUC2": 4, "BMXHT": 178.5,
    "BMXBMI": 26.7, "ALQ130": null, "SMQ020": 2, "SMQ040": 3
  }
];

// Global variables
let editor = null;
let gridApi = null;
let originalData = null;  // Initial data at app start
let currentData = null;   // Current state of data
let previousData = null;  // State before latest transformation
let lastCode = null;      // Last executed transformation code
let currentMappingKey = null;
let currentLanguage = 'javascript';
let webRInitialized = false;

/**
 * Initialize the Data Transform app
 */
export function initDataTransformApp() {
  const container = document.getElementById('data-transform-app');
  if (!container) return;

  // Store initial data
  originalData = JSON.parse(JSON.stringify(targetData));
  currentData = JSON.parse(JSON.stringify(targetData));

  // Clear any existing content
  container.innerHTML = '';

  // Create UI layout
  createAppLayout(container);

  // Initialize components
  setupMappingDropdown();
  setupCodeEditor();
  setupDataTable();
  setupChatInterface();

  // Set initial mapping
  if (Object.keys(mapping).length > 0) {
    setTimeout(() => {
      const mappingSelector = document.getElementById('mapping-selector');
      if (mappingSelector) {
        const firstKey = Object.keys(mapping)[0];
        mappingSelector.value = firstKey;
        updateSelectedMapping(firstKey);
      }
    }, 500); // Small delay to ensure editor is initialized
  }
}

/**
 * Create the main app layout
 */
function createAppLayout(container) {
  container.innerHTML = `
    <div class="mb-4">
      <h2 class="text-xl font-bold">Data Transform</h2>
      <p class="text-gray-600">Transform variables in the source dataset to the target schema</p>
    </div>
    
    <!-- Mapping selector -->
    <div class="w-full mb-4">
      <label for="mapping-selector" class="block text-sm font-medium text-gray-700 mb-1">Select mapping:</label>
      <select id="mapping-selector" class="w-full md:w-1/2 lg:w-1/3 border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent">
      </select>
    </div>
    
    <!-- Main content area: editor and table -->
    <div class="mt-4 flex flex-col lg:flex-row gap-4" style="min-height: 700px;">
      <!-- Code editor container -->
      <div id="code-editor-container" class="flex-1 border border-gray-200 rounded-md h-[600px] lg:h-[700px] flex flex-col overflow-hidden">
        <!-- Language selector -->
        <div class="language-selector bg-gray-100 border-b border-gray-300 p-2 flex">
          <button id="js-button" class="language-button active bg-amber-800 text-white px-3 py-1 rounded mr-2 text-sm font-medium">JavaScript</button>
          <button id="r-button" class="language-button bg-gray-200 text-gray-700 px-3 py-1 rounded mr-2 text-sm font-medium">R</button>
        </div>
        
        <!-- Editor area -->
        <div id="editor-area" class="flex-grow"></div>
        
        <!-- Controls -->
        <div class="editor-controls bg-gray-100 border-t border-b border-gray-300 p-2 flex justify-end gap-2">
          <button id="undo-button" class="bg-gray-600 text-white px-4 py-1 rounded hover:bg-gray-700 text-sm font-medium opacity-50" disabled>Undo</button>
          <button id="transform-button" class="bg-amber-600 text-white px-4 py-1 rounded hover:bg-amber-700 text-sm font-medium">Transform</button>
        </div>
        
        <!-- Output area (fixed height now) -->
        <div class="output-container flex-shrink-0 h-[150px] flex flex-col">
          <div class="output-header bg-gray-100 border-b border-gray-300 p-2 font-medium text-sm">Output</div>
          <div class="output-area bg-gray-50 p-3 flex-grow overflow-auto">
            <pre id="output-content" class="font-mono text-sm whitespace-pre-wrap"></pre>
          </div>
        </div>
      </div>
      
      <!-- Data table container -->
      <div id="data-table-container" class="flex-1 border border-gray-200 rounded-md h-[600px] lg:h-[700px] overflow-hidden ag-theme-alpine">
      </div>
    </div>
    
    <!-- Chat interface -->
    <div id="chat-interface" class="mt-4 border border-gray-200 rounded-md h-[400px]">
      <div class="h-full flex flex-col">
        <!-- File attachment section -->
        <div class="p-3 border-b border-gray-200 bg-gray-50">
          <div class="flex items-center gap-2">
            <label for="chat-file-upload" class="text-sm font-medium text-gray-700">Attach files:</label>
            <input id="chat-file-upload" type="file" multiple 
                  class="text-sm text-gray-500 file:mr-4 file:py-1 file:px-3
                         file:rounded file:border-0 file:text-sm file:font-medium
                         file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" />
          </div>
          <div id="attached-files-list" class="mt-2 flex flex-wrap gap-2"></div>
        </div>
        
        <!-- Chat messages area -->
        <div id="chat-messages" class="flex-grow p-4 overflow-y-auto">
          <div class="bg-gray-100 rounded-lg p-3 mb-3 max-w-3xl mx-auto">
            <p class="text-gray-800">I'm the epiHarmony data transform assistant. I can help you write and understand data transformation code for harmonizing variables in your source dataset to the target schema.</p>
            <p class="text-gray-800 mt-2">Select a mapping from the dropdown above and use the code editor to implement the transformation.</p>
          </div>
        </div>
        
        <!-- Chat input area -->
        <div class="p-3 border-t border-gray-200 bg-gray-50">
          <div class="flex gap-2">
            <textarea id="chat-input" placeholder="Type your message here..." rows="2"
                     class="flex-grow border border-gray-300 rounded-md p-2 text-gray-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"></textarea>
            <button id="chat-send-btn" class="bg-amber-800 text-white px-4 py-2 rounded-md hover:bg-amber-700 self-end">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Setup the mapping dropdown
 */
function setupMappingDropdown() {
  const selector = document.getElementById('mapping-selector');
  if (!selector) return;

  // Populate dropdown with mapping options
  Object.keys(mapping).forEach(key => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = key;
    selector.appendChild(option);
  });

  // Handle selection changes
  selector.addEventListener('change', (e) => {
    updateSelectedMapping(e.target.value);
  });
}

/**
 * Update when a new mapping is selected
 */
function updateSelectedMapping(mappingKey) {
  currentMappingKey = mappingKey;

  // Get current language
  const language = currentLanguage;

  // Generate appropriate code template based on the mapping and language
  if (editor) {
    if (language === 'javascript') {
      editor.setValue(generateJavaScriptCode(mappingKey));
    } else {
      editor.setValue(generateRCode(mappingKey));
    }
  }

  // If we're switching to a new mapping, we might need to reset the data
  // to its original state so transformations can be applied
  const canApplyTransform = checkTransformationApplicability(mappingKey, currentData);
  if (!canApplyTransform) {
    // Reset to original data if the transformation isn't applicable to current data
    resetToOriginalData();
  }
}

/**
 * Generate JavaScript code for the selected mapping
 */
function generateJavaScriptCode(mappingKey) {
  switch (mappingKey) {
    case 'BMXHT → HEIGHT':
      return generateHeightTransformJS();
    case 'DMDEDUC2 → EDUCATION':
      return generateEducationTransformJS();
    case 'ALQ130 → ALC':
      return generateAlcoholTransformJS();
    case '{ SMQ020, SMQ040 } → SMOKE':
      return generateSmokeTransformJS();
    default:
      return '// Please select a mapping from the dropdown';
  }
}

/**
 * Generate R code for the selected mapping
 */
function generateRCode(mappingKey) {
  switch (mappingKey) {
    case 'BMXHT → HEIGHT':
      return generateHeightTransformR();
    case 'DMDEDUC2 → EDUCATION':
      return generateEducationTransformR();
    case 'ALQ130 → ALC':
      return generateAlcoholTransformR();
    case '{ SMQ020, SMQ040 } → SMOKE':
      return generateSmokeTransformR();
    default:
      return '# Please select a mapping from the dropdown';
  }
}

/**
 * Set up the code editor
 */
function setupCodeEditor() {
  // Load CodeMirror library
  loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.js', () => {
    loadCSS('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.css');
    loadCSS('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/theme/monokai.min.css');

    // Load language modes
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/javascript/javascript.min.js', () => {
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/r/r.min.js', () => {
        // Initialize editor
        const editorArea = document.getElementById('editor-area');
        editor = CodeMirror(editorArea, {
          mode: 'javascript',
          theme: 'monokai',
          lineNumbers: true,
          indentUnit: 2,
          tabSize: 2,
          autoCloseBrackets: true,
          matchBrackets: true,
          value: '// Select a mapping from the dropdown to start'
        });

        // Make editor responsive
        window.addEventListener('resize', () => {
          editor.refresh();
        });

        // Load additional editor add-ons
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/edit/matchbrackets.min.js');
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/edit/closebrackets.min.js');

        // Set up language toggle buttons
        setupLanguageToggle();

        // Set up transform and undo buttons
        setupActionButtons();
      });
    });
  });
}

/**
 * Set up language toggle buttons
 */
function setupLanguageToggle() {
  const jsButton = document.getElementById('js-button');
  const rButton = document.getElementById('r-button');

  jsButton.addEventListener('click', () => {
    if (currentLanguage !== 'javascript') {
      currentLanguage = 'javascript';
      editor.setOption('mode', 'javascript');

      // Update button styles
      jsButton.classList.add('bg-amber-800', 'text-white');
      jsButton.classList.remove('bg-gray-200', 'text-gray-700');
      rButton.classList.remove('bg-amber-800', 'text-white');
      rButton.classList.add('bg-gray-200', 'text-gray-700');

      // Update code to JavaScript
      if (currentMappingKey) {
        editor.setValue(generateJavaScriptCode(currentMappingKey));
      }
    }
  });

  rButton.addEventListener('click', () => {
    if (currentLanguage !== 'r') {
      currentLanguage = 'r';
      editor.setOption('mode', 'r');

      // Update button styles
      rButton.classList.add('bg-amber-800', 'text-white');
      rButton.classList.remove('bg-gray-200', 'text-gray-700');
      jsButton.classList.remove('bg-amber-800', 'text-white');
      jsButton.classList.add('bg-gray-200', 'text-gray-700');

      // Update code to R
      if (currentMappingKey) {
        editor.setValue(generateRCode(currentMappingKey));
      }

      // Initialize webR if needed
      if (!webRInitialized) {
        initializeWebR();
      }
    }
  });
}

/**
 * Set up transform and undo buttons
 */
function setupActionButtons() {
  const transformButton = document.getElementById('transform-button');
  const undoButton = document.getElementById('undo-button');
  const outputContent = document.getElementById('output-content');

  transformButton.addEventListener('click', () => {
    // Add loading indicator
    transformButton.disabled = true;
    transformButton.innerHTML = '<span class="inline-block w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Transforming...';
    outputContent.textContent = 'Transforming data...';

    if (currentLanguage === 'javascript') {
      // For JavaScript, execute the transformation
      setTimeout(() => {
        const code = editor.getValue();

        // Check if the code has been modified since the last execution
        const isCodeModified = lastCode !== code;

        // Execute transformation
        executeTransformation(code, outputContent);

        // Reset button
        transformButton.disabled = false;
        transformButton.textContent = 'Transform';

        // Enable undo button since we now have a previous state
        if (previousData) {
          undoButton.disabled = false;
          undoButton.style.opacity = '1';
        }
      }, 100);
    } else {
      // For R, just show the code (no actual transformation)
      executeRCode(editor.getValue(), outputContent).finally(() => {
        transformButton.disabled = false;
        transformButton.textContent = 'Transform';
      });
    }
  });

  undoButton.addEventListener('click', () => {
    if (previousData) {
      // Log the undo operation
      console.log("Undoing transformation...");

      // Update current data back to previous state
      currentData = JSON.parse(JSON.stringify(previousData));

      // Update the table with previous data
      updateTable(previousData);

      // Update output message
      outputContent.textContent = 'Transformation undone. Data restored to previous state.';

      // Disable undo button
      undoButton.disabled = true;
      undoButton.style.opacity = '0.5';
    }
  });
}

/**
 * Set up the data table using AG-Grid
 */
function setupDataTable() {
  console.log("Setting up AG-Grid data table");
  const container = document.getElementById('data-table-container');
  if (!container) {
    console.error("Data table container not found");
    return;
  }

  // Ensure we have data
  if (!currentData || !Array.isArray(currentData) || currentData.length === 0) {
    console.error("No data available for table setup");
    const errorMessage = document.createElement('div');
    errorMessage.className = 'p-4 text-red-600';
    errorMessage.textContent = 'No data available to display';
    container.appendChild(errorMessage);
    return;
  }

  // Generate column definitions
  const columnDefs = deriveColumnDefs(currentData);

  // Create AG-Grid options
  const gridOptions = {
    columnDefs: columnDefs,
    rowData: currentData,
    defaultColDef: {
      flex: 1,
      minWidth: 100,
      resizable: true,
      sortable: true,
      filter: true,
      editable: false, // Read-only since this grid is for display only
      cellStyle: params => {
        return {
          textAlign: params.colDef.type === 'numericColumn' ? 'right' : 'left',
          backgroundColor: params.value === null ? '#f9fafb' : null // Light gray background for null values
        };
      }
    },
    animateRows: true,
    pagination: true,
    paginationAutoPageSize: true,
    rowHeight: 35,
    onGridReady: params => {
      gridApi = params.api;
      // Resize columns to fit when grid is ready
      if (isElementVisible(container)) {
        setTimeout(() => {
          params.api.sizeColumnsToFit();
        }, 100);
      }
    },
    getRowStyle: params => {
      return { background: params.rowIndex % 2 === 0 ? "#ffffff" : "#f3f4f6" };
    }
  };

  // Create the grid
  agGrid.createGrid(container, gridOptions);

  // Set up tab change listeners to handle resize
  setupTabChangeListeners();
}

/**
 * Derive column definitions from the data
 */
function deriveColumnDefs(data) {
  if (!data || data.length === 0) {
    return [];
  }

  // Get all unique keys from all objects in the data
  const allKeys = new Set();
  data.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });

  // Convert to array and sort alphabetically for consistent display
  const headers = Array.from(allKeys).sort();

  return headers.map(header => {
    const colDef = {
      field: header,
      headerName: header
    };

    // Determine the column type based on the first non-null value found
    let valueType = null;
    for (const row of data) {
      if (row[header] !== null && row[header] !== undefined) {
        valueType = typeof row[header];
        break;
      }
    }

    // Add type-specific formatting
    if (valueType === 'number') {
      colDef.type = 'numericColumn';
      colDef.filter = 'agNumberColumnFilter';
    }

    // Add value formatter for null values
    colDef.valueFormatter = params => {
      if (params.value === null) {
        return 'NULL';
      }
      return params.value;
    };

    return colDef;
  });
}

/**
 * Update the table with new data
 */
function updateTable(data) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.error("Cannot update table: Invalid data");
    return;
  }

  if (gridApi) {
    // First, derive new column definitions based on the transformed data
    const newColumnDefs = deriveColumnDefs(data);

    // Update column definitions first
    gridApi.setGridOption('columnDefs', newColumnDefs);

    // Then update the row data
    gridApi.setGridOption('rowData', data);

    // Force a refresh of the grid
    setTimeout(() => {
      gridApi.redrawRows();
    }, 50);

    console.log("Updated grid with new columns:", newColumnDefs.map(col => col.field));
  } else {
    console.error("Cannot update table: AG-Grid API not initialized");
  }
}

/**
 * Set up listeners for tab changes to handle grid resizing
 */
function setupTabChangeListeners() {
  // For desktop tabs
  const tabLinks = document.querySelectorAll('.tab-link[data-tabname="Data Transform"]');
  tabLinks.forEach(link => {
    link.addEventListener('click', handleDataTransformTabActivation);
  });

  // For mobile dropdown
  const navSelect = document.getElementById('nav-select');
  if (navSelect) {
    navSelect.addEventListener('change', (event) => {
      if (event.target.value === 'Data Transform') {
        handleDataTransformTabActivation();
      }
    });
  }
}

/**
 * Handle when the Data Transform tab is activated
 */
function handleDataTransformTabActivation() {
  // Allow DOM to update and make the tab visible first
  setTimeout(() => {
    if (gridApi) {
      gridApi.sizeColumnsToFit();
    }
    if (editor) {
      editor.refresh();
    }
  }, 50);  // Small delay to ensure the tab is visible
}

/**
 * Execute the transformation code and update the table
 */
function executeTransformation(code, outputElement) {
  try {
    console.log("Starting transformation...");

    // Make sure we have data to transform
    if (!currentData || !Array.isArray(currentData) || currentData.length === 0) {
      outputElement.textContent = "Error: No data available for transformation";
      console.error("No data available for transformation");
      return;
    }

    // Check if the transformation can be applied by examining the source fields
    const canApplyTransform = checkTransformationApplicability(currentMappingKey, currentData);
    if (!canApplyTransform) {
      outputElement.textContent = "Notice: Transformation cannot be applied because the source fields are not present in the current data.       outputElement.textContent = \"Notice: Transformation cannot be applied because the source fields are not present in the current data. This could mean that the transformation has already been applied and the code has since not undergone any changes.";
      console.log("Transformation not applicable - source fields not found");
      return;
    }

    // Store the current state before transformation for undo
    previousData = JSON.parse(JSON.stringify(currentData));
    console.log("Saved previous state with", previousData.length, "rows");

    // Create a sandbox environment for code execution
    const sandbox = createSandbox();

    // Set up console logging
    const logOutput = [];
    sandbox.console = {
      log: (...args) => {
        const message = args.map(formatOutput).join(' ');
        logOutput.push(message);
        console.log("Transform output:", message);
      },
      error: (...args) => {
        const message = 'ERROR: ' + args.map(formatOutput).join(' ');
        logOutput.push(message);
        console.error("Transform error:", message);
      }
    };

    // Pass current data to the sandbox
    sandbox.targetData = currentData;

    // Execute the code in the sandbox
    let result;
    try {
      // Create a safe evaluation function
      const evalFunction = new Function(
        ...Object.keys(sandbox),
        `try {
          ${code}
          //# sourceURL=transformation.js
        } catch(e) {
          console.error("Code execution error:", e.message);
          throw e;
        }`
      );

      // Call the function with sandbox values
      evalFunction(...Object.values(sandbox));

      // For the transformation code, the result is in the last statement
      // Extract the transformed data from the return statement
      const returnMatch = code.match(/return\s+(\w+)\s*;/);
      if (returnMatch && returnMatch[1] === 'transformedData') {
        console.log("Found return value in code");

        // Re-evaluate just to get the result
        const resultFunction = new Function(
          'targetData',
          `${code}
           //# sourceURL=result-extraction.js`
        );

        result = resultFunction(currentData);
        console.log("Extracted result with", result ? result.length : 0, "rows");
      } else {
        // For legacy/custom code formats
        const lastVariable = code.match(/const\s+(\w+)\s*=.*?\n.*?return\s+\1\s*;/s);
        if (lastVariable && lastVariable[1]) {
          // Try to re-execute to just get the result
          const resultFunction = new Function(
            'targetData',
            `${code}
             //# sourceURL=legacy-extraction.js`
          );

          result = resultFunction(currentData);
        } else {
          throw new Error("Could not extract transformation result from code");
        }
      }
    } catch (error) {
      outputElement.textContent = `Transformation error: ${error.message}`;
      console.error("Transformation execution failed:", error);
      return;
    }

    // Validate the result
    if (!result || !Array.isArray(result) || result.length === 0) {
      outputElement.textContent = 'Error: Transformation did not return valid data';
      console.error("Invalid transformation result");
      return;
    }

    // Update current data state
    currentData = result;
    console.log("Updated current data state with transformed data");

    // Update the table display
    updateTable(result);

    // Save the code that was just successfully executed
    lastCode = code;

    // Show success message
    outputElement.textContent = 'Transformation completed successfully!';
    if (logOutput.length > 0) {
      outputElement.textContent += '\n\n' + logOutput.join('\n');
    }

  } catch (error) {
    outputElement.textContent = `Error: ${error.message}`;
    console.error("Transformation failed:", error);
  }
}

/**
 * Create a sandbox environment for code execution
 */
function createSandbox() {
  // Create a sandboxed environment for safe code execution
  return {
    // Standard methods that transformation code might need
    JSON: JSON,
    Array: Array,
    Object: Object,
    Math: Math,
    Number: Number,
    String: String,
    console: console
  };
}

/**
 * Format output values for console logging
 */
function formatOutput(val) {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val, null, 2);
    } catch (e) {
      return val.toString();
    }
  }
  return String(val);
}

/**
 * Execute R code (for display purposes only)
 */
async function executeRCode(code, outputElement) {
  if (!webRInitialized) {
    outputElement.textContent = 'WebR is not initialized yet. Please wait...';
    return;
  }

  try {
    outputElement.textContent = 'Running R code...';
    // This would run the R code in a real implementation
    outputElement.textContent = 'WebR is not loaded. R code execution requires WebR.\n';
  } catch (error) {
    outputElement.textContent = 'Error executing R code: ' + error.message;
  }
}

/**
 * Initialize WebR for R code execution
 */
function initializeWebR() {
  const outputContent = document.getElementById('output-content');
  outputContent.textContent = 'Initializing WebR... (simulated)';

  // In a real implementation, this would load and initialize WebR
  setTimeout(() => {
    webRInitialized = true;
    outputContent.textContent = 'WebR initialized! Ready to run R code.';
  }, 1000);
}

/**
 * Set up the chat interface
 */
function setupChatInterface() {
  const fileInput = document.getElementById('chat-file-upload');
  const filesList = document.getElementById('attached-files-list');
  const chatInput = document.getElementById('chat-input');
  const sendButton = document.getElementById('chat-send-btn');
  const messagesContainer = document.getElementById('chat-messages');

  // Handle file uploads
  fileInput.addEventListener('change', () => {
    filesList.innerHTML = '';
    if (fileInput.files.length === 0) return;

    Array.from(fileInput.files).forEach(file => {
      const fileChip = document.createElement('div');
      fileChip.className = 'bg-gray-200 text-gray-800 px-2 py-1 rounded-md text-sm flex items-center';

      const fileName = document.createElement('span');
      fileName.className = 'mr-2 truncate max-w-[150px]';
      fileName.textContent = file.name;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'text-gray-500 hover:text-gray-700';
      removeBtn.innerHTML = '&times;';
      removeBtn.addEventListener('click', () => fileChip.remove());

      fileChip.appendChild(fileName);
      fileChip.appendChild(removeBtn);
      filesList.appendChild(fileChip);
    });
  });

  // Handle sending messages
  function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message
    addMessageToChat('user', message);

    // Clear input
    chatInput.value = '';

    // Simulate assistant response
    simulateAssistantResponse();
  }

  sendButton.addEventListener('click', sendMessage);

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}

/**
 * Add a message to the chat
 */
function addMessageToChat(role, content) {
  const messagesContainer = document.getElementById('chat-messages');
  const messageElement = document.createElement('div');
  messageElement.className = role === 'user'
    ? 'bg-amber-50 rounded-lg p-3 mb-3 ml-auto max-w-2xl'
    : 'bg-gray-100 rounded-lg p-3 mb-3 max-w-2xl';

  messageElement.textContent = content;
  messagesContainer.appendChild(messageElement);

  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Simulate assistant response
 */
function simulateAssistantResponse() {
  const messagesContainer = document.getElementById('chat-messages');

  // Add loading indicator
  const loadingElement = document.createElement('div');
  loadingElement.className = 'bg-gray-100 rounded-lg p-3 mb-3 max-w-2xl flex items-center';
  loadingElement.innerHTML = '<span class="inline-block w-3 h-3 mr-2 bg-gray-500 rounded-full animate-pulse"></span>' +
                           '<span class="inline-block w-3 h-3 mx-1 bg-gray-500 rounded-full animate-pulse" style="animation-delay: 0.2s"></span>' +
                           '<span class="inline-block w-3 h-3 ml-1 bg-gray-500 rounded-full animate-pulse" style="animation-delay: 0.4s"></span>';
  messagesContainer.appendChild(loadingElement);

  // Simulate response delay
  setTimeout(() => {
    // Remove loading indicator
    messagesContainer.removeChild(loadingElement);

    // Add assistant response based on current mapping
    let responseText = "I can help you with data transformations. ";

    if (currentMappingKey) {
      responseText += `I see you're working on the "${currentMappingKey}" mapping. ` +
        "What specific questions do you have about this transformation?";
    } else {
      responseText += "Please select a mapping from the dropdown to get started.";
    }

    addMessageToChat('assistant', responseText);
  }, 1000);
}

/**
 * Check if an element is visible (not hidden by CSS)
 */
function isElementVisible(el) {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 &&
    window.getComputedStyle(el).display !== 'none' &&
    window.getComputedStyle(el).visibility !== 'hidden';
}

/**
 * Load a script dynamically
 */
function loadScript(url, callback) {
  const script = document.createElement('script');
  script.src = url;
  script.onload = callback || (() => {});
  document.head.appendChild(script);
}

/**
 * Load CSS dynamically
 */
function loadCSS(url) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

/**
 * Check if a transformation can be applied to the current data
 * by checking if the source fields exist in the data
 */
function checkTransformationApplicability(mappingKey, data) {
  if (!data || data.length === 0 || !mappingKey || !mapping[mappingKey]) {
    return false;
  }

  // Get the first data item to check for field presence
  const firstRow = data[0];

  // Get the source and target concepts from the mapping
  const mapDef = mapping[mappingKey];

  // Check source fields based on the mapping type
  switch (mappingKey) {
    case 'DMDEDUC2 → EDUCATION':
      // Check if DMDEDUC2 exists (source) and EDUCATION doesn't (target not already transformed)
      return 'DMDEDUC2' in firstRow && !('EDUCATION' in firstRow);

    case 'BMXHT → HEIGHT':
      // Check if BMXHT exists (source) and HEIGHT doesn't (target not already transformed)
      return 'BMXHT' in firstRow && !('HEIGHT' in firstRow);

    case 'ALQ130 → ALC':
      // Check if ALQ130 exists (source) and ALC doesn't (target not already transformed)
      return 'ALQ130' in firstRow && !('ALC' in firstRow);

    case '{ SMQ020, SMQ040 } → SMOKE':
      // Check if both SMQ020 and SMQ040 exist (sources) and SMOKE doesn't (target not already transformed)
      return 'SMQ020' in firstRow && 'SMQ040' in firstRow && !('SMOKE' in firstRow);

    default:
      // For unknown mappings, assume it's applicable
      return true;
  }
}

/**
 * Reset to original data
 */
function resetToOriginalData() {
  if (originalData) {
    // Reset current data to original data
    currentData = JSON.parse(JSON.stringify(originalData));

    // Update the table
    updateTable(currentData);

    console.log("Reset data to original state");

    // Clear previous data to disable undo
    previousData = null;

    // Update UI to reflect the reset
    const undoButton = document.getElementById('undo-button');
    if (undoButton) {
      undoButton.disabled = true;
      undoButton.style.opacity = '0.5';
    }

    const outputContent = document.getElementById('output-content');
    if (outputContent) {
      outputContent.textContent = 'Data reset to original state.';
    }
  }
}

// ==========================================
// Transformation Templates
// ==========================================

/**
 * Generate JavaScript code for BMXHT → HEIGHT transformation
 */
function generateHeightTransformJS() {
  return `/**
 * Data Transform Function for BMXHT → HEIGHT mapping
 * 
 * This function transforms standing height from centimeters (BMXHT) to inches (HEIGHT).
 * The source schema requires heights to be in inches, restricted to 48-84 inches.
 * Any values outside this range or null values will be set to null.
 */

// Create a deep copy of the data to avoid modifying the original
const transformedData = JSON.parse(JSON.stringify(targetData));

// Conversion factor from cm to inches
const CM_TO_INCHES = 0.393701;

// Log the original data
console.log("Processing", transformedData.length, "rows of data");
console.log("First row before:", JSON.stringify(transformedData[0]));

// Perform the transformation for each row
transformedData.forEach(row => {
  // Convert cm to inches if BMXHT exists and is not null
  if (row.BMXHT != null) {
    // Convert the height from cm to inches
    const heightInInches = row.BMXHT * CM_TO_INCHES;
    
    // Check if the height is within the valid range (48-84 inches)
    if (heightInInches >= 48 && heightInInches <= 84) {
      // Round to 1 decimal place for consistency
      row.HEIGHT = Math.round(heightInInches * 10) / 10;
    } else {
      // Height outside of valid range - set to null
      row.HEIGHT = null;
    }
  } else {
    // BMXHT is null or undefined, so HEIGHT should be null
    row.HEIGHT = null;
  }
  
  // Remove the original BMXHT field
  delete row.BMXHT;
});

console.log("First row after:", JSON.stringify(transformedData[0]));

// Return the transformed data (this will update the table)
return transformedData;
`;
}

/**
 * Generate JavaScript code for DMDEDUC2 → EDUCATION transformation
 */
function generateEducationTransformJS() {
  return `/**
 * Data Transform Function for DMDEDUC2 → EDUCATION mapping
 * 
 * This function transforms education level coding from DMDEDUC2 to EDUCATION.
 * 
 * DMDEDUC2 values:
 * 1: "Less than 9th grade"
 * 2: "9-11th grade (Includes 12th grade with no diploma)"
 * 3: "High school graduate/GED or equivalent"
 * 4: "Some college or AA degree"
 * 5: "College graduate or above"
 * 7, 9, null: Refused, Don't Know, Missing
 * 
 * EDUCATION values:
 * 1: "Did not finish high school"
 * 2: "High school"
 * 3: "Some college"
 * 4: "Completed college"
 * 5: "Postgraduate"
 * 9: "Unknown"
 * null: "Missing/not provided"
 */

// Create a deep copy of the data to avoid modifying the original
const transformedData = JSON.parse(JSON.stringify(targetData));

// Log the original data
console.log("Processing education data for", transformedData.length, "rows");
console.log("First row before:", JSON.stringify(transformedData[0]));

// Perform the transformation for each row
transformedData.forEach(row => {
  // Map DMDEDUC2 to EDUCATION based on the defined mapping
  const dmdeduc2 = row.DMDEDUC2;
  
  // Set EDUCATION based on DMDEDUC2 value
  if (dmdeduc2 == null) {
    // Missing value
    row.EDUCATION = null;
  } else if (dmdeduc2 === 1 || dmdeduc2 === 2) {
    // Did not finish high school (1)
    // Includes less than 9th grade and 9-11th grade (Includes 12th grade with no diploma)
    row.EDUCATION = 1;
  } else if (dmdeduc2 === 3) {
    // High school (2)
    // Includes High school graduate/GED or equivalent
    row.EDUCATION = 2;
  } else if (dmdeduc2 === 4) {
    // Some college (3)
    // Includes Some college or AA degree
    row.EDUCATION = 3;
  } else if (dmdeduc2 === 5) {
    // Completed college (4)
    // Includes College graduate or above
    row.EDUCATION = 4;
  } else if (dmdeduc2 === 7 || dmdeduc2 === 9) {
    // Refused or Don't Know mapped to Unknown (9)
    row.EDUCATION = 9;
  } else {
    // Any other unexpected values
    row.EDUCATION = 9; // Unknown
  }
  
  // Remove the original DMDEDUC2 field
  delete row.DMDEDUC2;
});

console.log("First row after:", JSON.stringify(transformedData[0]));

// Return the transformed data
return transformedData;
`;
}

/**
 * Generate JavaScript code for ALQ130 → ALC transformation
 */
function generateAlcoholTransformJS() {
  return `/**
 * Data Transform Function for ALQ130 → ALC mapping
 * 
 * This function transforms average number of drinks per day (ALQ130) to 
 * alcohol intake in grams per day (ALC).
 * 
 * According to the National Institute on Alcohol Abuse and Alcoholism (NIAAA),
 * a standard US drink contains approximately 14 grams of pure alcohol.
 * 
 * ALQ130 values:
 * 1-14: Numeric response (drinks per day)
 * 15: "15 drinks or more"
 * 777: "Refused"
 * 999: "Don't know"
 * null: Missing
 * 
 * ALC values:
 * number: Alcohol intake in grams per day (≥ 0)
 * null: Missing
 */

// Create a deep copy of the data to avoid modifying the original
const transformedData = JSON.parse(JSON.stringify(targetData));

// Standard US drink contains 14 grams of pure alcohol according to NIAAA
const GRAMS_PER_DRINK = 14;

// Log the original data
console.log("Processing alcohol data for", transformedData.length, "rows");
console.log("Sample row before:", JSON.stringify(transformedData[0]));

// Perform the transformation for each row
transformedData.forEach(row => {
  const alq130 = row.ALQ130;
  
  // Convert drinks to grams of alcohol
  if (alq130 == null || alq130 === 777 || alq130 === 999) {
    // Missing, Refused, or Don't know -> set to null
    row.ALC = null;
  } else if (alq130 >= 1 && alq130 <= 14) {
    // Regular numeric responses (1-14 drinks)
    row.ALC = alq130 * GRAMS_PER_DRINK;
  } else if (alq130 === 15) {
    // "15 drinks or more" - use 15 as a minimum
    row.ALC = 15 * GRAMS_PER_DRINK;
  } else {
    // Any other unexpected values
    row.ALC = null;
  }
  
  // Remove the original ALQ130 field
  delete row.ALQ130;
});

console.log("Sample row after:", JSON.stringify(transformedData[0]));

// Return the transformed data
return transformedData;
`;
}

/**
 * Generate JavaScript code for {SMQ020, SMQ040} → SMOKE transformation
 */
function generateSmokeTransformJS() {
  return `/**
 * Data Transform Function for {SMQ020, SMQ040} → SMOKE mapping
 * 
 * This function transforms two smoking variables (SMQ020, SMQ040) into a single smoking status variable (SMOKE).
 * 
 * SMQ020 values: "Smoked at least 100 cigarettes in life"
 * 1: "Yes"
 * 2: "No"
 * 7: "Refused"
 * 9: "Don't know"
 * null: "Missing"
 * 
 * SMQ040 values: "Do you now smoke cigarettes?"
 * 1: "Every day"
 * 2: "Some days"
 * 3: "Not at all"
 * 7: "Refused"
 * 9: "Don't know"
 * null: "Missing"
 * 
 * SMOKE values:
 * 0: "Never (0)"
 * 1: "Former (1)"
 * 2: "Current (2)"
 * null: "Missing/unknown"
 */

// Create a deep copy of the data to avoid modifying the original
const transformedData = JSON.parse(JSON.stringify(targetData));

// Log the original data
console.log("Processing smoking data for", transformedData.length, "rows");
console.log("Sample row before:", JSON.stringify(transformedData[0]));

// Perform the transformation for each row
transformedData.forEach(row => {
  const smq020 = row.SMQ020; // Smoked at least 100 cigarettes in life
  const smq040 = row.SMQ040; // Do you now smoke cigarettes
  
  // Determine smoking status
  if (smq020 == null || smq040 == null || 
      smq020 === 7 || smq020 === 9 || 
      smq040 === 7 || smq040 === 9) {
    // Missing or refused or don't know for either variable
    row.SMOKE = null;
  } else if (smq020 === 2) {
    // Never smoked 100 cigarettes = Never smoker (0)
    row.SMOKE = 0;
  } else if (smq020 === 1 && smq040 === 3) {
    // Smoked 100 cigarettes but not currently smoking = Former smoker (1)
    row.SMOKE = 1;
  } else if (smq020 === 1 && (smq040 === 1 || smq040 === 2)) {
    // Smoked 100 cigarettes and currently smoking (every day or some days) = Current smoker (2)
    row.SMOKE = 2;
  } else {
    // Any other combination (should be rare)
    row.SMOKE = null;
  }
  
  // Remove the original smoking fields
  delete row.SMQ020;
  delete row.SMQ040;
});

console.log("Sample row after:", JSON.stringify(transformedData[0]));

// Return the transformed data
return transformedData;
`;
}

/**
 * Generate R code for BMXHT → HEIGHT transformation
 */
function generateHeightTransformR() {
  return `library(dplyr)

transform_bmxht_to_height <- function(df) {
  df %>%
    mutate(
      # Convert cm to inches (1 cm ~ 0.393701 inches)
      HEIGHT = ifelse(
        !is.na(BMXHT),
        round(BMXHT * 0.393701, 1),  # round to 1 decimal place
        NA
      ),
      # Enforce 48–84 inch range; otherwise set to NA
      HEIGHT = ifelse(
        HEIGHT >= 48 & HEIGHT <= 84,
        HEIGHT,
        NA
      )
    ) %>%
    # Remove the original BMXHT column
    select(-BMXHT)
}

`;
}

/**
 * Generate R code for DMDEDUC2 → EDUCATION transformation
 */
function generateEducationTransformR() {
  return `library(dplyr)

transform_dmdeduc2_to_education <- function(df) {
  df %>%
    mutate(
      EDUCATION = case_when(
        DMDEDUC2 %in% c(1, 2) ~ 1,  # Did not finish high school
        DMDEDUC2 == 3         ~ 2,  # High school
        DMDEDUC2 == 4         ~ 3,  # Some college
        DMDEDUC2 == 5         ~ 4,  # Completed college
        DMDEDUC2 %in% c(7, 9) ~ 9,  # Unknown
        TRUE                  ~ NA_real_
      )
    ) %>%
    select(-DMDEDUC2)
}
`;
}

/**
 * Generate R code for ALQ130 → ALC transformation
 */
function generateAlcoholTransformR() {
  return `library(dplyr)

transform_alq130_to_alc <- function(df) {
  # Each standard US drink is ~14 grams of pure alcohol
  grams_per_drink <- 14
  
  df %>%
    mutate(
      ALC = case_when(
        ALQ130 %in% 1:14 ~ ALQ130 * grams_per_drink,
        ALQ130 == 15     ~ 15 * grams_per_drink,   # "15 drinks or more"
        TRUE             ~ NA_real_
      )
    ) %>%
    select(-ALQ130)
}
`;
}

/**
 * Generate R code for {SMQ020, SMQ040} → SMOKE transformation
 */
function generateSmokeTransformR() {
  return `library(dplyr)

transform_smoking_status <- function(df) {
  df %>%
    mutate(
      SMOKE = case_when(
        # Any missing/refused/don't know for either variable => NA
        is.na(SMQ020) | is.na(SMQ040) ~ NA_real_,
        SMQ020 == 2                   ~ 0,  # Never smoked (0)
        SMQ020 == 1 & SMQ040 == 3     ~ 1,  # Former (1)
        SMQ020 == 1 & SMQ040 %in% c(1,2) ~ 2,  # Current (2)
        TRUE                          ~ NA_real_
      )
    ) %>%
    select(-SMQ020, -SMQ040)
}
`;
}