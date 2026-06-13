// Settings panel — custom background, wallpaper, font switching
(() => {
  const SETTINGS_KEY = 'newtab-settings';

  // Defaults
  const DEFAULTS = {
    bgMode: 'color',
    bgColor: '',
    wallpapers: [],
    activeWallpaperId: '',
    font: 'serif',
    radius: '28px',
    overlayStrength: 25,
    shadowStrength: 25,
    settingsBtnPosition: 'footer',
    tabTitle: '',
    wallpaperReadability: true,
    wallpaperSurfaceMode: 'auto',
    wallpaperRotation: 'off',
    wallpaperRotationMode: 'sequence',
    lastWallpaperRotationAt: 0,
    enableSuggestions: true,
  };

  // Font definitions for CSS
  const FONT_STACKS = {
    serif: "Georgia, 'Times New Roman', 'Songti SC', 'SimSun', serif",
    system: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', 'PingFang SC', sans-serif",
    mono: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', 'Courier New', 'Microsoft YaHei', monospace",
  };

  // Preset background colors
  const PRESET_COLORS = [
    { value: '#F5F5DC', get label() { return (window.__i18n && window.__i18n.t('color.beige')) || '米灰'; } },
    { value: '#bfbb98', get label() { return (window.__i18n && window.__i18n.t('color.sage')) || '鼠尾草'; } },
  ];

  let settings = { ...DEFAULTS };

  // --- DOM refs ---
  const settingsBtn = document.getElementById('settings-btn');
  const panel = document.getElementById('settings-panel');
  const closeBtn = document.getElementById('settings-close');
  const backBtn = document.getElementById('settings-back');
  const panelTitle = document.getElementById('settings-panel-title');
  const mainSettingsView = document.getElementById('settings-main-view');
  const wallpaperSettingsView = document.getElementById('wallpaper-settings-view');
  const colorPresets = document.getElementById('color-presets');
  const modeToggle = document.getElementById('mode-toggle');
  const colorSection = document.getElementById('color-section');
  const wallpaperSection = document.getElementById('wallpaper-section');
  const wallpaperOpenBtn = document.getElementById('wallpaper-open-btn');
  const wallpaperSummary = document.getElementById('wallpaper-summary');
  const wallpaperPhotoBtn = document.getElementById('wallpaper-photo-btn');
  const wallpaperPhotoInput = document.getElementById('wallpaper-photo-input');
  const wallpaperFolderBtn = document.getElementById('wallpaper-folder-btn');
  const wallpaperFolderInput = document.getElementById('wallpaper-folder-input');
  const wallpaperGallery = document.getElementById('wallpaper-gallery');
  const wallpaperReadabilityToggle = document.getElementById('wallpaper-readability-toggle');
  const wallpaperSurfaceModeOptions = document.getElementById('wallpaper-surface-mode-options');
  const wallpaperRotationOptions = document.getElementById('wallpaper-rotation-options');
  const wallpaperRotationModeOptions = document.getElementById('wallpaper-rotation-mode-options');
  const wallpaperSelectModeBtn = document.getElementById('wallpaper-select-mode-btn');
  const wallpaperDeleteSelectedBtn = document.getElementById('wallpaper-delete-selected-btn');
  const wallpaperClearAllBtn = document.getElementById('wallpaper-clear-all-btn');
  const overlaySlider = document.getElementById('overlay-slider');
  const overlayValue = document.getElementById('overlay-value');
  const shadowSlider = document.getElementById('shadow-slider');
  const shadowValue = document.getElementById('shadow-value');
  const customColorPicker = document.getElementById('custom-color-picker');
  const customColorHex = document.getElementById('custom-color-hex');
  const themeSection = document.getElementById('theme-section');
  const themeOptions = document.getElementById('theme-options');
  const fontOptions = document.getElementById('font-options');
  const radiusOptions = document.getElementById('radius-options');
  const tabTitleInput = document.getElementById('tab-title-input');
  const suggestionsToggle = document.getElementById('suggestions-toggle');

  const aboutBtn = document.getElementById('about-btn');
  const aboutPanel = document.getElementById('about-panel');
  const aboutClose = document.getElementById('about-close');
  const aboutOverlay = document.getElementById('about-overlay');

  const wallpaperAssets = window.__wallpaperAssets;
  let settingsOverlay = null;
  let saveTimer = null;
  let wallpaperApplyToken = 0;
  let lastFocusedBeforePanel = null;
  let wallpaperRotationTimer = null;
  let wallpaperSelectionMode = false;
  let draggedWallpaperId = '';
  let settingsPanelView = 'main';
  let activeWallpaperData = '';
  let wallpaperSurfaceAnalysisToken = 0;
  let resizeSyncTimer = null;
  const selectedWallpaperIds = new Set();

  const ROTATION_INTERVALS = {
    off: 0,
    '30m': 30 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '2h': 2 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
  };

  function t(key, vars) {
    return (window.__i18n && window.__i18n.t(key, vars)) || key;
  }

  // Detect effective theme (taking auto mode into account)
  function effectiveThemeIsDark() {
    const html = document.documentElement;
    if (html.getAttribute('data-theme') === 'dark') return true;
    if (html.getAttribute('data-theme') === 'light') return false;
    // Auto mode: follow OS
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  // --- Load settings ---
  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Migrate old single wallpaper string to new format
        if (parsed.wallpaper && typeof parsed.wallpaper === 'string') {
          const id = generateId();
          const oldName = (window.__i18n && window.__i18n.t('wallpaper.oldWallpaper')) || '旧壁纸';
          parsed.wallpapers = [{ id, data: parsed.wallpaper, name: oldName }];
          parsed.activeWallpaperId = id;
          parsed.bgMode = 'wallpaper';
          delete parsed.wallpaper;
        }
        settings = { ...DEFAULTS, ...parsed };
        normalizeSettings();
      }
    } catch (_) {
      settings = { ...DEFAULTS };
    }
  }

  async function migrateWallpaperStorage() {
    if (!wallpaperAssets) return;
    const oldName = (window.__i18n && window.__i18n.t('wallpaper.oldWallpaper')) || '旧壁纸';
    const result = await wallpaperAssets.migrateSettings(settings, generateId, oldName);
    settings = { ...DEFAULTS, ...result.settings };
    normalizeSettings();
    if (result.changed) {
      saveSettingsNow();
    }
  }

  function normalizeSettings() {
    if (!Array.isArray(settings.wallpapers)) settings.wallpapers = [];
    if (!Object.prototype.hasOwnProperty.call(ROTATION_INTERVALS, settings.wallpaperRotation)) {
      settings.wallpaperRotation = 'off';
    }
    if (!['sequence', 'random'].includes(settings.wallpaperRotationMode)) {
      settings.wallpaperRotationMode = 'sequence';
    }
    if (!['auto', 'light', 'dark'].includes(settings.wallpaperSurfaceMode)) {
      settings.wallpaperSurfaceMode = 'auto';
    }
    settings.wallpaperReadability = settings.wallpaperReadability !== false;
    settings.lastWallpaperRotationAt = Number(settings.lastWallpaperRotationAt) || 0;
    reconcileWallpaperState();
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
      toast.classList.remove('visible');
      toast.addEventListener('transitionend', () => toast.remove());
    }, 2500);
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function saveSettings() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveSettingsNow, 150);
  }

  function saveSettingsNow() {
    clearTimeout(saveTimer);
    saveTimer = null;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(serializeSettings(settings)));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        alert((window.__i18n && window.__i18n.t('error.quotaExceeded')) || '存储空间不足，新的设置未能保存，已有壁纸已保留。');
      }
    }
  }

  function serializeSettings(value) {
    return {
      ...value,
      wallpapers: (value.wallpapers || []).map((w) => {
        const meta = {
          id: w.id,
          name: w.name,
          brightness: w.brightness,
          complexity: w.complexity,
          createdAt: w.createdAt,
        };
        if (w.data) meta.data = w.data;
        return meta;
      }),
    };
  }

  function hasEnoughWallpapersForRotation() {
    return settings.wallpapers.length >= 2;
  }

  function reconcileWallpaperState() {
    selectedWallpaperIds.forEach((id) => {
      if (!settings.wallpapers.some((w) => w.id === id)) selectedWallpaperIds.delete(id);
    });
    if (settings.activeWallpaperId && !settings.wallpapers.some((w) => w.id === settings.activeWallpaperId)) {
      settings.activeWallpaperId = settings.wallpapers[0] ? settings.wallpapers[0].id : '';
    }
    if (!settings.wallpapers.length) {
      settings.activeWallpaperId = '';
      if (settings.bgMode === 'wallpaper') settings.bgMode = 'color';
    }
    if (!hasEnoughWallpapersForRotation()) {
      settings.wallpaperRotation = 'off';
    }
  }

  function resetWallpaperRotationClock() {
    settings.lastWallpaperRotationAt = Date.now();
    scheduleWallpaperRotation();
  }

  function getRotationInterval() {
    return ROTATION_INTERVALS[settings.wallpaperRotation] || 0;
  }

  function canRotateWallpaper() {
    return settings.bgMode === 'wallpaper' && settings.activeWallpaperId && hasEnoughWallpapersForRotation() && getRotationInterval() > 0;
  }

  function chooseNextWallpaperId() {
    if (!hasEnoughWallpapersForRotation()) return '';
    if (settings.wallpaperRotationMode === 'random') {
      const candidates = settings.wallpapers.filter((w) => w.id !== settings.activeWallpaperId);
      return candidates[Math.floor(Math.random() * candidates.length)].id;
    }
    const currentIndex = settings.wallpapers.findIndex((w) => w.id === settings.activeWallpaperId);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % settings.wallpapers.length : 0;
    return settings.wallpapers[nextIndex].id;
  }

  function rotateWallpaperIfDue(force = false) {
    clearTimeout(wallpaperRotationTimer);
    wallpaperRotationTimer = null;
    reconcileWallpaperState();
    if (!canRotateWallpaper()) return;

    const interval = getRotationInterval();
    const now = Date.now();
    if (!settings.lastWallpaperRotationAt) {
      settings.lastWallpaperRotationAt = now;
      saveSettings();
      scheduleWallpaperRotation();
      return;
    }
    if (!force && now - settings.lastWallpaperRotationAt < interval) {
      scheduleWallpaperRotation();
      return;
    }

    const nextId = chooseNextWallpaperId();
    if (!nextId || nextId === settings.activeWallpaperId) {
      scheduleWallpaperRotation();
      return;
    }
    settings.activeWallpaperId = nextId;
    settings.bgMode = 'wallpaper';
    settings.lastWallpaperRotationAt = now;
    saveSettingsNow();
    applyBackground();
    if (!panel.hasAttribute('hidden')) syncUI();
    scheduleWallpaperRotation();
  }

  function scheduleWallpaperRotation() {
    clearTimeout(wallpaperRotationTimer);
    wallpaperRotationTimer = null;
    if (!canRotateWallpaper()) return;

    const interval = getRotationInterval();
    const elapsed = Date.now() - (settings.lastWallpaperRotationAt || Date.now());
    const delay = Math.max(1000, interval - elapsed);
    wallpaperRotationTimer = setTimeout(() => rotateWallpaperIfDue(true), Math.min(delay, 2147483647));
  }

  // Compress image to a reasonable size before storing
  function compressImage(dataUrl, maxWidth) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w <= maxWidth) {
          resolve(dataUrl);
          return;
        }
        const ratio = maxWidth / w;
        w = maxWidth;
        h = Math.round(h * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  function parseHexColor(value) {
    if (typeof value !== 'string') return null;
    const hex = value.trim().toLowerCase();
    const short = /^#([0-9a-f]{3})$/.exec(hex);
    if (short) {
      return {
        r: parseInt(short[1][0] + short[1][0], 16),
        g: parseInt(short[1][1] + short[1][1], 16),
        b: parseInt(short[1][2] + short[1][2], 16),
      };
    }
    const full = /^#([0-9a-f]{6})$/.exec(hex);
    if (!full) return null;
    return {
      r: parseInt(full[1].slice(0, 2), 16),
      g: parseInt(full[1].slice(2, 4), 16),
      b: parseInt(full[1].slice(4, 6), 16),
    };
  }

  function relativeLuminance(color) {
    const channel = (value) => {
      const v = value / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
  }

  function contrastRatio(a, b) {
    const light = Math.max(a, b);
    const dark = Math.min(a, b);
    return (light + 0.05) / (dark + 0.05);
  }

  function clearColorReadabilityVars() {
    const root = document.documentElement;
    document.body.removeAttribute('data-color-readable');
    root.style.removeProperty('--bg-secondary');
    root.style.removeProperty('--bg-tertiary');
    root.style.removeProperty('--text-primary');
    root.style.removeProperty('--text-secondary');
    root.style.removeProperty('--text-tertiary');
    root.style.removeProperty('--border');
    root.style.removeProperty('--input-bg');
  }

  function applyColorReadabilityVars(bgColor) {
    const color = parseHexColor(bgColor);
    if (!color) return;
    const root = document.documentElement;
    const luminance = relativeLuminance(color);
    const useDarkText = contrastRatio(luminance, 0) >= contrastRatio(luminance, 1);
    document.body.dataset.colorReadable = useDarkText ? 'dark-text' : 'light-text';
    if (useDarkText) {
      root.style.setProperty('--bg-secondary', `color-mix(in srgb, ${bgColor} 88%, white)`);
      root.style.setProperty('--bg-tertiary', `color-mix(in srgb, ${bgColor} 75%, white)`);
      root.style.setProperty('--text-primary', `color-mix(in srgb, ${bgColor} 20%, black)`);
      root.style.setProperty('--text-secondary', `color-mix(in srgb, ${bgColor} 40%, black)`);
      root.style.setProperty('--text-tertiary', `color-mix(in srgb, ${bgColor} 65%, black)`);
      root.style.setProperty('--border', `color-mix(in srgb, ${bgColor} 75%, black)`);
      root.style.setProperty('--input-bg', `color-mix(in srgb, ${bgColor} 50%, white)`);
      return;
    }

    root.style.setProperty('--bg-secondary', `color-mix(in srgb, ${bgColor} 82%, white)`);
    root.style.setProperty('--bg-tertiary', `color-mix(in srgb, ${bgColor} 72%, white)`);
    root.style.setProperty('--text-primary', '#f3eddf');
    root.style.setProperty('--text-secondary', 'rgba(243, 237, 223, 0.78)');
    root.style.setProperty('--text-tertiary', 'rgba(243, 237, 223, 0.58)');
    root.style.setProperty('--border', 'rgba(255, 255, 255, 0.24)');
    root.style.setProperty('--input-bg', 'rgba(255, 255, 255, 0.12)');
  }

  function summarizeImageData(imageData, width, height) {
    let total = 0;
    const pixels = imageData.data;
    const samples = [];
    for (let i = 0; i < pixels.length; i += 4) {
      const value = (0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]) / 255;
      samples.push(value);
      total += value;
    }
    const brightness = samples.length ? total / samples.length : -1;
    let variance = 0;
    let neighborDiff = 0;
    let neighborCount = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        const value = samples[index];
        variance += (value - brightness) ** 2;
        if (x + 1 < width) {
          neighborDiff += Math.abs(value - samples[index + 1]);
          neighborCount++;
        }
        if (y + 1 < height) {
          neighborDiff += Math.abs(value - samples[index + width]);
          neighborCount++;
        }
      }
    }
    const deviation = Math.sqrt(variance / samples.length);
    const texture = neighborCount ? neighborDiff / neighborCount : 0;
    const complexity = Math.min(1, Math.max(0, deviation * 1.35 + texture * 2.4));
    return { brightness, complexity };
  }

  // Analyze wallpaper brightness and texture for adaptive readability
  function analyzeWallpaperImage(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size);
        resolve(summarizeImageData(imageData, size, size));
      };
      img.onerror = () => resolve({ brightness: -1, complexity: 0 });
      img.src = dataUrl;
    });
  }

  function analyzeWallpaperSurfaceRegion(dataUrl) {
    return new Promise((resolve) => {
      const target = document.querySelector('.search-input-wrapper') || document.querySelector('.search-input');
      if (!target || !dataUrl) {
        resolve(null);
        return;
      }
      const rect = target.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        resolve(null);
        return;
      }
      const img = new Image();
      img.onload = () => {
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const scale = Math.max(viewportWidth / img.width, viewportHeight / img.height);
        const drawnWidth = img.width * scale;
        const drawnHeight = img.height * scale;
        const offsetX = (viewportWidth - drawnWidth) / 2;
        const offsetY = (viewportHeight - drawnHeight) / 2;
        const padding = 20;
        const left = rect.left - padding;
        const top = rect.top - padding;
        const width = rect.width + padding * 2;
        const height = rect.height + padding * 2;
        const sx = Math.max(0, Math.min(img.width, (left - offsetX) / scale));
        const sy = Math.max(0, Math.min(img.height, (top - offsetY) / scale));
        const sw = Math.max(1, Math.min(img.width - sx, width / scale));
        const sh = Math.max(1, Math.min(img.height - sy, height / scale));
        const sampleWidth = 48;
        const sampleHeight = 18;
        const canvas = document.createElement('canvas');
        canvas.width = sampleWidth;
        canvas.height = sampleHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sampleWidth, sampleHeight);
        const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
        resolve(summarizeImageData(imageData, sampleWidth, sampleHeight));
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  }

  // --- Apply settings to page ---
  function applyBackground() {
    const token = ++wallpaperApplyToken;
    const root = document.documentElement;
    const body = document.body;
    body.classList.remove('has-wallpaper', 'has-custom-bg', 'wallpaper-readable');
    body.style.setProperty('--wallpaper', '');
    activeWallpaperData = '';
    wallpaperSurfaceAnalysisToken++;
    root.style.removeProperty('--bg-primary');
    root.style.removeProperty('--overlay-strength');
    clearColorReadabilityVars();
    clearWallpaperAdaptiveVars();

    // Wallpaper mode
    if (settings.bgMode === 'wallpaper' && settings.activeWallpaperId) {
      const active = settings.wallpapers.find((w) => w.id === settings.activeWallpaperId);
      if (active) {
        body.classList.add('has-wallpaper');
        body.classList.toggle('wallpaper-readable', settings.wallpaperReadability);
        root.style.setProperty('--overlay-strength', settings.overlayStrength / 100);

        const renderWallpaper = (record) => {
          const source = (record && record.data) ? record : active;
          if (token !== wallpaperApplyToken) return;
          if (!source || !source.data) {
            body.classList.remove('has-wallpaper');
            root.style.removeProperty('--overlay-strength');
            return;
          }
          body.style.setProperty('--wallpaper', `url(${source.data})`);
          activeWallpaperData = source.data;

          let brightness = active.brightness;
          let complexity = active.complexity;
          if (brightness == null) brightness = source.brightness;
          if (complexity == null) complexity = source.complexity;
          if (brightness == null || complexity == null) {
            analyzeWallpaperImage(source.data).then((analysis) => {
              if (token !== wallpaperApplyToken) return;
              active.brightness = analysis.brightness;
              active.complexity = analysis.complexity;
              if (record && wallpaperAssets) {
                wallpaperAssets.put({ ...record, brightness: analysis.brightness, complexity: analysis.complexity }).catch(() => {});
              }
              saveSettings();
              applyBackground();
            });
          } else if (brightness >= 0) {
            applyWallpaperTextColor(brightness, complexity);
            syncWallpaperSurfaceAnalysis(brightness, complexity, token);
          }
        };

        if (wallpaperAssets) {
          wallpaperAssets.get(active.id).then(renderWallpaper).catch(() => {
            if (token !== wallpaperApplyToken) return;
            renderWallpaper(active);
            if (!active.data) {
              body.classList.remove('has-wallpaper');
              root.style.removeProperty('--overlay-strength');
            }
          });
        } else {
          renderWallpaper(active);
        }
      }
    }

    // Color mode
    if (settings.bgMode === 'color' && !effectiveThemeIsDark()) {
      const color = settings.bgColor || '#F5F5DC';
      if (settings.bgColor) {
        body.classList.add('has-custom-bg');
        root.style.setProperty('--bg-primary', settings.bgColor);
      }
      applyColorReadabilityVars(color);
    }

    applyShadowStrength();
  }

  function clearWallpaperAdaptiveVars() {
    const root = document.documentElement;
    root.style.removeProperty('--wallpaper-text-color');
    root.style.removeProperty('--wallpaper-time-color');
    root.style.removeProperty('--wallpaper-greeting-color');
    root.style.removeProperty('--wallpaper-input-bg');
    root.style.removeProperty('--wallpaper-button-bg');
    root.style.removeProperty('--wallpaper-button-hover-bg');
    root.style.removeProperty('--wallpaper-surface-border');
    root.style.removeProperty('--wallpaper-protection-bg');
  }

  function updateWallpaperPresentation() {
    const root = document.documentElement;
    const body = document.body;
    const active = settings.wallpapers.find((w) => w.id === settings.activeWallpaperId);
    if (settings.bgMode !== 'wallpaper' || !active || !body.classList.contains('has-wallpaper')) {
      applyBackground();
      return;
    }

    body.classList.toggle('wallpaper-readable', settings.wallpaperReadability);
    root.style.setProperty('--overlay-strength', settings.overlayStrength / 100);
    if (active.brightness == null || active.complexity == null) {
      applyBackground();
      return;
    }
    applyWallpaperTextColor(active.brightness, active.complexity);
    syncWallpaperSurfaceAnalysis(active.brightness, active.complexity);
    applyShadowStrength();
  }

  function syncWallpaperSurfaceAnalysis(brightness, complexity, applyToken = wallpaperApplyToken) {
    if (!['auto', 'light'].includes(settings.wallpaperSurfaceMode) || !activeWallpaperData) return;
    const token = ++wallpaperSurfaceAnalysisToken;
    requestAnimationFrame(() => {
      analyzeWallpaperSurfaceRegion(activeWallpaperData).then((surfaceAnalysis) => {
        if (token !== wallpaperSurfaceAnalysisToken || applyToken !== wallpaperApplyToken) return;
        if (!surfaceAnalysis || surfaceAnalysis.brightness < 0) return;
        applyWallpaperTextColor(brightness, complexity, surfaceAnalysis);
      });
    });
  }

  function applyWallpaperTextColor(brightness, complexity = 0, surfaceAnalysis = null) {
    const root = document.documentElement;
    clearWallpaperAdaptiveVars();
    const effective = brightness * (1 - settings.overlayStrength / 100);
    const lightSurface = brightness >= 0.62 || effective >= 0.52;
    const surfaceMode = settings.wallpaperSurfaceMode || 'auto';
    const surfaceBrightness = surfaceAnalysis ? surfaceAnalysis.brightness : brightness;
    const surfaceEffective = surfaceBrightness * (1 - settings.overlayStrength / 100);
    const adaptiveLightSurface = surfaceBrightness >= 0.62 || surfaceEffective >= 0.5;
    const useLightSurface = surfaceMode === 'light' || (surfaceMode === 'auto' && adaptiveLightSurface);
    const protectionBoost = Math.min(0.18, Math.max(0, complexity) * 0.18);
    const surfaceBoost = Math.min(0.18, Math.max(0, surfaceAnalysis ? surfaceAnalysis.complexity : complexity) * 0.18);
    if (settings.wallpaperReadability) {
      if (lightSurface) {
        const brightnessReference = Math.max(effective, brightness * 0.82);
        const protection = Math.min(0.48, Math.max(0.18, 0.12 + (brightnessReference - 0.58) * 0.7 + protectionBoost));
        root.style.setProperty('--wallpaper-time-color', '#241f18');
        root.style.setProperty('--wallpaper-greeting-color', '#4a3f31');
        root.style.setProperty('--wallpaper-protection-bg', `rgba(255,255,255,${protection.toFixed(3)})`);
      } else {
        const protection = Math.min(0.42, (effective < 0.36 ? 0.16 : 0.24) + protectionBoost);
        root.style.setProperty('--wallpaper-time-color', '#f6efe2');
        root.style.setProperty('--wallpaper-greeting-color', '#ddd3c1');
        root.style.setProperty('--wallpaper-protection-bg', `rgba(0,0,0,${protection.toFixed(3)})`);
      }
      if (useLightSurface) {
        const inputAlpha = Math.min(0.3, 0.16 + surfaceBoost * 0.55);
        const buttonAlpha = Math.min(0.28, 0.14 + surfaceBoost * 0.45);
        const buttonHoverAlpha = Math.min(0.36, 0.24 + surfaceBoost * 0.45);
        root.style.setProperty('--wallpaper-text-color', adaptiveLightSurface ? '#272016' : '#f3eddf');
        root.style.setProperty('--wallpaper-input-bg', `rgba(255,255,255,${inputAlpha.toFixed(3)})`);
        root.style.setProperty('--wallpaper-button-bg', `rgba(255,255,255,${buttonAlpha.toFixed(3)})`);
        root.style.setProperty('--wallpaper-button-hover-bg', `rgba(255,255,255,${buttonHoverAlpha.toFixed(3)})`);
        root.style.setProperty('--wallpaper-surface-border', 'rgba(255,255,255,0.2)');
      } else {
        const veryDark = surfaceEffective < 0.36;
        const inputAlpha = veryDark
          ? Math.min(0.48, 0.34 + surfaceBoost * 0.8)
          : Math.min(0.5, 0.36 + surfaceBoost * 0.8);
        const buttonAlpha = veryDark
          ? Math.min(0.42, 0.28 + surfaceBoost * 0.75)
          : Math.min(0.44, 0.32 + surfaceBoost * 0.65);
        const buttonHoverAlpha = veryDark
          ? Math.min(0.56, 0.42 + surfaceBoost * 0.75)
          : Math.min(0.58, 0.46 + surfaceBoost * 0.65);
        root.style.setProperty('--wallpaper-text-color', '#f3eddf');
        root.style.setProperty('--wallpaper-input-bg', `rgba(18,16,14,${inputAlpha.toFixed(3)})`);
        root.style.setProperty('--wallpaper-button-bg', `rgba(18,16,14,${buttonAlpha.toFixed(3)})`);
        root.style.setProperty('--wallpaper-button-hover-bg', `rgba(18,16,14,${buttonHoverAlpha.toFixed(3)})`);
        root.style.setProperty('--wallpaper-surface-border', 'rgba(255,255,255,0.24)');
      }
      return;
    }

    if (surfaceMode === 'light') {
      root.style.setProperty('--wallpaper-text-color', adaptiveLightSurface ? '#272016' : '#f3eddf');
      root.style.setProperty('--wallpaper-input-bg', 'rgba(255,255,255,0.16)');
      root.style.setProperty('--wallpaper-button-bg', 'rgba(255,255,255,0.14)');
      root.style.setProperty('--wallpaper-button-hover-bg', 'rgba(255,255,255,0.24)');
      root.style.setProperty('--wallpaper-surface-border', 'rgba(255,255,255,0.2)');
      return;
    }
    if (surfaceMode === 'dark') {
      root.style.setProperty('--wallpaper-text-color', '#f3eddf');
      root.style.setProperty('--wallpaper-input-bg', 'rgba(18,16,14,0.38)');
      root.style.setProperty('--wallpaper-button-bg', 'rgba(18,16,14,0.32)');
      root.style.setProperty('--wallpaper-button-hover-bg', 'rgba(18,16,14,0.48)');
      root.style.setProperty('--wallpaper-surface-border', 'rgba(255,255,255,0.24)');
      return;
    }

    if (effective < 0.4) {
      root.style.setProperty('--wallpaper-text-color', '#e8e2d4');
      root.style.setProperty('--wallpaper-input-bg', 'rgba(255,255,255,0.18)');
    } else if (effective < 0.6) {
      root.style.setProperty('--wallpaper-text-color', '#f0ece0');
      root.style.setProperty('--wallpaper-input-bg', 'rgba(255,255,255,0.18)');
    } else {
      root.style.removeProperty('--wallpaper-text-color');
      root.style.removeProperty('--wallpaper-input-bg');
    }
  }

  function applyFont() {
    const stack = FONT_STACKS[settings.font] || FONT_STACKS.serif;
    document.documentElement.style.setProperty('--font-body', stack);
  }

  function applyRadius() {
    document.documentElement.style.setProperty('--radius-ui', settings.radius);
  }

  function applyShadowStrength() {
    const scale = settings.shadowStrength / 25;
    const root = document.documentElement;
    const hasWallpaper = document.body.classList.contains('has-wallpaper');
    const hasDarkColorSurface = document.body.dataset.colorReadable === 'light-text';

    if (hasWallpaper) {
      // 壁纸模式用中性黑色阴影——图片颜色不可预测，暖色调会不协调
      root.style.setProperty('--input-shadow',
        `0 2px 8px rgba(0,0,0,${(0.25 * scale).toFixed(3)}), 0 4px 20px rgba(0,0,0,${(0.15 * scale).toFixed(3)})`);
      // Button shadow
      root.style.setProperty('--shadow-sm', `0 2px 6px rgba(0,0,0,${(0.2 * scale).toFixed(3)})`);
      root.style.setProperty('--shadow-md', `0 4px 20px rgba(0,0,0,${(0.3 * scale).toFixed(3)})`);
      root.style.setProperty('--shadow-lg', `0 12px 40px rgba(0,0,0,${(0.4 * scale).toFixed(3)})`);
      // Input focus shadow
      root.style.setProperty('--input-shadow-focus',
        `0 2px 8px rgba(0,0,0,${(0.15 * scale).toFixed(3)}), 0 6px 24px rgba(200,122,60,${(0.15 * scale).toFixed(3)})`);
      // Text shadows
      root.style.setProperty('--text-shadow-time',
        `0 0 16px rgba(255,255,255,${(0.25 * scale).toFixed(3)}), 0 2px 8px rgba(0,0,0,${(0.5 * scale).toFixed(3)})`);
      root.style.setProperty('--text-shadow-greeting', `0 1px 6px rgba(0,0,0,${(0.4 * scale).toFixed(3)})`);
    } else if (hasDarkColorSurface) {
      root.style.setProperty('--input-shadow',
        `0 2px 8px rgba(0,0,0,${(0.25 * scale).toFixed(3)}), 0 4px 20px rgba(0,0,0,${(0.14 * scale).toFixed(3)})`);
      root.style.setProperty('--shadow-sm', `0 2px 6px rgba(0,0,0,${(0.18 * scale).toFixed(3)})`);
      root.style.setProperty('--shadow-md', `0 4px 20px rgba(0,0,0,${(0.26 * scale).toFixed(3)})`);
      root.style.setProperty('--shadow-lg', `0 12px 40px rgba(0,0,0,${(0.34 * scale).toFixed(3)})`);
      root.style.setProperty('--input-shadow-focus',
        `0 2px 8px rgba(0,0,0,${(0.18 * scale).toFixed(3)}), 0 6px 24px rgba(200,122,60,${(0.14 * scale).toFixed(3)})`);
      root.style.setProperty('--text-shadow-time', `0 2px 10px rgba(0,0,0,${(0.35 * scale).toFixed(3)})`);
      root.style.setProperty('--text-shadow-greeting', `0 1px 6px rgba(0,0,0,${(0.28 * scale).toFixed(3)})`);
    } else {
      // 纯色模式用暖棕阴影，与米白背景调色板融合
      root.style.setProperty('--input-shadow',
        `0 1px 3px rgba(44,36,22,${(0.06 * scale).toFixed(3)}), 0 4px 16px rgba(44,36,22,${(0.04 * scale).toFixed(3)})`);
      // Button shadow
      root.style.setProperty('--shadow-sm', `0 1px 2px rgba(44,36,22,${(0.04 * scale).toFixed(3)})`);
      root.style.setProperty('--shadow-md', `0 4px 20px rgba(44,36,22,${(0.08 * scale).toFixed(3)})`);
      root.style.setProperty('--shadow-lg', `0 12px 40px rgba(44,36,22,${(0.12 * scale).toFixed(3)})`);
      // Input focus shadow
      root.style.setProperty('--input-shadow-focus',
        `0 1px 3px rgba(44,36,22,${(0.08 * scale).toFixed(3)}), 0 6px 24px rgba(200,122,60,${(0.1 * scale).toFixed(3)})`);
      // Text shadows
      root.style.setProperty('--text-shadow-time', `0 2px 8px rgba(0,0,0,${(0.15 * scale).toFixed(3)})`);
      root.style.setProperty('--text-shadow-greeting', `0 1px 4px rgba(0,0,0,${(0.1 * scale).toFixed(3)})`);
    }
  }

  function applySettingsBtnPosition() {
    const actionsSection = document.querySelector('.actions-section');
    document.body.dataset.settingsBtnPosition = settings.settingsBtnPosition;
    if (settings.settingsBtnPosition === 'dropdown') {
      actionsSection.classList.add('hidden');
    } else {
      actionsSection.classList.remove('hidden');
    }
  }

  function applyTabTitle() {
    document.title = settings.tabTitle || 'WillowTab';
  }

  function handleSuggestionsToggle() {
    settings.enableSuggestions = !settings.enableSuggestions;
    saveSettingsNow();
    applySuggestions();
    syncUISuggestions();
  }

  function applySuggestions() {
    document.body.dataset.suggestionsEnabled = settings.enableSuggestions ? 'true' : 'false';
  }

  function syncUISuggestions() {
    if (!suggestionsToggle) return;
    suggestionsToggle.dataset.enabled = settings.enableSuggestions ? 'true' : 'false';
    suggestionsToggle.textContent = settings.enableSuggestions
      ? t('settings.suggestionsOn')
      : t('settings.suggestionsOff');
  }

  function applyAll() {
    reconcileWallpaperState();
    applyBackground();
    applyFont();
    applyRadius();
    applyShadowStrength();
    applySettingsBtnPosition();
    applyTabTitle();
    applySuggestions();
    rotateWallpaperIfDue();
  }

  // --- Settings panel ---
  function createOverlay() {
    settingsOverlay = document.createElement('div');
    settingsOverlay.className = 'panel-overlay';
    settingsOverlay.setAttribute('hidden', '');
    document.body.appendChild(settingsOverlay);
    settingsOverlay.addEventListener('click', closePanel);
  }

  function setSettingsView(view) {
    settingsPanelView = view === 'wallpaper' ? 'wallpaper' : 'main';
    const isWallpaperView = settingsPanelView === 'wallpaper';
    if (mainSettingsView) mainSettingsView.hidden = isWallpaperView;
    if (wallpaperSettingsView) wallpaperSettingsView.hidden = !isWallpaperView;
    if (backBtn) backBtn.hidden = !isWallpaperView;
    if (panelTitle) {
      panelTitle.textContent = isWallpaperView ? t('settings.wallpaperSettings') : t('settings.title');
    }
    if (isWallpaperView) {
      syncUI();
    }
  }

  function openPanel() {
    lastFocusedBeforePanel = document.activeElement;
    panel.removeAttribute('hidden');
    if (settingsOverlay) settingsOverlay.removeAttribute('hidden');
    setSettingsView('main');
    syncUI();
    closeBtn.focus();
  }

  function closePanel() {
    panel.setAttribute('hidden', '');
    if (settingsOverlay) settingsOverlay.setAttribute('hidden', '');
    setSettingsView('main');
    if (lastFocusedBeforePanel && typeof lastFocusedBeforePanel.focus === 'function' && document.contains(lastFocusedBeforePanel)) {
      lastFocusedBeforePanel.focus();
    } else if (settingsBtn) {
      settingsBtn.focus();
    }
  }

  // --- About panel ---
  function openAbout() {
    aboutPanel.removeAttribute('hidden');
    if (aboutOverlay) aboutOverlay.removeAttribute('hidden');
  }

  function closeAbout() {
    aboutPanel.setAttribute('hidden', '');
    if (aboutOverlay) aboutOverlay.setAttribute('hidden', '');
  }

  // --- Sync UI with current settings ---
  function syncUI() {
    const isDark = effectiveThemeIsDark();

    // Mode toggle
    modeToggle.querySelectorAll('.mode-option').forEach((opt) => {
      opt.classList.toggle('active', opt.dataset.mode === settings.bgMode);
    });

    // Section visibility — hide irrelevant sections completely
    colorSection.hidden = (settings.bgMode !== 'color');
    if (!colorSection.hidden) {
      colorSection.classList.toggle('disabled', isDark);
      if (isDark) {
        colorSection.setAttribute('data-hint', (window.__i18n && window.__i18n.t('hint.darkColorDisabled')) || '仅在浅色模式下可用');
      } else {
        colorSection.removeAttribute('data-hint');
      }
    }
    wallpaperSection.hidden = (settings.bgMode !== 'wallpaper');
    themeSection.hidden = (settings.bgMode === 'wallpaper');

    // Color presets
    colorPresets.querySelectorAll('.color-swatch').forEach((swatch) => {
      swatch.classList.toggle('active', swatch.dataset.color === settings.bgColor);
    });

    // Custom color inputs
    const color = settings.bgColor || '#F5F5DC';
    customColorPicker.value = color;
    customColorHex.value = settings.bgColor || '';

    // Wallpaper gallery
    renderWallpaperGallery();
    syncWallpaperControls();
    updateWallpaperSummary();

    // Theme options
    const currentTheme = window.__theme ? window.__theme.get() : 'auto';
    themeOptions.querySelectorAll('.theme-option').forEach((opt) => {
      opt.classList.toggle('active', opt.dataset.theme === currentTheme);
    });
    // Shadow slider
    shadowSlider.value = settings.shadowStrength;
    shadowValue.textContent = settings.shadowStrength;

    // Overlay slider
    overlaySlider.value = settings.overlayStrength;
    overlayValue.textContent = settings.overlayStrength;

    // Font options
    fontOptions.querySelectorAll('.font-option').forEach((opt) => {
      opt.classList.toggle('active', opt.dataset.font === settings.font);
    });

    // Radius options
    radiusOptions.querySelectorAll('.theme-option').forEach((opt) => {
      opt.classList.toggle('active', opt.dataset.radius === settings.radius);
    });

    // Settings button position
    const btnPosOptions = document.getElementById('settings-btn-position-options');
    if (btnPosOptions) {
      btnPosOptions.querySelectorAll('.theme-option').forEach((opt) => {
        opt.classList.toggle('active', opt.dataset.position === settings.settingsBtnPosition);
      });
    }

    // Tab title
    tabTitleInput.value = settings.tabTitle || '';
    syncUISuggestions();
  }

  function syncWallpaperControls() {
    reconcileWallpaperState();
    const canUseRotation = hasEnoughWallpapersForRotation();
    if (wallpaperReadabilityToggle) {
      wallpaperReadabilityToggle.checked = settings.wallpaperReadability;
    }
    if (wallpaperSurfaceModeOptions) {
      wallpaperSurfaceModeOptions.querySelectorAll('.theme-option').forEach((opt) => {
        opt.classList.toggle('active', opt.dataset.surfaceMode === settings.wallpaperSurfaceMode);
      });
    }
    if (wallpaperRotationOptions) {
      wallpaperRotationOptions.querySelectorAll('.theme-option').forEach((opt) => {
        const disabled = opt.dataset.rotation !== 'off' && !canUseRotation;
        opt.disabled = disabled;
        opt.classList.toggle('active', opt.dataset.rotation === settings.wallpaperRotation);
      });
    }
    if (wallpaperRotationModeOptions) {
      const enabled = canUseRotation && settings.wallpaperRotation !== 'off';
      wallpaperRotationModeOptions.querySelectorAll('.theme-option').forEach((opt) => {
        opt.disabled = !enabled;
        opt.classList.toggle('active', opt.dataset.rotationMode === settings.wallpaperRotationMode);
      });
    }
    if (wallpaperSelectModeBtn) {
      wallpaperSelectModeBtn.disabled = !settings.wallpapers.length;
      wallpaperSelectModeBtn.textContent = wallpaperSelectionMode
        ? t('settings.wallpaperSelectionDone')
        : t('settings.wallpaperSelect');
    }
    if (wallpaperDeleteSelectedBtn) {
      wallpaperDeleteSelectedBtn.disabled = selectedWallpaperIds.size === 0;
    }
    if (wallpaperClearAllBtn) {
      wallpaperClearAllBtn.disabled = settings.wallpapers.length === 0;
    }
  }

  function updateWallpaperSummary() {
    if (!wallpaperSummary) return;
    const count = settings.wallpapers.length;
    const pieces = [t('settings.wallpaperCount', { count })];
    if (settings.wallpaperRotation !== 'off' && hasEnoughWallpapersForRotation()) {
      pieces.push(t('settings.rotationEnabled'));
    }
    wallpaperSummary.textContent = pieces.join(' · ');
  }

  // Render wallpaper thumbnail gallery
  function renderWallpaperGallery() {
    wallpaperGallery.innerHTML = '';
    wallpaperGallery.classList.toggle('selecting', wallpaperSelectionMode);
    if (!settings.wallpapers.length) {
      const emptyText = (window.__i18n && window.__i18n.t('wallpaper.empty')) || '暂无壁纸，请选择文件夹添加';
      const empty = document.createElement('div');
      empty.className = 'wallpaper-empty';
      empty.textContent = emptyText;
      wallpaperGallery.appendChild(empty);
      return;
    }
    settings.wallpapers.forEach((w) => {
      const thumb = document.createElement('div');
      thumb.className = 'wallpaper-thumb'
        + (w.id === settings.activeWallpaperId ? ' active' : '')
        + (selectedWallpaperIds.has(w.id) ? ' selected' : '');
      thumb.dataset.id = w.id;
      thumb.draggable = !wallpaperSelectionMode;

      const img = document.createElement('img');
      img.alt = w.name;
      img.loading = 'lazy';
      if (w.data) img.src = w.data;
      if (wallpaperAssets) {
        wallpaperAssets.get(w.id).then((record) => {
          if (record && record.data && img.isConnected) {
            img.src = record.data;
          }
        }).catch(() => {});
      }

      const name = document.createElement('span');
      name.className = 'wallpaper-thumb-name';
      name.textContent = w.name;

      const selectedMark = document.createElement('span');
      selectedMark.className = 'wallpaper-thumb-select';
      selectedMark.textContent = selectedWallpaperIds.has(w.id) ? '✓' : '';

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'wallpaper-thumb-delete';
      deleteBtn.type = 'button';
      deleteBtn.title = (window.__i18n && window.__i18n.t('wallpaper.delete')) || '删除';
      deleteBtn.textContent = '×';

      thumb.append(img, selectedMark, name, deleteBtn);
      wallpaperGallery.appendChild(thumb);
    });
  }

  function removeWallpapers(ids) {
    const removeIds = new Set(ids);
    if (!removeIds.size) return 0;
    const removedCount = settings.wallpapers.filter((w) => removeIds.has(w.id)).length;
    settings.wallpapers = settings.wallpapers.filter((w) => !removeIds.has(w.id));
    removeIds.forEach((id) => {
      selectedWallpaperIds.delete(id);
      if (wallpaperAssets) wallpaperAssets.remove(id).catch(() => {});
    });
    reconcileWallpaperState();
    if (!settings.wallpapers.length) {
      wallpaperSelectionMode = false;
      settings.wallpaperRotation = 'off';
      settings.lastWallpaperRotationAt = Date.now();
    }
    saveSettingsNow();
    applyBackground();
    syncUI();
    scheduleWallpaperRotation();
    return removedCount;
  }

  function clearAllWallpapers() {
    if (!settings.wallpapers.length) return;
    if (!window.confirm(t('wallpaper.confirmClearAll'))) return;
    const ids = settings.wallpapers.map((w) => w.id);
    removeWallpapers(ids);
    showToast(t('toast.wallpaperCleared'));
  }

  function toggleWallpaperSelection(id) {
    if (selectedWallpaperIds.has(id)) {
      selectedWallpaperIds.delete(id);
    } else {
      selectedWallpaperIds.add(id);
    }
    const thumb = wallpaperGallery.querySelector(`.wallpaper-thumb[data-id="${CSS.escape(id)}"]`);
    if (thumb) {
      thumb.classList.toggle('selected', selectedWallpaperIds.has(id));
      const mark = thumb.querySelector('.wallpaper-thumb-select');
      if (mark) mark.textContent = selectedWallpaperIds.has(id) ? '✓' : '';
    }
    syncWallpaperControls();
  }

  function setWallpaperSelectionMode(enabled) {
    wallpaperSelectionMode = enabled && settings.wallpapers.length > 0;
    selectedWallpaperIds.clear();
    renderWallpaperGallery();
    syncWallpaperControls();
  }

  function reorderWallpapers(draggedId, targetId) {
    if (!draggedId || !targetId || draggedId === targetId) return;
    const from = settings.wallpapers.findIndex((w) => w.id === draggedId);
    const to = settings.wallpapers.findIndex((w) => w.id === targetId);
    if (from < 0 || to < 0) return;
    const [item] = settings.wallpapers.splice(from, 1);
    settings.wallpapers.splice(to, 0, item);
    saveSettingsNow();
    renderWallpaperGallery();
    scheduleWallpaperRotation();
  }

  // --- Events ---

  // Mode toggle
  modeToggle.addEventListener('click', (e) => {
    const opt = e.target.closest('.mode-option');
    if (!opt) return;
    settings.bgMode = opt.dataset.mode;
    if (settings.bgMode === 'wallpaper') resetWallpaperRotationClock();
    saveSettings();
    applyBackground();
    scheduleWallpaperRotation();
    syncUI();
  });

  // Theme options
  themeOptions.addEventListener('click', (e) => {
    const opt = e.target.closest('.theme-option');
    if (!opt) return;
    if (themeSection.hidden) return;
    if (window.__theme) window.__theme.set(opt.dataset.theme);
    applyBackground();
    syncUI();
  });

  // Color presets
  colorPresets.addEventListener('click', (e) => {
    const swatch = e.target.closest('.color-swatch');
    if (!swatch) return;
    settings.bgMode = 'color';
    settings.bgColor = swatch.dataset.color;
    saveSettings();
    applyBackground();
    scheduleWallpaperRotation();
    syncUI();
  });

  // Custom color picker
  customColorPicker.addEventListener('input', () => {
    settings.bgMode = 'color';
    settings.bgColor = customColorPicker.value;
    customColorHex.value = settings.bgColor;
    saveSettings();
    applyBackground();
    scheduleWallpaperRotation();
    syncUI();
  });

  // Custom color hex input
  customColorHex.addEventListener('change', () => {
    const val = customColorHex.value.trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(val)) {
      customColorHex.value = settings.bgColor || '';
      return;
    }
    settings.bgMode = 'color';
    settings.bgColor = val.toLowerCase();
    customColorPicker.value = settings.bgColor;
    saveSettings();
    applyBackground();
    scheduleWallpaperRotation();
    syncUI();
  });

  async function importWallpaperFiles(fileList) {
    const files = Array.from(fileList || []).filter((f) =>
      /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(f.name) || /^image\//i.test(f.type || '')
    );
    if (!files.length) return;

    let added = 0;
    let skipped = 0;
    let failed = 0;
    for (const file of files) {
      if (settings.wallpapers.some((w) => w.name === file.name)) {
        skipped++;
        continue;
      }
      try {
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        });
        if (!dataUrl) continue;
        const compressed = await compressImage(dataUrl, 1920);
        const analysis = await analyzeWallpaperImage(compressed);
        const id = generateId();
        if (!wallpaperAssets) throw new Error('Wallpaper storage is unavailable');
        const meta = await wallpaperAssets.put({
          id,
          data: compressed,
          name: file.name,
          brightness: analysis.brightness,
          complexity: analysis.complexity,
          createdAt: Date.now(),
        });
        settings.wallpapers.push(meta);
        added++;
      } catch (_) {
        failed++;
      }
    }

    if (added > 0) {
      // Auto-select first added if none active
      if (!settings.activeWallpaperId || !settings.wallpapers.find((w) => w.id === settings.activeWallpaperId)) {
        settings.activeWallpaperId = settings.wallpapers[settings.wallpapers.length - 1].id;
      }
      settings.bgMode = 'wallpaper';
      resetWallpaperRotationClock();
      try {
        saveSettingsNow();
      } catch (_) {
        // If save fails (quota), wallpapers were already cleared by saveSettings
      }
      applyBackground();
      syncUI();
      scheduleWallpaperRotation();
    }

    if (skipped > 0) {
      const tWallpaper = (k, vars) => (window.__i18n && window.__i18n.t(k, vars)) || k;
      const msg = added > 0
        ? tWallpaper('toast.addedAndSkipped', { added, skipped })
        : tWallpaper('toast.allSkipped', { skipped });
      showToast(msg);
    }

    if (failed > 0) {
      const tWallpaper = (k, vars) => (window.__i18n && window.__i18n.t(k, vars)) || k;
      showToast(tWallpaper('toast.wallpaperFailed', { failed }));
    }
  }

  // Wallpaper import
  wallpaperPhotoBtn.addEventListener('click', () => {
    wallpaperPhotoInput.click();
  });

  wallpaperPhotoInput.addEventListener('change', async () => {
    await importWallpaperFiles(wallpaperPhotoInput.files);
    wallpaperPhotoInput.value = '';
  });

  wallpaperFolderBtn.addEventListener('click', () => {
    wallpaperFolderInput.click();
  });

  wallpaperFolderInput.addEventListener('change', async () => {
    await importWallpaperFiles(wallpaperFolderInput.files);
    wallpaperFolderInput.value = '';
  });

  // Wallpaper gallery interaction (switch / delete)
  wallpaperGallery.addEventListener('click', (e) => {
    const thumb = e.target.closest('.wallpaper-thumb');
    if (!thumb) return;
    const id = thumb.dataset.id;

    // Delete button
    if (e.target.closest('.wallpaper-thumb-delete')) {
      removeWallpapers([id]);
      return;
    }

    if (wallpaperSelectionMode) {
      toggleWallpaperSelection(id);
      return;
    }

    // Switch active wallpaper
    settings.activeWallpaperId = id;
    settings.bgMode = 'wallpaper';
    resetWallpaperRotationClock();
    saveSettingsNow();
    applyBackground();
    syncUI();
  });

  wallpaperGallery.addEventListener('dragstart', (e) => {
    const thumb = e.target.closest('.wallpaper-thumb');
    if (!thumb || wallpaperSelectionMode) {
      e.preventDefault();
      return;
    }
    draggedWallpaperId = thumb.dataset.id;
    thumb.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedWallpaperId);
  });

  wallpaperGallery.addEventListener('dragover', (e) => {
    const thumb = e.target.closest('.wallpaper-thumb');
    if (!thumb || !draggedWallpaperId || thumb.dataset.id === draggedWallpaperId) return;
    e.preventDefault();
    thumb.classList.add('drag-over');
  });

  wallpaperGallery.addEventListener('dragleave', (e) => {
    const thumb = e.target.closest('.wallpaper-thumb');
    if (thumb) thumb.classList.remove('drag-over');
  });

  wallpaperGallery.addEventListener('drop', (e) => {
    const thumb = e.target.closest('.wallpaper-thumb');
    if (!thumb || !draggedWallpaperId) return;
    e.preventDefault();
    thumb.classList.remove('drag-over');
    reorderWallpapers(draggedWallpaperId, thumb.dataset.id);
  });

  wallpaperGallery.addEventListener('dragend', () => {
    draggedWallpaperId = '';
    wallpaperGallery.querySelectorAll('.dragging, .drag-over').forEach((thumb) => {
      thumb.classList.remove('dragging', 'drag-over');
    });
  });

  if (wallpaperReadabilityToggle) {
    wallpaperReadabilityToggle.addEventListener('change', () => {
      settings.wallpaperReadability = wallpaperReadabilityToggle.checked;
      saveSettings();
      updateWallpaperPresentation();
    });
  }

  if (wallpaperSurfaceModeOptions) {
    wallpaperSurfaceModeOptions.addEventListener('click', (e) => {
      const opt = e.target.closest('.theme-option');
      if (!opt) return;
      settings.wallpaperSurfaceMode = opt.dataset.surfaceMode;
      saveSettings();
      updateWallpaperPresentation();
      syncUI();
    });
  }

  if (wallpaperRotationOptions) {
    wallpaperRotationOptions.addEventListener('click', (e) => {
      const opt = e.target.closest('.theme-option');
      if (!opt || opt.disabled) return;
      settings.wallpaperRotation = opt.dataset.rotation;
      resetWallpaperRotationClock();
      saveSettingsNow();
      syncUI();
    });
  }

  if (wallpaperRotationModeOptions) {
    wallpaperRotationModeOptions.addEventListener('click', (e) => {
      const opt = e.target.closest('.theme-option');
      if (!opt || opt.disabled) return;
      settings.wallpaperRotationMode = opt.dataset.rotationMode;
      resetWallpaperRotationClock();
      saveSettingsNow();
      syncUI();
    });
  }

  if (wallpaperSelectModeBtn) {
    wallpaperSelectModeBtn.addEventListener('click', () => {
      setWallpaperSelectionMode(!wallpaperSelectionMode);
    });
  }

  if (wallpaperDeleteSelectedBtn) {
    wallpaperDeleteSelectedBtn.addEventListener('click', () => {
      const ids = Array.from(selectedWallpaperIds);
      const count = removeWallpapers(ids);
      setWallpaperSelectionMode(false);
      if (count > 0) showToast(t('toast.wallpaperDeleted', { count }));
    });
  }

  if (wallpaperClearAllBtn) {
    wallpaperClearAllBtn.addEventListener('click', clearAllWallpapers);
  }

  if (wallpaperOpenBtn) {
    wallpaperOpenBtn.addEventListener('click', () => {
      setSettingsView('wallpaper');
      if (backBtn) backBtn.focus();
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      setSettingsView('main');
      if (wallpaperOpenBtn && !wallpaperSection.hidden) wallpaperOpenBtn.focus();
    });
  }

  // Shadow strength slider
  shadowSlider.addEventListener('input', () => {
    settings.shadowStrength = parseInt(shadowSlider.value);
    shadowValue.textContent = settings.shadowStrength;
    applyShadowStrength();
    saveSettings();
  });

  // Overlay strength slider
  overlaySlider.addEventListener('input', () => {
    settings.overlayStrength = parseInt(overlaySlider.value);
    overlayValue.textContent = settings.overlayStrength;
    updateWallpaperPresentation();
    saveSettings();
  });

  // Tab title input
  tabTitleInput.addEventListener('input', () => {
    settings.tabTitle = tabTitleInput.value.trim();
    applyTabTitle();
    saveSettings();
  });

  // Suggestions toggle
  if (suggestionsToggle) {
    suggestionsToggle.addEventListener('click', handleSuggestionsToggle);
  }

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!aboutPanel.hasAttribute('hidden')) {
        closeAbout();
      } else if (!panel.hasAttribute('hidden') && settingsPanelView === 'wallpaper') {
        setSettingsView('main');
        if (wallpaperOpenBtn && !wallpaperSection.hidden) wallpaperOpenBtn.focus();
      } else if (!panel.hasAttribute('hidden')) {
        closePanel();
      }
    }
  });

  // --- Init ---
  loadSettings();
  const settingsReady = migrateWallpaperStorage().catch(() => {});

  // Build color preset buttons
  PRESET_COLORS.forEach((c) => {
    const btn = document.createElement('button');
    btn.className = 'color-swatch';
    btn.dataset.color = c.value;
    btn.title = c.label;
    btn.setAttribute('aria-label', c.label);
    if (c.value) {
      btn.style.backgroundColor = c.value;
    }
    colorPresets.appendChild(btn);
  });

  // Build font options
  const translate = (k) => (window.__i18n && window.__i18n.t(k)) || k;
  fontOptions.innerHTML = `
    <button class="font-option" data-font="serif">
      <span class="font-preview" style="font-family: ${FONT_STACKS.serif}">Aa</span>
      <span class="font-name">${translate('settings.fontSerif')}</span>
    </button>
    <button class="font-option" data-font="system">
      <span class="font-preview" style="font-family: ${FONT_STACKS.system}">Aa</span>
      <span class="font-name">${translate('settings.fontSystem')}</span>
    </button>
    <button class="font-option" data-font="mono">
      <span class="font-preview" style="font-family: ${FONT_STACKS.mono}">Aa</span>
      <span class="font-name">${translate('settings.fontMono')}</span>
    </button>
  `;

  // Re-query after rebuilding
  const fontOptsContainer = document.getElementById('font-options');
  fontOptsContainer.addEventListener('click', (e) => {
    const opt = e.target.closest('.font-option');
    if (!opt) return;
    settings.font = opt.dataset.font;
    saveSettings();
    applyFont();
    fontOptsContainer.querySelectorAll('.font-option').forEach((o) => {
      o.classList.toggle('active', o.dataset.font === settings.font);
    });
  });

  // Radius options
  radiusOptions.addEventListener('click', (e) => {
    const opt = e.target.closest('.theme-option');
    if (!opt) return;
    settings.radius = opt.dataset.radius;
    saveSettings();
    applyRadius();
    radiusOptions.querySelectorAll('.theme-option').forEach((o) => {
      o.classList.toggle('active', o.dataset.radius === settings.radius);
    });
  });

  // Settings button position toggle
  const btnPosOptions = document.getElementById('settings-btn-position-options');
  if (btnPosOptions) {
    btnPosOptions.addEventListener('click', (e) => {
      const opt = e.target.closest('.theme-option');
      if (!opt) return;
      settings.settingsBtnPosition = opt.dataset.position;
      saveSettings();
      applySettingsBtnPosition();
      syncUI();
    });
  }

  // Wire up events
  createOverlay();
  settingsBtn.addEventListener('click', openPanel);
  closeBtn.addEventListener('click', closePanel);

  // About panel
  aboutBtn.addEventListener('click', openAbout);
  aboutClose.addEventListener('click', closeAbout);
  if (aboutOverlay) aboutOverlay.addEventListener('click', closeAbout);

  // 监听 html data-theme 属性变化（包括 theme.js 延迟应用的情况），确保设置面板 UI 始终与当前主题同步
  const observer = new MutationObserver(() => {
    applyBackground();
    if (!panel.hasAttribute('hidden')) syncUI();
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    applyBackground();
    if (!panel.hasAttribute('hidden')) syncUI();
  });

  window.addEventListener('resize', () => {
    clearTimeout(resizeSyncTimer);
    resizeSyncTimer = setTimeout(() => {
      if (settings.bgMode === 'wallpaper' && ['auto', 'light'].includes(settings.wallpaperSurfaceMode)) {
        updateWallpaperPresentation();
      }
    }, 150);
  });

  // Expose for search.js dropdown settings entry
  window.__settingsPanel = { open: openPanel };

  window.addEventListener('pagehide', () => {
    if (saveTimer) saveSettingsNow();
    clearTimeout(wallpaperRotationTimer);
    clearTimeout(resizeSyncTimer);
  });

  // Apply on load
  settingsReady.finally(() => {
    applyAll();
  });
})();
