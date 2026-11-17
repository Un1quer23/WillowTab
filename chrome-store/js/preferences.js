(() => {
  const LEGACY_KEY = 'newtab-settings';
  const FIELD_PREFIX = 'newtab-setting:';
  const FIELDS = [
    'bgColor', 'font', 'radius', 'overlayStrength', 'shadowStrength',
    'settingsBtnPosition', 'tabTitle', 'showGreeting', 'wallpaperReadability',
    'wallpaperSurfaceMode', 'enableSuggestions',
  ];
  const listeners = new Set();
  let legacyRaw;
  let legacySettings = {};

  function readLegacy() {
    try {
      const raw = localStorage.getItem(LEGACY_KEY);
      if (raw !== legacyRaw) {
        const parsed = JSON.parse(raw);
        legacySettings = parsed && typeof parsed === 'object' ? parsed : {};
        legacyRaw = raw;
      }
      return legacySettings;
    } catch (_) {
      return {};
    }
  }

  function readEntry(field) {
    const raw = localStorage.getItem(FIELD_PREFIX + field);
    if (raw !== null) {
      const entry = JSON.parse(raw);
      if (entry && Object.hasOwn(entry, 'value')) return entry;
    }
    return { value: readLegacy()[field], version: '' };
  }

  function read() {
    const settings = {};
    for (const field of FIELDS) {
      try {
        const { value } = readEntry(field);
        if (value !== undefined) settings[field] = value;
      } catch (_) {}
    }
    return settings;
  }

  function notify(field) {
    listeners.forEach((listener) => listener(field));
  }

  function write(field, value) {
    localStorage.setItem(FIELD_PREFIX + field, JSON.stringify({
      value,
      version: crypto.randomUUID(),
    }));
    notify(field);
  }

  function clearMigratedWallpaperData() {
    const legacy = readLegacy();
    if (!legacy.wallpaper && !legacy.wallpapers?.some?.((wallpaper) => wallpaper?.data)) return;
    const next = { ...legacy };
    delete next.wallpaper;
    delete next.wallpaperBrightness;
    delete next.wallpaperComplexity;
    if (Array.isArray(next.wallpapers)) {
      next.wallpapers = next.wallpapers.map((wallpaper) => {
        if (!wallpaper?.data) return wallpaper;
        const metadata = { ...wallpaper };
        delete metadata.data;
        return metadata;
      });
    }
    localStorage.setItem(LEGACY_KEY, JSON.stringify(next));
  }

  window.addEventListener('storage', (event) => {
    if (event.storageArea !== localStorage) return;
    if (event.key === null) notify(null);
    else if (event.key.startsWith(FIELD_PREFIX)) notify(event.key.slice(FIELD_PREFIX.length));
  });

  window.__willowPreferences = {
    readLegacy,
    readEntry,
    read,
    write,
    clearMigratedWallpaperData,
    subscribe(listener) {
      listeners.add(listener);
    },
    isChromeStore: document.documentElement.dataset.variant === 'chrome-store',
  };
})();
