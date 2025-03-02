import Handsontable from 'handsontable';
import Ajv from 'ajv';

// Example target data (for testing purposes)
const exampleTargetData = [
    {
        "NEWID": 1,
        "ENTRYAGE": 62,
        "EDUCATION": 4,
        "HEIGHT": 65,
        "BMI": 24.8,
        "ALC": 5.2,
        "SMOKE": 0
    },
    {
        "NEWID": 2,
        "ENTRYAGE": 58,
        "EDUCATION": 2,
        "HEIGHT": 70,
        "BMI": 28.1,
        "ALC": 12.0,
        "SMOKE": 1
    },
    {
        "NEWID": 3,
        "ENTRYAGE": 71,
        "EDUCATION": 5,
        "HEIGHT": 68,
        "BMI": 32.5,
        "ALC": 0.0,
        "SMOKE": 2
    },
    {
        "NEWID": 4,
        "ENTRYAGE": 49,
        "EDUCATION": 3,
        "HEIGHT": 62,
        "BMI": 150,
        "ALC": 20.0,
        "SMOKE": 0
    },
    {
        "NEWID": 5,
        "ENTRYAGE": 85,
        "EDUCATION": 1,
        "HEIGHT": 45,
        "BMI": 21.0,
        "ALC": null,
        "SMOKE": null
    },
    {
        "NEWID": 6,
        "ENTRYAGE": "Sixty",
        "EDUCATION": 6,
        "HEIGHT": 72,
        "BMI": 26.3,
        "ALC": 8.7,
        "SMOKE": 1
    },
    {
        "NEWID": 7,
        "ENTRYAGE": 55,
        "EDUCATION": 9,
        "HEIGHT": 67,
        "BMI": 12.0,
        "ALC": 1.1,
        "SMOKE": 2
    },
    {
        "NEWID": 8,
        "ENTRYAGE": 68,
        "EDUCATION": 4,
        "HEIGHT": 80,
        "BMI": 29.5,
        "ALC": -3,
        "SMOKE": 0
    },
    {
        "NEWID": 9,
        "ENTRYAGE": 51,
        "EDUCATION": 2,
        "HEIGHT": 69,
        "BMI": 23.7,
        "ALC": 15,
        "SMOKE": 3
    },
    {
        "NEWID": 10,
        "ENTRYAGE": null,
        "EDUCATION": null,
        "HEIGHT": null,
        "BMI": null,
        "ALC": null,
        "SMOKE": null
    }
];


// Example source schema (for testing purposes)
const exampleSourceSchema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "Ovarian Cancer Cohort Consortium (OC3) Data Schema",
    type: "object",
    additionalProperties: false,
    properties: {
        NEWID: {
            type: "integer",
            description: "Unique ID for each study participant (sequential)."
        },

        ENTRYAGE: {
            type: "number", // Changed from ["number", "null"] to only allow numbers
            description: "Age at entry (QXAGE in years)."
        },

        EDUCATION: {
            description: "Highest level of education",
            type: ["integer", "null"],
            enum: [1, 2, 3, 4, 5, 9, null],
            enumDescriptions: [
                "Did not finish high school (1)",
                "High school (2)",
                "Some college (3)",
                "Completed college (4)",
                "Postgraduate (5)",
                "Unknown (9)",
                "Missing/not provided"
            ]
        },

        HEIGHT: {
            description: "Height in inches; set missing if <48 or >84.",
            oneOf: [
                {
                    type: "number",
                    minimum: 48,
                    maximum: 84
                },
                {type: "null"}
            ]
        },

        BMI: {
            description: "Body mass index (kg/m^2); set missing if <14 or >60.",
            oneOf: [
                {
                    type: "number",
                    minimum: 14,
                    maximum: 60
                },
                {type: "null"}
            ]
        },

        ALC: {
            type: ["number", "null"],
            description: "Alcohol intake (grams/day). Null if missing."
        },

        SMOKE: {
            description: "Smoking status",
            type: ["integer", "null"],
            enum: [0, 1, 2, null],
            enumDescriptions: [
                "Never (0)",
                "Former (1)",
                "Current (2)",
                "Missing/unknown"
            ]
        }
    }
};


/**
 * Initializes the Quality Control tab UI with improved error reporting
 */
function initQualityControlApp() {
    const container = document.getElementById('quality-control-app');
    if (!container) return;

    // Clear any existing content
    container.innerHTML = '';

    // Create the QC UI
    const qcUI = createQualityControlUI(exampleTargetData, exampleSourceSchema);
    container.appendChild(qcUI);

    // Add styles for error display
    addErrorStyles();
}

/**
 * Create the spreadsheet and control UI for Quality Control.
 */
