import { EntityDB } from '@babycommando/entity-db';
import { getGeminiService } from './gemini.js';
import { StorageManager } from '../core/storage.js';

export class VocabularyMappingService {
  constructor() {
    this.storageManager = new StorageManager();
    this.geminiService = null;
    this.sourceDB = null;
    this.targetDB = null;
    this.mappings = [];
    this.candidateMappings = [];
  }

  async initialize() {
    // Get API key from storage
    const apiKey = await this.storageManager.getApiKey();
    if (apiKey) {
      this.geminiService = getGeminiService(apiKey);
    }

    // Initialize vector databases
    await this.initializeVectorDatabases();
  }

  async initializeVectorDatabases() {
    try {
      // Create separate databases for source and target schemas
      this.sourceDB = new EntityDB({
        vectorPath: 'epiharmony_source_vectors',
        model: null // We'll use manual vectors from Gemini
      });

      this.targetDB = new EntityDB({
        vectorPath: 'epiharmony_target_vectors',
        model: null // We'll use manual vectors from Gemini
      });

      console.log('Vector databases initialized');
    } catch (error) {
      console.error('Failed to initialize vector databases:', error);
    }
  }

  /**
   * Extract schema properties with metadata for embedding
   */
  extractSchemaProperties(schema, prefix = '') {
    const properties = [];

    if (schema.type === 'object' && schema.properties) {
      Object.entries(schema.properties).forEach(([key, prop]) => {
        const fullPath = prefix ? `${prefix}.${key}` : key;

        // Create comprehensive text for embedding
        let embeddingText = key;
        if (prop.title) embeddingText += ` ${prop.title}`;
        if (prop.description) embeddingText += ` ${prop.description}`;

        properties.push({
          path: fullPath,
          name: key,
          type: prop.type || 'unknown',
          title: prop.title || '',
          description: prop.description || '',
          enum: prop.enum || null,
          format: prop.format || null,
          embeddingText,
          schema: prop
        });

        // Recursively process nested objects
        if (prop.type === 'object' && prop.properties) {
          properties.push(...this.extractSchemaProperties(prop, fullPath));
        }
      });
    } else if (schema.type === 'array' && schema.items) {
      // For array schemas, process the items
      if (schema.items.type === 'object' && schema.items.properties) {
        properties.push(...this.extractSchemaProperties(schema.items, prefix));
      }
    }

    return properties;
  }

