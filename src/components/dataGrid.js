import { createGrid, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

// Register all community modules before using the grid
ModuleRegistry.registerModules([AllCommunityModule]);

export class DataGrid {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.options = {
      theme: 'ag-theme-quartz',
      height: '500px',
      showStatusColumn: false,
      ...options
    };
    this.gridApi = null;
    this.data = [];
    this.originalData = []; // Store original clean data for export
    this.validationErrors = [];
    this.errorsByRow = new Map();
    this.errorsByCell = new Map();
    this.hasValidationRun = false; // Track if validation has been performed
  }

  init(data, columns = null) {
    if (!this.container) return;

    this.data = data || [];
    this.originalData = JSON.parse(JSON.stringify(data || [])); // Deep copy original data
    this.hasValidationRun = false; // Reset validation state when new data is loaded

    // Clear existing grid if present
    if (this.gridApi) {
      this.gridApi.destroy();
      this.gridApi = null;
    }

    // Auto-generate columns if not provided
    const columnDefs = columns || this.generateColumns(this.data);

    // Add status column if requested
    if (this.options.showStatusColumn) {
      columnDefs.unshift(this.createStatusColumn());
    }

    // Configure grid options
    const gridOptions = {
      theme: 'legacy', // Use legacy CSS-based theming to avoid conflict with ag-grid.css
      columnDefs,
      rowData: this.data,
      defaultColDef: {
        sortable: true,
        filter: true,
        resizable: true,
        tooltipValueGetter: (params) => this.getCellTooltip(params)
      },
      animateRows: true,
      pagination: true,
      paginationPageSize: 50,
      paginationPageSizeSelector: [20, 50, 100, 200],
      getRowClass: (params) => this.getRowClass(params),
      onGridReady: (params) => {
        this.onGridReady(params);
      },
      ...this.options.gridOptions
    };

    // Apply theme and height
    this.container.classList.add(this.options.theme);
    this.container.style.height = this.options.height;

    // Create grid
    this.gridApi = createGrid(this.container, gridOptions);
  }

  generateColumns(data) {
    if (!data || data.length === 0) return [];

    // Get all unique keys from the data
    const keys = new Set();
    data.forEach(row => {
      Object.keys(row).forEach(key => keys.add(key));
    });

    // Create column definitions
    return Array.from(keys).map(key => ({
      field: key,
      headerName: key,
      cellClass: (params) => this.getCellClass(params),
      cellRenderer: (params) => this.cellRenderer(params)
    }));
  }

  createStatusColumn() {
    return {
      field: '__status',
      headerName: '',
      width: 50,
      pinned: 'left',
      sortable: false,
      filter: false,
      resizable: false,
      cellRenderer: (params) => {
        // Only show status after validation has been run
        if (!this.hasValidationRun) {
          return ''; // Show blank until validation is performed
        }

        const rowErrors = this.errorsByRow.get(params.node.rowIndex);
        if (rowErrors && rowErrors.length > 0) {
          return `<span class="text-red-500" title="${rowErrors.length} error(s)">❗</span>`;
        }
        return '<span class="text-green-500">✓</span>';
      }
    };
  }

  setValidationErrors(errors) {
    this.validationErrors = errors;
    this.errorsByRow.clear();
    this.errorsByCell.clear();
    this.hasValidationRun = true; // Mark that validation has been performed

    // Group errors by row and cell
    errors.forEach(error => {
      // Group by row
      if (!this.errorsByRow.has(error.row)) {
        this.errorsByRow.set(error.row, []);
      }
      this.errorsByRow.get(error.row).push(error);

      // Group by cell (row-column combination)
      const cellKey = `${error.row}-${error.column}`;
      if (!this.errorsByCell.has(cellKey)) {
        this.errorsByCell.set(cellKey, []);
      }
      this.errorsByCell.get(cellKey).push(error);
    });

    // Refresh grid to apply styling
    if (this.gridApi) {
      this.gridApi.refreshCells({ force: true });
      this.gridApi.redrawRows();
    }
  }

  getCellClass(params) {
    const cellKey = `${params.node.rowIndex}-${params.colDef.field}`;
    const errors = this.errorsByCell.get(cellKey);

    if (errors && errors.length > 0) {
      return 'bg-red-50 border-red-300';
    }
    return '';
  }

  getCellTooltip(params) {
    const cellKey = `${params.node.rowIndex}-${params.colDef.field}`;
    const errors = this.errorsByCell.get(cellKey);

    if (errors && errors.length > 0) {
      return errors.map(e => e.message).join('\n');
    }
    return params.value;
  }

  getRowClass(params) {
    const rowErrors = this.errorsByRow.get(params.node.rowIndex);
    if (rowErrors && rowErrors.length > 0) {
      return 'ag-row-error';
    }
    return '';
  }

  cellRenderer(params) {
    const value = params.value;
    const cellKey = `${params.node.rowIndex}-${params.colDef.field}`;
    const errors = this.errorsByCell.get(cellKey);

    if (errors && errors.length > 0) {
      return `
        <div class="flex items-center justify-between">
          <span>${value !== null && value !== undefined ? value : ''}</span>
          <span class="text-red-500 text-xs ml-1" title="${errors.map(e => e.message).join(', ')}">⚠</span>
        </div>
      `;
    }

    return value !== null && value !== undefined ? value : '';
  }

  filterByErrors(errorType = null, column = null) {
    if (!this.gridApi) return;

    // Clear existing filters
    this.gridApi.setFilterModel(null);

    if (!errorType && !column) {
      // Show all rows
      return;
    }

    // Filter to show only rows with matching errors
    const rowsToShow = new Set();

    this.validationErrors.forEach(error => {
      const matchesType = !errorType || error.errorType === errorType;
      const matchesColumn = !column || error.column === column;

      if (matchesType && matchesColumn) {
        rowsToShow.add(error.row);
      }
    });

    // Apply external filter
    this.gridApi.onFilterChanged();
    this.gridApi.setFilterModel({
      __externalFilter: {
        filterType: 'custom',
        filter: (params) => rowsToShow.has(params.node.rowIndex)
      }
    });

    // Alternative approach using row node selection
    this.gridApi.forEachNode(node => {
      node.setSelected(rowsToShow.has(node.rowIndex));
    });
  }

  clearFilters() {
    if (this.gridApi) {
      this.gridApi.setFilterModel(null);
      this.gridApi.deselectAll();
    }
  }

  exportData(filename = 'data.csv') {
    // Export original clean data without validation annotations
    if (!this.originalData || this.originalData.length === 0) return;

    // Convert data to CSV format
    const headers = Object.keys(this.originalData[0]);
    const csvContent = [
      headers.join(','),
      ...this.originalData.map(row =>
        headers.map(key => {
          const value = row[key];
          // Escape values containing commas, quotes, or newlines
          if (value && (value.toString().includes(',') || value.toString().includes('"') || value.toString().includes('\n'))) {
            return `"${value.toString().replace(/"/g, '""')}"`;
          }
          return value ?? '';
        }).join(',')
      )
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  setData(data) {
    this.data = data;
    this.originalData = JSON.parse(JSON.stringify(data || [])); // Deep copy original data
    this.hasValidationRun = false; // Reset validation state when new data is set
    if (this.gridApi) {
      this.gridApi.setRowData(data);
      this.gridApi.refreshCells({ force: true }); // Refresh to update status column
    } else {
      // Re-initialize grid with new data
      this.init(data);
    }
  }

  onGridReady(params) {
    // Auto-size columns to fit content
    params.api.sizeColumnsToFit();

    // Emit custom event
    if (this.options.onReady) {
      this.options.onReady(params);
    }
  }

  highlightErrorRows() {
    if (!this.gridApi) return;

    const errorRows = Array.from(this.errorsByRow.keys());

    this.gridApi.forEachNode(node => {
      if (errorRows.includes(node.rowIndex)) {
        node.setSelected(true);
      }
    });
  }

  getSelectedRows() {
    if (!this.gridApi) return [];
    return this.gridApi.getSelectedRows();
  }

  destroy() {
    if (this.gridApi) {
      this.gridApi.destroy();
      this.gridApi = null;
    }
  }
}