(() => {
  const DB_NAME = 'willowtab-assets';
  const DB_VERSION = 1;
  const WALLPAPER_STORE = 'wallpapers';

  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB is not available'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(WALLPAPER_STORE)) {
          db.createObjectStore(WALLPAPER_STORE, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
    });
    return dbPromise;
  }

  async function withStore(mode, fn) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(WALLPAPER_STORE, mode);
      const store = tx.objectStore(WALLPAPER_STORE);
      let result;
      let settled = false;

      tx.oncomplete = () => {
        if (!settled) resolve(result);
      };
      tx.onerror = () => {
        if (!settled) reject(tx.error || new Error('IndexedDB transaction failed'));
      };
      tx.onabort = () => {
        if (!settled) reject(tx.error || new Error('IndexedDB transaction aborted'));
      };

      try {
        fn(store, (value) => {
          result = value;
        }, (error) => {
          settled = true;
          reject(error);
        });
      } catch (error) {
        settled = true;
        reject(error);
      }
    });
  }

  function metaFromRecord(record) {
    return {
      id: record.id,
      name: record.name || 'Wallpaper',
      brightness: record.brightness,
      complexity: record.complexity,
      createdAt: record.createdAt || Date.now(),
    };
  }

  async function putWallpaper(record) {
    if (!record || !record.id || !record.data) {
      throw new Error('Invalid wallpaper record');
    }
    const stored = {
      id: record.id,
      name: record.name || 'Wallpaper',
      data: record.data,
      brightness: record.brightness,
      complexity: record.complexity,
      createdAt: record.createdAt || Date.now(),
    };
    await withStore('readwrite', (store, resolve, reject) => {
      const request = store.put(stored);
      request.onsuccess = () => resolve(metaFromRecord(stored));
      request.onerror = () => reject(request.error || new Error('Failed to store wallpaper'));
    });
    return metaFromRecord(stored);
  }

  async function getWallpaper(id) {
    if (!id) return null;
    return withStore('readonly', (store, resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error('Failed to read wallpaper'));
    });
  }

  async function removeWallpaper(id) {
    if (!id) return;
    await withStore('readwrite', (store, resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error || new Error('Failed to remove wallpaper'));
    });
  }

  async function migrateSettings(settings, generateId, oldName) {
    let changed = false;
    const next = { ...settings };
    const wallpapers = Array.isArray(next.wallpapers) ? [...next.wallpapers] : [];

    if (next.wallpaper && typeof next.wallpaper === 'string') {
      const id = generateId();
      try {
        const meta = await putWallpaper({
          id,
          name: oldName || 'Old Wallpaper',
          data: next.wallpaper,
          brightness: next.wallpaperBrightness,
          complexity: next.wallpaperComplexity,
          createdAt: Date.now(),
        });
        wallpapers.push(meta);
        next.activeWallpaperId = id;
        next.bgMode = 'wallpaper';
        delete next.wallpaper;
        delete next.wallpaperBrightness;
        delete next.wallpaperComplexity;
        changed = true;
      } catch (_) {
      }
    }

    const migrated = [];
    for (const wallpaper of wallpapers) {
      if (wallpaper && typeof wallpaper.data === 'string') {
        try {
          const meta = await putWallpaper({
            id: wallpaper.id || generateId(),
            name: wallpaper.name,
            data: wallpaper.data,
            brightness: wallpaper.brightness,
            complexity: wallpaper.complexity,
            createdAt: wallpaper.createdAt,
          });
          migrated.push(meta);
          changed = true;
        } catch (_) {
          migrated.push(wallpaper);
        }
      } else if (wallpaper && wallpaper.id) {
        migrated.push(metaFromRecord(wallpaper));
      }
    }

    next.wallpapers = migrated;
    return { settings: next, changed };
  }

  window.__wallpaperAssets = {
    put: putWallpaper,
    get: getWallpaper,
    remove: removeWallpaper,
    migrateSettings,
  };
})();