  /**
   * Generate embeddings for schema properties using Gemini
   */
  async generateEmbeddings(properties, options = {}) {
    if (!this.geminiService) {
      throw new Error('Gemini service not initialized. Please set API key.');
    }

    const texts = properties.map(p => p.embeddingText);
    const embeddings = [];

    // Process in batches to avoid rate limits
    const batchSize = 20;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      try {
        // Generate embeddings for batch
        const batchEmbeddings = await Promise.all(
          batch.map(text =>
            this.geminiService.generateEmbedding(text, {
              outputDimension: options.dimension || 768
            })
          )
        );

        embeddings.push(...batchEmbeddings);

        // Progress callback
        if (options.onProgress) {
          options.onProgress({
            processed: Math.min(i + batchSize, texts.length),
            total: texts.length
          });
        }

        // Add delay between batches to respect rate limits
        if (i + batchSize < texts.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Failed to generate embeddings for batch ${i / batchSize}:`, error);
        throw error;
      }
    }

    return embeddings;
  }

  /**
   * Embed schemas into vector databases
   */
  async embedSchemas(sourceSchema, targetSchema, options = {}) {
    try {
      // Extract properties from schemas
      const sourceProps = this.extractSchemaProperties(sourceSchema);
      const targetProps = this.extractSchemaProperties(targetSchema);

      console.log(`Extracted ${sourceProps.length} source properties and ${targetProps.length} target properties`);

      // Generate embeddings
      console.log('Generating source embeddings...');
      const sourceEmbeddings = await this.generateEmbeddings(sourceProps, {
        ...options,
        onProgress: (progress) => {
          if (options.onProgress) {
            options.onProgress({
              phase: 'source',
              ...progress
            });
          }
        }
      });

      console.log('Generating target embeddings...');
      const targetEmbeddings = await this.generateEmbeddings(targetProps, {
        ...options,
        onProgress: (progress) => {
          if (options.onProgress) {
            options.onProgress({
              phase: 'target',
              ...progress
            });
          }
        }
      });

      // Clear existing data
      // Note: EntityDB doesn't have a clear method, so we'll work with what we have

      // Insert into vector databases
      console.log('Storing embeddings in vector databases...');

      for (let i = 0; i < sourceProps.length; i++) {
        await this.sourceDB.insertManualVectors({
          text: sourceProps[i].embeddingText,
          embedding: sourceEmbeddings[i].values,
          metadata: sourceProps[i]
        });
      }

      for (let i = 0; i < targetProps.length; i++) {
        await this.targetDB.insertManualVectors({
          text: targetProps[i].embeddingText,
          embedding: targetEmbeddings[i].values,
          metadata: targetProps[i]
        });
      }

      console.log('Embeddings stored successfully');

      return {
        sourceProperties: sourceProps,
        targetProperties: targetProps
      };
    } catch (error) {
      console.error('Failed to embed schemas:', error);
      throw error;
    }
  }

  /**
   * Find k-nearest neighbors for a given property
   */
  async findNearestNeighbors(property, embedding, targetDB, k = 5) {
    try {
      // Query the target database for similar vectors
      const results = await targetDB.queryManualVectors(embedding, k);

      return results.map(result => ({
        property: result.metadata,
        similarity: result.similarity || result.score,
        distance: result.distance
      }));
    } catch (error) {
      console.error('Failed to find nearest neighbors:', error);
      return [];
    }
  }

  /**
   * Build bipartite graph of potential mappings
   */
  async buildBipartiteGraph(sourceProps, targetProps, k = 5) {
    const graph = {
      sourceNodes: new Set(),
      targetNodes: new Set(),
      edges: [],
      adjacencyList: new Map()
    };

    console.log('Building bipartite graph...');

    // For each source property, find top-k target properties
    for (const sourceProp of sourceProps) {
      const sourceEmbedding = await this.sourceDB.query(sourceProp.embeddingText, 1);
      if (sourceEmbedding && sourceEmbedding[0]) {
        const neighbors = await this.findNearestNeighbors(
          sourceProp,
          sourceEmbedding[0].embedding,
          this.targetDB,
          k
        );

        graph.sourceNodes.add(sourceProp.path);

        if (!graph.adjacencyList.has(sourceProp.path)) {
          graph.adjacencyList.set(sourceProp.path, []);
        }

        for (const neighbor of neighbors) {
          if (neighbor.property && neighbor.similarity > 0.5) { // Similarity threshold
            graph.targetNodes.add(neighbor.property.path);
            graph.edges.push({
              source: sourceProp.path,
              target: neighbor.property.path,
              similarity: neighbor.similarity,
              sourceProperty: sourceProp,
              targetProperty: neighbor.property
            });
            graph.adjacencyList.get(sourceProp.path).push(neighbor.property.path);
          }
        }
      }
    }

    // Also search from target to source to catch many-to-one mappings
    for (const targetProp of targetProps) {
      const targetEmbedding = await this.targetDB.query(targetProp.embeddingText, 1);
      if (targetEmbedding && targetEmbedding[0]) {
        const neighbors = await this.findNearestNeighbors(
          targetProp,
          targetEmbedding[0].embedding,
          this.sourceDB,
          k
        );

        for (const neighbor of neighbors) {
          if (neighbor.property && neighbor.similarity > 0.5) {
            // Check if edge already exists
            const existingEdge = graph.edges.find(
              e => e.source === neighbor.property.path && e.target === targetProp.path
            );

            if (!existingEdge) {
              graph.sourceNodes.add(neighbor.property.path);
              graph.targetNodes.add(targetProp.path);

              if (!graph.adjacencyList.has(neighbor.property.path)) {
                graph.adjacencyList.set(neighbor.property.path, []);
              }

              graph.edges.push({
                source: neighbor.property.path,
                target: targetProp.path,
                similarity: neighbor.similarity,
                sourceProperty: neighbor.property,
                targetProperty: targetProp
              });
              graph.adjacencyList.get(neighbor.property.path).push(targetProp.path);
            }
          }
        }
      }
    }

    console.log(`Built bipartite graph with ${graph.edges.length} edges`);
    return graph;
  }

  /**
   * Find connected components in the bipartite graph
   */
  findConnectedComponents(graph) {
    const visited = new Set();
    const components = [];

    // BFS to find connected components
    const bfs = (startNode, isSourceNode) => {
      const queue = [{ node: startNode, isSource: isSourceNode }];
      const component = {
        sourceNodes: [],
        targetNodes: [],
        edges: []
      };

      while (queue.length > 0) {
        const { node, isSource } = queue.shift();

        if (visited.has(node)) continue;
        visited.add(node);

        if (isSource) {
          component.sourceNodes.push(node);
          // Find all edges from this source node
          const neighbors = graph.adjacencyList.get(node) || [];
          for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
              queue.push({ node: neighbor, isSource: false });
            }
            // Add edge to component
            const edge = graph.edges.find(e => e.source === node && e.target === neighbor);
            if (edge) component.edges.push(edge);
          }
        } else {
          component.targetNodes.push(node);
          // Find all edges to this target node
          for (const [source, targets] of graph.adjacencyList.entries()) {
            if (targets.includes(node) && !visited.has(source)) {
              queue.push({ node: source, isSource: true });
            }
          }
        }
      }

      return component;
    };

    // Process all unvisited nodes
    for (const sourceNode of graph.sourceNodes) {
      if (!visited.has(sourceNode)) {
        const component = bfs(sourceNode, true);
        if (component.sourceNodes.length > 0 || component.targetNodes.length > 0) {
          components.push(component);
        }
      }
    }

    console.log(`Found ${components.length} connected components`);
    return components;
  }

  /**
   * Use LLM to refine mappings within a connected component
   */
  async refineMappingWithLLM(component, sourceSchema, targetSchema) {
    if (!this.geminiService) {
      throw new Error('Gemini service not initialized');
    }

    // Prepare component details for LLM
    const sourceDetails = component.sourceNodes.map(path => {
      const edge = component.edges.find(e => e.source === path);
      if (edge && edge.sourceProperty) {
        return {
          path,
          name: edge.sourceProperty.name,
          type: edge.sourceProperty.type,
          description: edge.sourceProperty.description
        };
      }
      return { path };
    });

    const targetDetails = component.targetNodes.map(path => {
      const edge = component.edges.find(e => e.target === path);
      if (edge && edge.targetProperty) {
        return {
          path,
          name: edge.targetProperty.name,
          type: edge.targetProperty.type,
          description: edge.targetProperty.description
        };
      }
      return { path };
    });

    const prompt = `
You are a data harmonization expert. Analyze the following source and target schema properties that are semantically related, and determine the best mapping between them.

Source Properties:
${JSON.stringify(sourceDetails, null, 2)}

Target Properties:
${JSON.stringify(targetDetails, null, 2)}

Consider:
1. One-to-one mappings: Direct correspondence between single properties
2. Many-to-one mappings: Multiple source properties combine to form one target property
3. One-to-many mappings: One source property splits into multiple target properties
4. Properties that should not be mapped despite similarity

Return your response as a JSON object with the following structure:
{
  "mappings": [
    {
      "source": ["source_property_path1", "source_property_path2"],
      "target": ["target_property_path1"],
      "type": "many-to-one|one-to-many|one-to-one",
      "confidence": 0.0-1.0,
      "description": "Brief explanation of the mapping"
    }
  ],
  "unmapped_source": ["paths of source properties that shouldn't be mapped"],
  "unmapped_target": ["paths of target properties that shouldn't be mapped"]
}
`;

    try {
      const response = await this.geminiService.generateContent(prompt, {
        temperature: 0.3,
        maxOutputTokens: 2048
      });

      // Parse the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse LLM response');
    } catch (error) {
      console.error('Failed to refine mapping with LLM:', error);

      // Fallback to simple one-to-one mappings based on highest similarity
      const fallbackMappings = [];
      const usedTargets = new Set();

      for (const edge of component.edges.sort((a, b) => b.similarity - a.similarity)) {
        if (!usedTargets.has(edge.target)) {
          fallbackMappings.push({
            source: [edge.source],
            target: [edge.target],
            type: 'one-to-one',
            confidence: edge.similarity,
            description: 'Similarity-based mapping'
          });
          usedTargets.add(edge.target);
        }
      }

      return { mappings: fallbackMappings };
    }
  }

  /**
   * Generate complete vocabulary mappings
   */
  async generateMappings(sourceSchema, targetSchema, options = {}) {
    try {
      // Step 1: Embed schemas
      const { sourceProperties, targetProperties } = await this.embedSchemas(
        sourceSchema,
        targetSchema,
        options
      );

      // Step 2: Build bipartite graph
      const graph = await this.buildBipartiteGraph(
        sourceProperties,
        targetProperties,
        options.k || 5
      );

      // Step 3: Find connected components
      const components = this.findConnectedComponents(graph);

      // Step 4: Refine each component with LLM
      const allMappings = [];

      for (let i = 0; i < components.length; i++) {
        if (options.onProgress) {
          options.onProgress({
            phase: 'refining',
            processed: i,
            total: components.length
          });
        }

        const refinedMapping = await this.refineMappingWithLLM(
          components[i],
          sourceSchema,
          targetSchema
        );

        if (refinedMapping && refinedMapping.mappings) {
          allMappings.push(...refinedMapping.mappings);
        }

        // Add delay between LLM calls
        if (i < components.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Format mappings for display
      this.candidateMappings = allMappings.map((mapping, index) => ({
        id: `mapping-${index}`,
        source: mapping.source,
        target: mapping.target,
        type: mapping.type,
        confidence: mapping.confidence || 0.5,
        description: mapping.description || '',
        status: 'pending', // pending, accepted, rejected, flagged
        displayName: this.getMappingDisplayName(mapping)
      }));

      console.log(`Generated ${this.candidateMappings.length} mappings`);

      // Store mappings
      await this.storageManager.saveMappings(this.candidateMappings);

      return this.candidateMappings;
    } catch (error) {
      console.error('Failed to generate mappings:', error);
      throw error;
    }
  }

  /**
   * Get display name for a mapping
   */
  getMappingDisplayName(mapping) {
    const sourceStr = mapping.source.length === 1
      ? mapping.source[0]
      : `{${mapping.source.join(', ')}}`;

    const targetStr = mapping.target.length === 1
      ? mapping.target[0]
      : `{${mapping.target.join(', ')}}`;

    return `${sourceStr} → ${targetStr}`;
  }

  /**
   * Accept a mapping
   */
  acceptMapping(mappingId) {
    const mapping = this.candidateMappings.find(m => m.id === mappingId);
    if (mapping) {
      mapping.status = 'accepted';
      this.mappings.push(mapping);
      this.storageManager.saveMappings(this.candidateMappings);
    }
  }

  /**
   * Reject a mapping
   */
  rejectMapping(mappingId) {
    const mapping = this.candidateMappings.find(m => m.id === mappingId);
    if (mapping) {
      mapping.status = 'rejected';
      this.storageManager.saveMappings(this.candidateMappings);
    }
  }

  /**
   * Flag a mapping for review
   */
  flagMapping(mappingId) {
    const mapping = this.candidateMappings.find(m => m.id === mappingId);
    if (mapping) {
      mapping.status = 'flagged';
      this.storageManager.saveMappings(this.candidateMappings);
    }
  }

  /**
   * Create a manual mapping
   */
  async createManualMapping(sourcePaths, targetPaths, description = '') {
    const mapping = {
      id: `mapping-manual-${Date.now()}`,
      source: sourcePaths,
      target: targetPaths,
      type: this.determineMappingType(sourcePaths, targetPaths),
      confidence: 1.0, // Manual mappings have full confidence
      description: description || 'Manual mapping',
      status: 'accepted',
      displayName: this.getMappingDisplayName({ source: sourcePaths, target: targetPaths })
    };

    this.candidateMappings.push(mapping);
    this.mappings.push(mapping);
    await this.storageManager.saveMappings(this.candidateMappings);

    return mapping;
  }

  /**
   * Determine mapping type based on cardinality
   */
  determineMappingType(sourcePaths, targetPaths) {
    if (sourcePaths.length === 1 && targetPaths.length === 1) {
      return 'one-to-one';
    } else if (sourcePaths.length > 1 && targetPaths.length === 1) {
      return 'many-to-one';
    } else if (sourcePaths.length === 1 && targetPaths.length > 1) {
      return 'one-to-many';
    } else {
      return 'many-to-many';
    }
  }

  /**
   * Get accepted mappings
   */
  getAcceptedMappings() {
    return this.candidateMappings.filter(m => m.status === 'accepted');
  }

  /**
   * Load existing mappings
   */
  async loadMappings() {
    const stored = await this.storageManager.getMappings();
    if (stored && stored.length > 0) {
      this.candidateMappings = stored;
      this.mappings = stored.filter(m => m.status === 'accepted');
      return stored;
    }
    return [];
  }

  /**
   * Clear all mappings
   */
  async clearMappings() {
    this.mappings = [];
    this.candidateMappings = [];
    await this.storageManager.saveMappings([]);
  }

  /**
   * Find k related concepts for a specific target property
   */
  async findRelatedConcepts(targetProperty, sourceSchema, k = 5, options = {}) {
    if (!this.geminiService) {
      throw new Error('Gemini service not initialized');
    }

    try {
      // Extract source properties
      const sourceProps = this.extractSchemaProperties(sourceSchema);

      // Generate embedding for target property
      const targetEmbedding = await this.geminiService.generateEmbedding(
        targetProperty.embeddingText || `${targetProperty.name} ${targetProperty.description}`,
        { outputDimension: options.dimension || 768 }
      );

      // Generate embeddings for all source properties
      const sourceEmbeddings = await this.generateEmbeddings(sourceProps, {
        dimension: options.dimension || 768,
        onProgress: options.onProgress
      });

      // Calculate similarities
      const similarities = [];
      for (let i = 0; i < sourceProps.length; i++) {
        const similarity = this.cosineSimilarity(
          targetEmbedding.values,
          sourceEmbeddings[i].values
        );

        similarities.push({
          property: sourceProps[i],
          similarity: similarity,
          score: Math.round(similarity * 100) // Convert to percentage
        });
      }

      // Sort by similarity and return top k
      similarities.sort((a, b) => b.similarity - a.similarity);
      const topK = similarities.slice(0, k);

      return {
        targetProperty,
        candidates: topK,
        allScores: similarities
      };
    } catch (error) {
      console.error('Failed to find related concepts:', error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vec1, vec2) {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  }

  /**
   * Get the default prompt for mapping analysis
   */
  getDefaultPrompt() {
    return `You are a data harmonization expert focused on finding the MINIMAL SUFFICIENT mapping to derive the target property.

CRITICAL PRINCIPLES:
1. PARSIMONY: Use the FEWEST source properties necessary - fewer is better
2. NECESSITY TEST: For each property ask "Can I correctly populate the target WITHOUT this?"
3. SUFFICIENCY TEST: "Do these properties provide ALL required information?"
4. REDUNDANCY CHECK: Exclude properties that duplicate information already captured

REASONING APPROACH:
- Start with the single most essential property
- Only add more if the target CANNOT be correctly derived without them
- For each candidate, explicitly reason: "Is this NECESSARY or just nice-to-have?"
- Justify why excluded properties are NOT needed
- If multiple properties seem related, determine if they're truly ALL required

RESPONSE FORMAT (use === markers):

=== ANALYSIS ===
[Explain what the target property represents and examine each candidate's relevance]
[For each candidate, answer: Is this NECESSARY to derive the target?]

=== MAPPING OPTIONS ===
[List possible mappings from most minimal to most comprehensive]
[Explain what information would be missing with each option]

=== RECOMMENDATION ===
MAPPING_TYPE: [one-to-one, many-to-one, one-to-many, or many-to-many]
SOURCE_PROPERTIES: [Comma-separated list of ONLY necessary properties]
TARGET_PROPERTIES: [Usually just the target property name]
CONFIDENCE: [High, Medium, or Low]
RATIONALE: [Why these specific properties are necessary and sufficient]

=== TRANSFORMATION NOTES ===
[How to derive the target from the recommended source properties]

NOW ANALYZE THIS MAPPING:`;
  }

  /**
   * Analyze mapping with detailed reasoning
   */
  async analyzeMappingWithReasoning(targetProperty, candidates, options = {}) {
    if (!this.geminiService) {
      throw new Error('Gemini service not initialized');
    }

    // Check for custom prompt, otherwise use default
    let promptTemplate = this.getDefaultPrompt();

    // If a custom prompt is provided in options, use it
    if (options.customPrompt) {
      promptTemplate = options.customPrompt;
    } else if (!options.skipCustomPrompt) {
      // Otherwise check storage for saved custom prompt
      const customPrompt = await this.storageManager.getCustomPrompt();
      if (customPrompt) {
        promptTemplate = customPrompt;
      }
    }

    // Build the full prompt with target and candidates
    const prompt = `${promptTemplate}

TARGET PROPERTY:
Name: ${targetProperty.name}
Full JSON Schema:
${JSON.stringify(targetProperty.schema || {
  type: targetProperty.type,
  description: targetProperty.description,
  enum: targetProperty.enum
}, null, 2)}

SOURCE CANDIDATES (sorted by similarity):
${candidates.map((c, i) => `
${i + 1}. ${c.property.name} (Similarity: ${c.score}%)
   Full JSON Schema:
${JSON.stringify(c.property.schema || {
  type: c.property.type,
  description: c.property.description,
  enum: c.property.enum
}, null, 2).split('\n').map(line => '   ' + line).join('\n')}
`).join('')}

YOUR RESPONSE (follow the EXACT format as the examples above, with === section markers):
`;

    try {
      const response = await this.geminiService.generateContent(prompt, {
        temperature: 0.3,
        maxOutputTokens: 2048
      });

      // Parse the response into structured format
      const analysis = this.parseAnalysisResponse(response);

      return {
        targetProperty,
        candidates,
        analysis,
        rawResponse: response
      };
    } catch (error) {
      console.error('Failed to analyze mapping:', error);
      throw error;
    }
  }

  /**
   * Parse LLM analysis response
   */
  parseAnalysisResponse(response) {
    const sections = {
      analysis: '',
      mappingOptions: [],
      recommendation: {
        type: '',
        sourceProperties: [],
        targetProperties: [],
        confidence: '',
        rationale: ''
      },
      transformationNotes: ''
    };

    try {
      // Extract sections using the === markers
      const analysisMatch = response.match(/=== ANALYSIS ===([\s\S]*?)(?==== |$)/);
      if (analysisMatch) {
        sections.analysis = analysisMatch[1].trim();
      }

      const optionsMatch = response.match(/=== MAPPING OPTIONS ===([\s\S]*?)(?==== |$)/);
      if (optionsMatch) {
        sections.mappingOptions = optionsMatch[1].trim().split('\n').filter(l => l.trim());
      }

      const recommendationMatch = response.match(/=== RECOMMENDATION ===([\s\S]*?)(?==== |$)/);
      if (recommendationMatch) {
        const recText = recommendationMatch[1].trim();

        // Parse each line in the recommendation section
        const lines = recText.split('\n');
        for (const line of lines) {
          const trimmedLine = line.trim();

          if (trimmedLine.startsWith('MAPPING_TYPE:')) {
            sections.recommendation.type = trimmedLine.split(':')[1].trim().toLowerCase();
          }

          if (trimmedLine.startsWith('SOURCE_PROPERTIES:')) {
            const propsStr = trimmedLine.split(':')[1].trim();
            // Handle comma-separated list of properties
            sections.recommendation.sourceProperties = propsStr
              .split(',')
              .map(p => p.trim())
              .filter(p => p.length > 0);
          }

          if (trimmedLine.startsWith('TARGET_PROPERTIES:')) {
            const propsStr = trimmedLine.split(':')[1].trim();
            sections.recommendation.targetProperties = propsStr
              .split(',')
              .map(p => p.trim())
              .filter(p => p.length > 0);
          }

          if (trimmedLine.startsWith('CONFIDENCE:')) {
            sections.recommendation.confidence = trimmedLine.split(':')[1].trim();
          }

          if (trimmedLine.startsWith('RATIONALE:')) {
            // Rationale might span multiple lines, so take everything after RATIONALE:
            const rationaleStart = recText.indexOf('RATIONALE:');
            if (rationaleStart !== -1) {
              sections.recommendation.rationale = recText
                .substring(rationaleStart + 10)
                .trim();
            }
          }
        }
      }

      const transformMatch = response.match(/=== TRANSFORMATION NOTES ===([\s\S]*?)$/);
      if (transformMatch) {
        sections.transformationNotes = transformMatch[1].trim();
      }

    } catch (e) {
      console.error('Error parsing analysis response:', e);
      // Fallback to old parsing if new format fails
      this.fallbackParsing(response, sections);
    }

    return sections;
  }

  /**
   * Fallback parsing for backwards compatibility
   */
  fallbackParsing(response, sections) {
    // Try to extract mapping type from anywhere in response
    if (response.match(/many[\s-]to[\s-]one/i)) {
      sections.recommendation.type = 'many-to-one';
    } else if (response.match(/one[\s-]to[\s-]many/i)) {
      sections.recommendation.type = 'one-to-many';
    } else if (response.match(/one[\s-]to[\s-]one/i)) {
      sections.recommendation.type = 'one-to-one';
    }

    // Try to extract confidence
    const confMatch = response.match(/confidence[:\s]+(High|Medium|Low)/i);
    if (confMatch) {
      sections.recommendation.confidence = confMatch[1];
    }

    // Try to extract property names mentioned after "Properties to use" or similar
    const propsMatch = response.match(/properties to use[:\s]+([^\n]+)/i);
    if (propsMatch) {
      const propNames = propsMatch[1].match(/\b[A-Z][A-Z0-9_]+\b/g);
      if (propNames) {
        sections.recommendation.sourceProperties = propNames;
      }
    }
  }

  /**
   * Refine mapping with chat interaction
   */
  async refineMappingWithChat(context, userMessage, options = {}) {
    if (!this.geminiService) {
      throw new Error('Gemini service not initialized');
    }

    const prompt = `
You are helping refine a data mapping decision. Here's the context:

CURRENT MAPPING CONTEXT:
Target: ${context.targetProperty.name} (${context.targetProperty.type})
Current Recommendation: ${context.currentRecommendation}
Candidates: ${context.candidates.map(c => c.property.name).join(', ')}

PREVIOUS ANALYSIS:
${context.previousAnalysis}

USER QUESTION/REQUEST:
${userMessage}

Please provide a helpful response that:
1. Directly addresses the user's question or request
2. Provides specific recommendations if asked
3. Explains any trade-offs or considerations
4. Suggests concrete next steps

Keep your response focused and actionable.
`;

    try {
      const response = await this.geminiService.generateContent(prompt, {
        temperature: 0.5,
        maxOutputTokens: 1024
      });

      return {
        userMessage,
        assistantResponse: response,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to refine mapping:', error);
      throw error;
    }
  }
}

// Singleton instance
let vocabularyMappingServiceInstance = null;

export function getVocabularyMappingService() {
  if (!vocabularyMappingServiceInstance) {
    vocabularyMappingServiceInstance = new VocabularyMappingService();
  }
  return vocabularyMappingServiceInstance;
}