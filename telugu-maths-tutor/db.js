// db.js - minimal IndexedDB wrapper for Telugu Maths Tutor
// DB "tmt-db" v1. Stores: profiles, attempts, topicStats, streaks.

const DB_NAME = 'tmt-db';
const DB_VERSION = 1;

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('profiles')) {
        db.createObjectStore('profiles', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('attempts')) {
        db.createObjectStore('attempts', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('topicStats')) {
        db.createObjectStore('topicStats', { keyPath: 'topic' });
      }
      if (!db.objectStoreNames.contains('streaks')) {
        db.createObjectStore('streaks', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
    req.onblocked = () => {
      dbPromise = null;
      reject(new Error('tmt-db upgrade blocked by another tab'));
    };
  });
  return dbPromise;
}

// Runs one request inside a transaction and resolves with its result
// (or undefined when the store operation has no request, e.g. clear).
function run(store, mode, makeRequest) {
  return openDB().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const req = makeRequest(tx.objectStore(store));
    let result;
    if (req) req.onsuccess = () => { result = req.result; };
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  }));
}

function put(store, value) {
  return run(store, 'readwrite', (os) => os.put(value));
}

function get(store, key) {
  return run(store, 'readonly', (os) => os.get(key));
}

function getAll(store) {
  return run(store, 'readonly', (os) => os.getAll());
}

function clearStore(store) {
  return run(store, 'readwrite', (os) => os.clear());
}

export { openDB, put, get, getAll, clearStore };
