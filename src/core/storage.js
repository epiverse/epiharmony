import { openDB } from 'idb';

export class StorageManager {
  constructor() {
    this.dbName = 'epiHarmonyDB';
    this.dbVersion = 1;
    this.db = null;
    this.initPromise = this.init();
  }

  async init() {
    this.db = await openDB(this.dbName, this.dbVersion, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('blueprints')) {
          db.createObjectStore('blueprints');
        }
        if (!db.objectStoreNames.contains('sourceData')) {
          db.createObjectStore('sourceData');
        }
        if (!db.objectStoreNames.contains('config')) {
          db.createObjectStore('config');
        }
        if (!db.objectStoreNames.contains('vectorDB')) {
          db.createObjectStore('vectorDB');
        }
      }
    });
    return this.db;
  }

  async ensureInit() {
    if (!this.db) {
      await this.initPromise;
    }
    return this.db;
  }

  async saveBlueprint(blueprint) {
    await this.ensureInit();
    await this.db.put('blueprints', blueprint, 'current');
  }

  async getBlueprint() {
    await this.ensureInit();
    return await this.db.get('blueprints', 'current');
  }

  async saveSourceData(data) {
    await this.ensureInit();
    await this.db.put('sourceData', data, 'current');
  }

  async getSourceData() {
    await this.ensureInit();
    return await this.db.get('sourceData', 'current');
  }

  async saveAPIKey(apiKey) {
    await this.ensureInit();
    await this.db.put('config', apiKey, 'apiKey');
  }

  async getAPIKey() {
    await this.ensureInit();
    return await this.db.get('config', 'apiKey');
  }

  async clearAPIKey() {
    await this.ensureInit();
    await this.db.delete('config', 'apiKey');
  }

  async saveAIConfig(config) {
    await this.ensureInit();
    await this.db.put('config', config, 'aiConfig');
  }

  async getAIConfig() {
    await this.ensureInit();
    return await this.db.get('config', 'aiConfig');
  }

  async saveCustomPrompt(prompt) {
    await this.ensureInit();
    await this.db.put('config', prompt, 'customPrompt');
  }

  async getCustomPrompt() {
    await this.ensureInit();
    return await this.db.get('config', 'customPrompt');
  }

  async clearCustomPrompt() {
    await this.ensureInit();
    await this.db.delete('config', 'customPrompt');
  }

  async saveVectorDB(type, data) {
    await this.ensureInit();
    await this.db.put('vectorDB', data, type);
  }

  async getVectorDB(type) {
    await this.ensureInit();
    return await this.db.get('vectorDB', type);
  }

  async saveSchemas(type, data) {
    // type can be 'source' or 'target'
    // data should include: { urls, schemas, mainSchema, resolvedSchema }
    await this.ensureInit();
    await this.db.put('config', data, `schemas_${type}`);
  }

  async getSchemas(type) {
    await this.ensureInit();
    return await this.db.get('config', `schemas_${type}`);
  }

  async saveSourceSchemas(data) {
    return await this.saveSchemas('source', data);
  }

  async getSourceSchemas() {
    return await this.getSchemas('source');
  }

  async saveTargetSchemas(data) {
    return await this.saveSchemas('target', data);
  }

  async getTargetSchemas() {
    return await this.getSchemas('target');
  }

  async clearSchemas() {
    await this.ensureInit();
    await this.db.delete('config', 'schemas_source');
    await this.db.delete('config', 'schemas_target');
  }

  async clearProject() {
    await this.ensureInit();
    await this.db.clear('blueprints');
    await this.db.clear('sourceData');
    await this.db.clear('vectorDB');
    await this.clearSchemas();
  }

  async exportProject() {
    await this.ensureInit();
    const blueprint = await this.getBlueprint();
    const sourceVectorDB = await this.getVectorDB('source');
    const targetVectorDB = await this.getVectorDB('target');

    if (sourceVectorDB) {
      blueprint.vectorDB = blueprint.vectorDB || {};
      blueprint.vectorDB.source = sourceVectorDB;
    }

    if (targetVectorDB) {
      blueprint.vectorDB = blueprint.vectorDB || {};
      blueprint.vectorDB.target = targetVectorDB;
    }

    return blueprint;
  }

  async importProject(blueprint) {
    const { vectorDB, ...blueprintData } = blueprint;

    await this.saveBlueprint(blueprintData);

    if (vectorDB?.source) {
      await this.saveVectorDB('source', vectorDB.source);
    }

    if (vectorDB?.target) {
      await this.saveVectorDB('target', vectorDB.target);
    }
  }

  async clearSourceSchemas() {
    await this.ensureInit();
    await this.db.delete('config', 'schemas_source');
  }

  async clearTargetSchemas() {
    await this.ensureInit();
    await this.db.delete('config', 'schemas_target');
  }

  async saveAIAssistantSettings(settings) {
    await this.ensureInit();
    await this.db.put('config', settings, 'aiAssistantSettings');
  }

  async getAIAssistantSettings() {
    await this.ensureInit();
    return await this.db.get('config', 'aiAssistantSettings');
  }

  async saveMappings(mappings) {
    await this.ensureInit();
    await this.db.put('config', mappings, 'vocabularyMappings');
  }

  async getMappings() {
    await this.ensureInit();
    return await this.db.get('config', 'vocabularyMappings');
  }

  async clearMappings() {
    await this.ensureInit();
    await this.db.delete('config', 'vocabularyMappings');
  }

  async getApiKey() {
    return await this.getAPIKey();
  }
}