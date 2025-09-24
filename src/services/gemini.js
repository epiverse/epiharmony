import { GoogleGenAI } from '@google/genai';

export class GeminiService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;
    this.models = {
      embedding: 'gemini-embedding-001',
      chat: 'gemini-2.5-flash'
    };
    this.embeddingDimension = 3072; // Default to maximum
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
    this.genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;
  }

  setModels(embeddingModel, chatModel) {
    if (embeddingModel) this.models.embedding = embeddingModel;
    if (chatModel) this.models.chat = chatModel;
  }

  setEmbeddingDimension(dimension) {
    // Validate dimension is in allowed range
    if (dimension >= 128 && dimension <= 3072) {
      this.embeddingDimension = dimension;
    } else {
      throw new Error('Embedding dimension must be between 128 and 3072');
    }
  }

  async validateApiKey() {
    if (!this.genAI) {
      throw new Error('API key not set');
    }

    try {
      // Test with a simple generation request
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Test'
      });

      return true;
    } catch (error) {
      throw new Error(`API key validation failed: ${error.message}`);
    }
  }

  async listModels() {
    if (!this.genAI) {
      throw new Error('API key not set');
    }

    try {
      // Use the SDK's models.list() method to get available models
      const pager = await this.genAI.models.list();
      const embeddingModels = [];
      const chatModels = [];

      // Iterate through all pages of models
      for await (const model of pager) {
        // Extract model name (last part after /)
        const modelName = model.name?.split('/').pop() || model.name;
        const displayName = model.displayName || modelName;

        // Create model object
        const modelInfo = {
          name: modelName,
          displayName: displayName,
          description: model.description || ''
        };

        // Categorize based on supported actions
        if (model.supportedActions?.includes('embedContent')) {
          embeddingModels.push(modelInfo);
        }

        if (model.supportedActions?.includes('generateContent')) {
          chatModels.push(modelInfo);
        }

        // Also check by name pattern as fallback
        if (!model.supportedActions) {
          if (modelName.includes('embedding')) {
            if (!embeddingModels.find(m => m.name === modelName)) {
              embeddingModels.push(modelInfo);
            }
          } else {
            if (!chatModels.find(m => m.name === modelName)) {
              chatModels.push(modelInfo);
            }
          }
        }
      }

      // If no models found, return defaults
      if (embeddingModels.length === 0) {
        embeddingModels.push({
          name: 'gemini-embedding-001',
          displayName: 'Gemini Embedding 001',
          description: 'Text embedding model'
        });
      }

      if (chatModels.length === 0) {
        chatModels.push(
          { name: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash', description: 'Fast, versatile performance' },
          { name: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro', description: 'Complex reasoning' },
          { name: 'gemini-2.5-flash-lite', displayName: 'Gemini 2.5 Flash Lite', description: 'Cost-efficient' }
        );
      }

      console.log('Available models loaded:', {
        embeddings: embeddingModels.length,
        chat: chatModels.length
      });

      return { embeddingModels, chatModels };
    } catch (error) {
      console.error('Failed to list models:', error);
      // Return default models if listing fails
      return {
        embeddingModels: [
          { name: 'gemini-embedding-001', displayName: 'Gemini Embedding 001' }
        ],
        chatModels: [
          { name: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash' },
          { name: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro' },
          { name: 'gemini-2.5-flash-lite', displayName: 'Gemini 2.5 Flash Lite' }
        ]
      };
    }
  }

  async generateEmbedding(text, options = {}) {
    if (!this.genAI) {
      throw new Error('API key not set');
    }

    try {
      const dimension = options.outputDimension || this.embeddingDimension;

      const params = {
        model: options.model || this.models.embedding,
        contents: text,
        config: {
          outputDimensionality: dimension,
          taskType: 'SEMANTIC_SIMILARITY'
        }
      };

      const result = await this.genAI.models.embedContent(params);

      // Response has embeddings array, get first element
      const embedding = result.embeddings?.[0];
      if (!embedding) {
        throw new Error('No embedding returned from API');
      }

      // Normalize embeddings if dimension is not 3072
      if (dimension !== 3072 && embedding.values) {
        const values = embedding.values;
        const magnitude = Math.sqrt(values.reduce((sum, val) => sum + val * val, 0));
        embedding.values = values.map(val => val / magnitude);
      }

      return embedding;
    } catch (error) {
      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  async generateBatchEmbeddings(texts, options = {}) {
    if (!this.genAI) {
      throw new Error('API key not set');
    }

    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('Texts must be a non-empty array');
    }

    try {
      // Process in batches to avoid rate limits
      const batchSize = options.batchSize || 100;
      const embeddings = [];

      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);

        // Create batch request
        const dimension = options.outputDimension || this.embeddingDimension;
        const requests = batch.map(text => ({
          model: options.model || this.models.embedding,
          contents: text,
          config: {
            outputDimensionality: dimension,
            taskType: 'SEMANTIC_SIMILARITY'
          }
        }));

        // Process batch in parallel
        const batchResults = await Promise.all(
          requests.map(req => this.genAI.models.embedContent(req))
        );

        // Normalize if needed and collect results
        for (const result of batchResults) {
          // Response has embeddings array, get first element
          const embedding = result.embeddings?.[0];
          if (!embedding) {
            throw new Error('No embedding returned from API');
          }

          if (dimension !== 3072 && embedding.values) {
            const values = embedding.values;
            const magnitude = Math.sqrt(values.reduce((sum, val) => sum + val * val, 0));
            embedding.values = values.map(val => val / magnitude);
          }
          embeddings.push(embedding);
        }

        // Add delay between batches to respect rate limits
        if (i + batchSize < texts.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return embeddings;
    } catch (error) {
      throw new Error(`Batch embedding generation failed: ${error.message}`);
    }
  }

  async generateContent(prompt, options = {}) {
    if (!this.genAI) {
      throw new Error('API key not set');
    }

    try {
      const result = await this.genAI.models.generateContent({
        model: options.model || this.models.chat,
        contents: prompt,
        generationConfig: options.generationConfig || {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      });

      return result.text;
    } catch (error) {
      throw new Error(`Content generation failed: ${error.message}`);
    }
  }

  async testEmbedding() {
    try {
      const testText = "This is a test embedding for epiHarmony";
      console.log(`Testing embedding with model: ${this.models.embedding}`);
      console.log(`Output dimension: ${this.embeddingDimension}`);

      const embedding = await this.generateEmbedding(testText);

      console.log('Embedding test successful!');
      console.log(`Generated embedding with ${embedding.values.length} dimensions`);
      console.log('First 10 values:', embedding.values.slice(0, 10));

      return {
        success: true,
        model: this.models.embedding,
        dimension: embedding.values.length,
        sample: embedding.values.slice(0, 10)
      };
    } catch (error) {
      console.error('Embedding test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testChat() {
    try {
      const testPrompt = "Say 'Hello from epiHarmony!' and briefly explain what data harmonization means in one sentence.";
      console.log(`Testing chat with model: ${this.models.chat}`);

      const response = await this.generateContent(testPrompt);

      console.log('Chat test successful!');
      console.log('Response:', response);

      return {
        success: true,
        model: this.models.chat,
        response: response
      };
    } catch (error) {
      console.error('Chat test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Singleton instance
let geminiServiceInstance = null;

export function getGeminiService(apiKey) {
  if (!geminiServiceInstance) {
    geminiServiceInstance = new GeminiService(apiKey);
  } else if (apiKey && apiKey !== geminiServiceInstance.apiKey) {
    geminiServiceInstance.setApiKey(apiKey);
  }
  return geminiServiceInstance;
}