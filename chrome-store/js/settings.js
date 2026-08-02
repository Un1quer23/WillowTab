(() => {
  const SETTINGS_KEY = 'newtab-settings';
  const WALLPAPER_CONTROL_TARGET = 3.3;

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
    wallpaperSurfaceMode: 'light',
    wallpaperRotation: 'off',
    wallpaperRotationMode: 'sequence',
    lastWallpaperRotationAt: 0,
    enableSuggestions: false,
  };

  const FONT_STACKS = {
    serif: "Georgia, 'Times New Roman', 'Songti SC', 'SimSun', serif",
    system: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', 'PingFang SC', sans-serif",
    mono: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', 'Courier New', 'Microsoft YaHei', monospace",
  };

  const PRESET_COLORS = [
    { value: '#F5F5DC', get label() { return (window.__i18n && window.__i18n.t('color.beige')) || '米灰'; } },
    { value: '#bfbb98', get label() { return (window.__i18n && window.__i18n.t('color.sage')) || '鼠尾草'; } },
  ];

  let settings = { ...DEFAULTS };

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
  const wallpaperModeHint = document.getElementById('wallpaper-mode-hint');
  const wallpaperTabs = document.getElementById('wallpaper-tabs');
  const wallpaperLibraryPanel = document.getElementById('wallpaper-library-panel');
  const wallpaperPreferencesPanel = document.getElementById('wallpaper-preferences-panel');
  const wallpaperLibraryCount = document.getElementById('wallpaper-library-count');
  const wallpaperAddBtn = document.getElementById('wallpaper-add-btn');
  const wallpaperAddLabel = document.getElementById('wallpaper-add-label');
  const wallpaperAddMenu = document.getElementById('wallpaper-add-menu');
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
  const wallpaperManageToolbar = document.getElementById('wallpaper-manage-toolbar');
  const wallpaperSelectedCount = document.getElementById('wallpaper-selected-count');
  const wallpaperSelectAllBtn = document.getElementById('wallpaper-select-all-btn');
  const wallpaperDeleteSelectedBtn = document.getElementById('wallpaper-delete-selected-btn');
  const wallpaperManageDoneBtn = document.getElementById('wallpaper-manage-done-btn');
  const wallpaperReorderStatus = document.getElementById('wallpaper-reorder-status');
  const wallpaperConfirmOverlay = document.getElementById('wallpaper-confirm-overlay');
  const wallpaperConfirmDialog = document.getElementById('wallpaper-confirm-dialog');
  const wallpaperConfirmTitle = document.getElementById('wallpaper-confirm-title');
  const wallpaperConfirmMessage = document.getElementById('wallpaper-confirm-message');
  const wallpaperConfirmCancel = document.getElementById('wallpaper-confirm-cancel');
  const wallpaperConfirmSubmit = document.getElementById('wallpaper-confirm-submit');
  const overlaySlider = document.getElementById('overlay-slider');
  const overlayValue = document.getElementById('overlay-value');
  const shadowSlider = document.getElementById('shadow-slider');
  const shadowValue = document.getElementById('shadow-value');
  const customColorPicker = document.getElementById('custom-color-picker');
  const customColorHex = document.getElementById('custom-color-hex');
  const colorQualityWarning = document.getElementById('color-quality-warning');
  const useSuggestedColor = document.getElementById('use-suggested-color');
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
  let draggedWallpaperBoundary = -1;
  let wallpaperSubView = 'library';
  let wallpaperImportInProgress = false;
  let wallpaperImportProgress = { current: 0, total: 0 };
  let pendingWallpaperDeleteIds = [];
  let wallpaperDeleteReturnFocus = null;
  let wallpaperDeleteInProgress = false;
  let settingsPanelView = 'main';
  let activeWallpaperData = '';
  let wallpaperSurfaceAnalysisToken = 0;
  let resizeSyncTimer = null;
  let aboutReturnFocus = null;
  let activeColorPalette = null;
  const selectedWallpaperIds = new Set();
  const pendingHides = new Map();
  const pageRegions = [
    document.querySelector('.container'),
    document.querySelector('.actions-section'),
  ].filter(Boolean);

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

  const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  function getFocusableElements(container) {
    return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter((element) => {
      return !element.closest('[hidden], [inert]') && element.getClientRects().length > 0;
    });
  }

  function trapFocus(event, container) {
    if (event.key !== 'Tab') return;
    const focusable = getFocusableElements(container);
    if (!focusable.length) {
      event.preventDefault();
      container.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function setPageInert(inert) {
    pageRegions.forEach((region) => { region.inert = inert; });
  }

  function focusWhenAvailable(element, fallback) {
    const engineToggle = document.getElementById('engine-toggle');
    const target = [element, fallback, engineToggle].find((candidate) => {
      return candidate && candidate.isConnected && !candidate.closest('[hidden], [inert]') && candidate.getClientRects().length > 0;
    });
    if (target && typeof target.focus === 'function') target.focus();
  }

  function cancelPendingHide(element) {
    const pending = pendingHides.get(element);
    if (!pending) return;
    clearTimeout(pending.timer);
    element.removeEventListener('transitionend', pending.onEnd);
    pendingHides.delete(element);
  }

  function hideAfterTransition(element, timeout, callback) {
    cancelPendingHide(element);
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      element.removeEventListener('transitionend', onEnd);
      pendingHides.delete(element);
      callback();
    };
    const onEnd = (event) => {
      if (event.target === element && ['opacity', 'transform'].includes(event.propertyName)) finish();
    };
    const timer = setTimeout(finish, timeout);
    pendingHides.set(element, { timer, onEnd });
    element.addEventListener('transitionend', onEnd);
  }

  function syncRadioOptions(container, selector, dataKey, selectedValue) {
    if (!container) return;
    const options = Array.from(container.querySelectorAll(selector));
    let tabbableAssigned = false;
    options.forEach((option) => {
      const selected = option.dataset[dataKey] === selectedValue;
      option.setAttribute('role', 'radio');
      option.setAttribute('aria-checked', String(selected));
      const tabbable = selected && !option.disabled;
      option.tabIndex = tabbable ? 0 : -1;
      if (tabbable) tabbableAssigned = true;
      option.classList.toggle('active', selected);
    });
    if (!tabbableAssigned) {
      const firstEnabled = options.find((option) => !option.disabled);
      if (firstEnabled) firstEnabled.tabIndex = 0;
    }
  }

  function enableRadioKeyboard(container, selector) {
    if (!container) return;
    container.addEventListener('keydown', (event) => {
      const current = event.target.closest(selector);
      if (!current) return;
      const options = Array.from(container.querySelectorAll(selector)).filter((option) => !option.disabled);
      const currentIndex = options.indexOf(current);
      if (currentIndex < 0) return;
      let nextIndex = currentIndex;
      if (['ArrowRight', 'ArrowDown'].includes(event.key)) nextIndex = (currentIndex + 1) % options.length;
      else if (['ArrowLeft', 'ArrowUp'].includes(event.key)) nextIndex = (currentIndex - 1 + options.length) % options.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = options.length - 1;
      else return;
      event.preventDefault();
      options[nextIndex].focus();
      options[nextIndex].click();
    });
  }

  function effectiveThemeIsDark() {
    const html = document.documentElement;
    const colorScheme = html.getAttribute('data-color-scheme');
    if (colorScheme === 'dark') return true;
    if (colorScheme === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
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
      settings.wallpaperSurfaceMode = 'light';
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

  function mixRgb(from, to, amount) {
    return {
      r: from.r + (to.r - from.r) * amount,
      g: from.g + (to.g - from.g) * amount,
      b: from.b + (to.b - from.b) * amount,
    };
  }

  function rgbToHex(color) {
    const channel = (value) => Math.round(value).toString(16).padStart(2, '0');
    return `#${channel(color.r)}${channel(color.g)}${channel(color.b)}`;
  }

  function lowestContrast(color, surfaces) {
    const luminance = relativeLuminance(color);
    return Math.min(...surfaces.map((surface) => {
      return contrastRatio(luminance, relativeLuminance(surface));
    }));
  }

  function pickReadableColor(surfaces, desired, endpoint, targetContrast = 4.5) {
    if (window.__willowColor) {
      return window.__willowColor.readableColor(surfaces, desired, endpoint, targetContrast).hex;
    }
    const isReadable = (candidate) => {
      return lowestContrast(candidate, surfaces) >= targetContrast;
    };

    const roundedCandidate = (amount) => parseHexColor(rgbToHex(mixRgb(desired, endpoint, amount)));

    const roundedDesired = parseHexColor(rgbToHex(desired));
    if (isReadable(roundedDesired)) return rgbToHex(roundedDesired);

    let low = 0;
    let high = 1;
    for (let i = 0; i < 20; i += 1) {
      const middle = (low + high) / 2;
      if (isReadable(roundedCandidate(middle))) high = middle;
      else low = middle;
    }
    const candidate = roundedCandidate(high);
    if (isReadable(candidate)) return rgbToHex(candidate);
    for (let step = 1; step <= 255; step += 1) {
      const amount = high + ((1 - high) * step) / 255;
      const fallback = roundedCandidate(amount);
      if (isReadable(fallback)) return rgbToHex(fallback);
    }
    return rgbToHex(endpoint);
  }

  function resolveLightInputSurface(color, white) {
    const roundedSurface = (amount) => parseHexColor(rgbToHex(mixRgb(color, white, amount)));
    const desiredAmount = 0.12;
    const desired = roundedSurface(desiredAmount);
    if (lowestContrast(white, [color, desired]) >= 4.5) return desired;

    let low = 0;
    let high = desiredAmount;
    for (let i = 0; i < 20; i += 1) {
      const middle = (low + high) / 2;
      if (lowestContrast(white, [color, roundedSurface(middle)]) >= 4.5) low = middle;
      else high = middle;
    }
    return roundedSurface(low);
  }

  function clearColorReadabilityVars() {
    const root = document.documentElement;
    document.body.removeAttribute('data-color-readable');
    root.style.removeProperty('--bg-secondary');
    root.style.removeProperty('--bg-tertiary');
    root.style.removeProperty('--text-primary');
    root.style.removeProperty('--text-secondary');
    root.style.removeProperty('--text-tertiary');
    root.style.removeProperty('--motto-text');
    root.style.removeProperty('--placeholder-text');
    root.style.removeProperty('--border');
    root.style.removeProperty('--border-focus');
    root.style.removeProperty('--input-bg');
    root.style.removeProperty('--accent');
    root.style.removeProperty('--accent-hover');
    root.style.removeProperty('--accent-text');
    root.style.removeProperty('--accent-subtle');
    root.style.removeProperty('--focus-ring-color');
    root.style.removeProperty('--canvas-text-primary');
    root.style.removeProperty('--canvas-text-secondary');
    root.style.removeProperty('--canvas-large-text');
    root.style.removeProperty('--canvas-control-color');
    root.style.removeProperty('--search-surface');
    root.style.removeProperty('--search-text-color');
    root.style.removeProperty('--search-placeholder-color');
    root.style.removeProperty('--search-control-color');
    root.style.removeProperty('--search-control-hover-color');
    root.style.removeProperty('--search-control-focus-color');
    root.style.removeProperty('--search-focus-stroke');
    root.style.removeProperty('--search-selected-surface');
    root.style.removeProperty('--search-selected-text');
    activeColorPalette = null;
  }

  function applyColorReadabilityVars(bgColor) {
    if (window.__willowColor) {
      const palette = window.__willowColor.createSolidPalette(bgColor);
      if (!palette) return;
      const root = document.documentElement;
      const accent = palette.colors.searchAccent;
      const accentRgb = window.__willowColor.parseHex(accent);
      activeColorPalette = palette;
      document.body.dataset.colorReadable = palette.mode;
      root.style.setProperty('--bg-secondary', palette.surfaces.secondary);
      root.style.setProperty('--bg-tertiary', palette.surfaces.tertiary);
      root.style.setProperty('--text-primary', palette.colors.canvasPrimary);
      root.style.setProperty('--text-secondary', palette.colors.canvasSecondary);
      root.style.setProperty('--text-tertiary', palette.colors.canvasControl);
      root.style.setProperty('--placeholder-text', palette.colors.searchPlaceholder);
      root.style.setProperty('--input-bg', palette.surfaces.input);
      root.style.setProperty('--accent', accent);
      root.style.setProperty('--accent-hover', accent);
      root.style.setProperty('--accent-text', palette.colors.accentText);
      root.style.setProperty('--accent-subtle', `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.08)`);
      root.style.setProperty('--border-focus', accent);
      root.style.setProperty('--focus-ring-color', accent);
      root.style.setProperty('--canvas-text-primary', palette.colors.canvasPrimary);
      root.style.setProperty('--canvas-text-secondary', palette.colors.canvasSecondary);
      root.style.setProperty('--canvas-large-text', palette.colors.canvasLarge);
      root.style.setProperty('--canvas-control-color', palette.colors.canvasControl);
      root.style.setProperty('--search-surface', palette.surfaces.input);
      root.style.setProperty('--search-text-color', palette.colors.searchText);
      root.style.setProperty('--search-placeholder-color', palette.colors.searchPlaceholder);
      root.style.setProperty('--search-control-color', palette.colors.searchControl);
      root.style.setProperty('--search-control-hover-color', accent);
      root.style.setProperty('--search-control-focus-color', accent);
      root.style.setProperty('--search-focus-stroke', accent);
      root.style.setProperty('--search-selected-surface', `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.08)`);
      root.style.setProperty('--search-selected-text', palette.colors.accentText);
      root.style.setProperty('--border', palette.mode === 'dark-text'
        ? `color-mix(in srgb, ${bgColor} 75%, black)`
        : 'rgba(255, 255, 255, 0.24)');
      return;
    }
    const color = parseHexColor(bgColor);
    if (!color) return;
    const root = document.documentElement;
    const white = { r: 255, g: 255, b: 255 };
    const black = { r: 0, g: 0, b: 0 };
    const schemes = [
      {
        name: 'dark-text',
        endpoint: black,
        inputSurface: parseHexColor(rgbToHex(mixRgb(color, white, 0.5))),
      },
      {
        name: 'light-text',
        endpoint: white,
        inputSurface: resolveLightInputSurface(color, white),
      },
    ];
    schemes.forEach((scheme) => {
      scheme.score = lowestContrast(scheme.endpoint, [color, scheme.inputSurface]);
    });
    const scheme = schemes.reduce((best, candidate) => candidate.score > best.score ? candidate : best);
    const useDarkText = scheme.name === 'dark-text';
    const endpoint = scheme.endpoint;
    const inputSurface = scheme.inputSurface;
    const surfaces = [color, inputSurface];
    const lightPrimary = parseHexColor('#f3eddf');
    const primaryDesired = useDarkText ? mixRgb(color, black, 0.8) : lightPrimary;
    const secondaryDesired = useDarkText
      ? mixRgb(color, black, 0.6)
      : mixRgb(color, lightPrimary, 0.78);
    const primaryText = pickReadableColor(surfaces, primaryDesired, endpoint);
    const secondaryText = pickReadableColor(surfaces, secondaryDesired, endpoint);
    const mutedText = pickReadableColor(
      [color, inputSurface],
      useDarkText ? parseHexColor('#6b6b60') : parseHexColor('#8f887e'),
      endpoint,
    );
    const placeholderText = pickReadableColor(
      [inputSurface],
      useDarkText ? parseHexColor('#727269') : parseHexColor('#8f887e'),
      endpoint,
    );
    const mottoText = pickReadableColor(
      [inputSurface],
      useDarkText ? parseHexColor('#918d83') : parseHexColor('#706b64'),
      endpoint,
      3.2,
    );
    const accent = pickReadableColor(
      surfaces,
      parseHexColor(useDarkText ? '#c87a3c' : '#e8964a'),
      endpoint,
      3,
    );
    const accentColor = parseHexColor(accent);
    const accentSubtleColor = mixRgb(accentColor, useDarkText ? white : black, 0.8);
    const accentSubtleSurface = mixRgb(inputSurface, accentSubtleColor, 0.1);
    const accentText = pickReadableColor(
      [inputSurface, accentSubtleSurface],
      accentColor,
      endpoint,
    );
    const accentSubtle = `rgba(${Math.round(accentSubtleColor.r)}, ${Math.round(accentSubtleColor.g)}, ${Math.round(accentSubtleColor.b)}, 0.1)`;
    document.body.dataset.colorReadable = useDarkText ? 'dark-text' : 'light-text';
    if (useDarkText) {
      root.style.setProperty('--bg-secondary', `color-mix(in srgb, ${bgColor} 88%, white)`);
      root.style.setProperty('--bg-tertiary', `color-mix(in srgb, ${bgColor} 75%, white)`);
      root.style.setProperty('--border', `color-mix(in srgb, ${bgColor} 75%, black)`);
    } else {
      root.style.setProperty('--bg-secondary', `color-mix(in srgb, ${bgColor} 82%, white)`);
      root.style.setProperty('--bg-tertiary', `color-mix(in srgb, ${bgColor} 72%, white)`);
      root.style.setProperty('--border', 'rgba(255, 255, 255, 0.24)');
    }

    root.style.setProperty('--text-primary', primaryText);
    root.style.setProperty('--text-secondary', secondaryText);
    root.style.setProperty('--text-tertiary', mutedText);
    root.style.setProperty('--motto-text', mottoText);
    root.style.setProperty('--placeholder-text', placeholderText);
    root.style.setProperty('--input-bg', rgbToHex(inputSurface));
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-hover', accent);
    root.style.setProperty('--accent-text', accentText);
    root.style.setProperty('--accent-subtle', accentSubtle);
    root.style.setProperty('--border-focus', accent);
    root.style.setProperty('--focus-ring-color', accent);
  }

  function syncColorQualityWarning() {
    if (!colorQualityWarning || !useSuggestedColor) return;
    const showWarning = settings.bgMode === 'color'
      && Boolean(settings.bgColor)
      && !effectiveThemeIsDark()
      && Boolean(activeColorPalette && activeColorPalette.warning);
    colorQualityWarning.hidden = !showWarning;
    useSuggestedColor.dataset.color = showWarning ? activeColorPalette.suggested : '';
  }

  function summarizeImageData(imageData, width, height) {
    let total = 0;
    let totalR = 0;
    let totalG = 0;
    let totalB = 0;
    const pixels = imageData.data;
    const samples = [];
    for (let i = 0; i < pixels.length; i += 4) {
      const color = { r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] };
      const value = (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) / 255;
      samples.push({ value, color });
      total += value;
      totalR += color.r;
      totalG += color.g;
      totalB += color.b;
    }
    const brightness = samples.length ? total / samples.length : -1;
    const color = samples.length
      ? { r: totalR / samples.length, g: totalG / samples.length, b: totalB / samples.length }
      : null;
    let variance = 0;
    let neighborDiff = 0;
    let neighborCount = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        const value = samples[index].value;
        variance += (value - brightness) ** 2;
        if (x + 1 < width) {
          neighborDiff += Math.abs(value - samples[index + 1].value);
          neighborCount++;
        }
        if (y + 1 < height) {
          neighborDiff += Math.abs(value - samples[index + width].value);
          neighborCount++;
        }
      }
    }
    const deviation = Math.sqrt(variance / samples.length);
    const texture = neighborCount ? neighborDiff / neighborCount : 0;
    const complexity = Math.min(1, Math.max(0, deviation * 1.35 + texture * 2.4));
    const sorted = [...samples].sort((a, b) => a.value - b.value);
    const lowSample = sorted.length ? sorted[0] : null;
    const highSample = sorted.length ? sorted[sorted.length - 1] : null;
    return {
      brightness,
      complexity,
      color,
      lowBrightness: lowSample ? lowSample.value : brightness,
      highBrightness: highSample ? highSample.value : brightness,
      lowColor: lowSample ? lowSample.color : color,
      highColor: highSample ? highSample.color : color,
    };
  }

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
        const sampleRegion = (region, sampleWidth, sampleHeight) => {
          const regionSx = Math.max(0, Math.min(img.width, (region.left - offsetX) / scale));
          const regionSy = Math.max(0, Math.min(img.height, (region.top - offsetY) / scale));
          const regionSw = Math.max(1, Math.min(img.width - regionSx, region.width / scale));
          const regionSh = Math.max(1, Math.min(img.height - regionSy, region.height / scale));
          const canvas = document.createElement('canvas');
          canvas.width = sampleWidth;
          canvas.height = sampleHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, regionSx, regionSy, regionSw, regionSh, 0, 0, sampleWidth, sampleHeight);
          return summarizeImageData(ctx.getImageData(0, 0, sampleWidth, sampleHeight), sampleWidth, sampleHeight);
        };
        resolve(sampleRegion({ left, top, width, height }, 48, 18));
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  }

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

    if (settings.bgMode === 'color' && settings.bgColor && !effectiveThemeIsDark()) {
      body.classList.add('has-custom-bg');
      root.style.setProperty('--bg-primary', settings.bgColor);
      applyColorReadabilityVars(settings.bgColor);
    }

    applyShadowStrength();
  }

  function clearWallpaperAdaptiveVars() {
    const root = document.documentElement;
    root.style.removeProperty('--wallpaper-text-color');
    root.style.removeProperty('--wallpaper-motto-text');
    root.style.removeProperty('--wallpaper-time-color');
    root.style.removeProperty('--wallpaper-greeting-color');
    root.style.removeProperty('--wallpaper-input-bg');
    root.style.removeProperty('--wallpaper-button-bg');
    root.style.removeProperty('--wallpaper-button-hover-bg');
    root.style.removeProperty('--wallpaper-menu-selected-bg');
    root.style.removeProperty('--wallpaper-menu-selected-text');
    root.style.removeProperty('--wallpaper-surface-border');
    root.style.removeProperty('--wallpaper-protection-bg');
    root.style.removeProperty('--wallpaper-search-control-color');
    root.style.removeProperty('--wallpaper-engine-color');
    root.style.removeProperty('--wallpaper-submit-color');
    root.style.removeProperty('--wallpaper-engine-hover-color');
    root.style.removeProperty('--wallpaper-submit-hover-color');
    root.style.removeProperty('--wallpaper-engine-scrim');
    root.style.removeProperty('--wallpaper-submit-scrim');
    root.style.removeProperty('--wallpaper-engine-hover-scrim');
    root.style.removeProperty('--wallpaper-submit-hover-scrim');
    root.style.removeProperty('--wallpaper-search-control-hover-color');
    root.style.removeProperty('--wallpaper-search-control-focus-color');
    root.style.removeProperty('--wallpaper-search-focus-stroke');
    root.style.removeProperty('--wallpaper-action-border');
    root.style.removeProperty('--wallpaper-analysis-min');
    root.style.removeProperty('--wallpaper-analysis-max');
    root.style.removeProperty('--wallpaper-analysis-target');
  }

  function applyWallpaperMottoColor(
    textColor,
    inputSurfaceColor,
    inputAlpha,
    surfaceBrightness,
  ) {
    const primaryText = parseHexColor(textColor);
    if (!primaryText) return inputAlpha;
    const tone = Math.min(1, Math.max(0, surfaceBrightness)) * 255;
    const wallpaperSurface = { r: tone, g: tone, b: tone };
    const primaryLuminance = relativeLuminance(primaryText);
    const contrastAt = (alpha) => {
      const surface = mixRgb(wallpaperSurface, inputSurfaceColor, alpha);
      return contrastRatio(primaryLuminance, relativeLuminance(surface));
    };
    let resolvedInputAlpha = inputAlpha;
    const targetPrimaryContrast = 4.5;
    if (contrastAt(inputAlpha) < targetPrimaryContrast && contrastAt(1) >= targetPrimaryContrast) {
      let low = inputAlpha;
      let high = 1;
      for (let i = 0; i < 20; i += 1) {
        const middle = (low + high) / 2;
        if (contrastAt(middle) >= targetPrimaryContrast) high = middle;
        else low = middle;
      }
      resolvedInputAlpha = high;
    }
    const inputSurface = mixRgb(wallpaperSurface, inputSurfaceColor, resolvedInputAlpha);
    const useDarkText = relativeLuminance(primaryText) < relativeLuminance(inputSurface);
    const desired = parseHexColor(useDarkText ? '#918d83' : '#706b64');
    const motto = pickReadableColor([inputSurface], desired, primaryText, 3.2);
    const root = document.documentElement;
    root.style.setProperty('--wallpaper-motto-text', motto);
    root.style.setProperty('--wallpaper-search-control-color', textColor);
    root.style.setProperty('--wallpaper-search-control-hover-color', textColor);
    root.style.setProperty('--wallpaper-search-control-focus-color', textColor);
    root.style.setProperty('--wallpaper-search-focus-stroke', textColor);
    root.style.setProperty('--wallpaper-action-border', textColor);
    return resolvedInputAlpha;
  }

  function applyWallpaperMenuSelectionColors(
    surfaceBrightness,
    menuSurfaceColor,
    menuSurfaceAlpha,
    selectedSurfaceColor,
    selectedSurfaceAlpha,
    selectedTextColor,
  ) {
    const root = document.documentElement;
    const tone = Math.min(1, Math.max(0, surfaceBrightness)) * 255;
    const wallpaperSurface = { r: tone, g: tone, b: tone };
    const menuSurface = mixRgb(wallpaperSurface, menuSurfaceColor, menuSurfaceAlpha);
    const selectedText = parseHexColor(selectedTextColor) || parseHexColor('#f3eddf');
    const selectedSurface = mixRgb(menuSurface, selectedSurfaceColor, selectedSurfaceAlpha);
    const useDarkText = relativeLuminance(selectedText) < relativeLuminance(selectedSurface);
    const resolvedSelectedText = pickReadableColor(
      [selectedSurface],
      selectedText,
      parseHexColor(useDarkText ? '#000000' : '#ffffff'),
      4.5,
    );

    root.style.setProperty(
      '--wallpaper-menu-selected-bg',
      `rgba(${Math.round(selectedSurfaceColor.r)},${Math.round(selectedSurfaceColor.g)},${Math.round(selectedSurfaceColor.b)},${selectedSurfaceAlpha.toFixed(3)})`,
    );
    root.style.setProperty('--wallpaper-menu-selected-text', resolvedSelectedText);
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
    if (!activeWallpaperData) return;
    const token = ++wallpaperSurfaceAnalysisToken;
    requestAnimationFrame(() => {
      const surfacePromise = ['auto', 'light'].includes(settings.wallpaperSurfaceMode)
        ? analyzeWallpaperSurfaceRegion(activeWallpaperData)
        : Promise.resolve(null);
      surfacePromise.then((surfaceAnalysis) => {
        if (token !== wallpaperSurfaceAnalysisToken || applyToken !== wallpaperApplyToken) return;
        if (surfaceAnalysis && surfaceAnalysis.brightness >= 0) {
          applyWallpaperTextColor(brightness, complexity, surfaceAnalysis);
        }
        return syncWallpaperControlStyles(token, applyToken);
      });
    });
  }

  async function syncWallpaperControlStyles(token, applyToken) {
    const analyzer = window.__willowWallpaperColor;
    const engine = document.getElementById('engine-toggle');
    const submit = document.getElementById('search-submit');
    const engineVisual = engine?.querySelector('.search-control-visual');
    const submitVisual = submit?.querySelector('.search-control-visual');
    const engineSvg = engineVisual?.querySelector('svg');
    const submitSvg = submitVisual?.querySelector('svg');
    if (!analyzer || !engineVisual || !submitVisual || !engineSvg || !submitSvg) return;

    const root = document.documentElement;
    const styles = getComputedStyle(root);
    const protection = analyzer.normalizeColor(styles.getPropertyValue('--wallpaper-protection-bg'));
    try {
      const analysis = await analyzer.analyzeControlSurface({
        wallpaperUrl: activeWallpaperData,
        wallpaperId: settings.activeWallpaperId,
        viewport: {
          width: window.innerWidth || document.documentElement.clientWidth,
          height: window.innerHeight || document.documentElement.clientHeight,
          dpr: window.devicePixelRatio || 1,
        },
        overlayAlpha: settings.overlayStrength / 100,
        readability: settings.wallpaperReadability,
        protectionColor: protection,
        protectionAlpha: protection.a,
        inputColor: styles.getPropertyValue('--wallpaper-input-bg'),
        hoverColor: styles.getPropertyValue('--wallpaper-button-bg'),
        blurRadius: parseFloat(styles.getPropertyValue('--wallpaper-surface-blur')) || 16,
        targetContrast: WALLPAPER_CONTROL_TARGET,
        solverVersion: analyzer.solverVersion,
        controls: {
          engine: { visual: engineVisual, svg: engineSvg },
          submit: { visual: submitVisual, svg: submitSvg },
        },
      });
      if (token !== wallpaperSurfaceAnalysisToken || applyToken !== wallpaperApplyToken || !analysis) return;
      const desired = styles.getPropertyValue('--wallpaper-search-control-color').trim() || '#9f5300';
      const pair = analyzer.solveControlPair(
        analysis.controls.engine,
        analysis.controls.submit,
        desired,
        WALLPAPER_CONTROL_TARGET,
      );
      if (!pair) return;
      const { engine: engineStyle, submit: submitStyle } = pair;
      root.style.setProperty('--wallpaper-engine-color', engineStyle.normal.color);
      root.style.setProperty('--wallpaper-submit-color', submitStyle.normal.color);
      root.style.setProperty('--wallpaper-engine-hover-color', engineStyle.hover.color);
      root.style.setProperty('--wallpaper-submit-hover-color', submitStyle.hover.color);
      root.style.setProperty('--wallpaper-engine-scrim', engineStyle.normal.scrim);
      root.style.setProperty('--wallpaper-submit-scrim', submitStyle.normal.scrim);
      root.style.setProperty('--wallpaper-engine-hover-scrim', engineStyle.hover.scrim);
      root.style.setProperty('--wallpaper-submit-hover-scrim', submitStyle.hover.scrim);
      root.style.setProperty('--wallpaper-analysis-min', Math.min(
        engineStyle.normal.minimumContrast,
        submitStyle.normal.minimumContrast,
      ).toFixed(3));
      root.style.setProperty('--wallpaper-analysis-max', Math.max(
        engineStyle.hover.minimumContrast,
        submitStyle.hover.minimumContrast,
      ).toFixed(3));
      root.style.setProperty('--wallpaper-analysis-target', WALLPAPER_CONTROL_TARGET.toFixed(1));
      analyzer.lastResult = {
        analysis,
        engine: engineStyle,
        submit: submitStyle,
        pair: pair.diagnostics,
      };
    } catch (_) {
      // Keep the theme-provided control colors if the wallpaper cannot be analyzed.
    }
  }

  function applyWallpaperTextColor(brightness, complexity = 0, surfaceAnalysis = null) {
    const root = document.documentElement;
    clearWallpaperAdaptiveVars();
    const effective = brightness * (1 - settings.overlayStrength / 100);
    const lightSurface = brightness >= 0.62 || effective >= 0.52;
    const surfaceMode = settings.wallpaperSurfaceMode || 'light';
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
        const textColor = adaptiveLightSurface ? '#272016' : '#f3eddf';
        const resolvedInputAlpha = applyWallpaperMottoColor(
          textColor,
          { r: 255, g: 255, b: 255 },
          inputAlpha,
          surfaceEffective,
        );
        root.style.setProperty('--wallpaper-text-color', textColor);
        root.style.setProperty('--wallpaper-input-bg', `rgba(255,255,255,${resolvedInputAlpha.toFixed(3)})`);
        root.style.setProperty('--wallpaper-button-bg', `rgba(255,255,255,${buttonAlpha.toFixed(3)})`);
        root.style.setProperty('--wallpaper-button-hover-bg', `rgba(255,255,255,${buttonHoverAlpha.toFixed(3)})`);
        applyWallpaperMenuSelectionColors(
          surfaceEffective,
          { r: 255, g: 255, b: 255 },
          resolvedInputAlpha,
          { r: 245, g: 245, b: 220 },
          0.76,
          '#68401f',
        );
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
        const resolvedInputAlpha = applyWallpaperMottoColor(
          '#f3eddf',
          { r: 18, g: 16, b: 14 },
          inputAlpha,
          surfaceEffective,
        );
        root.style.setProperty('--wallpaper-text-color', '#f3eddf');
        root.style.setProperty('--wallpaper-input-bg', `rgba(18,16,14,${resolvedInputAlpha.toFixed(3)})`);
        root.style.setProperty('--wallpaper-button-bg', `rgba(18,16,14,${buttonAlpha.toFixed(3)})`);
        root.style.setProperty('--wallpaper-button-hover-bg', `rgba(18,16,14,${buttonHoverAlpha.toFixed(3)})`);
        applyWallpaperMenuSelectionColors(
          surfaceEffective,
          { r: 18, g: 16, b: 14 },
          resolvedInputAlpha,
          { r: 18, g: 16, b: 14 },
          buttonHoverAlpha,
          '#f3eddf',
        );
        root.style.setProperty('--wallpaper-surface-border', 'rgba(255,255,255,0.24)');
      }
      return;
    }

    if (surfaceMode === 'light') {
      const textColor = adaptiveLightSurface ? '#272016' : '#f3eddf';
      const inputAlpha = applyWallpaperMottoColor(
        textColor,
        { r: 255, g: 255, b: 255 },
        0.16,
        surfaceEffective,
      );
      root.style.setProperty('--wallpaper-text-color', textColor);
      root.style.setProperty('--wallpaper-input-bg', `rgba(255,255,255,${inputAlpha.toFixed(3)})`);
      root.style.setProperty('--wallpaper-button-bg', 'rgba(255,255,255,0.14)');
      root.style.setProperty('--wallpaper-button-hover-bg', 'rgba(255,255,255,0.24)');
      applyWallpaperMenuSelectionColors(
        surfaceEffective,
        { r: 255, g: 255, b: 255 },
        inputAlpha,
        { r: 245, g: 245, b: 220 },
        0.76,
        '#68401f',
      );
      root.style.setProperty('--wallpaper-surface-border', 'rgba(255,255,255,0.2)');
      return;
    }
    if (surfaceMode === 'dark') {
      const inputAlpha = applyWallpaperMottoColor(
        '#f3eddf',
        { r: 18, g: 16, b: 14 },
        0.38,
        surfaceEffective,
      );
      root.style.setProperty('--wallpaper-text-color', '#f3eddf');
      root.style.setProperty('--wallpaper-input-bg', `rgba(18,16,14,${inputAlpha.toFixed(3)})`);
      root.style.setProperty('--wallpaper-button-bg', 'rgba(18,16,14,0.32)');
      root.style.setProperty('--wallpaper-button-hover-bg', 'rgba(18,16,14,0.48)');
      applyWallpaperMenuSelectionColors(
        surfaceEffective,
        { r: 18, g: 16, b: 14 },
        inputAlpha,
        { r: 18, g: 16, b: 14 },
        0.48,
        '#f3eddf',
      );
      root.style.setProperty('--wallpaper-surface-border', 'rgba(255,255,255,0.24)');
      return;
    }

    if (effective < 0.4) {
      const inputAlpha = applyWallpaperMottoColor(
        '#e8e2d4',
        { r: 255, g: 255, b: 255 },
        0.18,
        effective,
      );
      root.style.setProperty('--wallpaper-text-color', '#e8e2d4');
      root.style.setProperty('--wallpaper-input-bg', `rgba(255,255,255,${inputAlpha.toFixed(3)})`);
      applyWallpaperMenuSelectionColors(
        surfaceEffective,
        { r: 255, g: 255, b: 255 },
        inputAlpha,
        { r: 245, g: 245, b: 220 },
        0.76,
        '#68401f',
      );
    } else if (effective < 0.6) {
      const inputAlpha = applyWallpaperMottoColor(
        '#f0ece0',
        { r: 255, g: 255, b: 255 },
        0.18,
        effective,
      );
      root.style.setProperty('--wallpaper-text-color', '#f0ece0');
      root.style.setProperty('--wallpaper-input-bg', `rgba(255,255,255,${inputAlpha.toFixed(3)})`);
      applyWallpaperMenuSelectionColors(
        surfaceEffective,
        { r: 255, g: 255, b: 255 },
        inputAlpha,
        { r: 245, g: 245, b: 220 },
        0.76,
        '#68401f',
      );
    } else {
      root.style.removeProperty('--wallpaper-text-color');
      root.style.removeProperty('--wallpaper-input-bg');
      applyWallpaperMottoColor('#272016', { r: 255, g: 255, b: 255 }, 0.15, effective);
      applyWallpaperMenuSelectionColors(
        surfaceEffective,
        { r: 255, g: 255, b: 255 },
        0.15,
        { r: 245, g: 245, b: 220 },
        0.76,
        '#68401f',
      );
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
      root.style.setProperty('--input-shadow',
        `0 2px 8px rgba(0,0,0,${(0.25 * scale).toFixed(3)}), 0 4px 20px rgba(0,0,0,${(0.15 * scale).toFixed(3)})`);
      root.style.setProperty('--shadow-sm', `0 2px 6px rgba(0,0,0,${(0.2 * scale).toFixed(3)})`);
      root.style.setProperty('--shadow-md', `0 4px 20px rgba(0,0,0,${(0.3 * scale).toFixed(3)})`);
      root.style.setProperty('--shadow-lg', `0 12px 40px rgba(0,0,0,${(0.4 * scale).toFixed(3)})`);
      root.style.setProperty('--input-shadow-focus',
        `0 2px 8px rgba(0,0,0,${(0.15 * scale).toFixed(3)}), 0 6px 24px color-mix(in srgb, var(--wallpaper-search-focus-stroke) ${(15 * scale).toFixed(1)}%, transparent)`);
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
        `0 2px 8px rgba(0,0,0,${(0.18 * scale).toFixed(3)}), 0 6px 24px color-mix(in srgb, var(--search-focus-stroke) ${(14 * scale).toFixed(1)}%, transparent)`);
      root.style.setProperty('--text-shadow-time', `0 2px 10px rgba(0,0,0,${(0.35 * scale).toFixed(3)})`);
      root.style.setProperty('--text-shadow-greeting', `0 1px 6px rgba(0,0,0,${(0.28 * scale).toFixed(3)})`);
    } else {
      root.style.setProperty('--input-shadow',
        `0 1px 3px rgba(44,36,22,${(0.06 * scale).toFixed(3)}), 0 4px 16px rgba(44,36,22,${(0.04 * scale).toFixed(3)})`);
      root.style.setProperty('--shadow-sm', `0 1px 2px rgba(44,36,22,${(0.04 * scale).toFixed(3)})`);
      root.style.setProperty('--shadow-md', `0 4px 20px rgba(44,36,22,${(0.08 * scale).toFixed(3)})`);
      root.style.setProperty('--shadow-lg', `0 12px 40px rgba(44,36,22,${(0.12 * scale).toFixed(3)})`);
      root.style.setProperty('--input-shadow-focus',
        `0 1px 3px rgba(44,36,22,${(0.08 * scale).toFixed(3)}), 0 6px 24px color-mix(in srgb, var(--search-focus-stroke) ${(10 * scale).toFixed(1)}%, transparent)`);
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

  const SUGGESTION_ORIGINS = [
    'https://suggestqueries.google.com/*',
    'https://www.baidu.com/*',
    'https://api.bing.com/*',
    'https://duckduckgo.com/*',
  ];

  async function handleSuggestionsToggle() {
    if (settings.enableSuggestions) {
      settings.enableSuggestions = false;
      saveSettingsNow();
      applySuggestions();
      syncUISuggestions();
      try { await chrome.permissions.remove({ origins: SUGGESTION_ORIGINS }); } catch (_) {}
    } else {
      try {
        const granted = await chrome.permissions.request({ origins: SUGGESTION_ORIGINS });
        if (granted) {
          settings.enableSuggestions = true;
          saveSettingsNow();
          applySuggestions();
        }
      } catch (_) {}
      syncUISuggestions();
    }
  }

  function applySuggestions() {
    document.body.dataset.suggestionsEnabled = settings.enableSuggestions ? 'true' : 'false';
  }

  function syncUISuggestions() {
    if (!suggestionsToggle) return;
    suggestionsToggle.dataset.enabled = settings.enableSuggestions ? 'true' : 'false';
    suggestionsToggle.setAttribute('aria-pressed', String(settings.enableSuggestions));
    const t = (key) => (window.__i18n && window.__i18n.t(key)) || key;
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

  function createOverlay() {
    settingsOverlay = document.createElement('div');
    settingsOverlay.className = 'panel-overlay';
    settingsOverlay.setAttribute('aria-hidden', 'true');
    settingsOverlay.setAttribute('hidden', '');
    document.body.appendChild(settingsOverlay);
    settingsOverlay.addEventListener('click', closePanel);
  }

  function closeWallpaperAddMenu(restoreFocus = false) {
    if (!wallpaperAddMenu || !wallpaperAddBtn) return;
    wallpaperAddMenu.hidden = true;
    wallpaperAddBtn.setAttribute('aria-expanded', 'false');
    if (restoreFocus && !wallpaperAddBtn.disabled) wallpaperAddBtn.focus();
  }

  function openWallpaperAddMenu(focusIndex = 0) {
    if (!wallpaperAddMenu || !wallpaperAddBtn || wallpaperAddBtn.disabled) return;
    wallpaperAddMenu.hidden = false;
    wallpaperAddBtn.setAttribute('aria-expanded', 'true');
    const items = getFocusableElements(wallpaperAddMenu);
    const target = items[Math.max(0, Math.min(focusIndex, items.length - 1))];
    if (target) target.focus();
  }

  function setWallpaperSubView(view, focusTab = false) {
    const nextView = view === 'preferences' ? 'preferences' : 'library';
    if (wallpaperSubView !== nextView) setWallpaperSelectionMode(false);
    wallpaperSubView = nextView;
    closeWallpaperAddMenu(false);
    if (wallpaperLibraryPanel) wallpaperLibraryPanel.hidden = nextView !== 'library';
    if (wallpaperPreferencesPanel) wallpaperPreferencesPanel.hidden = nextView !== 'preferences';
    if (wallpaperTabs) {
      wallpaperTabs.querySelectorAll('[role="tab"]').forEach((tab) => {
        const selected = tab.dataset.wallpaperTab === nextView;
        tab.classList.toggle('active', selected);
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
        if (selected && focusTab) tab.focus();
      });
    }
    if (wallpaperSettingsView) wallpaperSettingsView.scrollTop = 0;
  }

  function setSettingsView(view) {
    settingsPanelView = view === 'wallpaper' ? 'wallpaper' : 'main';
    panel.scrollTop = 0;
    const isWallpaperView = settingsPanelView === 'wallpaper';
    if (!isWallpaperView) {
      setWallpaperSelectionMode(false);
      closeWallpaperAddMenu(false);
    }
    if (mainSettingsView) mainSettingsView.hidden = isWallpaperView;
    if (wallpaperSettingsView) wallpaperSettingsView.hidden = !isWallpaperView;
    if (backBtn) backBtn.hidden = !isWallpaperView;
    if (panelTitle) {
      panelTitle.textContent = isWallpaperView ? t('settings.wallpaperSettings') : t('settings.title');
    }
    if (isWallpaperView) {
      setWallpaperSubView('library');
      syncUI();
    }
    const activeView = isWallpaperView ? wallpaperSettingsView : mainSettingsView;
    if (activeView) activeView.scrollTop = 0;
  }

  function openPanel(returnFocus = document.activeElement) {
    cancelPendingHide(panel);
    lastFocusedBeforePanel = returnFocus;
    panel.classList.remove('is-closing');
    if (settingsOverlay) settingsOverlay.classList.remove('is-closing');
    panel.removeAttribute('hidden');
    if (settingsOverlay) settingsOverlay.removeAttribute('hidden');
    setPageInert(true);
    setSettingsView('main');
    syncUI();
    requestAnimationFrame(() => {
      panel.classList.add('is-open');
      if (settingsOverlay) settingsOverlay.classList.add('is-open');
      closeBtn.focus();
    });
  }

  function closePanel() {
    if (panel.hasAttribute('hidden')) return;
    setWallpaperSelectionMode(false);
    closeWallpaperAddMenu(false);
    panel.classList.add('is-closing');
    panel.classList.remove('is-open');
    if (settingsOverlay) {
      settingsOverlay.classList.add('is-closing');
      settingsOverlay.classList.remove('is-open');
    }
    const timeout = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 170 : 270;
    hideAfterTransition(panel, timeout, () => {
      panel.setAttribute('hidden', '');
      panel.classList.remove('is-closing');
      if (settingsOverlay) {
        settingsOverlay.setAttribute('hidden', '');
        settingsOverlay.classList.remove('is-closing');
      }
      setSettingsView('main');
      setPageInert(false);
      focusWhenAvailable(lastFocusedBeforePanel, settingsBtn);
    });
  }

  function openAbout() {
    cancelPendingHide(aboutPanel);
    aboutReturnFocus = document.activeElement;
    panel.inert = true;
    aboutPanel.classList.remove('is-closing');
    if (aboutOverlay) aboutOverlay.classList.remove('is-closing');
    aboutPanel.removeAttribute('hidden');
    if (aboutOverlay) aboutOverlay.removeAttribute('hidden');
    requestAnimationFrame(() => {
      aboutPanel.classList.add('is-open');
      if (aboutOverlay) aboutOverlay.classList.add('is-open');
      aboutClose.focus();
    });
  }

  function closeAbout() {
    if (aboutPanel.hasAttribute('hidden')) return;
    aboutPanel.classList.add('is-closing');
    aboutPanel.classList.remove('is-open');
    if (aboutOverlay) {
      aboutOverlay.classList.add('is-closing');
      aboutOverlay.classList.remove('is-open');
    }
    const timeout = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 170 : 230;
    hideAfterTransition(aboutPanel, timeout, () => {
      aboutPanel.setAttribute('hidden', '');
      aboutPanel.classList.remove('is-closing');
      if (aboutOverlay) {
        aboutOverlay.setAttribute('hidden', '');
        aboutOverlay.classList.remove('is-closing');
      }
      panel.inert = false;
      focusWhenAvailable(aboutReturnFocus, aboutBtn);
    });
  }

  function openWallpaperDeleteConfirm(ids, returnFocus = document.activeElement) {
    const validIds = Array.from(new Set(ids)).filter((id) => settings.wallpapers.some((item) => item.id === id));
    if (!validIds.length || wallpaperDeleteInProgress) return;
    cancelPendingHide(wallpaperConfirmDialog);
    pendingWallpaperDeleteIds = validIds;
    wallpaperDeleteReturnFocus = returnFocus;
    panel.inert = true;
    wallpaperConfirmTitle.textContent = t('wallpaper.confirmDeleteTitle');
    wallpaperConfirmMessage.textContent = t('wallpaper.confirmDeleteMessage', { count: validIds.length });
    wallpaperConfirmSubmit.textContent = t('wallpaper.confirmDeleteSubmit');
    wallpaperConfirmCancel.disabled = false;
    wallpaperConfirmSubmit.disabled = false;
    wallpaperConfirmDialog.classList.remove('is-closing');
    wallpaperConfirmOverlay.classList.remove('is-closing');
    wallpaperConfirmDialog.removeAttribute('hidden');
    wallpaperConfirmOverlay.removeAttribute('hidden');
    requestAnimationFrame(() => {
      wallpaperConfirmDialog.classList.add('is-open');
      wallpaperConfirmOverlay.classList.add('is-open');
      wallpaperConfirmCancel.focus();
    });
  }

  function closeWallpaperDeleteConfirm(restoreFocus = true) {
    if (wallpaperConfirmDialog.hasAttribute('hidden') || wallpaperDeleteInProgress) return;
    wallpaperConfirmDialog.classList.add('is-closing');
    wallpaperConfirmDialog.classList.remove('is-open');
    wallpaperConfirmOverlay.classList.add('is-closing');
    wallpaperConfirmOverlay.classList.remove('is-open');
    const timeout = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 170 : 230;
    hideAfterTransition(wallpaperConfirmDialog, timeout, () => {
      wallpaperConfirmDialog.setAttribute('hidden', '');
      wallpaperConfirmOverlay.setAttribute('hidden', '');
      wallpaperConfirmDialog.classList.remove('is-closing');
      wallpaperConfirmOverlay.classList.remove('is-closing');
      panel.inert = false;
      pendingWallpaperDeleteIds = [];
      if (restoreFocus) focusWhenAvailable(wallpaperDeleteReturnFocus, wallpaperAddBtn);
      wallpaperDeleteReturnFocus = null;
    });
  }

  function syncUI() {
    const isDark = effectiveThemeIsDark();
    const hasWallpapers = settings.wallpapers.length > 0;
    const wallpaperModeOption = modeToggle.querySelector('[data-mode="wallpaper"]');
    if (wallpaperModeOption) {
      wallpaperModeOption.disabled = !hasWallpapers;
      wallpaperModeOption.setAttribute('aria-disabled', String(!hasWallpapers));
    }
    if (wallpaperModeHint) wallpaperModeHint.hidden = hasWallpapers;

    syncRadioOptions(modeToggle, '.mode-option', 'mode', settings.bgMode);

    colorSection.hidden = (settings.bgMode !== 'color');
    colorSection.classList.toggle('disabled', isDark);
    colorSection.setAttribute('aria-disabled', String(isDark));
    colorSection.querySelectorAll('button, input').forEach((control) => {
      control.disabled = isDark;
    });
    if (isDark) {
      colorSection.setAttribute('data-hint', (window.__i18n && window.__i18n.t('hint.darkColorDisabled')) || '仅在浅色模式下可用');
    } else {
      colorSection.removeAttribute('data-hint');
    }
    wallpaperSection.hidden = false;
    themeSection.hidden = (settings.bgMode === 'wallpaper');

    colorPresets.querySelectorAll('.color-swatch').forEach((swatch) => {
      const selected = swatch.dataset.color === settings.bgColor;
      swatch.classList.toggle('active', selected);
      swatch.setAttribute('aria-pressed', String(selected));
    });

    const color = settings.bgColor || '#F5F5DC';
    customColorPicker.value = color;
    customColorHex.value = settings.bgColor || '';
    syncColorQualityWarning();

    renderWallpaperGallery();
    syncWallpaperControls();
    updateWallpaperSummary();

    const currentTheme = window.__theme ? window.__theme.get() : 'auto';
    syncRadioOptions(themeOptions, '.theme-option', 'theme', currentTheme);
    shadowSlider.value = settings.shadowStrength;
    shadowValue.textContent = settings.shadowStrength;

    overlaySlider.value = settings.overlayStrength;
    overlayValue.textContent = `${settings.overlayStrength}%`;

    syncRadioOptions(fontOptions, '.font-option', 'font', settings.font);
    syncRadioOptions(radiusOptions, '.theme-option', 'radius', settings.radius);

    const btnPosOptions = document.getElementById('settings-btn-position-options');
    if (btnPosOptions) {
      syncRadioOptions(btnPosOptions, '.theme-option', 'position', settings.settingsBtnPosition);
    }

    tabTitleInput.value = settings.tabTitle || '';

    syncUISuggestions();
  }

  function syncWallpaperControls() {
    reconcileWallpaperState();
    const canUseRotation = hasEnoughWallpapersForRotation();
    const wallpaperCount = settings.wallpapers.length;
    const allSelected = wallpaperCount > 0 && selectedWallpaperIds.size === wallpaperCount;
    if (wallpaperReadabilityToggle) {
      wallpaperReadabilityToggle.checked = settings.wallpaperReadability;
    }
    if (wallpaperSurfaceModeOptions) {
      syncRadioOptions(wallpaperSurfaceModeOptions, '.theme-option', 'surfaceMode', settings.wallpaperSurfaceMode);
    }
    if (wallpaperRotationOptions) {
      wallpaperRotationOptions.querySelectorAll('.theme-option').forEach((opt) => {
        const disabled = opt.dataset.rotation !== 'off' && !canUseRotation;
        opt.disabled = disabled;
      });
      syncRadioOptions(wallpaperRotationOptions, '.theme-option', 'rotation', settings.wallpaperRotation);
    }
    if (wallpaperRotationModeOptions) {
      const enabled = canUseRotation && settings.wallpaperRotation !== 'off';
      wallpaperRotationModeOptions.querySelectorAll('.theme-option').forEach((opt) => {
        opt.disabled = !enabled;
      });
      syncRadioOptions(wallpaperRotationModeOptions, '.theme-option', 'rotationMode', settings.wallpaperRotationMode);
    }
    if (wallpaperSelectModeBtn) {
      wallpaperSelectModeBtn.disabled = !wallpaperCount || wallpaperImportInProgress;
      wallpaperSelectModeBtn.hidden = wallpaperSelectionMode;
      wallpaperSelectModeBtn.textContent = t('settings.wallpaperSelect');
    }
    if (wallpaperLibraryCount) {
      wallpaperLibraryCount.textContent = t('settings.wallpaperCount', { count: wallpaperCount });
    }
    if (wallpaperAddBtn) {
      wallpaperAddBtn.disabled = wallpaperImportInProgress || wallpaperSelectionMode;
    }
    if (wallpaperAddLabel) {
      wallpaperAddLabel.textContent = wallpaperImportInProgress
        ? t('settings.wallpaperImporting', wallpaperImportProgress)
        : t('settings.addWallpaper');
    }
    [wallpaperPhotoBtn, wallpaperFolderBtn].forEach((button) => {
      if (button) button.disabled = wallpaperImportInProgress;
    });
    const libraryActions = wallpaperAddBtn ? wallpaperAddBtn.closest('.wallpaper-library-actions') : null;
    if (libraryActions) libraryActions.hidden = wallpaperSelectionMode;
    if (wallpaperManageToolbar) wallpaperManageToolbar.hidden = !wallpaperSelectionMode;
    if (wallpaperSelectedCount) {
      wallpaperSelectedCount.textContent = t('settings.wallpaperSelectedCount', { count: selectedWallpaperIds.size });
    }
    if (wallpaperSelectAllBtn) {
      wallpaperSelectAllBtn.disabled = !wallpaperSelectionMode || wallpaperImportInProgress || wallpaperDeleteInProgress;
      wallpaperSelectAllBtn.textContent = t(allSelected ? 'settings.wallpaperUnselectAll' : 'settings.wallpaperSelectAll');
    }
    if (wallpaperDeleteSelectedBtn) {
      wallpaperDeleteSelectedBtn.disabled = selectedWallpaperIds.size === 0 || wallpaperImportInProgress || wallpaperDeleteInProgress;
    }
    if (wallpaperManageDoneBtn) {
      wallpaperManageDoneBtn.disabled = wallpaperImportInProgress || wallpaperDeleteInProgress;
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

  function renderWallpaperGallery() {
    wallpaperGallery.innerHTML = '';
    wallpaperGallery.classList.toggle('selecting', wallpaperSelectionMode);
    if (!settings.wallpapers.length) {
      const empty = document.createElement('div');
      empty.className = 'wallpaper-empty';
      empty.textContent = t('wallpaper.empty');
      wallpaperGallery.appendChild(empty);
      return;
    }
    settings.wallpapers.forEach((w, index) => {
      const thumb = document.createElement('div');
      thumb.className = 'wallpaper-thumb'
        + (w.id === settings.activeWallpaperId ? ' active' : '')
        + (selectedWallpaperIds.has(w.id) ? ' selected' : '');
      thumb.dataset.id = w.id;
      thumb.setAttribute('role', 'listitem');

      const mainButton = document.createElement('button');
      mainButton.className = 'wallpaper-thumb-main';
      mainButton.type = 'button';
      mainButton.dataset.wallpaperAction = 'activate';
      const pressed = wallpaperSelectionMode
        ? selectedWallpaperIds.has(w.id)
        : w.id === settings.activeWallpaperId;
      mainButton.setAttribute('aria-pressed', String(pressed));
      const selectionLabel = selectedWallpaperIds.has(w.id) ? 'wallpaper.unselect' : 'wallpaper.select';
      mainButton.setAttribute('aria-label', t(wallpaperSelectionMode ? selectionLabel : 'wallpaper.use', { name: w.name }));

      const visual = document.createElement('span');
      visual.className = 'wallpaper-thumb-visual';

      const img = document.createElement('img');
      img.alt = '';
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

      const selectedMark = document.createElement('input');
      selectedMark.type = 'checkbox';
      selectedMark.className = 'wallpaper-thumb-select';
      selectedMark.checked = selectedWallpaperIds.has(w.id);
      selectedMark.tabIndex = -1;
      selectedMark.setAttribute('aria-hidden', 'true');

      const reorderHandle = document.createElement('button');
      reorderHandle.className = 'wallpaper-reorder-handle';
      reorderHandle.type = 'button';
      reorderHandle.dataset.wallpaperAction = 'reorder';
      reorderHandle.draggable = wallpaperSelectionMode;
      const reorderHandleLabel = document.createElement('span');
      reorderHandleLabel.className = 'wallpaper-reorder-handle-label';
      reorderHandleLabel.textContent = t('wallpaper.reorderHandle');
      reorderHandle.appendChild(reorderHandleLabel);
      reorderHandle.setAttribute('aria-label', t('wallpaper.reorder', {
        name: w.name,
        position: index + 1,
        total: settings.wallpapers.length,
      }));

      visual.prepend(img);
      mainButton.append(visual, name);
      thumb.append(mainButton, selectedMark, reorderHandle);
      wallpaperGallery.appendChild(thumb);
    });
  }

  async function removeWallpapers(ids) {
    const requestedIds = new Set(ids);
    const originalWallpapers = [...settings.wallpapers];
    const requestedWallpapers = originalWallpapers.filter((item) => requestedIds.has(item.id));
    const removedIds = new Set();
    let failedCount = 0;

    for (const item of requestedWallpapers) {
      try {
        if (wallpaperAssets) {
          await wallpaperAssets.remove(item.id);
        } else if (!item.data) {
          throw new Error('Wallpaper storage is unavailable');
        }
        removedIds.add(item.id);
      } catch (_) {
        failedCount += 1;
      }
    }

    if (!removedIds.size) {
      return { deletedCount: 0, failedCount };
    }

    const activeIndex = originalWallpapers.findIndex((item) => item.id === settings.activeWallpaperId);
    const activeWasRemoved = removedIds.has(settings.activeWallpaperId);
    settings.wallpapers = originalWallpapers.filter((item) => !removedIds.has(item.id));
    removedIds.forEach((id) => selectedWallpaperIds.delete(id));

    if (activeWasRemoved) {
      const next = originalWallpapers.slice(activeIndex + 1).find((item) => !removedIds.has(item.id));
      const previous = originalWallpapers.slice(0, activeIndex).reverse().find((item) => !removedIds.has(item.id));
      settings.activeWallpaperId = (next || previous || {}).id || '';
    }

    if (!settings.wallpapers.length) {
      wallpaperSelectionMode = false;
      selectedWallpaperIds.clear();
      settings.activeWallpaperId = '';
      settings.bgMode = 'color';
      settings.wallpaperRotation = 'off';
      settings.lastWallpaperRotationAt = Date.now();
    }

    reconcileWallpaperState();
    saveSettingsNow();
    applyBackground();
    syncUI();
    scheduleWallpaperRotation();
    return { deletedCount: removedIds.size, failedCount };
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
      if (mark) mark.checked = selectedWallpaperIds.has(id);
      const mainButton = thumb.querySelector('.wallpaper-thumb-main');
      if (mainButton) {
        const wallpaper = settings.wallpapers.find((item) => item.id === id);
        mainButton.setAttribute('aria-pressed', String(selectedWallpaperIds.has(id)));
        if (wallpaper) {
          mainButton.setAttribute('aria-label', t(selectedWallpaperIds.has(id) ? 'wallpaper.unselect' : 'wallpaper.select', { name: wallpaper.name }));
        }
      }
    }
    syncWallpaperControls();
  }

  function setWallpaperSelectionMode(enabled) {
    wallpaperSelectionMode = Boolean(enabled && settings.wallpapers.length > 0 && !wallpaperImportInProgress);
    selectedWallpaperIds.clear();
    closeWallpaperAddMenu(false);
    renderWallpaperGallery();
    syncWallpaperControls();
  }

  function announceWallpaperPosition(id, position) {
    if (!wallpaperReorderStatus) return;
    const wallpaper = settings.wallpapers.find((item) => item.id === id);
    if (!wallpaper) return;
    wallpaperReorderStatus.textContent = '';
    requestAnimationFrame(() => {
      wallpaperReorderStatus.textContent = t('wallpaper.reorderPosition', {
        name: wallpaper.name,
        position: position + 1,
        total: settings.wallpapers.length,
      });
    });
  }

  function focusWallpaperHandleAfterRender(id) {
    requestAnimationFrame(() => {
      const handle = wallpaperGallery.querySelector(`.wallpaper-thumb[data-id="${CSS.escape(id)}"] .wallpaper-reorder-handle`);
      if (handle) handle.focus();
    });
  }

  function reorderWallpaperToIndex(id, targetIndex, restoreHandleFocus = false) {
    const from = settings.wallpapers.findIndex((item) => item.id === id);
    if (from < 0) return from;
    const to = Math.max(0, Math.min(targetIndex, settings.wallpapers.length - 1));
    if (from === to) return from;
    const [item] = settings.wallpapers.splice(from, 1);
    settings.wallpapers.splice(to, 0, item);
    saveSettingsNow();
    renderWallpaperGallery();
    scheduleWallpaperRotation();
    announceWallpaperPosition(id, to);
    if (restoreHandleFocus) focusWallpaperHandleAfterRender(id);
    return to;
  }

  function reorderWallpaperAtBoundary(id, boundaryIndex) {
    const from = settings.wallpapers.findIndex((item) => item.id === id);
    if (from < 0) return from;
    let target = Math.max(0, Math.min(boundaryIndex, settings.wallpapers.length));
    if (from < target) target -= 1;
    return reorderWallpaperToIndex(id, target, false);
  }

  function clearWallpaperDragIndicators() {
    wallpaperGallery.querySelectorAll('.dragging, .drag-before, .drag-after').forEach((thumb) => {
      thumb.classList.remove('dragging', 'drag-before', 'drag-after');
    });
    draggedWallpaperBoundary = -1;
  }

  async function executeWallpaperDelete() {
    if (wallpaperDeleteInProgress || !pendingWallpaperDeleteIds.length) return;
    wallpaperDeleteInProgress = true;
    wallpaperConfirmCancel.disabled = true;
    wallpaperConfirmSubmit.disabled = true;
    wallpaperConfirmSubmit.textContent = t('wallpaper.deleting');
    syncWallpaperControls();
    const result = await removeWallpapers(pendingWallpaperDeleteIds);
    wallpaperDeleteInProgress = false;
    selectedWallpaperIds.clear();
    if (settings.wallpapers.length) {
      wallpaperSelectionMode = true;
    } else {
      wallpaperSelectionMode = false;
    }
    renderWallpaperGallery();
    syncWallpaperControls();
    wallpaperConfirmCancel.disabled = false;
    wallpaperConfirmSubmit.disabled = false;
    closeWallpaperDeleteConfirm(true);
    showToast(t('toast.wallpaperDeleteResult', {
      deleted: result.deletedCount,
      failed: result.failedCount,
    }));
  }


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

  themeOptions.addEventListener('click', (e) => {
    const opt = e.target.closest('.theme-option');
    if (!opt) return;
    if (themeSection.hidden) return;
    if (window.__theme) window.__theme.set(opt.dataset.theme);
    applyBackground();
    syncUI();
  });

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

  customColorPicker.addEventListener('input', () => {
    settings.bgMode = 'color';
    settings.bgColor = customColorPicker.value;
    customColorHex.value = settings.bgColor;
    saveSettings();
    applyBackground();
    scheduleWallpaperRotation();
    syncUI();
  });

  customColorHex.addEventListener('input', () => {
    const val = customColorHex.value.trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(val)) return;
    const normalized = val.toLowerCase();
    if (normalized === settings.bgColor) return;
    settings.bgMode = 'color';
    settings.bgColor = normalized;
    customColorPicker.value = normalized;
    saveSettings();
    applyBackground();
    scheduleWallpaperRotation();
    syncUI();
  });

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

  if (useSuggestedColor) {
    useSuggestedColor.addEventListener('click', () => {
      const suggested = useSuggestedColor.dataset.color;
      if (!/^#[0-9a-fA-F]{6}$/.test(suggested)) return;
      settings.bgMode = 'color';
      settings.bgColor = suggested.toLowerCase();
      customColorPicker.value = settings.bgColor;
      customColorHex.value = settings.bgColor;
      saveSettings();
      applyBackground();
      scheduleWallpaperRotation();
      syncUI();
    });
  }

  function isWallpaperFile(file) {
    return /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(file.name) || /^image\//i.test(file.type || '');
  }

  function normalizedWallpaperName(name) {
    return String(name || '').trim().toLocaleLowerCase();
  }

  async function importWallpaperFiles(fileList, source) {
    if (wallpaperImportInProgress) return;
    const selectedFiles = Array.from(fileList || []);
    if (!selectedFiles.length) return;

    const naturalSort = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
    let files = selectedFiles.filter(isWallpaperFile);
    if (source === 'folder') {
      files = files.sort((a, b) => naturalSort.compare(a.webkitRelativePath || a.name, b.webkitRelativePath || b.name));
    }

    const wasEmpty = settings.wallpapers.length === 0;
    const previousActiveId = settings.activeWallpaperId;
    const previousBgMode = settings.bgMode;
    const singlePhotoImport = source === 'photo' && files.length === 1;
    const existingNames = new Set(settings.wallpapers.map((item) => normalizedWallpaperName(item.name)));
    const addedIds = [];
    let skipped = selectedFiles.length - files.length;
    let failed = 0;

    wallpaperImportInProgress = true;
    wallpaperImportProgress = { current: 0, total: files.length };
    closeWallpaperAddMenu(false);
    syncWallpaperControls();

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      wallpaperImportProgress = { current: index + 1, total: files.length };
      syncWallpaperControls();
      const normalizedName = normalizedWallpaperName(file.name);
      if (existingNames.has(normalizedName)) {
        skipped += 1;
        continue;
      }
      try {
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        });
        if (!dataUrl) throw new Error('Failed to read wallpaper');
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
          createdAt: Date.now() + index,
        });
        settings.wallpapers.push(meta);
        existingNames.add(normalizedName);
        addedIds.push(meta.id);
      } catch (_) {
        failed += 1;
      }
    }

    if (addedIds.length) {
      const shouldActivateImported = wasEmpty || (singlePhotoImport && addedIds.length === 1);
      if (shouldActivateImported) {
        settings.activeWallpaperId = addedIds[0];
        settings.bgMode = 'wallpaper';
        resetWallpaperRotationClock();
      } else {
        settings.activeWallpaperId = settings.wallpapers.some((item) => item.id === previousActiveId)
          ? previousActiveId
          : settings.wallpapers[0].id;
        settings.bgMode = previousBgMode;
      }
      saveSettingsNow();
      applyBackground();
      scheduleWallpaperRotation();
    }

    wallpaperImportInProgress = false;
    wallpaperImportProgress = { current: 0, total: 0 };
    syncUI();
    showToast(t('toast.wallpaperImportResult', {
      added: addedIds.length,
      skipped,
      failed,
    }));
  }

  wallpaperAddBtn.addEventListener('click', () => {
    if (wallpaperAddMenu.hidden) openWallpaperAddMenu(0);
    else closeWallpaperAddMenu(true);
  });

  wallpaperAddBtn.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      openWallpaperAddMenu(0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      openWallpaperAddMenu(getFocusableElements(wallpaperAddMenu).length - 1);
    }
  });

  wallpaperAddMenu.addEventListener('keydown', (event) => {
    const items = getFocusableElements(wallpaperAddMenu);
    const currentIndex = items.indexOf(document.activeElement);
    let nextIndex = currentIndex;
    if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % items.length;
    else if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + items.length) % items.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = items.length - 1;
    else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeWallpaperAddMenu(true);
      return;
    } else if (event.key === 'Tab') {
      closeWallpaperAddMenu(false);
      return;
    } else {
      return;
    }
    event.preventDefault();
    if (items[nextIndex]) items[nextIndex].focus();
  });

  wallpaperPhotoBtn.addEventListener('click', () => {
    closeWallpaperAddMenu(true);
    wallpaperPhotoInput.click();
  });

  wallpaperPhotoInput.addEventListener('change', async () => {
    const files = wallpaperPhotoInput.files;
    if (files && files.length) await importWallpaperFiles(files, 'photo');
    wallpaperPhotoInput.value = '';
    focusWhenAvailable(wallpaperAddBtn, wallpaperSelectModeBtn);
  });

  wallpaperFolderBtn.addEventListener('click', () => {
    closeWallpaperAddMenu(true);
    wallpaperFolderInput.click();
  });

  wallpaperFolderInput.addEventListener('change', async () => {
    const files = wallpaperFolderInput.files;
    if (files && files.length) await importWallpaperFiles(files, 'folder');
    wallpaperFolderInput.value = '';
    focusWhenAvailable(wallpaperAddBtn, wallpaperSelectModeBtn);
  });

  document.addEventListener('pointerdown', (event) => {
    if (!wallpaperAddMenu.hidden && !event.target.closest('.wallpaper-add-menu-wrap')) {
      closeWallpaperAddMenu(false);
    }
  });

  wallpaperGallery.addEventListener('click', (e) => {
    const thumb = e.target.closest('.wallpaper-thumb');
    if (!thumb) return;
    const id = thumb.dataset.id;
    const action = e.target.closest('[data-wallpaper-action]')?.dataset.wallpaperAction;

    if (action !== 'activate') return;

    if (wallpaperSelectionMode) {
      toggleWallpaperSelection(id);
      return;
    }

    settings.activeWallpaperId = id;
    settings.bgMode = 'wallpaper';
    resetWallpaperRotationClock();
    saveSettingsNow();
    applyBackground();
    syncUI();
  });

  wallpaperGallery.addEventListener('keydown', (event) => {
    const handle = event.target.closest('.wallpaper-reorder-handle');
    if (!handle || !wallpaperSelectionMode) return;
    const thumb = handle.closest('.wallpaper-thumb');
    const id = thumb ? thumb.dataset.id : '';
    const from = settings.wallpapers.findIndex((item) => item.id === id);
    if (from < 0) return;
    let target = from;
    if (['ArrowLeft', 'ArrowUp'].includes(event.key)) target = Math.max(0, from - 1);
    else if (['ArrowRight', 'ArrowDown'].includes(event.key)) target = Math.min(settings.wallpapers.length - 1, from + 1);
    else if (event.key === 'Home') target = 0;
    else if (event.key === 'End') target = settings.wallpapers.length - 1;
    else return;
    event.preventDefault();
    reorderWallpaperToIndex(id, target, true);
  });

  wallpaperGallery.addEventListener('dragstart', (e) => {
    const handle = e.target.closest('.wallpaper-reorder-handle');
    const thumb = handle ? handle.closest('.wallpaper-thumb') : null;
    if (!thumb || !wallpaperSelectionMode || wallpaperImportInProgress) {
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
    wallpaperGallery.querySelectorAll('.drag-before, .drag-after').forEach((item) => item.classList.remove('drag-before', 'drag-after'));
    const rect = thumb.getBoundingClientRect();
    const columns = getComputedStyle(wallpaperGallery).gridTemplateColumns.split(/\s+/).length;
    const after = columns === 1 ? e.clientY >= rect.top + rect.height / 2 : e.clientX >= rect.left + rect.width / 2;
    thumb.classList.add(after ? 'drag-after' : 'drag-before');
    const targetIndex = settings.wallpapers.findIndex((item) => item.id === thumb.dataset.id);
    draggedWallpaperBoundary = targetIndex + (after ? 1 : 0);
    e.dataTransfer.dropEffect = 'move';
  });

  wallpaperGallery.addEventListener('dragleave', (e) => {
    const thumb = e.target.closest('.wallpaper-thumb');
    if (thumb && !thumb.contains(e.relatedTarget)) thumb.classList.remove('drag-before', 'drag-after');
  });

  wallpaperGallery.addEventListener('drop', (e) => {
    if (!draggedWallpaperId || draggedWallpaperBoundary < 0) return;
    e.preventDefault();
    const movedId = draggedWallpaperId;
    const boundary = draggedWallpaperBoundary;
    draggedWallpaperId = '';
    clearWallpaperDragIndicators();
    reorderWallpaperAtBoundary(movedId, boundary);
  });

  wallpaperGallery.addEventListener('dragend', () => {
    draggedWallpaperId = '';
    clearWallpaperDragIndicators();
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
      setWallpaperSelectionMode(true);
    });
  }

  if (wallpaperSelectAllBtn) {
    wallpaperSelectAllBtn.addEventListener('click', () => {
      const allSelected = settings.wallpapers.length > 0 && selectedWallpaperIds.size === settings.wallpapers.length;
      selectedWallpaperIds.clear();
      if (!allSelected) settings.wallpapers.forEach((item) => selectedWallpaperIds.add(item.id));
      renderWallpaperGallery();
      syncWallpaperControls();
    });
  }

  if (wallpaperDeleteSelectedBtn) {
    wallpaperDeleteSelectedBtn.addEventListener('click', () => {
      openWallpaperDeleteConfirm(Array.from(selectedWallpaperIds), wallpaperDeleteSelectedBtn);
    });
  }

  if (wallpaperManageDoneBtn) {
    wallpaperManageDoneBtn.addEventListener('click', () => {
      setWallpaperSelectionMode(false);
      focusWhenAvailable(wallpaperSelectModeBtn, wallpaperAddBtn);
    });
  }

  if (wallpaperTabs) {
    wallpaperTabs.addEventListener('click', (event) => {
      const tab = event.target.closest('[role="tab"]');
      if (tab) setWallpaperSubView(tab.dataset.wallpaperTab, false);
    });
    wallpaperTabs.addEventListener('keydown', (event) => {
      const tabs = Array.from(wallpaperTabs.querySelectorAll('[role="tab"]'));
      const currentIndex = tabs.indexOf(event.target.closest('[role="tab"]'));
      if (currentIndex < 0) return;
      let nextIndex = currentIndex;
      if (['ArrowRight', 'ArrowDown'].includes(event.key)) nextIndex = (currentIndex + 1) % tabs.length;
      else if (['ArrowLeft', 'ArrowUp'].includes(event.key)) nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = tabs.length - 1;
      else return;
      event.preventDefault();
      setWallpaperSubView(tabs[nextIndex].dataset.wallpaperTab, true);
    });
  }

  wallpaperConfirmCancel.addEventListener('click', () => closeWallpaperDeleteConfirm(true));
  wallpaperConfirmSubmit.addEventListener('click', executeWallpaperDelete);
  wallpaperConfirmOverlay.addEventListener('click', () => closeWallpaperDeleteConfirm(true));

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

  shadowSlider.addEventListener('input', () => {
    settings.shadowStrength = parseInt(shadowSlider.value);
    shadowValue.textContent = settings.shadowStrength;
    applyShadowStrength();
    saveSettings();
  });

  overlaySlider.addEventListener('input', () => {
    settings.overlayStrength = parseInt(overlaySlider.value);
    overlayValue.textContent = `${settings.overlayStrength}%`;
    updateWallpaperPresentation();
    saveSettings();
  });

  tabTitleInput.addEventListener('input', () => {
    settings.tabTitle = tabTitleInput.value.trim();
    applyTabTitle();
    saveSettings();
  });

  if (suggestionsToggle) {
    suggestionsToggle.addEventListener('click', handleSuggestionsToggle);
  }

  document.addEventListener('keydown', (e) => {
    if (!wallpaperConfirmDialog.hasAttribute('hidden')) {
      trapFocus(e, wallpaperConfirmDialog);
    } else if (!aboutPanel.hasAttribute('hidden')) {
      trapFocus(e, aboutPanel);
    } else if (!panel.hasAttribute('hidden')) {
      trapFocus(e, panel);
    }
    if (e.key === 'Escape') {
      if (!wallpaperConfirmDialog.hasAttribute('hidden')) {
        closeWallpaperDeleteConfirm(true);
      } else if (!aboutPanel.hasAttribute('hidden')) {
        closeAbout();
      } else if (!wallpaperAddMenu.hidden) {
        closeWallpaperAddMenu(true);
      } else if (!panel.hasAttribute('hidden') && settingsPanelView === 'wallpaper' && wallpaperSelectionMode) {
        setWallpaperSelectionMode(false);
        focusWhenAvailable(wallpaperSelectModeBtn, wallpaperAddBtn);
      } else if (!panel.hasAttribute('hidden') && settingsPanelView === 'wallpaper') {
        setSettingsView('main');
        if (wallpaperOpenBtn && !wallpaperSection.hidden) wallpaperOpenBtn.focus();
      } else if (!panel.hasAttribute('hidden')) {
        closePanel();
      }
    }
  });

  loadSettings();
  const settingsReady = migrateWallpaperStorage().catch(() => {});

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

  const fontOptsContainer = document.getElementById('font-options');
  fontOptsContainer.addEventListener('click', (e) => {
    const opt = e.target.closest('.font-option');
    if (!opt) return;
    settings.font = opt.dataset.font;
    saveSettings();
    applyFont();
    syncUI();
  });

  radiusOptions.addEventListener('click', (e) => {
    const opt = e.target.closest('.theme-option');
    if (!opt) return;
    settings.radius = opt.dataset.radius;
    saveSettings();
    applyRadius();
    syncUI();
  });

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

  [
    [modeToggle, '.mode-option'],
    [themeOptions, '.theme-option'],
    [fontOptions, '.font-option'],
    [radiusOptions, '.theme-option'],
    [btnPosOptions, '.theme-option'],
    [wallpaperSurfaceModeOptions, '.theme-option'],
    [wallpaperRotationOptions, '.theme-option'],
    [wallpaperRotationModeOptions, '.theme-option'],
  ].forEach(([container, selector]) => enableRadioKeyboard(container, selector));

  createOverlay();
  settingsBtn.addEventListener('click', () => openPanel(settingsBtn));
  closeBtn.addEventListener('click', closePanel);

  aboutBtn.addEventListener('click', openAbout);
  aboutClose.addEventListener('click', closeAbout);
  if (aboutOverlay) aboutOverlay.addEventListener('click', closeAbout);

  const observer = new MutationObserver(() => {
    applyBackground();
    if (!panel.hasAttribute('hidden')) syncUI();
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-color-scheme'] });

  const engineIconObserver = new MutationObserver(() => {
    const active = settings.wallpapers.find((wallpaper) => wallpaper.id === settings.activeWallpaperId);
    if (settings.bgMode === 'wallpaper' && active && activeWallpaperData) {
      syncWallpaperSurfaceAnalysis(active.brightness ?? 0, active.complexity ?? 0);
    }
  });
  const engineToggle = document.getElementById('engine-toggle');
  if (engineToggle) engineIconObserver.observe(engineToggle, { childList: true, subtree: true });

  window.addEventListener('resize', () => {
    clearTimeout(resizeSyncTimer);
    resizeSyncTimer = setTimeout(() => {
      if (settings.bgMode === 'wallpaper') {
        updateWallpaperPresentation();
      }
    }, 150);
  });

  window.__settingsPanel = { open: openPanel };

  window.addEventListener('pagehide', () => {
    if (saveTimer) saveSettingsNow();
    clearTimeout(wallpaperRotationTimer);
    clearTimeout(resizeSyncTimer);
    engineIconObserver.disconnect();
  });

  settingsReady.finally(() => {
    applyAll();
  });
})();