function createQualityControlUI(data, schema) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('qc-wrapper', 'mt-4');

    // Spreadsheet container
    const tableContainer = document.createElement('div');
    tableContainer.id = 'qc-table-container';
    tableContainer.classList.add(
        'w-full',
        'overflow-auto',
        'border',
        'border-gray-200',
        'rounded',
        'mb-6',
        'max-h-96'
    );
    wrapper.appendChild(tableContainer);

    // Build Handsontable instance
    const hot = buildHandsontable(tableContainer, data, schema);

    // Action buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.classList.add('flex', 'gap-3', 'items-center', 'justify-start', 'my-4');
    wrapper.appendChild(buttonsContainer);

    // Validate button
    const validateBtn = document.createElement('button');
    validateBtn.textContent = 'Validate';
    validateBtn.classList.add(
        'bg-amber-800',
        'text-white',
        'px-4',
        'py-2',
        'rounded-md',
        'hover:bg-amber-700',
        'cursor-pointer'
    );
    validateBtn.addEventListener('click', () => {
        validateAgainstSchema(hot, schema, errorLogDiv);
    });
    buttonsContainer.appendChild(validateBtn);

    // Download JSON button
    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = 'Download data';
    downloadBtn.classList.add(
        'bg-white',
        'text-gray-700',
        'border',
        'border-gray-300',
        'px-4',
        'py-2',
        'rounded-md',
        'hover:bg-gray-50',
        'cursor-pointer'
    );
    downloadBtn.addEventListener('click', () => {
        downloadDataAsJson(hot);
    });
    buttonsContainer.appendChild(downloadBtn);

    // Error messages container
    const errorContainer = document.createElement('div');
    errorContainer.classList.add(
        'relative',
        'border',
        'border-gray-300',
        'rounded-md',
        'p-4',
        'mt-4',
        'overflow-y-auto',
        'max-h-80',
        'error-summary-container'
    );
    wrapper.appendChild(errorContainer);

    // Container for displaying the error messages
    const errorLogDiv = document.createElement('div');
    errorLogDiv.classList.add('whitespace-pre-wrap');
    errorContainer.appendChild(errorLogDiv);

    // Copy Errors button
    const copyBtn = document.createElement('button');
    copyBtn.innerHTML = '<span class="button-text">Copy Errors</span>';
    copyBtn.classList.add(
        'absolute',
        'top-2',
        'right-2',
        'bg-white',
        'text-gray-500',
        'border',
        'border-gray-400',
        'hover:text-gray-600',
        'hover:bg-gray-50',
        'rounded',
        'px-2',
        'py-1',
        'text-xs',
        'flex',
        'items-center',
        'gap-1',
        'cursor-pointer'
    );
    const buttonTextEl = copyBtn.querySelector('.button-text');
    const originalClasses = copyBtn.className;
    copyBtn.addEventListener('click', async () => {
        if (!buttonTextEl) return;
        try {
            await navigator.clipboard.writeText(errorLogDiv.innerText);
            copyBtn.className = 'absolute top-2 right-2 bg-white text-green-600 border border-green-400 rounded px-2 py-1 text-xs flex items-center gap-1 cursor-pointer';
            buttonTextEl.textContent = '✓';
            setTimeout(() => {
                copyBtn.className = originalClasses;
                buttonTextEl.textContent = 'Copy Errors';
            }, 1000);
        } catch (err) {
            copyBtn.className = 'absolute top-2 right-2 bg-white text-red-600 border border-red-400 rounded px-2 py-1 text-xs flex items-center gap-1 cursor-pointer';
            buttonTextEl.textContent = '!';
            setTimeout(() => {
                copyBtn.className = originalClasses;
                buttonTextEl.textContent = 'Copy Errors';
            }, 1000);
        }
    });
    errorContainer.appendChild(copyBtn);

    return wrapper;
}

/**
 * Add styles for error display if they don't exist
 */
function addErrorStyles() {
    // Check if styles already exist
    if (document.getElementById('qc-error-styles')) return;

    // Create style element
    const style = document.createElement('style');
    style.id = 'qc-error-styles';
    style.textContent = `
        .htInvalidCell {
            background-color: rgba(239, 68, 68, 0.15) !important;
        }
        
        .htInvalidCell.current {
            box-shadow: inset 0 0 0 2px rgb(239, 68, 68) !important;
        }
    `;

    // Add to document head
    document.head.appendChild(style);
}

