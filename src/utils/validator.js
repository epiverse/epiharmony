import Ajv from 'ajv';

export class DataValidator {
  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false,
      coerceTypes: false
    });
    this.validator = null;
    this.schema = null;
  }

  setSchema(schema) {
    if (!schema) {
      throw new Error('Schema is required for validation');
    }

    this.schema = schema;

    // Extract the schema for items if the schema is for an array
    let itemSchema = schema;
    if (schema.type === 'array' && schema.items) {
      itemSchema = schema.items;
    }

    // Create a validator function
    this.validator = this.ajv.compile(itemSchema);
  }

  validateData(data) {
    if (!this.validator) {
      throw new Error('No schema set for validation');
    }

    if (!Array.isArray(data)) {
      throw new Error('Data must be an array of objects');
    }

    const errors = [];
    const summary = {};
    let errorCount = 0;

    // Validate each row
    data.forEach((row, index) => {
      const valid = this.validator(row);

      if (!valid) {
        // Process errors for this row
        this.validator.errors.forEach(error => {
          const errorDetail = this.formatError(error, index);
          errors.push(errorDetail);

          // Update summary
          const errorKey = `${errorDetail.column}:${errorDetail.errorType}`;
          if (!summary[errorKey]) {
            summary[errorKey] = {
              column: errorDetail.column,
              errorType: errorDetail.errorType,
              message: errorDetail.message,
              count: 0,
              rows: []
            };
          }
          summary[errorKey].count++;
          summary[errorKey].rows.push(index);
          errorCount++;
        });
      }
    });

    return {
      valid: errors.length === 0,
      errorCount,
      errors,
      summary: Object.values(summary),
      rowCount: data.length,
      validRowCount: data.length - new Set(errors.map(e => e.row)).size
    };
  }

  formatError(ajvError, rowIndex) {
    // Extract column name from instancePath
    let column = 'row';
    if (ajvError.instancePath) {
      // Remove leading slash and get property name
      column = ajvError.instancePath.replace(/^\//, '');
    } else if (ajvError.params?.missingProperty) {
      column = ajvError.params.missingProperty;
    }

    // Format error message
    let message = ajvError.message || 'Validation error';
    let errorType = ajvError.keyword;

    // Enhance messages for common error types
    switch (ajvError.keyword) {
      case 'required':
        message = `Missing required field: ${ajvError.params.missingProperty}`;
        errorType = 'Required field missing';
        break;
      case 'type':
        message = `Expected ${ajvError.params.type}, got ${typeof ajvError.data}`;
        errorType = 'Invalid type';
        break;
      case 'enum':
        message = `Value must be one of: ${ajvError.params.allowedValues.join(', ')}`;
        errorType = 'Invalid enum value';
        break;
      case 'pattern':
        message = `Value does not match required pattern: ${ajvError.params.pattern}`;
        errorType = 'Pattern mismatch';
        break;
      case 'minimum':
      case 'maximum':
        message = `Value ${ajvError.params.comparison} ${ajvError.params.limit}`;
        errorType = 'Out of range';
        break;
      case 'minLength':
      case 'maxLength':
        message = `String length ${ajvError.params.comparison} ${ajvError.params.limit}`;
        errorType = 'Invalid length';
        break;
      case 'format':
        message = `Invalid ${ajvError.params.format} format`;
        errorType = 'Format error';
        break;
    }

    return {
      row: rowIndex,
      column,
      value: ajvError.data,
      message,
      errorType,
      keyword: ajvError.keyword,
      params: ajvError.params
    };
  }

  exportErrorsToCSV(errors, filename = 'validation-errors.csv') {
    if (errors.length === 0) {
      return null;
    }

    // Create CSV headers
    const headers = ['Row Number', 'Column Name', 'Invalid Value', 'Error Type', 'Error Message'];

    // Create CSV rows
    const rows = errors.map(error => [
      error.row + 1, // Convert to 1-based index for user-friendliness
      error.column,
      JSON.stringify(error.value),
      error.errorType,
      error.message
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => {
        // Escape fields that contain commas or quotes
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(','))
    ].join('\n');

    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);

    return csvContent;
  }

  getValidationStats(validationResult) {
    const { errors, summary, rowCount, validRowCount } = validationResult;

    // Group errors by type
    const errorsByType = {};
    summary.forEach(item => {
      if (!errorsByType[item.errorType]) {
        errorsByType[item.errorType] = 0;
      }
      errorsByType[item.errorType] += item.count;
    });

    // Get most common errors
    const topErrors = summary
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get columns with most errors
    const columnErrors = {};
    errors.forEach(error => {
      if (!columnErrors[error.column]) {
        columnErrors[error.column] = 0;
      }
      columnErrors[error.column]++;
    });

    const topColumns = Object.entries(columnErrors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([column, count]) => ({ column, count }));

    return {
      totalRows: rowCount,
      validRows: validRowCount,
      invalidRows: rowCount - validRowCount,
      totalErrors: errors.length,
      errorTypes: errorsByType,
      topErrors,
      topColumns,
      validationRate: ((validRowCount / rowCount) * 100).toFixed(2) + '%'
    };
  }
}