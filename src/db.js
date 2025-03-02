import { openDB } from 'idb';


async function getOrCreateDB() {
  return openDB('epiharmony-db', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('config')) {
        db.createObjectStore('config', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('data')) {
        db.createObjectStore('data', { keyPath: 'id' });
      }
    },
  });
}

/** Config store */
export async function saveConfigRecord(record) {
  const db = await getOrCreateDB();
  return db.put('config', record);
}

export async function getConfigRecord(id) {
  const db = await getOrCreateDB();
  return db.get('config', id);
}

export async function deleteConfigRecord(id) {
  const db = await getOrCreateDB();
  return db.delete('config', id);
}

export async function clearConfigStore() {
  const db = await getOrCreateDB();
  return db.clear('config');
}

/** Data store */
export async function saveDataRecord(record) {
  const db = await getOrCreateDB();
  return db.put('data', record);
}

export async function getDataRecord(id) {
  const db = await getOrCreateDB();
  return db.get('data', id);
}

export async function deleteDataRecord(id) {
  const db = await getOrCreateDB();
  return db.delete('data', id);
}

export async function clearDataStore() {
  const db = await getOrCreateDB();
  return db.clear('data');
}