function isNumericType(schema) {
    // Check direct type property (string or array)
    if (typeof schema.type === 'string') {
        return schema.type === 'integer' || schema.type === 'number';
    }

    if (Array.isArray(schema.type)) {
        return schema.type.includes('integer') || schema.type.includes('number');
    }

    // Check oneOf pattern
    if (schema.oneOf && Array.isArray(schema.oneOf)) {
        return schema.oneOf.some(option =>
            option.type === 'integer' || option.type === 'number');
    }

    // Check anyOf pattern
    if (schema.anyOf && Array.isArray(schema.anyOf)) {
        return schema.anyOf.some(option =>
            option.type === 'integer' || option.type === 'number');
    }

    // Check allOf pattern (all must be numeric for this to return true)
    if (schema.allOf && Array.isArray(schema.allOf)) {
        return schema.allOf.every(option =>
            option.type === 'integer' || option.type === 'number');
    }

    return false;
}

/**
 * Determine if a field allows null values based on its schema
 */
function allowsNullValues(schema) {
    // Check if null is explicitly included in type array
    if (Array.isArray(schema.type) && schema.type.includes('null')) {
        return true;
    }

    // Check oneOf pattern for null type
    if (schema.oneOf && Array.isArray(schema.oneOf)) {
        return schema.oneOf.some(option => option.type === 'null');
    }

    // Check anyOf pattern for null type
    if (schema.anyOf && Array.isArray(schema.anyOf)) {
        return schema.anyOf.some(option => option.type === 'null');
    }

    // Check enum for null value
    if (schema.enum && Array.isArray(schema.enum)) {
        return schema.enum.includes(null);
    }

    return false;
}

/**
 * Custom renderer that converts empty string to null for numeric fields
 */
function emptyToNullRenderer(instance, td, row, col, prop, value, cellProperties) {
    // Call the original renderer first
    Handsontable.renderers.TextRenderer.apply(this, arguments);

    // If it's a numeric cell and value is empty string, display as "NULL"
    if (cellProperties.type === 'numeric' && value === '') {
        td.innerHTML = '<em class="text-gray-400">NULL</em>';
    }
}

/**
 * Build a Handsontable instance with slightly larger text.
 */
function buildHandsontable(containerEl, data, schema) {
    // Derive column headers and column configurations
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    const columns = headers.map((header) => {
        // Fix schema access - don't look for items layer
        const colSchema = schema?.properties?.[header];
        let colType = 'text';
        let colOptions = {};

        if (colSchema) {
            // Check if field is numeric
            if (isNumericType(colSchema)) {
                colType = 'numeric';

                // Add custom options for numeric fields
                colOptions.allowEmpty = allowsNullValues(colSchema);
                colOptions.renderer = emptyToNullRenderer;
            }

            // Handle enums for dropdown
            if (colSchema.enum && colSchema.enum.length > 0) {
                colType = 'dropdown';
                // Filter out null values from enum list for dropdown
                colOptions.source = colSchema.enum.filter(item => item !== null);
            }
        }

        return {
            data: header,
            type: colType,
            ...colOptions
        };
    });

    // Initialize Handsontable
    const hot = new Handsontable(containerEl, {
        data: data,
        columns: columns,
        rowHeaders: true,
        colHeaders: headers,
        stretchH: 'all',
        height: 'auto',
        autoWrapRow: true,
        autoWrapCol: true,
        contextMenu: true,
        className: 'htLeft htMiddle text-base',
        licenseKey: 'non-commercial-and-evaluation',
        // Handle empty string to null conversion
        beforeChange: function(changes, source) {
            if (!changes) return;

            changes.forEach(change => {
                const [row, prop, oldValue, newValue] = change;

                // Find the column index
                const colIndex = this.propToCol(prop);
                if (colIndex === -1) return;

                // Get column metadata
                const colMeta = this.getCellMeta(row, colIndex);

                // If it's a numeric column and the value is an empty string, set it to null
                if (colMeta.type === 'numeric' && newValue === '') {
                    change[3] = null;
                }
            });
        }
    });

    return hot;
}

/**
 * Displays validation errors with minimal spacing
 */
