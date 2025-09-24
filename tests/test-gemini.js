#!/usr/bin/env node

// Test script for Gemini integration
import { GoogleGenAI } from '@google/genai';

// Get API key from environment or command line
const apiKey = process.env.GEMINI_API_KEY || process.argv[2];

if (!apiKey) {
  console.error('Please provide a Gemini API key:');
  console.error('Usage: node test-gemini.js YOUR_API_KEY');
  console.error('Or set GEMINI_API_KEY environment variable');
  process.exit(1);
}

console.log('Testing Gemini API integration...\n');

async function testGemini() {
  try {
    // Initialize the SDK
    console.log('1. Initializing SDK...');
    const ai = new GoogleGenAI({ apiKey });
    console.log('✓ SDK initialized\n');

    // Test content generation
    console.log('2. Testing content generation...');
    const contentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Say "Hello from epiHarmony!" and explain data harmonization in one sentence.'
    });
    console.log('✓ Content generated:');
    console.log('Response:', contentResponse.text);
    console.log('');

    // Test embedding generation
    console.log('3. Testing embedding generation...');
    const embeddingResponse = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: 'epidemiological data harmonization',
      config: {
        outputDimensionality: 768,
        taskType: 'SEMANTIC_SIMILARITY'
      }
    });
    console.log('✓ Embedding generated:');
    const embedding = embeddingResponse.embeddings[0];
    console.log('Dimensions:', embedding.values.length);
    console.log('First 5 values:', embedding.values.slice(0, 5));
    console.log('');

    // Test different embedding dimensions
    console.log('4. Testing different embedding dimensions...');
    const dimensions = [128, 256, 512, 768, 1536, 3072];

    for (const dim of dimensions) {
      const response = await ai.models.embedContent({
        model: 'gemini-embedding-001',
        contents: 'test',
        config: {
          outputDimensionality: dim,
          taskType: 'SEMANTIC_SIMILARITY'
        }
      });
      const emb = response.embeddings[0];
      console.log(`✓ Dimension ${dim}: Generated ${emb.values.length} values`);
    }
    console.log('');

    console.log('✅ All tests passed successfully!');
    console.log('\nYou can now use this API key in the epiHarmony app.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.message.includes('API_KEY_INVALID')) {
      console.error('The API key appears to be invalid. Please check your key.');
    }
    process.exit(1);
  }
}

testGemini();