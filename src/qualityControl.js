/* src/qualityControl.js */

// Import Ajv for JSON schema validation
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
        "ENTRYAGE": 60,
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
            type: "number",
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
            description: "Alcohol intake (grams/day). Null if missing.",
            oneOf: [
                {
                    type: "number",
                    minimum: 0
                },
                {type: "null"}
            ]
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

// Store the grid API globally so we can access it from any function
let gridApi = null;

/**
 * Initializes the Quality Control tab UI with AG-Grid
 */
function initQualityControlApp() {
    const container = document.getElementById('quality-control-app');
    if (!container) return;

    // Clear any existing content
    container.innerHTML = '';

    // Create the QC UI
    const qcUI = createQualityControlUI(exampleTargetData, exampleSourceSchema);
    container.appendChild(qcUI);
}

/**
 * Check if a schema type is numeric
 */
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
 * Create the AG-Grid and control UI for Quality Control.
 */
function createQualityControlUI(data, schema) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('qc-wrapper', 'mt-4');

    // Create title for the Quality Control section
    const title = document.createElement('h2');
    title.textContent = 'Quality Control';
    title.classList.add('text-xl', 'font-bold', 'mb-4');
    wrapper.appendChild(title);

    // Explanation text
    const explanation = document.createElement('p');
    explanation.textContent = 'The table below displays the data for quality control checks. Edit cells to update values and click Validate to check against the schema.';
    explanation.classList.add('mb-4', 'text-gray-700');
    wrapper.appendChild(explanation);

    // AG-Grid container
    const gridContainer = document.createElement('div');
    gridContainer.id = 'ag-grid-container';
    gridContainer.style.height = '400px';
    gridContainer.classList.add('ag-theme-alpine', 'w-full');
    wrapper.appendChild(gridContainer);

    // Initialize AG-Grid
    initAgGrid(gridContainer, data, schema);

    // Action buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.classList.add('flex', 'gap-3', 'items-center', 'justify-center', 'my-4');
    wrapper.appendChild(buttonsContainer);

    // Create error messages container first so we can reference it
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

    // Container for displaying the error messages
    const errorLogDiv = document.createElement('div');
    errorLogDiv.classList.add('whitespace-pre-wrap');
    errorContainer.appendChild(errorLogDiv);

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
        // Make sure gridApi is available
        if (!gridApi) {
            errorLogDiv.innerHTML = '<div class="text-red-600 font-medium">Error: Grid API not available. Please try again.</div>';
            return;
        }

        validateAgainstSchema(schema, errorLogDiv);
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
        if (!gridApi) {
            alert('Error: Grid API not available. Please try again.');
            return;
        }

        downloadDataAsJson();
    });
    buttonsContainer.appendChild(downloadBtn);

    wrapper.appendChild(errorContainer);

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

    // Add CSS for invalid cells
    addErrorStyles();

    return wrapper;
}

/**
 * Initialize AG-Grid with the data
 */
function initAgGrid(containerEl, data, schema) {
    // Derive column definitions from the data
    const columnDefs = deriveColumnDefs(data, schema);

    // Grid options
    const gridOptions = {
        columnDefs: columnDefs,
        rowData: data,
        defaultColDef: {
            flex: 1,
            minWidth: 100,
            resizable: true,
            sortable: true,
            filter: true,
            editable: true,
            cellStyle: params => {
                return { textAlign: params.colDef.type === 'numericColumn' ? 'right' : 'left' };
            }
        },
        animateRows: true,
        pagination: true,
        paginationAutoPageSize: true,
        // Add an onCellValueChanged handler to validate data after editing
        onCellValueChanged: params => {
            validateCell(params.node, params.column, params.newValue, schema);
        },
        // Store the API reference when the grid is ready
        onGridReady: params => {
            gridApi = params.api;
            params.api.sizeColumnsToFit();
        }
    };

    // Create the grid
    agGrid.createGrid(containerEl, gridOptions);
}

/**
 * Derive column definitions from the data and schema
 */
