export async function loadSchemaFromUrl(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 0 || response.type === 'opaque') {
        throw new Error('CORS policy blocked access. Please ensure the schema URL allows cross-origin requests.');
      }
      throw new Error(`Failed to fetch schema: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Failed to fetch schema. This may be due to CORS restrictions or network issues. Please ensure the URL allows cross-origin requests.');
    }
    if (error.message.includes('JSON')) {
      throw new Error('The URL did not return valid JSON. Please verify the schema URL.');
    }
    throw new Error(`Error loading schema: ${error.message}`);
  }
}

export function validateSchema(schema) {
  if (!schema || typeof schema !== 'object') {
    return false;
  }

  if (!schema.$schema && !schema.type) {
    return false;
  }

  if (schema.type === 'array' && schema.items) {
    return schema.items.type === 'object';
  }

  if (schema.properties && typeof schema.properties === 'object') {
    return true;
  }

  return false;
}

export function validateTabularSchema(schema) {
  if (!schema || typeof schema !== 'object') {
    return { valid: false, error: 'Schema must be an object' };
  }

  // Check if it's an array schema with object items
  if (schema.type === 'array') {
    if (!schema.items) {
      return { valid: false, error: 'Array schema must have items property' };
    }
    if (schema.items.type !== 'object' && !schema.items.$ref && !schema.items.allOf) {
      return { valid: false, error: 'Array items must be objects or references to objects' };
    }
    return { valid: true };
  }

  // Check if it's an object schema with properties
  if (schema.type === 'object' || schema.properties) {
    if (!schema.properties && !schema.allOf && !schema.$ref) {
      return { valid: false, error: 'Object schema must define properties' };
    }
    return { valid: true };
  }

  return { valid: false, error: 'Schema must be of type array or object for tabular data' };
}

export class SchemaProcessor {
  constructor() {
    this.schemas = new Map();
    this.mainSchema = null;
    this.resolvedSchema = null;
    this.uploadOrder = new Map();
  }

  async loadMultipleSchemas(urls, type = 'source') {
    this.schemas.clear();
    this.mainSchema = null;
    this.resolvedSchema = null;
    this.uploadOrder = new Map(); // Track upload order

    const errors = [];
    const loaded = [];

    for (let index = 0; index < urls.length; index++) {
      const url = urls[index];
      try {
        const schema = await loadSchemaFromUrl(url);

        // Store schema by its $id or URL
        const id = schema.$id || url;
        this.schemas.set(id, schema);

        // Track upload order
        this.uploadOrder.set(id, index + 1);

        // Also store by filename for simpler references
        const filename = url.split('/').pop();
        if (filename !== id) {
          this.schemas.set(filename, schema);
          this.uploadOrder.set(filename, index + 1);
        }

        loaded.push({ url, schema, id });

        // Check if this could be the main schema
        if (schema.type === 'array' && schema.items) {
          this.mainSchema = schema;
        }
      } catch (error) {
        errors.push({ url, error: error.message });
      }
    }

    // If no main schema found, try to use first valid schema
    if (!this.mainSchema && loaded.length > 0) {
      for (const { schema } of loaded) {
        const validation = validateTabularSchema(schema);
        if (validation.valid) {
          this.mainSchema = schema;
          break;
        }
      }
    }

    if (errors.length === urls.length) {
      throw new Error('Failed to load any schemas: ' + errors.map(e => e.error).join('; '));
    }

    if (!this.mainSchema) {
      throw new Error('No valid tabular schema found. Please ensure at least one schema describes an array of objects.');
    }

    // Resolve all references in the main schema
    this.resolvedSchema = this.resolveSchema(this.mainSchema);

    return {
      loaded,
      errors,
      mainSchema: this.mainSchema,
      resolvedSchema: this.resolvedSchema,
      allSchemas: Array.from(this.schemas.values())
    };
  }

  resolveRef(ref, baseSchema = null) {
    // Handle internal references (starting with #)
    if (ref.startsWith('#')) {
      const path = ref.substring(2).split('/');
      let current = baseSchema || this.mainSchema;
      for (const segment of path) {
        if (!current) return null;
        current = current[segment];
      }
      return current;
    }

    // Try to find schema by $id
    if (this.schemas.has(ref)) {
      return this.schemas.get(ref);
    }

    // Try to find by matching end of $id
    for (const [id, schema] of this.schemas) {
      if (id.endsWith(ref) || ref.endsWith(id)) {
        return schema;
      }
    }

    // Try simple filename match
    const filename = ref.split('/').pop();
    if (this.schemas.has(filename)) {
      return this.schemas.get(filename);
    }

    return null;
  }

  resolveSchema(schema, visited = new Set()) {
    if (!schema || typeof schema !== 'object') return schema;

    // Prevent infinite recursion
    const schemaId = schema.$id || JSON.stringify(schema);
    if (visited.has(schemaId)) return schema;
    visited.add(schemaId);

    // Handle $ref
    if (schema.$ref) {
      const resolved = this.resolveRef(schema.$ref, schema);
      if (resolved) {
        return this.resolveSchema(resolved, visited);
      }
    }

    // Handle allOf
    if (schema.allOf) {
      const merged = { ...schema };
      delete merged.allOf;
      merged.properties = merged.properties || {};
      merged.required = merged.required || [];

      for (const subSchema of schema.allOf) {
        let resolved = subSchema;
        if (subSchema.$ref) {
          resolved = this.resolveRef(subSchema.$ref, schema);
        }
        if (resolved) {
          resolved = this.resolveSchema(resolved, visited);
          if (resolved.properties) {
            Object.assign(merged.properties, resolved.properties);
          }
          if (resolved.required) {
            merged.required = [...new Set([...merged.required, ...resolved.required])];
          }
          // Copy other properties
          for (const key of Object.keys(resolved)) {
            if (key !== 'properties' && key !== 'required' && key !== '$id' && key !== '$schema') {
              if (!merged[key]) merged[key] = resolved[key];
            }
          }
        }
      }
      return merged;
    }

    // Recursively resolve nested schemas
    const resolved = { ...schema };
    if (resolved.items) {
      resolved.items = this.resolveSchema(resolved.items, visited);
    }
    if (resolved.properties) {
      resolved.properties = {};
      for (const [key, value] of Object.entries(schema.properties)) {
        resolved.properties[key] = this.resolveSchema(value, visited);
      }
    }

    return resolved;
  }

  extractProperties(schema, category = null) {
    const properties = [];

    if (!schema) return properties;

    // Get the actual schema to process
    let schemaToProcess = schema;
    if (schema.type === 'array' && schema.items) {
      schemaToProcess = schema.items;
    }

    // Extract properties
    if (schemaToProcess.properties) {
      for (const [name, propSchema] of Object.entries(schemaToProcess.properties)) {
        properties.push({
          name,
          category,
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

  getSchemaList() {
    const seen = new Set(); // Avoid duplicates (same schema stored under multiple keys)
    const list = [];

    for (const [id, schema] of this.schemas.entries()) {
      // Skip if we've already processed this schema object
      if (seen.has(schema)) continue;
      seen.add(schema);

      // Determine display name
      let displayName;
      if (schema.$id) {
        // Use $id if available
        displayName = schema.$id;
      } else {
        // Use "Schema N" where N is the upload order
        const order = this.uploadOrder ? this.uploadOrder.get(id) : null;
        displayName = order ? `Schema ${order}` : id;
      }

      list.push({
        id,
        title: displayName,
        description: schema.description || '',
        type: schema.type,
        isMain: schema === this.mainSchema
      });
    }

    return list;
  }

  setMainSchema(schemaId) {
    const schema = this.schemas.get(schemaId);
    if (schema) {
      const validation = validateTabularSchema(schema);
      if (validation.valid) {
        this.mainSchema = schema;
        this.resolvedSchema = this.resolveSchema(this.mainSchema);
        return true;
      }
    }
    return false;
  }
}

export function extractConcepts(schema) {
  const concepts = [];

  function traverse(obj, path = '') {
    if (!obj || typeof obj !== 'object') return;

    if (obj.properties) {
      Object.entries(obj.properties).forEach(([key, value]) => {
        const conceptPath = path ? `${path}.${key}` : key;

        concepts.push({
          name: key,
          path: conceptPath,
          type: value.type || 'any',
          description: value.description || '',
          enum: value.enum || null,
          required: obj.required?.includes(key) || false,
          schema: value
        });

        if (value.type === 'object' && value.properties) {
          traverse(value, conceptPath);
        }
      });
    } else if (obj.items && obj.items.properties) {
      traverse(obj.items, path);
    }
  }

  traverse(schema);
  return concepts;
}

export function generateConceptEmbeddingText(concept) {
  let text = `Variable: ${concept.name}`;

  if (concept.description) {
    text += ` - ${concept.description}`;
  }

  if (concept.type) {
    text += ` (Type: ${concept.type})`;
  }

  if (concept.enum) {
    text += ` [Values: ${concept.enum.join(', ')}]`;
  }

  return text;
}

export function findMainSchema(schemas) {
  for (const schema of schemas) {
    if (schema.type === 'array' && schema.items?.type === 'object') {
      return schema;
    }
  }

  for (const schema of schemas) {
    if (schema.type === 'object' && schema.properties) {
      return schema;
    }
  }

  return schemas[0];
}

export function mergeSchemas(schemas) {
  if (schemas.length === 0) return null;
  if (schemas.length === 1) return schemas[0];

  const merged = {
    type: 'object',
    properties: {},
    required: []
  };

  schemas.forEach(schema => {
    if (schema.properties) {
      Object.assign(merged.properties, schema.properties);
    }
    if (schema.required) {
      merged.required = [...new Set([...merged.required, ...schema.required])];
    }
  });

  return merged;
}

export function compareSchemas(source, target) {
  const sourceConcepts = extractConcepts(source);
  const targetConcepts = extractConcepts(target);

  const comparison = {
    sourceOnly: [],
    targetOnly: [],
    common: [],
    similar: []
  };

  const targetNames = new Set(targetConcepts.map(c => c.name));
  const sourceNames = new Set(sourceConcepts.map(c => c.name));

  sourceConcepts.forEach(concept => {
    if (!targetNames.has(concept.name)) {
      comparison.sourceOnly.push(concept);
    } else {
      comparison.common.push(concept);
    }
  });

  targetConcepts.forEach(concept => {
    if (!sourceNames.has(concept.name)) {
      comparison.targetOnly.push(concept);
    }
  });

  return comparison;
}