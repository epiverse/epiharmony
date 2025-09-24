#!/usr/bin/env node

// Test script for models.list() functionality
import { GoogleGenAI } from '@google/genai';

// Get API key from environment or command line
const apiKey = process.env.GEMINI_API_KEY || process.argv[2];

if (!apiKey) {
  console.error('Please provide a Gemini API key:');
  console.error('Usage: node test-models-list.js YOUR_API_KEY');
  console.error('Or set GEMINI_API_KEY environment variable');
  process.exit(1);
}

console.log('Testing Gemini models.list() API...\n');

async function testModelsList() {
  try {
    // Initialize the SDK
    const ai = new GoogleGenAI({ apiKey });

    console.log('Fetching available models...\n');

    // List models
    const pager = await ai.models.list();

    const embeddingModels = [];
    const chatModels = [];
    const otherModels = [];

    // Iterate through all models
    for await (const model of pager) {
      const modelName = model.name?.split('/').pop() || model.name;

      console.log(`Model: ${modelName}`);
      console.log(`  Display Name: ${model.displayName || 'N/A'}`);
      console.log(`  Description: ${model.description || 'N/A'}`);
      console.log(`  Supported Actions: ${model.supportedActions?.join(', ') || 'N/A'}`);
      console.log('');

      // Categorize models
      if (model.supportedActions?.includes('embedContent')) {
        embeddingModels.push(modelName);
      }

      if (model.supportedActions?.includes('generateContent')) {
        chatModels.push(modelName);
      }

      if (!model.supportedActions ||
          (!model.supportedActions.includes('embedContent') &&
           !model.supportedActions.includes('generateContent'))) {
        otherModels.push(modelName);
      }
    }

    console.log('\n=== Summary ===');
    console.log(`\nEmbedding Models (${embeddingModels.length}):`);
    embeddingModels.forEach(m => console.log(`  - ${m}`));

    console.log(`\nChat/Generation Models (${chatModels.length}):`);
    chatModels.forEach(m => console.log(`  - ${m}`));

    if (otherModels.length > 0) {
      console.log(`\nOther Models (${otherModels.length}):`);
      otherModels.forEach(m => console.log(`  - ${m}`));
    }

    console.log('\n✅ Successfully retrieved model list!');

  } catch (error) {
    console.error('❌ Error listing models:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testModelsList();