function deriveColumnDefs(data, schema) {
    if (!data || data.length === 0) {
        return [];
    }

    const headers = Object.keys(data[0]);
    return headers.map(header => {
        const colDef = {
            field: header,
            headerName: header
        };

        // Add schema-based information if available
        const fieldSchema = schema?.properties?.[header];
        if (fieldSchema) {
            // Add tooltip with schema description
            if (fieldSchema.description) {
                colDef.headerTooltip = fieldSchema.description;
            }

            // Handle different data types
            if (isNumericType(fieldSchema)) {
                colDef.type = 'numericColumn';
                colDef.filter = 'agNumberColumnFilter';

                // For numeric columns, set up value parser to handle empty strings
                colDef.valueParser = (params) => {
                    if (params.newValue === '' || params.newValue === null || params.newValue === undefined) {
                        return null;
                    }
                    return Number(params.newValue);
                };

                // Add cell class rules for validation
                colDef.cellClassRules = getCellClassRulesForNumeric(fieldSchema);
            }

            // Check for enum values to create dropdown editor
            if (fieldSchema.enum && fieldSchema.enum.length > 0) {
                colDef.cellEditor = 'agSelectCellEditor';

                // Create values array for dropdown, adding a "NULL" option if nulls are allowed
                const enumValues = fieldSchema.enum.filter(item => item !== null);
                if (allowsNullValues(fieldSchema)) {
                    colDef.cellEditorParams = {
                        values: [...enumValues, 'NULL']
                    };

                    // Special value formatter for handling NULL values
                    colDef.valueFormatter = (params) => {
                        if (params.value === null || params.value === undefined) {
                            return 'NULL';
                        }

                        // Use enum descriptions if available
                        if (fieldSchema.enumDescriptions) {
                            const index = fieldSchema.enum.indexOf(params.value);
                            if (index >= 0 && index < fieldSchema.enumDescriptions.length) {
                                return fieldSchema.enumDescriptions[index];
                            }
                        }

                        return params.value;
                    };

                    // Special value parser to convert "NULL" string back to null
                    colDef.valueParser = (params) => {
                        if (params.newValue === 'NULL') {
                            return null;
                        }
                        return params.newValue;
                    };
                } else {
                    colDef.cellEditorParams = {
                        values: enumValues
                    };
                }

                // Add cell class rules for validation
                colDef.cellClassRules = getCellClassRulesForEnum(fieldSchema);
            }
        }

        return colDef;
    });
}

/**
 * Create cell class rules for numeric fields based on schema constraints
 */
function getCellClassRulesForNumeric(schema) {
    const rules = {};

    // If the field allows nulls, we need to handle that case
    const allowsNull = allowsNullValues(schema);

    // Check for numeric constraints in the schema
    let min = undefined;
    let max = undefined;

    // Direct constraints
    if (schema.minimum !== undefined) min = schema.minimum;
    if (schema.maximum !== undefined) max = schema.maximum;

    // Check in oneOf patterns
    if (schema.oneOf && Array.isArray(schema.oneOf)) {
        schema.oneOf.forEach(option => {
            if (option.type === 'number' || option.type === 'integer') {
                if (option.minimum !== undefined && (min === undefined || option.minimum > min)) {
                    min = option.minimum;
                }
                if (option.maximum !== undefined && (max === undefined || option.maximum < max)) {
                    max = option.maximum;
                }
            }
        });
    }

    // Create validation rules
    if (min !== undefined) {
        rules['invalid-cell'] = params => {
            // Skip validation for null values if they're allowed
            if ((params.value === null || params.value === undefined) && allowsNull) {
                return false;
            }
            return params.value !== null && params.value < min;
        };
    }

    if (max !== undefined) {
        rules['invalid-cell'] = params => {
            // Skip validation for null values if they're allowed
            if ((params.value === null || params.value === undefined) && allowsNull) {
                return false;
            }
            return params.value !== null && params.value > max;
        };
    }

    // If both min and max are defined, combine them
    if (min !== undefined && max !== undefined) {
        rules['invalid-cell'] = params => {
            // Skip validation for null values if they're allowed
            if ((params.value === null || params.value === undefined) && allowsNull) {
                return false;
            }
            return params.value !== null && (params.value < min || params.value > max);
        };
    }

    // Return empty rules if no constraints found
    return rules;
}

/**
 * Create cell class rules for enum fields based on schema constraints
 */
function getCellClassRulesForEnum(schema) {
    const rules = {};

    if (schema.enum && Array.isArray(schema.enum)) {
        rules['invalid-cell'] = params => {
            // If the value is null and null is allowed, it's valid
            if ((params.value === null || params.value === undefined) && schema.enum.includes(null)) {
                return false;
            }

            // Otherwise check if the value is in the enum
            return params.value !== null && !schema.enum.includes(params.value);
        };
    }

    return rules;
}

/**
 * Validate a cell value against the schema
 */
