export async function loadSchemaFromUrl(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch schema: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Error loading schema from URL: ${error.message}`);
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