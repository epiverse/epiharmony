self.addEventListener('message', async (event) => {
  const { type, code, data, mapping } = event.data;

  if (type === 'execute') {
    try {
      const result = await executeTransformation(code, data, mapping);
      self.postMessage({
        type: 'result',
        success: true,
        result: result,
        mapping: mapping
      });
    } catch (error) {
      self.postMessage({
        type: 'result',
        success: false,
        error: error.toString(),
        stack: error.stack,
        mapping: mapping
      });
    }
  }
});

async function executeTransformation(code, data, mapping) {
  const consoleOutput = [];
  const errors = [];

  const sandboxedConsole = {
    log: (...args) => {
      consoleOutput.push({
        type: 'log',
        message: args.map(arg => formatValue(arg)).join(' ')
      });
    },
    error: (...args) => {
      consoleOutput.push({
        type: 'error',
        message: args.map(arg => formatValue(arg)).join(' ')
      });
    },
    warn: (...args) => {
      consoleOutput.push({
        type: 'warn',
        message: args.map(arg => formatValue(arg)).join(' ')
      });
    },
    info: (...args) => {
      consoleOutput.push({
        type: 'info',
        message: args.map(arg => formatValue(arg)).join(' ')
      });
    }
  };

  const sandboxGlobal = {
    console: sandboxedConsole,
    JSON: JSON,
    Math: Math,
    Date: Date,
    String: String,
    Number: Number,
    Boolean: Boolean,
    Array: Array,
    Object: Object,
    RegExp: RegExp,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    isFinite: isFinite,
    encodeURIComponent: encodeURIComponent,
    decodeURIComponent: decodeURIComponent,
    undefined: undefined,
    null: null
  };

  try {
    // Create a sandboxed evaluation environment
    const functionBody = `
      'use strict';
      const console = arguments[0].console;
      const Math = arguments[0].Math;
      const Date = arguments[0].Date;
      const JSON = arguments[0].JSON;
      const String = arguments[0].String;
      const Number = arguments[0].Number;
      const Boolean = arguments[0].Boolean;
      const Array = arguments[0].Array;
      const Object = arguments[0].Object;
      const RegExp = arguments[0].RegExp;
      const parseInt = arguments[0].parseInt;
      const parseFloat = arguments[0].parseFloat;
      const isNaN = arguments[0].isNaN;
      const isFinite = arguments[0].isFinite;

      // User transformation function
      ${code}

      // Check if transform function exists
      if (typeof transform !== 'function') {
        throw new Error('No transform function defined. Please define a function named "transform" that takes a row object and returns the transformed value(s).');
      }

      return transform;
    `;

    const evalFunction = new Function(functionBody);
    const transformFunction = evalFunction(sandboxGlobal);

    const transformedData = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < data.length; i++) {
      try {
        const row = { ...data[i] }; // Create a copy of the row
        const result = transformFunction(data[i]);

        if (result !== undefined && result !== null) {
          const sourceFields = mapping.source || [];
          const targetFields = mapping.target || [];

          // Remove source fields from the row (they're being replaced)
          sourceFields.forEach(field => {
            delete row[field];
          });

          // Add transformed fields in place
          if (typeof result === 'object' && !Array.isArray(result)) {
            // Result is an object with target field names
            Object.assign(row, result);
          } else {
            // Result is a single value
            if (targetFields.length === 1) {
              row[targetFields[0]] = result;
            } else {
              row._transformed = result;
            }
          }

          // For preserving column order: insert at first source field position
          const transformedRow = {};
          const firstSourceField = sourceFields[0];
          let insertPosition = null;

          // Build new row with correct column order
          for (const key of Object.keys(data[i])) {
            if (key === firstSourceField && insertPosition === null) {
              // Insert transformed fields at this position
              insertPosition = key;
              if (typeof result === 'object' && !Array.isArray(result)) {
                Object.assign(transformedRow, result);
              } else if (targetFields.length === 1) {
                transformedRow[targetFields[0]] = result;
              } else {
                transformedRow._transformed = result;
              }
              // Skip source fields as they're replaced
              if (!sourceFields.includes(key)) {
                transformedRow[key] = data[i][key];
              }
            } else if (!sourceFields.includes(key)) {
              // Keep non-source fields
              transformedRow[key] = data[i][key];
            }
          }

          transformedData.push(transformedRow);
          successCount++;
        } else {
          transformedData.push(data[i]);
          errorCount++;
          errors.push(`Row ${i + 1}: Transformation returned undefined or null`);
        }
      } catch (rowError) {
        transformedData.push(data[i]);
        errorCount++;
        errors.push(`Row ${i + 1}: ${rowError.message}`);
        if (errorCount > 10) {
          errors.push('Too many errors, stopping transformation...');
          break;
        }
      }
    }

    return {
      data: transformedData,
      console: consoleOutput,
      stats: {
        total: data.length,
        success: successCount,
        errors: errorCount
      },
      errors: errors
    };

  } catch (error) {
    throw new Error(`Code compilation error: ${error.message}`);
  }
}

function formatValue(value) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'function') return value.toString();
  if (value instanceof Error) return value.toString();
  if (Array.isArray(value)) {
    return '[' + value.map(v => formatValue(v)).join(', ') + ']';
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return Object.prototype.toString.call(value);
    }
  }
  return String(value);
}