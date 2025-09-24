export class SchemaViewer {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.options = {
      searchable: true,
      title: '',
      emptyMessage: 'No schema loaded',
      ...options
    };
    this.properties = [];
    this.filteredProperties = [];
    this.searchTerm = '';
  }

  setSchema(schema, processor = null) {
    if (!schema) {
      this.properties = [];
      this.render();
      return;
    }

    // Use processor if available for better property extraction
    if (processor && processor.resolvedSchema) {
      this.properties = processor.extractProperties(processor.resolvedSchema);
    } else {
      // Fallback to direct extraction
      this.properties = this.extractProperties(schema);
    }

    this.filteredProperties = [...this.properties];
    this.render();
  }

  extractProperties(schema) {
    const properties = [];

    let schemaToProcess = schema;
    if (schema.type === 'array' && schema.items) {
      schemaToProcess = schema.items;
    }

    if (schemaToProcess.properties) {
      for (const [name, propSchema] of Object.entries(schemaToProcess.properties)) {
        properties.push({
          name,
          schema: propSchema,
          required: schemaToProcess.required?.includes(name) || false,
          description: propSchema.description || '',
          type: propSchema.type || 'any',
          enum: propSchema.enum || null,
          enumDescriptions: propSchema.enumDescriptions || null
        });
      }
    }

    return properties;
  }

  formatType(schema) {
    if (!schema) return 'any';

    let type = schema.type || 'any';

    // Handle array types
    if (Array.isArray(type)) {
      type = type.filter(t => t !== 'null').join(' | ');
      if (schema.type.includes('null')) {
        type += ' (nullable)';
      }
    }

    if (schema.format) {
      return `${type} (${schema.format})`;
    }

    if (type === 'array' && schema.items) {
      const itemType = schema.items.type || 'any';
      return `array<${itemType}>`;
    }

    return type;
  }

  formatConstraints(schema) {
    const constraints = [];

    if (schema.minimum !== undefined || schema.maximum !== undefined) {
      const min = schema.minimum ?? (schema.exclusiveMinimum !== undefined ? `>${schema.exclusiveMinimum}` : '');
      const max = schema.maximum ?? (schema.exclusiveMaximum !== undefined ? `<${schema.exclusiveMaximum}` : '');
      if (min || max) {
        const range = min && max ? `${min} to ${max}` : (min || max);
        constraints.push(`Range: ${range}`);
      }
    }

    if (schema.minLength !== undefined || schema.maxLength !== undefined) {
      if (schema.minLength === schema.maxLength) {
        constraints.push(`Length: ${schema.minLength}`);
      } else {
        const min = schema.minLength ?? 0;
        const max = schema.maxLength ?? '∞';
        constraints.push(`Length: ${min}-${max}`);
      }
    }

    if (schema.pattern) {
      constraints.push(`Pattern: ${schema.pattern}`);
    }

    if (schema.multipleOf) {
      constraints.push(`Multiple of ${schema.multipleOf}`);
    }

    if (schema.minItems !== undefined || schema.maxItems !== undefined) {
      const min = schema.minItems ?? 0;
      const max = schema.maxItems ?? '∞';
      constraints.push(`Items: ${min}-${max}`);
    }

    if (schema.uniqueItems) {
      constraints.push('Unique items');
    }

    return constraints;
  }

  formatEnum(property) {
    if (!property.enum || property.enum.length === 0) return '';

    const hasDescriptions = property.enumDescriptions &&
      property.enumDescriptions.length === property.enum.length;

    if (!hasDescriptions) {
      // Simple enum display
      if (property.enum.length <= 3) {
        return property.enum.join(', ');
      }
      return `${property.enum.slice(0, 3).join(', ')}... (${property.enum.length} values)`;
    }

    // Create dropdown for enums with descriptions
    const enumId = 'enum_' + Math.random().toString(36).substr(2, 9);

    let html = `
      <div class="relative inline-block">
        <button
          onclick="(function() {
            const el = document.getElementById('${enumId}');
            el.classList.toggle('hidden');
            event.stopPropagation();
          })()"
          class="text-amber-600 hover:text-amber-700 underline text-sm"
        >
          ${property.enum.length} values ▼
        </button>
        <div id="${enumId}" class="hidden absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[250px] max-w-[400px] max-h-[300px] overflow-y-auto">
    `;

    property.enum.forEach((value, index) => {
      const desc = property.enumDescriptions[index];
      html += `
        <div class="px-3 py-2 hover:bg-amber-50 border-b border-gray-100 last:border-b-0">
          <div class="font-semibold text-gray-900">${value}</div>
          ${desc ? `<div class="text-xs text-gray-600 mt-1">${desc}</div>` : ''}
        </div>
      `;
    });

    html += '</div></div>';
    return html;
  }

  render() {
    if (!this.container) return;

    if (this.properties.length === 0) {
      this.container.innerHTML = `
        <div class="text-gray-500 text-center py-8">
          <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <p>${this.options.emptyMessage}</p>
        </div>
      `;
      return;
    }

    let html = '<div class="schema-viewer">';

    // Add title if provided
    if (this.options.title) {
      html += `<h3 class="font-semibold text-lg mb-3">${this.options.title}</h3>`;
    }

    // Add search box if searchable
    if (this.options.searchable) {
      html += `
        <div class="mb-4">
          <input
            type="text"
            placeholder="Search variables..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            id="${this.container.id}-search"
          >
        </div>
      `;
    }

    // Add variable count
    html += `
      <div class="text-sm text-gray-600 mb-3">
        Total variables: <span class="font-semibold">${this.filteredProperties.length}</span>
        ${this.searchTerm ? ` (filtered from ${this.properties.length})` : ''}
      </div>
    `;

    // Create table
    html += `
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variable Name</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid Values</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Constraints</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
    `;

    // Add rows
    for (const property of this.filteredProperties) {
      const constraints = this.formatConstraints(property.schema);

      html += `
        <tr class="hover:bg-gray-50">
          <td class="px-4 py-3 text-sm">
            <span class="variable-name font-mono font-semibold text-gray-900">${property.name}</span>
          </td>
          <td class="px-4 py-3 text-sm text-gray-700">${property.description}</td>
          <td class="px-4 py-3 text-sm">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
              ${this.formatType(property.schema)}
            </span>
          </td>
          <td class="px-4 py-3 text-sm text-gray-700">
            ${property.schema.const !== undefined ?
              `<span class="font-mono bg-gray-100 px-2 py-1 rounded">${property.schema.const}</span>` :
              this.formatEnum(property)}
          </td>
          <td class="px-4 py-3 text-sm">
            ${property.required ?
              '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Yes</span>' :
              '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">No</span>'}
          </td>
          <td class="px-4 py-3 text-sm text-gray-700">
            ${constraints.map(c =>
              `<span class="inline-block mr-2 mb-1 px-2 py-1 bg-yellow-50 text-yellow-800 text-xs rounded">${c}</span>`
            ).join(' ')}
          </td>
        </tr>
      `;
    }

    html += `
          </tbody>
        </table>
      </div>
    </div>
    `;

    this.container.innerHTML = html;

    // Set up search if enabled
    if (this.options.searchable) {
      const searchInput = document.getElementById(`${this.container.id}-search`);
      if (searchInput) {
        searchInput.value = this.searchTerm;
        searchInput.addEventListener('input', (e) => {
          this.search(e.target.value);
        });
      }
    }

    // Set up enum dropdown close on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.matches('button')) {
        document.querySelectorAll('[id^="enum_"]').forEach(el => {
          el.classList.add('hidden');
        });
      }
    });
  }

  search(term) {
    this.searchTerm = term.toLowerCase();

    // Update filtered properties
    if (!this.searchTerm) {
      this.filteredProperties = [...this.properties];
    } else {
      this.filteredProperties = this.properties.filter(prop => {
        const searchableText = [
          prop.name,
          prop.description,
          prop.type,
          ...(prop.enum || [])
        ].join(' ').toLowerCase();

        return searchableText.includes(this.searchTerm);
      });
    }

    // Update table rows without re-rendering (to preserve focus)
    this.updateTableRows();
  }

  updateTableRows() {
    // Find all data rows in the table
    const tbody = this.container.querySelector('tbody');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');

    // Create a set of visible property names for efficient lookup
    const visibleNames = new Set(this.filteredProperties.map(p => p.name));

    // Show/hide rows based on filter
    rows.forEach(row => {
      const nameCell = row.querySelector('.variable-name');
      if (nameCell) {
        const propertyName = nameCell.textContent;
        if (visibleNames.has(propertyName)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      }
    });

    // Update the count display
    const countText = this.container.querySelector('.text-sm.text-gray-600');
    if (countText) {
      countText.innerHTML = `
        Total variables: <span class="font-semibold">${this.filteredProperties.length}</span>
        ${this.searchTerm ? ` (filtered from ${this.properties.length})` : ''}
      `;
    }
  }

  getPropertyCount() {
    return this.properties.length;
  }

  highlightProperty(propertyName) {
    // This method will be used to highlight specific properties
    // Useful for showing mappings in the vocabulary mapper
    const row = Array.from(this.container.querySelectorAll('tr')).find(tr => {
      const nameCell = tr.querySelector('td:first-child span');
      return nameCell && nameCell.textContent === propertyName;
    });

    if (row) {
      row.classList.add('bg-amber-50', 'border-l-4', 'border-amber-500');
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  clearHighlights() {
    this.container.querySelectorAll('tr').forEach(row => {
      row.classList.remove('bg-amber-50', 'border-l-4', 'border-amber-500');
    });
  }
}