// js/db.js – IndexedDB yönetimi (no ES modules, namespace pattern)
// IIFE appended to window.DB

(function(exports) {
  'use strict';

  const DB_NAME = 'fregitmenimclaude-db';
  const DB_VERSION = 1;
  const STORE = 'words';

  let db = null;

  function normalizeId(fr) {
    return fr.trim().toLowerCase()
      .replace(/[^a-zàâçéèêëîïôûùüÿñœæ0-9'\- ]/g, '')
      .replace(/\s+/g, '_');
  }

  function parseWordData(dataStr) {
    return dataStr.trim().split('\n')
      .map(l => l.trim()).filter(l => l.length > 0)
      .map(line => {
        const p = line.split('|');
        return {
          id: normalizeId(p[0] || ''),
          fr: (p[0] || '').trim(),
          tr: (p[1] || '').trim(),
          sentence: (p[2] || '').trim(),
          status: 'unlearned'
        };
      }).filter(w => w.fr && w.tr);
  }

  exports.initDB = function() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = e => {
        const d = e.target.result;
        if (!d.objectStoreNames.contains(STORE)) {
          const store = d.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
        }
      };
      req.onsuccess = e => { db = e.target.result; resolve(db); };
      req.onerror = e => reject(e.target.error);
    });
  };

  exports.seedWords = function(dataStr) {
    return new Promise((resolve, reject) => {
      const words = parseWordData(dataStr);
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      let added = 0;
      words.forEach(word => {
        const r = store.get(word.id);
        r.onsuccess = () => { if (!r.result) { store.add(word); added++; } };
      });
      tx.oncomplete = () => resolve(added);
      tx.onerror = e => reject(e.target.error);
    });
  };

    exports.syncWords = function(dataStr) {
    return new Promise((resolve, reject) => {
      const words = parseWordData(dataStr);
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      let added = 0;
      let updated = 0; 

      words.forEach(word => {
        const r = store.get(word.id);
        r.onsuccess = () => { 
          if (!r.result) { 
            store.add(word); 
            added++; 
          } else {
            const existingWord = r.result;
            existingWord.tr = word.tr;
            existingWord.sentence = word.sentence;
            store.put(existingWord);
            updated++;
          }
        };
      });
      
      tx.oncomplete = () => resolve(added);
      tx.onerror = e => reject(e.target.error);
    });
  };

  exports.getNextWord = function() {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const index = tx.objectStore(STORE).index('status');
      const req = index.getAll('unlearned');
      req.onsuccess = () => {
        const list = req.result;
        if (!list || list.length === 0) { resolve(null); return; }
        resolve(list[Math.floor(Math.random() * list.length)]);
      };
      req.onerror = e => reject(e.target.error);
    });
  };

  exports.updateWordStatus = function(id, status) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const r = store.get(id);
      r.onsuccess = () => { if (r.result) { r.result.status = status; store.put(r.result); } };
      tx.oncomplete = resolve;
      tx.onerror = e => reject(e.target.error);
    });
  };

  exports.getFavorites = function() {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).index('status').getAll('favorite');
      req.onsuccess = () => resolve(req.result);
      req.onerror = e => reject(e.target.error);
    });
  };

  exports.getStats = function() {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => {
        const all = req.result;
        const learned = all.filter(w => w.status === 'learned').length;
        const favorite = all.filter(w => w.status === 'favorite').length;
        const unlearned = all.filter(w => w.status === 'unlearned').length;
        resolve({ total: all.length, learned, favorite, unlearned, done: learned + favorite });
      };
      req.onerror = e => reject(e.target.error);
    });
  };

})(window.DB = window.DB || {});
