import Handsontable from 'handsontable';
import Ajv from 'ajv';

// Example target data (for testing purposes)
const exampleTargetData = [
    {
        SEQN: 93248,
        RIDRETH1: 3,
        RIDAGEYR: 45,
        RIAGENDR: 1,
        INCOME: "80000"
    },
    {
        SEQN: 93249,
        RIDRETH1: 4,
        RIDAGEYR: 22,
        RIAGENDR: 2,
        INCOME: "55k"
    },
    {
        SEQN: 93250,
        RIDRETH1: 2,
        RIDAGEYR: 75,
        RIAGENDR: 1,
        INCOME: "120000"
    },
    {
        SEQN: 93251,
        RIDRETH1: 5,
        RIDAGEYR: "30",
        RIAGENDR: 2,
        INCOME: "65000"
    },
    {
        SEQN: 93252,
        RIDRETH1: 1,
        RIDAGEYR: 62,
        RIAGENDR: 1,
        INCOME: "Unknown"
    },
    {
        SEQN: 93253,
        RIDRETH1: 3,
        RIDAGEYR: -10,
        RIAGENDR: 2,
        INCOME: "90000"
    }
];


// Example source schema (for testing purposes)
const exampleSourceSchema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "Dummy NHANES Demographics dataset",
    description: "A dummy NHANES-like demographic dataset.",
    type: "array",
    items: {
        type: "object",
        properties: {
            SEQN: {
                type: "integer",
                description: "Respondent sequence number",
                minimum: 1
            },
            RIDRETH1: {
                type: "integer",
                description: "Race/Ethnicity Category",
                enum: [1, 2, 3, 4, 5]
            },
            RIDAGEYR: {
                type: "integer",
                description: "Age in years at screening",
                minimum: 0,
                maximum: 120
            },
            RIAGENDR: {
                type: "integer",
                description: "Gender",
                enum: [1, 2]
            },
            INCOME: {
                type: "string",
                description: "Household income",
                pattern: "^[0-9]+$"
            }
        },
        required: ["SEQN", "RIDRETH1", "RIDAGEYR", "RIAGENDR", "INCOME"]
    }
};


/**
 * Initializes the Quality Control tab UI
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

    // Build the Handsontable
    const hot = buildHandsontable(tableContainer, data, schema);

    // Create action buttons (Validate, Download JSON)
    const buttonsContainer = document.createElement('div');
    buttonsContainer.classList.add(
        'flex',
        'gap-3',
        'items-center',
        'justify-start',
        'my-4'
    );
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
    downloadBtn.textContent = 'Download JSON';
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
        'max-h-80'
    );
    wrapper.appendChild(errorContainer);

    // Copy errors button
    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy Errors';
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
        'cursor-pointer'
    );
    copyBtn.addEventListener('click', () => {
        navigator.clipboard
            .writeText(errorLogDiv.innerText)
            .catch((err) => console.error('Failed to copy errors: ', err));
    });
    errorContainer.appendChild(copyBtn);

    // Schema error container
    const errorLogDiv = document.createElement('div');
    errorLogDiv.classList.add(
        'mt-8',
        'whitespace-pre-wrap'
    );
    errorContainer.appendChild(errorLogDiv);

    return wrapper;
}

/**
 * Build a Handsontable instance with slightly larger text.
 */
function buildHandsontable(containerEl, data, schema) {
    // Derive column headers and column configurations
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    const columns = headers.map((header) => {
        const colSchema = schema?.items?.properties?.[header];
        let colType = 'text';
        if (colSchema?.type === 'integer' || colSchema?.type === 'number') {
            colType = 'numeric';
        }
        return {data: header, type: colType};
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
        licenseKey: 'non-commercial-and-evaluation'
    });

    return hot;
}

/**
 * Validate the Handsontable data against the JSON schema with Ajv.
 * Invalid cells get highlighted, and errors are listed in the error div.
 */
function validateAgainstSchema(hotInstance, schema, errorMessagesDiv) {
    // Clear previous messages
    errorMessagesDiv.textContent = '';

    // Clear any previous highlighting
    const totalRows = hotInstance.countRows();
    const totalCols = hotInstance.countCols();
    for (let r = 0; r < totalRows; r++) {
        for (let c = 0; c < totalCols; c++) {
            hotInstance.setCellMeta(r, c, 'className', '');
        }
    }

    // Validate the schema
    const ajv = new Ajv({allErrors: true});
    const schemaValid = ajv.validateSchema(schema);
    if (!schemaValid) {
        errorMessagesDiv.textContent = 'The provided schema is invalid!';
        console.error('Invalid schema:', ajv.errors);
        hotInstance.render();
        return;
    }

    // Get current data from the spreadsheet
    const tableData = hotInstance.getSourceData();

    // Compile & run validation
    const validateFn = ajv.compile(schema);
    const valid = validateFn(tableData);

    let errorMessages = '';
    if (!valid && validateFn.errors) {
        validateFn.errors.forEach((error) => {
            // E.g. error.instancePath = "/0/RIDAGEYR"
            const path = error.instancePath;
            if (path) {
                const segments = path.split('/').filter(Boolean); // ["0", "RIDAGEYR"]
                if (segments.length === 2) {
                    const rowIndex = parseInt(segments[0], 10);
                    const propertyName = segments[1];
                    const colHeaders = hotInstance.getColHeader();
                    const colIndex = colHeaders.indexOf(propertyName);
                    if (colIndex > -1) {
                        // Highlight the invalid cell
                        hotInstance.setCellMeta(rowIndex, colIndex, 'className', 'htInvalidCell');
                    }
                }
            }
            errorMessages += `Error at ${error.instancePath}: ${error.message}\n`;
        });
    } else {
        errorMessages = 'No errors found.';
    }

    // Display errors
    errorMessagesDiv.textContent = errorMessages;

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
