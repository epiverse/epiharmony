import { openDB } from 'idb';

export class StorageManager {
  constructor() {
    this.dbName = 'epiHarmonyDB';
    this.dbVersion = 1;
    this.db = null;
    this.init();
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
  }

  async saveBlueprint(blueprint) {
    await this.db.put('blueprints', blueprint, 'current');
  }

  async getBlueprint() {
    return await this.db.get('blueprints', 'current');
  }

  async saveSourceData(data) {
    await this.db.put('sourceData', data, 'current');
  }

  async getSourceData() {
    return await this.db.get('sourceData', 'current');
  }

  async saveAPIKey(apiKey) {
    await this.db.put('config', apiKey, 'apiKey');
  }

  async getAPIKey() {
    return await this.db.get('config', 'apiKey');
  }

  async clearAPIKey() {
    await this.db.delete('config', 'apiKey');
  }

  async saveAIConfig(config) {
    await this.db.put('config', config, 'aiConfig');
  }

  async getAIConfig() {
    return await this.db.get('config', 'aiConfig');
  }

  async saveVectorDB(type, data) {
    await this.db.put('vectorDB', data, type);
  }

  async getVectorDB(type) {
    return await this.db.get('vectorDB', type);
  }

  async clearProject() {
    await this.db.clear('blueprints');
    await this.db.clear('sourceData');
    await this.db.clear('vectorDB');
  }

  async exportProject() {
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
}