function validateCell(rowNode, column, value, schema) {
    const field = column.getColId();
    const fieldSchema = schema?.properties?.[field];

    if (!fieldSchema) return;

    let isValid = true;

    // For numeric fields, check constraints
    if (isNumericType(fieldSchema)) {
        // Check if null is allowed
        if ((value === null || value === undefined) && !allowsNullValues(fieldSchema)) {
            isValid = false;
        }
        // Check minimum constraint
        else if (value !== null && fieldSchema.minimum !== undefined && value < fieldSchema.minimum) {
            isValid = false;
        }
        // Check maximum constraint
        else if (value !== null && fieldSchema.maximum !== undefined && value > fieldSchema.maximum) {
            isValid = false;
        }

        // Check oneOf constraints
        if (fieldSchema.oneOf && Array.isArray(fieldSchema.oneOf)) {
            let oneOfValid = false;

            for (const option of fieldSchema.oneOf) {
                // For null value, check if null type is allowed
                if ((value === null || value === undefined) && option.type === 'null') {
                    oneOfValid = true;
                    break;
                }

                // For numeric value, check constraints
                if ((option.type === 'number' || option.type === 'integer') && value !== null) {
                    let optionValid = true;

                    if (option.minimum !== undefined && value < option.minimum) {
                        optionValid = false;
                    }

                    if (option.maximum !== undefined && value > option.maximum) {
                        optionValid = false;
                    }

                    if (optionValid) {
                        oneOfValid = true;
                        break;
                    }
                }
            }

            isValid = oneOfValid;
        }
    }

    // For enum fields, check if value is in enum
    if (fieldSchema.enum && Array.isArray(fieldSchema.enum)) {
        isValid = fieldSchema.enum.includes(value);
    }

    // Apply cell class based on validation result
    if (!isValid) {
        column.getColDef().cellClassRules = {
            'invalid-cell': () => true
        };
    } else {
        column.getColDef().cellClassRules = {};
    }

    // Force cell refresh to show validation result
    rowNode.setDataValue(field, value);
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
        .invalid-cell {
            background-color: rgba(239, 68, 68, 0.15) !important;
        }
        
        .ag-cell.ag-cell-focus.invalid-cell {
            border: 2px solid rgb(239, 68, 68) !important;
        }
    `;

    // Add to document head
    document.head.appendChild(style);
}

/**
 * Validate the AG-Grid data against the JSON schema with Ajv.
 * Invalid cells get highlighted, and errors are listed in the error div.
 */
function validateAgainstSchema(schema, errorMessagesDiv) {
    // Get current data from the grid
    const tableData = [];

    // Iterate through all rows to get data
    gridApi.forEachNode(node => {
        tableData.push(node.data);
    });

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
    const cellsToHighlight = [];

    if (!valid && validateFn.errors) {
        validateFn.errors.forEach((error) => {
            // Process errors and highlight cells
            const path = error.instancePath;
            if (path) {
                const segments = path.split('/').filter(Boolean);
                if (segments.length >= 2) {
                    const rowIndex = parseInt(segments[0], 10);
                    const propertyName = segments[1];

                    // Find the row node
                    let rowNode = null;
                    gridApi.forEachNode((node, index) => {
                        if (index === rowIndex) {
                            rowNode = node;
                        }
                    });

                    if (rowNode) {
                        // Add to structured errors
                        structuredErrors.push({
                            rowIndex: rowIndex,
                            field: propertyName,
                            message: error.message,
                            path: error.instancePath
                        });

                        // Add to cells to highlight
                        cellsToHighlight.push({
                            rowNode: rowNode,
                            field: propertyName
                        });
                    }
                }
            }
        });
    }

    // Highlight invalid cells using cellClassRules
    gridApi.forEachNode(node => {
        gridApi.refreshCells({
            rowNodes: [node],
            force: true
        });
    });

    // Apply 'invalid-cell' class to cells with errors
    cellsToHighlight.forEach(cell => {
        const column = gridApi.getColumnDef(cell.field);
        if (column) {
            column.cellClassRules = {
                'invalid-cell': () => true
            };
            gridApi.refreshCells({
                rowNodes: [cell.rowNode],
                columns: [cell.field],
                force: true
            });
        }
    });

    // Display errors
    displayValidationErrors(structuredErrors, errorMessagesDiv);
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
 * Download the table data as JSON.
 */
function downloadDataAsJson() {
    const rowData = [];

    gridApi.forEachNode(node => {
        rowData.push(node.data);
    });

    const jsonData = JSON.stringify(rowData, null, 2);
    const blob = new Blob([jsonData], {type: 'application/json'});
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'target-data.json';
    a.click();

    URL.revokeObjectURL(url);
}

export {initQualityControlApp};