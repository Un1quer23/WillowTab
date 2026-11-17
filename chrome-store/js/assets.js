(() => {
  const DB_NAME = 'willowtab-assets';
  const DB_VERSION = 2;
  const WALLPAPERS = 'wallpapers';
  const LIBRARY = 'library';
  const THUMBNAILS = 'thumbnails';
  const LIBRARY_KEY = 'state';
  const STARTUP_LIBRARY_KEY = 'wallpaper-startup-library';
  const STARTUP_PREVIEW_KEY = 'wallpaper-startup-preview';
  const PREVIEW_SIZE = 192;
  const ROTATION_INTERVALS = {
    off: 0,
    '30m': 30 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '2h': 2 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
  };

  let dbPromise;
  const libraryUpdates = typeof BroadcastChannel === 'function' ? new BroadcastChannel(DB_NAME) : null;
  const libraryListeners = new Set();
  const pendingThumbnails = new Map();

  function notifyLibrary() {
    libraryListeners.forEach((listener) => listener());
  }
  libraryUpdates?.addEventListener('message', notifyLibrary);

  function readCache(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch (_) {
      return null;
    }
  }

  function readStartupLibrary() {
    const cached = readCache(STARTUP_LIBRARY_KEY);
    if (cached && Number.isInteger(cached.revision) && Array.isArray(cached.wallpapers)) return cached;
    const legacy = window.__willowPreferences.readLegacy();
    return {
      bgMode: legacy.wallpaper || legacy.bgMode === 'wallpaper' ? 'wallpaper' : 'color',
      wallpapers: Array.isArray(legacy.wallpapers) ? legacy.wallpapers.filter((item) => item?.id) : [],
      activeWallpaperId: legacy.activeWallpaperId || '',
      wallpaper: legacy.wallpaper,
    };
  }

  function getStartupPreview(id) {
    const preview = readCache(STARTUP_PREVIEW_KEY);
    return id && preview?.id === id && /^data:image\/(?:webp|png);base64,[a-z0-9+/]+={0,2}$/i.test(preview.data)
      ? preview.data
      : '';
  }

  function makeThumbnail(image) {
    const scale = Math.min(1, PREVIEW_SIZE / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/webp', 0.8);
  }

  function saveStartupPreview(id, image) {
    try {
      const cached = readCache(STARTUP_LIBRARY_KEY);
      if (cached?.bgMode !== 'wallpaper' || cached.activeWallpaperId !== id) return;
      localStorage.setItem(STARTUP_PREVIEW_KEY, JSON.stringify({ id, data: makeThumbnail(image) }));
    } catch (_) {
      // The full image stays in IndexedDB if a preview cannot be stored.
    }
  }

  function openDB() {
    if (!dbPromise) {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      dbPromise = new Promise((resolve, reject) => {
        let blocked = false;
        request.onblocked = () => {
          // Keep this open request so reads fail promptly while the other tab releases it.
          blocked = true;
          reject(new Error('Wallpaper database upgrade is blocked by another open tab'));
        };
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(WALLPAPERS)) db.createObjectStore(WALLPAPERS, { keyPath: 'id' });
          db.createObjectStore(LIBRARY);
          db.createObjectStore(THUMBNAILS);
        };
        request.onsuccess = () => {
          const db = request.result;
          db.onversionchange = () => {
            db.close();
            dbPromise = undefined;
          };
          db.onclose = () => { dbPromise = undefined; };
          if (blocked) {
            dbPromise = Promise.resolve(db);
            notifyLibrary();
          } else {
            resolve(db);
          }
        };
        request.onerror = () => {
          dbPromise = undefined;
          reject(request.error);
        };
      });
    }
    return dbPromise;
  }

  function resultOf(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function transact(names, mode, run) {
    const db = await openDB();
    const tx = db.transaction(names, mode);
    const finished = new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onabort = () => reject(tx.error || new Error('Wallpaper transaction aborted'));
    });
    finished.catch(() => {});
    try {
      const value = await run(tx);
      await finished;
      return value;
    } catch (error) {
      try { tx.abort(); } catch (_) {}
      await finished.catch(() => {});
      throw error;
    }
  }

  function metadata(record) {
    return {
      id: record.id,
      name: record.name || 'Wallpaper',
      sourcePath: record.sourcePath || '',
      brightness: record.brightness,
      complexity: record.complexity,
      createdAt: record.createdAt || Date.now(),
      hash: record.hash,
    };
  }

  function normalizeLibrary(state) {
    if (!Object.hasOwn(ROTATION_INTERVALS, state.wallpaperRotation) || state.wallpapers.length < 2) {
      state.wallpaperRotation = 'off';
    }
    if (!state.wallpapers.some(({ id }) => id === state.activeWallpaperId)) {
      state.activeWallpaperId = state.wallpapers[0]?.id || '';
    }
  }

  function getLibrary() {
    return transact([LIBRARY], 'readonly', (tx) => resultOf(tx.objectStore(LIBRARY).get(LIBRARY_KEY)));
  }

  // A readwrite transaction orders the synchronous projection with library writes from other tabs.
  function refreshStartupLibrary() {
    return transact([LIBRARY], 'readwrite', async (tx) => {
      const state = await resultOf(tx.objectStore(LIBRARY).get(LIBRARY_KEY));
      if (!state) return;
      const active = state.wallpapers.find(({ id }) => id === state.activeWallpaperId);
      const projection = JSON.stringify({
        revision: state.revision,
        bgMode: state.bgMode,
        activeWallpaperId: state.activeWallpaperId,
        wallpapers: active ? [active] : [],
      });
      try {
        const previewId = readCache(STARTUP_PREVIEW_KEY)?.id;
        if (previewId && !state.wallpapers.some(({ id }) => id === previewId)) {
          localStorage.removeItem(STARTUP_PREVIEW_KEY);
        }
        if (localStorage.getItem(STARTUP_LIBRARY_KEY) !== projection) {
          localStorage.setItem(STARTUP_LIBRARY_KEY, projection);
        }
        window.__willowPreferences.clearMigratedWallpaperData();
      } catch (_) {
        // Preferences and preview storage cannot invalidate the committed library.
      }
    });
  }

  async function initialize(oldName) {
    const legacy = window.__willowPreferences.readLegacy();
    const state = await transact([LIBRARY, WALLPAPERS], 'readwrite', async (tx) => {
      const library = tx.objectStore(LIBRARY);
      const current = await resultOf(library.get(LIBRARY_KEY));
      if (current) return current;

      const images = tx.objectStore(WALLPAPERS);
      const wallpapers = [];
      const seen = new Set();
      const next = {
        revision: 1,
        wallpapers,
        bgMode: legacy.bgMode === 'wallpaper' ? 'wallpaper' : 'color',
        activeWallpaperId: legacy.activeWallpaperId || '',
        wallpaperRotation: legacy.wallpaperRotation || 'off',
        wallpaperRotationMode: legacy.wallpaperRotationMode === 'random' ? 'random' : 'sequence',
        lastWallpaperRotationAt: Number(legacy.lastWallpaperRotationAt) || 0,
      };
      const entries = Array.isArray(legacy.wallpapers) ? legacy.wallpapers : [];
      for (const entry of entries) {
        if (!entry || (seen.has(entry.id) && !entry.data)) continue;
        let id = entry.id || crypto.randomUUID();
        if (typeof entry.data === 'string' && entry.data) {
          let existing = await resultOf(images.get(id));
          if (existing && existing.data !== entry.data) {
            if (id === next.activeWallpaperId) next.activeWallpaperId = '';
            id = crypto.randomUUID();
            existing = undefined;
          }
          if (!existing) await resultOf(images.put({ ...metadata({ ...entry, id }), data: entry.data }));
          if (entry.id === legacy.activeWallpaperId) next.activeWallpaperId = id;
        } else if (!entry.id || !(await resultOf(images.getKey(id)))) {
          continue;
        }
        if (seen.has(id)) continue;
        seen.add(id);
        wallpapers.push(metadata({ ...entry, id }));
      }
      if (typeof legacy.wallpaper === 'string' && legacy.wallpaper) {
        const id = crypto.randomUUID();
        const old = metadata({
          id,
          name: oldName,
          brightness: legacy.wallpaperBrightness,
          complexity: legacy.wallpaperComplexity,
        });
        await resultOf(images.put({ ...old, data: legacy.wallpaper }));
        wallpapers.push(old);
        next.activeWallpaperId = id;
        next.bgMode = 'wallpaper';
      }
      normalizeLibrary(next);
      await resultOf(library.put(next, LIBRARY_KEY));
      return next;
    });
    await refreshStartupLibrary().catch(() => {});
    return state;
  }

  async function changeLibrary(stores, change) {
    const result = await transact([LIBRARY, ...stores], 'readwrite', async (tx) => {
      const library = tx.objectStore(LIBRARY);
      const state = await resultOf(library.get(LIBRARY_KEY));
      if (!state) throw new Error('Wallpaper library has not been initialized');
      const outcome = await change(state, tx);
      if (outcome.changed) {
        normalizeLibrary(state);
        state.revision += 1;
        await resultOf(library.put(state, LIBRARY_KEY));
      }
      return { ...outcome, state };
    });
    if (result.changed) {
      await refreshStartupLibrary().catch(() => {});
      libraryUpdates?.postMessage(result.state.revision);
    }
    return result;
  }

  function get(id) {
    if (!id) return Promise.resolve(null);
    return transact([WALLPAPERS], 'readonly', (tx) => resultOf(tx.objectStore(WALLPAPERS).get(id)));
  }

  async function imageHash(data) {
    if (!data?.startsWith('data:')) return null;
    const bytes = await (await fetch(data)).arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  async function addWallpaper(record, thumbnail, activate) {
    const policy = window.__willowWallpaperPolicy;
    const identity = policy.getFileIdentity(record);
    const hash = await imageHash(record.data);
    const hashes = new Map();
    for (;;) {
      const result = await changeLibrary([WALLPAPERS, THUMBNAILS], async (state, tx) => {
        const candidates = state.wallpapers.filter((item) => policy.getFileIdentity(item) === identity);
        const missing = candidates.filter((item) => !item.hash && !hashes.has(item.id));
        if (missing.length) return { changed: false, missing };

        let changed = false;
        for (const item of candidates) {
          if (!item.hash && hashes.get(item.id)) {
            item.hash = hashes.get(item.id);
            changed = true;
          }
        }
        if (hash && candidates.some((item) => item.hash === hash)) return { changed, duplicate: true };

        const saved = { ...metadata({ ...record, hash }), data: record.data };
        await resultOf(tx.objectStore(WALLPAPERS).add(saved));
        if (thumbnail) await resultOf(tx.objectStore(THUMBNAILS).put(thumbnail, saved.id));
        const first = state.wallpapers.length === 0;
        state.wallpapers.push(metadata(saved));
        if (first || activate) {
          state.bgMode = 'wallpaper';
          state.activeWallpaperId = saved.id;
          state.lastWallpaperRotationAt = Date.now();
        }
        return { changed: true, added: saved.id };
      });
      if (!result.missing) return result;
      for (const item of result.missing) {
        const saved = await get(item.id);
        hashes.set(item.id, await imageHash(saved?.data).catch(() => null));
      }
    }
  }

  function removeWallpapers(ids) {
    const requested = new Set(ids);
    return changeLibrary([WALLPAPERS, THUMBNAILS], async (state, tx) => {
      const removed = state.wallpapers.filter(({ id }) => requested.has(id));
      if (!removed.length) return { changed: false, deletedCount: 0 };
      const activeIndex = state.wallpapers.findIndex(({ id }) => id === state.activeWallpaperId);
      if (requested.has(state.activeWallpaperId)) {
        const next = state.wallpapers.slice(activeIndex + 1).find(({ id }) => !requested.has(id));
        const previous = state.wallpapers.slice(0, activeIndex).reverse().find(({ id }) => !requested.has(id));
        state.activeWallpaperId = (next || previous)?.id || '';
      }
      for (const { id } of removed) {
        await resultOf(tx.objectStore(WALLPAPERS).delete(id));
        await resultOf(tx.objectStore(THUMBNAILS).delete(id));
      }
      state.wallpapers = state.wallpapers.filter(({ id }) => !requested.has(id));
      if (!state.wallpapers.length) state.lastWallpaperRotationAt = Date.now();
      return { changed: true, deletedCount: removed.length };
    });
  }

  function setMode(mode) {
    return changeLibrary([], (state) => {
      if (state.bgMode === mode) return { changed: false };
      state.bgMode = mode;
      if (mode === 'wallpaper') state.lastWallpaperRotationAt = Date.now();
      return { changed: true };
    });
  }

  function activate(id) {
    return changeLibrary([], (state) => {
      if (!state.wallpapers.some((item) => item.id === id)) return { changed: false };
      state.activeWallpaperId = id;
      state.bgMode = 'wallpaper';
      state.lastWallpaperRotationAt = Date.now();
      return { changed: true };
    });
  }

  function reorder(id, neighborId, after) {
    return changeLibrary([], (state) => {
      const from = state.wallpapers.findIndex((item) => item.id === id);
      if (from < 0 || neighborId === id || !state.wallpapers.some((item) => item.id === neighborId)) {
        return { changed: false };
      }
      const [item] = state.wallpapers.splice(from, 1);
      const neighbor = state.wallpapers.findIndex((other) => other.id === neighborId);
      const target = neighbor + (after ? 1 : 0);
      state.wallpapers.splice(target, 0, item);
      return { changed: from !== target };
    });
  }

  function setRotation(patch) {
    return changeLibrary([], (state) => {
      Object.assign(state, patch, { lastWallpaperRotationAt: Date.now() });
      return { changed: true };
    });
  }

  function rotateIfDue(now) {
    return changeLibrary([], (state) => {
      const interval = ROTATION_INTERVALS[state.wallpaperRotation];
      if (!interval || state.bgMode !== 'wallpaper' || state.wallpapers.length < 2 || !state.activeWallpaperId) {
        return { changed: false };
      }
      if (state.lastWallpaperRotationAt) {
        if (now - state.lastWallpaperRotationAt < interval) return { changed: false };
        const index = state.wallpapers.findIndex(({ id }) => id === state.activeWallpaperId);
        const next = state.wallpaperRotationMode === 'random'
          ? state.wallpapers.filter(({ id }) => id !== state.activeWallpaperId)[Math.floor(Math.random() * (state.wallpapers.length - 1))]
          : state.wallpapers[(index + 1) % state.wallpapers.length];
        state.activeWallpaperId = next.id;
      }
      state.lastWallpaperRotationAt = now;
      return { changed: true };
    });
  }

  function updateAnalysis(id, brightness, complexity) {
    return changeLibrary([], (state) => {
      const item = state.wallpapers.find((wallpaper) => wallpaper.id === id);
      if (!item || (item.brightness === brightness && item.complexity === complexity)) return { changed: false };
      Object.assign(item, { brightness, complexity });
      return { changed: true };
    });
  }

  async function loadThumbnail(id) {
    const thumbnail = await transact([THUMBNAILS], 'readonly', (tx) => resultOf(tx.objectStore(THUMBNAILS).get(id)));
    if (thumbnail) return thumbnail;
    const record = await get(id);
    if (!record?.data) return null;
    const image = new Image();
    image.src = record.data;
    await image.decode();
    const data = makeThumbnail(image);
    return transact([WALLPAPERS, THUMBNAILS], 'readwrite', async (tx) => {
      if (!(await resultOf(tx.objectStore(WALLPAPERS).getKey(id)))) return null;
      await resultOf(tx.objectStore(THUMBNAILS).put(data, id));
      return data;
    });
  }

  function getThumbnail(id) {
    if (!pendingThumbnails.has(id)) {
      pendingThumbnails.set(id, loadThumbnail(id).finally(() => pendingThumbnails.delete(id)));
    }
    return pendingThumbnails.get(id);
  }

  window.__wallpaperAssets = {
    initialize,
    getLibrary,
    subscribe(listener) {
      libraryListeners.add(listener);
    },
    readStartupLibrary,
    getStartupPreview,
    saveStartupPreview,
    makeThumbnail,
    get,
    getThumbnail,
    addWallpaper,
    removeWallpapers,
    setMode,
    activate,
    reorder,
    setRotation,
    rotateIfDue,
    updateAnalysis,
    ROTATION_INTERVALS,
  };
})();
