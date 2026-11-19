(() => {
  const preferences = window.__willowPreferences;
  const WALLPAPER_CONTROL_TARGET = 6.0;
  const WALLPAPER_TIME_TARGET = 6.0;
  const wallpaperPolicy = window.__willowWallpaperPolicy;

  const DEFAULTS = {
    bgMode: 'color',
    bgColor: window.__theme.defaultBackgroundColor,
    wallpapers: [],
    activeWallpaperId: '',
    font: 'serif',
    radius: window.__theme.defaultRadius,
    overlayStrength: 25,
    shadowStrength: 25,
    settingsBtnPosition: 'footer',
    tabTitle: '',
    showGreeting: true,
    wallpaperReadability: true,
    wallpaperSurfaceMode: 'light',
    wallpaperRotation: 'off',
    wallpaperRotationMode: 'sequence',
    lastWallpaperRotationAt: 0,
  };

  const FONT_STACKS = {
    serif: "Georgia, 'Times New Roman', 'Songti SC', 'SimSun', serif",
    system: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', 'PingFang SC', sans-serif",
    mono: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', 'Courier New', 'Microsoft YaHei', monospace",
  };

  const PRESET_COLORS = [
    { value: '#BFBB98', get label() { return (window.__i18n && window.__i18n.t('color.sage')) || '鼠尾草'; } },
    { value: '#E7E1D3', get label() { return (window.__i18n && window.__i18n.t('color.warmOat')) || '暖燕麦'; } },
    { value: '#C9D5CF', get label() { return (window.__i18n && window.__i18n.t('color.mistPine')) || '雾松绿'; } },
    { value: '#C8D4E3', get label() { return (window.__i18n && window.__i18n.t('color.mistBlue')) || '雾蓝'; } },
    { value: '#D7CEDC', get label() { return (window.__i18n && window.__i18n.t('color.softLavender')) || '柔雾紫'; } },
    { value: '#DDBFB2', get label() { return (window.__i18n && window.__i18n.t('color.softClay')) || '柔陶'; } },
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
  const customColorPreview = document.getElementById('custom-color-preview');
  const customColorHex = document.getElementById('custom-color-hex');
  const customColorHue = document.getElementById('custom-color-hue');
  const customColorHueValue = document.getElementById('custom-color-hue-value');
  const customColorChroma = document.getElementById('custom-color-chroma');
  const customColorChromaValue = document.getElementById('custom-color-chroma-value');
  const customColorLightness = document.getElementById('custom-color-lightness');
  const customColorLightnessValue = document.getElementById('custom-color-lightness-value');
  const customColorError = document.getElementById('custom-color-error');
  const themeSection = document.getElementById('theme-section');
  const themeOptions = document.getElementById('theme-options');
  const fontOptions = document.getElementById('font-options');
  const radiusOptions = document.getElementById('radius-options');
  const tabTitleInput = document.getElementById('tab-title-input');
  const greetingToggle = document.getElementById('greeting-toggle');
  const suggestionsToggle = document.getElementById('suggestions-toggle');
  const toastRegion = document.getElementById('toast-region');

  const aboutBtn = document.getElementById('about-btn');
  const aboutPanel = document.getElementById('about-panel');
  const aboutClose = document.getElementById('about-close');
  const aboutOverlay = document.getElementById('about-overlay');

  const wallpaperAssets = window.__wallpaperAssets;
  const thumbnailObserver = new IntersectionObserver((entries) => {
    for (const { isIntersecting, target: image } of entries) {
      if (!isIntersecting || !image.isConnected || !wallpaperLibraryVisible()) continue;
      thumbnailObserver.unobserve(image);
      wallpaperAssets.getThumbnail(image.dataset.wallpaperId).then((data) => {
        if (data && image.isConnected) image.src = data;
      }).catch(() => {});
    }
  });
  let settingsOverlay = null;
  const pendingSettings = new Map();
  let saveTimer = null;
  let libraryInitialization;
  let libraryRevision = 0;
  let toastHideTimer = null;
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
  let customColorMigrationNotice = '';
  let customColorHexInvalid = false;
  let customColorSliderState = null;
  const selectedWallpaperIds = new Set();
  const pendingHides = new Map();
  const pageRegions = [
    document.querySelector('.container'),
    document.querySelector('.actions-section'),
  ].filter(Boolean);

  const { ROTATION_INTERVALS } = wallpaperAssets;

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

  function normalizeLoadedCustomColor() {
    if (settings.bgColor === '') {
      settings.bgColor = DEFAULTS.bgColor;
      return true;
    }
    if (typeof settings.bgColor !== 'string') {
      settings.bgColor = DEFAULTS.bgColor;
      customColorMigrationNotice = 'notice.customColorReset';
      return true;
    }
    const colorApi = window.__willowColor;
    const inspection = colorApi && colorApi.inspectSolidBackground(settings.bgColor);
    if (!inspection || !inspection.valid) {
      settings.bgColor = DEFAULTS.bgColor;
      customColorMigrationNotice = 'notice.customColorReset';
      return true;
    }
    if (inspection.safe) return false;
    const constrained = colorApi.constrainSolidBackground(settings.bgColor);
    if (!constrained) {
      settings.bgColor = DEFAULTS.bgColor;
      customColorMigrationNotice = 'notice.customColorReset';
      return true;
    }
    settings.bgColor = constrained;
    customColorMigrationNotice = 'notice.customColorAdjusted';
    return true;
  }

  function loadSettings() {
    settings = { ...DEFAULTS, ...preferences.read(), ...wallpaperAssets.readStartupLibrary() };
    if (!['auto', 'light', 'dark'].includes(settings.wallpaperSurfaceMode)) settings.wallpaperSurfaceMode = 'light';
    if (normalizeLoadedCustomColor()) saveSetting('bgColor');
  }

  function ensureLibrary() {
    if (!libraryInitialization) {
      libraryInitialization = wallpaperAssets.initialize(t('wallpaper.oldWallpaper')).catch((error) => {
        libraryInitialization = undefined;
        throw error;
      });
    }
    return libraryInitialization;
  }

  function applyLibrary(state, render = true) {
    if (!state || state.revision <= libraryRevision) return;
    const previous = settings.wallpapers.find((item) => item.id === settings.activeWallpaperId);
    const active = state.wallpapers.find((item) => item.id === state.activeWallpaperId);
    const backgroundChanged = settings.bgMode !== state.bgMode || previous?.id !== active?.id
      || previous?.brightness !== active?.brightness || previous?.complexity !== active?.complexity;
    const { revision, ...snapshot } = state;
    libraryRevision = revision;
    Object.assign(settings, snapshot);
    reconcileWallpaperState();
    if (!render) return;
    if (backgroundChanged || (settings.bgMode === 'wallpaper' && active && !activeWallpaperData)) applyBackground();
    if (!panel.hidden) syncUI();
    scheduleWallpaperRotation();
  }

  async function refreshLibrary() {
    await ensureLibrary();
    applyLibrary(await wallpaperAssets.getLibrary());
  }

  async function updateLibrary(action, reportFailure = true) {
    try {
      await ensureLibrary();
      const result = await action();
      applyLibrary(result.state);
      return result;
    } catch (error) {
      console.error('Wallpaper library update failed', error);
      if (reportFailure) showToast(t('error.wallpaperStorageUnavailable'));
      return null;
    }
  }

  function showToast(message) {
    if (!toastRegion) return;
    clearTimeout(toastHideTimer);
    toastRegion.classList.remove('visible');
    toastRegion.textContent = '';
    requestAnimationFrame(() => {
      toastRegion.textContent = message;
      toastRegion.classList.add('visible');
    });
    toastHideTimer = setTimeout(() => {
      toastRegion.classList.remove('visible');
    }, 2500);
  }

  function saveSetting(field) {
    pendingSettings.set(field, settings[field]);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushSettings, 150);
  }

  function flushSettings() {
    clearTimeout(saveTimer);
    saveTimer = null;
    const entries = Array.from(pendingSettings);
    pendingSettings.clear();
    for (const [field, value] of entries) {
      try {
        preferences.write(field, value);
      } catch (error) {
        console.error('Preference update failed', error);
        showToast(t('error.settingsSaveFailed'));
      }
    }
  }

  function syncSavedPreferences(changedField) {
    if (changedField === 'enableSuggestions') return;
    const saved = preferences.read();
    const fields = changedField ? [changedField] : Object.keys(preferenceEffects);
    let changed = false;
    for (const field of fields) {
      if (!Object.hasOwn(preferenceEffects, field) || pendingSettings.has(field)) continue;
      const value = Object.hasOwn(saved, field) ? saved[field] : DEFAULTS[field];
      if (settings[field] === value) continue;
      settings[field] = value;
      preferenceEffects[field]();
      changed = true;
    }
    if (changed && !panel.hidden) syncUI();
  }

  const preferenceEffects = {
    bgColor() { normalizeLoadedCustomColor(); applyBackground(); },
    font: applyFont,
    radius: applyRadius,
    overlayStrength: updateWallpaperPresentation,
    shadowStrength: applyShadowStrength,
    settingsBtnPosition: applySettingsBtnPosition,
    tabTitle: applyTabTitle,
    showGreeting: updateWallpaperPresentation,
    wallpaperReadability: updateWallpaperPresentation,
    wallpaperSurfaceMode: updateWallpaperPresentation,
  };

  function hasEnoughWallpapersForRotation() {
    return settings.wallpapers.length >= 2;
  }

  function reconcileWallpaperState() {
    if (!settings.wallpapers.length) wallpaperSelectionMode = false;
    selectedWallpaperIds.forEach((id) => {
      if (!settings.wallpapers.some((item) => item.id === id)) selectedWallpaperIds.delete(id);
    });
  }

  function getRotationInterval() {
    return ROTATION_INTERVALS[settings.wallpaperRotation] || 0;
  }

  function canRotateWallpaper() {
    return settings.bgMode === 'wallpaper' && settings.activeWallpaperId && hasEnoughWallpapersForRotation() && getRotationInterval() > 0;
  }

  async function rotateWallpaperIfDue() {
    if (!canRotateWallpaper()) return;
    await updateLibrary(() => wallpaperAssets.rotateIfDue(Date.now()), false);
    scheduleWallpaperRotation();
  }

  function scheduleWallpaperRotation() {
    clearTimeout(wallpaperRotationTimer);
    wallpaperRotationTimer = null;
    if (!canRotateWallpaper()) return;

    const interval = getRotationInterval();
    const elapsed = Date.now() - (settings.lastWallpaperRotationAt || Date.now());
    const delay = Math.max(1000, interval - elapsed);
    wallpaperRotationTimer = setTimeout(rotateWallpaperIfDue, Math.min(delay, 2147483647));
  }

  async function compressImage(dataUrl, maxWidth) {
    const image = new Image();
    image.src = dataUrl;
    await image.decode();
    const { naturalWidth: sourceWidth, naturalHeight: sourceHeight } = image;
    if (sourceWidth <= maxWidth || sourceWidth * sourceHeight > wallpaperPolicy.LIMITS.maxPixels) {
      return { data: dataUrl, sourceWidth, sourceHeight };
    }
    const canvas = document.createElement('canvas');
    canvas.width = maxWidth;
    canvas.height = Math.max(1, Math.round(sourceHeight * maxWidth / sourceWidth));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    return { data: canvas.toDataURL('image/webp', 0.85), sourceWidth, sourceHeight };
  }

  function pickReadableColor(surfaces, desired, endpoint, targetContrast = 4.5) {
    return window.__willowColor.readableColor(surfaces, desired, endpoint, targetContrast).hex;
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
    root.style.removeProperty('--search-control-hover-surface');
    root.style.removeProperty('--search-control-focus-color');
    root.style.removeProperty('--search-control-focus-ring');
    root.style.removeProperty('--search-focus-stroke');
    root.style.removeProperty('--search-selected-surface');
    root.style.removeProperty('--search-selected-text');
    root.style.removeProperty('--engine-menu-hover-surface');
    root.style.removeProperty('--engine-menu-hover-text');
    activeColorPalette = null;
  }

  function applyColorReadabilityVars(bgColor) {
    activeColorPalette = window.__theme.applySolidPalette(bgColor);
    if (activeColorPalette) document.body.dataset.colorReadable = activeColorPalette.mode;
  }

  function safeSolidHexFromOklch(oklch) {
    const colorApi = window.__willowColor;
    if (!colorApi) return null;
    const generated = colorApi.toHex(colorApi.gamutMappedOklch(oklch));
    return colorApi.constrainSolidBackground(generated);
  }

  function setCustomColorValidation(violations = []) {
    if (!customColorHex || !customColorError) return;
    const reasons = new Set(violations);
    let message = '';
    if (reasons.has('invalid-format')) {
      message = t('error.customColorFormat');
    } else if (reasons.has('too-dark') && reasons.has('too-saturated')) {
      message = t('error.customColorTooDarkAndSaturated');
    } else if (reasons.has('too-dark')) {
      message = t('error.customColorTooDark');
    } else if (reasons.has('too-saturated')) {
      message = t('error.customColorTooSaturated');
    }
    customColorHexInvalid = Boolean(message);
    customColorHex.setAttribute('aria-invalid', String(customColorHexInvalid));
    customColorError.textContent = message;
    customColorError.hidden = !message;
  }

  function customColorGradient(stops) {
    return `linear-gradient(90deg, ${stops.map(({ color, position }) => `${color} ${position}%`).join(', ')})`;
  }

  function updateCustomColorTracks(oklch) {
    const colorApi = window.__willowColor;
    if (!colorApi) return;
    const limits = colorApi.SOLID_COLOR_LIMITS;
    const hueChroma = Math.max(oklch.c, 0.08);
    const hueStops = Array.from({ length: 13 }, (_, index) => {
      const position = index * 100 / 12;
      return {
        color: safeSolidHexFromOklch({ l: oklch.l, c: hueChroma, h: index * 30 }),
        position,
      };
    });
    const chromaStops = Array.from({ length: 5 }, (_, index) => {
      const position = index * 25;
      return {
        color: safeSolidHexFromOklch({
          l: oklch.l,
          c: limits.chromaMax * index / 4,
          h: oklch.h,
        }),
        position,
      };
    });
    const lightnessStops = Array.from({ length: 6 }, (_, index) => {
      const position = index * 20;
      return {
        color: safeSolidHexFromOklch({
          l: limits.lightnessMin + (limits.lightnessMax - limits.lightnessMin) * index / 5,
          c: oklch.c,
          h: oklch.h,
        }),
        position,
      };
    });
    customColorHue.style.setProperty('--range-track', customColorGradient(hueStops));
    customColorChroma.style.setProperty('--range-track', customColorGradient(chromaStops));
    customColorLightness.style.setProperty('--range-track', customColorGradient(lightnessStops));
  }

  function syncCustomColorControls(color, syncHex = true) {
    const colorApi = window.__willowColor;
    if (!colorApi) return;
    const fallback = '#bfbb98';
    const inspection = colorApi.inspectSolidBackground(color);
    const safeInspection = inspection && inspection.valid && inspection.safe
      ? inspection
      : colorApi.inspectSolidBackground(fallback);
    if (!safeInspection) return;

    if (!customColorSliderState) {
      customColorSliderState = {
        h: Math.round(safeInspection.oklch.h) % 360,
        c: safeInspection.oklch.c,
        l: safeInspection.oklch.l,
      };
    }
    const state = customColorSliderState;
    const normalized = safeInspection.normalized;
    customColorPreview.style.backgroundColor = normalized;
    customColorPreview.dataset.color = normalized;
    customColorPreview.setAttribute('aria-label', `${t('settings.customColorPreview')} ${normalized.toUpperCase()}`);

    customColorHue.value = String(Math.round(state.h) % 360);
    customColorChroma.value = String(Math.round(state.c * 1000));
    customColorLightness.value = String(Math.round(state.l * 1000));
    const chromaPercent = Math.round(state.c / colorApi.SOLID_COLOR_LIMITS.chromaMax * 100);
    const lightnessPercent = Math.round(state.l * 100);
    customColorHueValue.textContent = `${customColorHue.value}°`;
    customColorChromaValue.textContent = `${chromaPercent}%`;
    customColorLightnessValue.textContent = `${lightnessPercent}%`;
    customColorHue.setAttribute('aria-valuetext', customColorHueValue.textContent);
    customColorChroma.setAttribute('aria-valuetext', customColorChromaValue.textContent);
    customColorLightness.setAttribute('aria-valuetext', customColorLightnessValue.textContent);
    updateCustomColorTracks(state);

    if (syncHex) {
      customColorHex.value = settings.bgColor || '';
      setCustomColorValidation();
    }
  }

  function commitCustomColor(color, preserveSliderState = false) {
    const colorApi = window.__willowColor;
    const inspection = colorApi && colorApi.inspectSolidBackground(color);
    if (!inspection || !inspection.valid || !inspection.safe) return false;
    if (!preserveSliderState) customColorSliderState = null;
    settings.bgColor = inspection.normalized;
    setCustomColorValidation();
    saveSetting('bgColor');
    applyBackground();
    scheduleWallpaperRotation();
    syncUI();
    return true;
  }

  function applyCustomColorSliders() {
    customColorSliderState = {
      h: Number(customColorHue.value),
      c: Number(customColorChroma.value) / 1000,
      l: Number(customColorLightness.value) / 1000,
    };
    const color = safeSolidHexFromOklch(customColorSliderState);
    if (color) commitCustomColor(color, true);
  }

  function applyCustomColorHex() {
    const colorApi = window.__willowColor;
    const inspection = colorApi && colorApi.inspectSolidBackground(customColorHex.value.trim());
    if (!inspection || !inspection.valid) {
      setCustomColorValidation(['invalid-format']);
      return false;
    }
    if (!inspection.safe) {
      setCustomColorValidation(inspection.violations);
      return false;
    }
    return commitCustomColor(inspection.normalized);
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

  async function analyzeWallpaperImage(dataUrl, includeThumbnail = false) {
    const image = new Image();
    image.src = dataUrl;
    try {
      await image.decode();
      const size = 64;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--wallpaper-background-color').trim();
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(image, 0, 0, size, size);
      const analysis = summarizeImageData(ctx.getImageData(0, 0, size, size), size, size);
      if (includeThumbnail) {
        try { analysis.thumbnail = wallpaperAssets.makeThumbnail(image); } catch (_) {}
      }
      return analysis;
    } catch (_) {
      return { brightness: -1, complexity: 0 };
    }
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
          ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--wallpaper-background-color').trim();
          ctx.fillRect(0, 0, sampleWidth, sampleHeight);
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
    const active = settings.bgMode === 'wallpaper'
      ? settings.wallpapers.find((wallpaper) => wallpaper.id === settings.activeWallpaperId)
      : null;
    body.classList.remove('has-wallpaper', 'has-custom-bg', 'wallpaper-readable');
    delete body.dataset.wallpaperSurface;
    if (!active) body.style.removeProperty('--wallpaper');
    activeWallpaperData = '';
    wallpaperSurfaceAnalysisToken++;
    root.style.removeProperty('--bg-primary');
    root.style.removeProperty('--overlay-strength');
    clearColorReadabilityVars();
    clearWallpaperAdaptiveVars();

    if (active) {
      body.classList.add('has-wallpaper');
      body.classList.toggle('wallpaper-readable', settings.wallpaperReadability);
      root.style.setProperty('--overlay-strength', settings.overlayStrength / 100);

      const renderWallpaper = async (record) => {
        if (token !== wallpaperApplyToken) return;
        const source = record?.data ? record : active;
        if (!source.data) {
          body.classList.remove('has-wallpaper');
          body.style.removeProperty('--wallpaper');
          root.style.removeProperty('--overlay-strength');
          window.__theme.finishStartupBackground();
          return;
        }

        const needsPreview = record?.data && !wallpaperAssets.getStartupPreview(active.id);
        let decodedImage = null;
        if (root.dataset.startupBackground === 'wallpaper' || needsPreview) {
          const image = new Image();
          image.src = source.data;
          try {
            await image.decode();
            decodedImage = image;
          } catch (_) {}
        }
        if (token !== wallpaperApplyToken) return;
        body.style.setProperty('--wallpaper', `url(${source.data})`);
        activeWallpaperData = source.data;
        window.__theme.finishStartupBackground();
        if (decodedImage && needsPreview) wallpaperAssets.saveStartupPreview(active.id, decodedImage);

        const brightness = active.brightness ?? source.brightness;
        const complexity = active.complexity ?? source.complexity;
        if (brightness == null || complexity == null) {
          analyzeWallpaperImage(source.data).then((analysis) => {
            if (token !== wallpaperApplyToken) return;
            if (analysis.brightness >= 0) {
              applyWallpaperTextColor(analysis.brightness, analysis.complexity);
              syncWallpaperSurfaceAnalysis(analysis.brightness, analysis.complexity, token);
            }
            if (record) {
              wallpaperAssets.updateAnalysis(active.id, analysis.brightness, analysis.complexity)
                .then(({ state }) => applyLibrary(state)).catch(() => {});
            }
          });
        } else if (brightness >= 0) {
          applyWallpaperTextColor(brightness, complexity);
          syncWallpaperSurfaceAnalysis(brightness, complexity, token);
        }
      };

      if (wallpaperAssets) {
        wallpaperAssets.get(active.id).then(renderWallpaper, () => {
          if (active.data) return renderWallpaper(null);
        });
      } else {
        renderWallpaper(null);
      }
    }

    if (settings.bgMode === 'color' && settings.bgColor && !effectiveThemeIsDark()) {
      body.classList.add('has-custom-bg');
      root.style.setProperty('--bg-primary', settings.bgColor);
      applyColorReadabilityVars(settings.bgColor);
    }

    if (!active) window.__theme.finishStartupBackground();
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
    root.style.removeProperty('--wallpaper-search-control-hover-color');
    root.style.removeProperty('--wallpaper-search-control-focus-color');
    root.style.removeProperty('--wallpaper-search-focus-stroke');
    root.style.removeProperty('--wallpaper-action-border');
    root.style.removeProperty('--wallpaper-analysis-min');
    root.style.removeProperty('--wallpaper-analysis-max');
    root.style.removeProperty('--wallpaper-analysis-target');
    root.style.removeProperty('--wallpaper-time-analysis-min');
    root.style.removeProperty('--wallpaper-time-analysis-target');
  }

  function applyWallpaperMottoColor(
    textColor,
    inputSurfaceColor,
    inputAlpha,
    surfaceBrightness,
  ) {
    const colorApi = window.__willowColor;
    const primaryText = colorApi.parseHex(textColor);
    if (!primaryText) return inputAlpha;
    const tone = Math.min(1, Math.max(0, surfaceBrightness)) * 255;
    const wallpaperSurface = { r: tone, g: tone, b: tone };
    const primaryLuminance = colorApi.relativeLuminance(primaryText);
    const contrastAt = (alpha) => {
      const surface = colorApi.mix(wallpaperSurface, inputSurfaceColor, alpha);
      return colorApi.contrast(primaryLuminance, colorApi.relativeLuminance(surface));
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
    const inputSurface = colorApi.mix(wallpaperSurface, inputSurfaceColor, resolvedInputAlpha);
    const useDarkText = primaryLuminance < colorApi.relativeLuminance(inputSurface);
    const desired = colorApi.parseHex(useDarkText ? '#918d83' : '#706b64');
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
    const colorApi = window.__willowColor;
    const root = document.documentElement;
    const tone = Math.min(1, Math.max(0, surfaceBrightness)) * 255;
    const wallpaperSurface = { r: tone, g: tone, b: tone };
    const menuSurface = colorApi.mix(wallpaperSurface, menuSurfaceColor, menuSurfaceAlpha);
    const selectedText = colorApi.parseHex(selectedTextColor) || colorApi.parseHex('#f3eddf');
    const selectedSurface = colorApi.mix(menuSurface, selectedSurfaceColor, selectedSurfaceAlpha);
    const useDarkText = colorApi.relativeLuminance(selectedText) < colorApi.relativeLuminance(selectedSurface);
    const resolvedSelectedText = pickReadableColor(
      [selectedSurface],
      selectedText,
      colorApi.parseHex(useDarkText ? '#000000' : '#ffffff'),
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
        return Promise.all([
          syncWallpaperControlStyles(token, applyToken),
          syncWallpaperTimeStyle(token, applyToken),
        ]);
      });
    });
  }

  async function syncWallpaperTimeStyle(token, applyToken) {
    const analyzer = window.__willowWallpaperColor;
    const time = document.querySelector('.time-display');
    if (!analyzer || !time) return;

    const root = document.documentElement;
    const styles = getComputedStyle(root);
    const protection = analyzer.normalizeColor(styles.getPropertyValue('--wallpaper-protection-bg'));
    try {
      const analysis = await analyzer.analyzeTextSurface({
        wallpaperUrl: activeWallpaperData,
        wallpaperId: settings.activeWallpaperId,
        element: time,
        viewport: {
          width: window.innerWidth || document.documentElement.clientWidth,
          height: window.innerHeight || document.documentElement.clientHeight,
          dpr: window.devicePixelRatio || 1,
        },
        overlayAlpha: settings.overlayStrength / 100,
        backgroundColor: styles.getPropertyValue('--wallpaper-background-color').trim(),
        readability: settings.wallpaperReadability,
        protectionColor: protection,
        protectionAlpha: protection.a,
        targetContrast: WALLPAPER_TIME_TARGET,
        solverVersion: analyzer.solverVersion,
      });
      if (token !== wallpaperSurfaceAnalysisToken || applyToken !== wallpaperApplyToken || !analysis) return;
      const desired = styles.getPropertyValue('--wallpaper-time-color').trim() || '#f6efe2';
      const result = analyzer.solveTextStyle(analysis, desired, WALLPAPER_TIME_TARGET);
      if (!result) return;
      root.style.setProperty('--wallpaper-time-color', result.color);
      root.style.setProperty('--wallpaper-time-analysis-min', result.minimumContrast.toFixed(3));
      root.style.setProperty('--wallpaper-time-analysis-target', WALLPAPER_TIME_TARGET.toFixed(1));
      analyzer.lastTextResult = { analysis, result };
    } catch (_) {
      // Keep the best-effort light or dark time color when wallpaper analysis fails.
    }
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
        backgroundColor: styles.getPropertyValue('--wallpaper-background-color').trim(),
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
    root.style.setProperty('--wallpaper-time-color', lightSurface ? '#241f18' : '#f6efe2');
    const surfaceMode = settings.wallpaperSurfaceMode || 'light';
    const surfaceBrightness = surfaceAnalysis ? surfaceAnalysis.brightness : brightness;
    const surfaceEffective = surfaceBrightness * (1 - settings.overlayStrength / 100);
    const adaptiveLightSurface = window.__theme.isLightWallpaperSurface(surfaceBrightness, surfaceEffective);
    const useLightSurface = surfaceMode === 'light' || (surfaceMode === 'auto' && adaptiveLightSurface);
    const useDarkPanel = settings.wallpaperReadability ? !useLightSurface : surfaceMode === 'dark';
    document.body.dataset.wallpaperSurface = useDarkPanel ? 'dark' : 'light';
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
    window.__theme.setSettingsButtonPosition(settings.settingsBtnPosition);
  }

  function applyTabTitle() {
    document.title = settings.tabTitle || 'WillowTab';
  }

  function syncUISuggestions() {
    if (!suggestionsToggle) return;
    const enabled = window.__willowSearch.suggestionsEnabled;
    document.body.dataset.suggestionsEnabled = String(enabled);
    suggestionsToggle.dataset.enabled = String(enabled);
    suggestionsToggle.setAttribute('aria-pressed', String(enabled));
    suggestionsToggle.textContent = t(enabled ? 'settings.suggestionsOn' : 'settings.suggestionsOff');
  }

  function applyAll() {
    reconcileWallpaperState();
    applyBackground();
    applyFont();
    applyRadius();
    applyShadowStrength();
    applySettingsBtnPosition();
    applyTabTitle();
    syncUISuggestions();
    rotateWallpaperIfDue();
    if (customColorMigrationNotice) {
      showToast(t(customColorMigrationNotice));
      customColorMigrationNotice = '';
    }
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
    renderWallpaperGallery();
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
      wallpaperModeOption.disabled = false;
      wallpaperModeOption.removeAttribute('aria-disabled');
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
    wallpaperSection.hidden = (settings.bgMode !== 'wallpaper');
    themeSection.hidden = (settings.bgMode === 'wallpaper');

    colorPresets.querySelectorAll('.color-swatch').forEach((swatch) => {
      const selected = swatch.dataset.color.toLowerCase() === String(settings.bgColor || '').toLowerCase();
      swatch.classList.toggle('active', selected);
      swatch.setAttribute('aria-pressed', String(selected));
    });

    const color = settings.bgColor || DEFAULTS.bgColor;
    syncCustomColorControls(color, !customColorHexInvalid);

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

    if (document.activeElement !== tabTitleInput) tabTitleInput.value = settings.tabTitle || '';
    greetingToggle.checked = settings.showGreeting !== false;
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

  function wallpaperLibraryVisible() {
    return !panel.hidden && !panel.classList.contains('is-closing')
      && settingsPanelView === 'wallpaper' && wallpaperSubView === 'library';
  }

  function renderWallpaperGallery() {
    thumbnailObserver.disconnect();
    if (!wallpaperLibraryVisible()) return;
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
      img.dataset.wallpaperId = w.id;
      if (w.data) img.src = w.data;

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
      if (!w.data) thumbnailObserver.observe(img);
    });
  }

  async function removeWallpapers(ids) {
    const result = await updateLibrary(() => wallpaperAssets.removeWallpapers(ids), false);
    return result
      ? { deletedCount: result.deletedCount, failedCount: 0 }
      : { deletedCount: 0, failedCount: ids.length };
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

  async function reorderWallpaperToIndex(id, targetIndex, restoreHandleFocus = false) {
    const from = settings.wallpapers.findIndex((item) => item.id === id);
    if (from < 0) return;
    const to = Math.max(0, Math.min(targetIndex, settings.wallpapers.length - 1));
    if (from === to) return;
    const neighbor = settings.wallpapers[to].id;
    const result = await updateLibrary(() => wallpaperAssets.reorder(id, neighbor, from < to));
    if (result?.changed) announceWallpaperPosition(id, settings.wallpapers.findIndex((item) => item.id === id));
    if (restoreHandleFocus) focusWallpaperHandleAfterRender(id);
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
    updateLibrary(() => wallpaperAssets.setMode(opt.dataset.mode));
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
    commitCustomColor(swatch.dataset.color);
  });

  [customColorHue, customColorChroma, customColorLightness].forEach((slider) => {
    slider.addEventListener('input', applyCustomColorSliders);
  });

  customColorHex.addEventListener('input', applyCustomColorHex);
  customColorHex.addEventListener('change', applyCustomColorHex);

  function isWallpaperFile(file) {
    return /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(file.name) || /^image\//i.test(file.type || '');
  }

  async function importWallpaperFiles(fileList, source) {
    if (wallpaperImportInProgress) return;
    const selectedFiles = Array.from(fileList || []);
    if (!selectedFiles.length) return;
    if (!wallpaperPolicy) {
      showToast(t('error.wallpaperImportUnavailable'));
      return;
    }

    const naturalSort = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
    let files = selectedFiles.filter(isWallpaperFile);
    if (source === 'folder') {
      files = files.sort((a, b) => naturalSort.compare(a.webkitRelativePath || a.name, b.webkitRelativePath || b.name));
    }

    const batchValidation = wallpaperPolicy.validateBatch(files);
    if (!batchValidation.ok) {
      showToast(t(batchValidation.reason === 'too_many_files'
        ? 'error.wallpaperBatchCount'
        : 'error.wallpaperBatchSize', {
        limit: batchValidation.reason === 'too_many_files'
          ? wallpaperPolicy.LIMITS.maxBatchFiles
          : '1 GiB',
      }));
      return;
    }

    const activate = source === 'photo' && files.length === 1;
    let added = 0;
    let skipped = selectedFiles.length - files.length;
    let limited = 0;
    let failed = 0;
    let latest;

    wallpaperImportInProgress = true;
    wallpaperImportProgress = { current: 0, total: files.length };
    closeWallpaperAddMenu(false);
    syncWallpaperControls();

    try {
      await ensureLibrary();
      for (const [index, file] of files.entries()) {
        wallpaperImportProgress = { current: index + 1, total: files.length };
        syncWallpaperControls();
        if (!wallpaperPolicy.validateFile(file).ok) {
          limited += 1;
          continue;
        }

        try {
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          });
          const processed = await compressImage(dataUrl, 1920);
          if (!wallpaperPolicy.validateFile(file, processed.sourceWidth, processed.sourceHeight).ok) {
            limited += 1;
            continue;
          }
          const { brightness, complexity, thumbnail } = await analyzeWallpaperImage(processed.data, true);
          if (brightness < 0) throw new Error('Failed to analyze wallpaper');
          const result = await wallpaperAssets.addWallpaper({
            id: crypto.randomUUID(),
            data: processed.data,
            name: file.name,
            sourcePath: wallpaperPolicy.getImportPath(file, source),
            brightness,
            complexity,
            createdAt: Date.now(),
          }, thumbnail, activate);
          latest = result.state;
          if (result.duplicate) skipped += 1;
          else added += 1;
        } catch (_) {
          failed += 1;
        }
      }
    } catch (error) {
      console.error('Wallpaper import failed', error);
      failed += files.length;
    } finally {
      wallpaperImportInProgress = false;
      wallpaperImportProgress = { current: 0, total: 0 };
      applyLibrary(latest);
      syncUI();
    }

    showToast(t('toast.wallpaperImportResult', { added, skipped, limited, failed }));
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

    updateLibrary(() => wallpaperAssets.activate(id));
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
      saveSetting('wallpaperReadability');
      updateWallpaperPresentation();
    });
  }

  if (wallpaperSurfaceModeOptions) {
    wallpaperSurfaceModeOptions.addEventListener('click', (e) => {
      const opt = e.target.closest('.theme-option');
      if (!opt) return;
      settings.wallpaperSurfaceMode = opt.dataset.surfaceMode;
      saveSetting('wallpaperSurfaceMode');
      updateWallpaperPresentation();
      syncUI();
    });
  }

  if (wallpaperRotationOptions) {
    wallpaperRotationOptions.addEventListener('click', (e) => {
      const opt = e.target.closest('.theme-option');
      if (!opt || opt.disabled) return;
      updateLibrary(() => wallpaperAssets.setRotation({ wallpaperRotation: opt.dataset.rotation }));
    });
  }

  if (wallpaperRotationModeOptions) {
    wallpaperRotationModeOptions.addEventListener('click', (e) => {
      const opt = e.target.closest('.theme-option');
      if (!opt || opt.disabled) return;
      updateLibrary(() => wallpaperAssets.setRotation({ wallpaperRotationMode: opt.dataset.rotationMode }));
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
    saveSetting('shadowStrength');
  });

  overlaySlider.addEventListener('input', () => {
    settings.overlayStrength = parseInt(overlaySlider.value);
    overlayValue.textContent = `${settings.overlayStrength}%`;
    updateWallpaperPresentation();
    saveSetting('overlayStrength');
  });

  tabTitleInput.addEventListener('input', () => {
    settings.tabTitle = tabTitleInput.value.trim();
    applyTabTitle();
    saveSetting('tabTitle');
  });
  tabTitleInput.addEventListener('blur', () => {
    tabTitleInput.value = settings.tabTitle || '';
  });

  greetingToggle.addEventListener('change', () => {
    try {
      preferences.write('showGreeting', greetingToggle.checked);
    } catch (error) {
      greetingToggle.checked = settings.showGreeting !== false;
      console.error('Preference update failed', error);
      showToast(t('error.settingsSaveFailed'));
    }
  });

  if (suggestionsToggle) {
    suggestionsToggle.addEventListener('click', () => window.__willowSearch.toggleSuggestions());
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
  const settingsReady = ensureLibrary()
    .then((state) => applyLibrary(state, false))
    .catch((error) => console.error('Failed to initialize wallpaper storage', error));
  preferences.subscribe(syncSavedPreferences);
  window.__willowSearch.subscribe(syncUISuggestions);
  const refreshFromStorage = () => refreshLibrary().catch(() => {});
  wallpaperAssets.subscribe(refreshFromStorage);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshFromStorage();
  });
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) refreshFromStorage();
  });

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
    saveSetting('font');
    applyFont();
    syncUI();
  });

  radiusOptions.addEventListener('click', (e) => {
    const opt = e.target.closest('.theme-option');
    if (!opt) return;
    settings.radius = opt.dataset.radius;
    saveSetting('radius');
    applyRadius();
    syncUI();
  });

  const btnPosOptions = document.getElementById('settings-btn-position-options');
  if (btnPosOptions) {
    btnPosOptions.addEventListener('click', (e) => {
      const opt = e.target.closest('.theme-option');
      if (!opt) return;
      settings.settingsBtnPosition = opt.dataset.position;
      saveSetting('settingsBtnPosition');
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
    if (saveTimer) flushSettings();
    clearTimeout(toastHideTimer);
    clearTimeout(wallpaperRotationTimer);
    clearTimeout(resizeSyncTimer);
    engineIconObserver.disconnect();
  });

  settingsReady.finally(() => {
    applyAll();
  });
})();