function displayValidationErrors(errors, errorContainer) {
    // Clear any existing content
    errorContainer.innerHTML = '';

    // Set container to have minimal spacing
    errorContainer.style.padding = '0.75rem';
    errorContainer.style.lineHeight = '1.25';

    if (!errors || errors.length === 0) {
        const successMsg = document.createElement('div');
        successMsg.className = 'text-green-600 font-medium';
        successMsg.textContent = '✓ No errors found';
        errorContainer.appendChild(successMsg);
        return;
    }

    // Group errors by row
    const errorsByRow = {};
    errors.forEach(error => {
        const rowNum = error.rowIndex + 1;
        if (!errorsByRow[rowNum]) {
            errorsByRow[rowNum] = [];
        }
        errorsByRow[rowNum].push({
            field: error.field,
            message: error.message
        });
    });

    // Create error summary div
    const totalRows = Object.keys(errorsByRow).length;
    const totalErrors = errors.length;

    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'text-red-600 font-medium';
    summaryDiv.style.marginBottom = '8px';
    summaryDiv.textContent = `Found ${totalErrors} validation ${totalErrors === 1 ? 'error' : 'errors'} in ${totalRows} ${totalRows === 1 ? 'row' : 'rows'}`;
    errorContainer.appendChild(summaryDiv);

    // Create container for error rows
    const rowsContainer = document.createElement('div');
    rowsContainer.style.margin = '0';
    errorContainer.appendChild(rowsContainer);

    // Add row error sections
    Object.keys(errorsByRow).sort((a, b) => parseInt(a) - parseInt(b)).forEach(rowNum => {
        const rowErrors = errorsByRow[rowNum];

        // Create row container
        const rowDiv = document.createElement('div');
        rowDiv.className = 'border-l-4 border-red-400 pl-3';
        rowDiv.style.marginBottom = '8px';
        rowDiv.style.paddingTop = '2px';
        rowDiv.style.paddingBottom = '2px';
        rowsContainer.appendChild(rowDiv);

        // Row header
        const rowHeader = document.createElement('div');
        rowHeader.className = 'font-medium';
        rowHeader.style.marginBottom = '2px';
        rowHeader.textContent = `Row ${rowNum}:`;
        rowDiv.appendChild(rowHeader);

        // Error list
        const errorList = document.createElement('ul');
        errorList.className = 'ml-4';
        errorList.style.margin = '0';
        errorList.style.paddingLeft = '0.75rem';
        rowDiv.appendChild(errorList);

        // Add each error
        rowErrors.forEach(err => {
            const errorItem = document.createElement('li');
            errorItem.style.marginBottom = '1px';

            const fieldSpan = document.createElement('span');
            fieldSpan.className = 'font-mono bg-gray-100 px-1 rounded';
            fieldSpan.textContent = err.field;

            errorItem.appendChild(fieldSpan);
            errorItem.appendChild(document.createTextNode(`: ${err.message}`));
            errorList.appendChild(errorItem);
        });
    });
}

/**
 * Validate the Handsontable data against the JSON schema with Ajv.
 * Invalid cells get highlighted, and errors are listed in the error div.
 */
function validateAgainstSchema(hotInstance, schema, errorMessagesDiv) {
    // Clear any previous highlighting
    const totalRows = hotInstance.countRows();
    const totalCols = hotInstance.countCols();
    for (let r = 0; r < totalRows; r++) {
        for (let c = 0; c < totalCols; c++) {
            hotInstance.setCellMeta(r, c, 'className', '');
        }
    }

    // Get current data from the spreadsheet
    const tableData = hotInstance.getSourceData();

    // Initialize Ajv with strict mode disabled to allow custom keywords
    const ajv = new Ajv({
        allErrors: true,
        strict: false
    });

    // Create a proper array schema
    const arraySchema = {
        type: "array",
        items: schema
    };

    // Validate
    const validateFn = ajv.compile(arraySchema);
    const valid = validateFn(tableData);

    // Collect structured errors
    const structuredErrors = [];

    if (!valid && validateFn.errors) {
        validateFn.errors.forEach((error) => {
            // Process errors and highlight cells
            const path = error.instancePath;
            if (path) {
                const segments = path.split('/').filter(Boolean);
                if (segments.length >= 2) {
                    const rowIndex = parseInt(segments[0], 10);
                    const propertyName = segments[1];
                    const colHeaders = hotInstance.getColHeader();
                    const colIndex = colHeaders.indexOf(propertyName);

                    if (colIndex > -1) {
                        // Highlight the invalid cell
                        hotInstance.setCellMeta(rowIndex, colIndex, 'className', 'htInvalidCell');
                    }

                    // Add to structured errors
                    structuredErrors.push({
                        rowIndex: rowIndex,
                        field: propertyName,
                        message: error.message,
                        path: error.instancePath
                    });
                }
            }
        });
    }

    // Display errors using the enhanced function
    displayValidationErrors(structuredErrors, errorMessagesDiv);

    // Re-render the table to apply the highlights
    hotInstance.render();
}

/**
 * Download the table data as JSON.
 */
function downloadDataAsJson(hotInstance) {
    const editedData = hotInstance.getSourceData();
    const jsonData = JSON.stringify(editedData, null, 2);
    const blob = new Blob([jsonData], {type: 'application/json'});
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'target-data.json';
    a.click();

    URL.revokeObjectURL(url);
}

export {initQualityControlApp};