(() => {
  const STORAGE_KEY = 'theme';
  const DEFAULT_BACKGROUND_COLOR = '#BFBB98';
  const DEFAULT_RADIUS = '28px';
  const html = document.documentElement;
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  let solidPalette = null;

  function getTheme() {
    try {
      const storedTheme = localStorage.getItem(STORAGE_KEY);
      return storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'auto';
    } catch (_) {
      return 'auto';
    }
  }

  function resolveColorScheme(theme) {
    return theme === 'auto' ? (mediaQuery.matches ? 'dark' : 'light') : theme;
  }

  function syncThemeAttributes(theme) {
    if (theme === 'light' || theme === 'dark') {
      html.setAttribute('data-theme', theme);
    } else {
      html.removeAttribute('data-theme');
    }
    html.setAttribute('data-color-scheme', resolveColorScheme(theme));
  }

  function applyTheme(theme) {
    const normalizedTheme = theme === 'light' || theme === 'dark' ? theme : 'auto';
    syncThemeAttributes(normalizedTheme);
    localStorage.setItem(STORAGE_KEY, normalizedTheme);
  }

  function setSettingsButtonPosition(position) {
    html.dataset.settingsBtnPosition = position === 'dropdown' ? 'dropdown' : 'footer';
  }

  function applySolidPalette(background) {
    const color = window.__willowColor;
    if (!color) return null;
    if (solidPalette?.background !== background.toLowerCase()) {
      solidPalette = color.createSolidPalette(background);
    }
    if (!solidPalette) return null;

    const { colors, surfaces, diagnostics, mode } = solidPalette;
    const brandAccent = color.parseHex(colors.brandAccent);
    const searchAccent = color.parseHex(colors.searchAccent);
    const searchAccentSurface = `rgba(${searchAccent.r}, ${searchAccent.g}, ${searchAccent.b}, ${diagnostics.searchAccent.overlayAlpha})`;
    const style = html.style;
    style.setProperty('--bg-secondary', surfaces.secondary);
    style.setProperty('--bg-tertiary', surfaces.tertiary);
    style.setProperty('--text-primary', colors.canvasPrimary);
    style.setProperty('--text-secondary', colors.canvasSecondary);
    style.setProperty('--text-tertiary', colors.canvasControl);
    style.setProperty('--placeholder-text', colors.searchPlaceholder);
    style.setProperty('--input-bg', surfaces.input);
    style.setProperty('--accent', colors.brandAccent);
    style.setProperty('--accent-hover', colors.brandAccent);
    style.setProperty('--accent-text', colors.accentText);
    style.setProperty('--accent-subtle', `rgba(${brandAccent.r}, ${brandAccent.g}, ${brandAccent.b}, 0.08)`);
    style.setProperty('--border-focus', colors.brandAccent);
    style.setProperty('--focus-ring-color', colors.brandAccent);
    style.setProperty('--canvas-text-primary', colors.canvasPrimary);
    style.setProperty('--canvas-text-secondary', colors.canvasSecondary);
    style.setProperty('--canvas-large-text', colors.canvasLarge);
    style.setProperty('--canvas-control-color', colors.canvasControl);
    style.setProperty('--search-surface', surfaces.input);
    style.setProperty('--search-text-color', colors.searchText);
    style.setProperty('--search-placeholder-color', colors.searchPlaceholder);
    style.setProperty('--search-control-color', colors.searchControl);
    style.setProperty('--search-control-hover-color', colors.searchAccent);
    style.setProperty('--search-control-hover-surface', searchAccentSurface);
    style.setProperty('--search-control-focus-color', colors.searchAccent);
    style.setProperty('--search-control-focus-ring', colors.searchAccent);
    style.setProperty('--search-focus-stroke', colors.searchAccent);
    style.setProperty('--search-selected-surface', searchAccentSurface);
    style.setProperty('--search-selected-text', colors.searchSelectedText);
    style.setProperty('--engine-menu-hover-surface', searchAccentSurface);
    style.setProperty('--engine-menu-hover-text', colors.searchAccent);
    style.setProperty('--border', mode === 'dark-text'
      ? `color-mix(in srgb, ${background} 75%, black)`
      : 'rgba(255, 255, 255, 0.24)');
    return solidPalette;
  }

  function isLightWallpaperSurface(brightness, effective) {
    return brightness >= 0.62 || effective >= 0.5;
  }

  function prepareStartupBackground() {
    const settings = {
      ...window.__willowPreferences.read(),
      ...window.__wallpaperAssets.readStartupLibrary(),
    };

    setSettingsButtonPosition(settings.settingsBtnPosition);
    html.style.setProperty('--radius-ui', settings.radius === undefined ? DEFAULT_RADIUS : settings.radius);
    html.dataset.startupBackground = 'theme';
    html.style.backgroundColor = 'var(--startup-background-color, var(--bg-primary))';
    const wallpapers = Array.isArray(settings.wallpapers) ? settings.wallpapers : [];
    const active = settings.bgMode === 'wallpaper' && settings.activeWallpaperId
      ? (wallpapers.find((item) => item?.id === settings.activeWallpaperId) || wallpapers[0])
      : null;
    const legacyWallpaper = typeof settings.wallpaper === 'string' && settings.wallpaper;
    if (active || legacyWallpaper) {
      html.dataset.startupBackground = 'wallpaper';
      html.style.setProperty('--startup-background-color', 'var(--wallpaper-background-color, #1a1a1a)');
      const preview = window.__wallpaperAssets?.getStartupPreview(active?.id);
      if (preview) html.style.setProperty('--startup-wallpaper', `url("${preview}")`);
      const overlayStrength = Number(settings.overlayStrength ?? 25);
      if (Number.isFinite(overlayStrength)) {
        html.style.setProperty('--startup-overlay-strength', overlayStrength / 100);
      }
      const brightness = active?.brightness;
      const lightSurface = isLightWallpaperSurface(brightness, brightness * (1 - overlayStrength / 100));
      const useDarkSurface = settings.wallpaperSurfaceMode === 'dark'
        || (settings.wallpaperSurfaceMode === 'auto' && settings.wallpaperReadability !== false && !lightSurface);
      if (useDarkSurface) html.dataset.startupWallpaperSurface = 'dark';
      html.style.setProperty('--startup-wallpaper-text-color', lightSurface && !useDarkSurface ? '#272016' : '#f3eddf');
    } else if (html.dataset.colorScheme === 'light' && (!settings.bgMode || settings.bgMode === 'color')) {
      const color = window.__willowColor?.constrainSolidBackground(settings.bgColor) || DEFAULT_BACKGROUND_COLOR;
      html.dataset.startupBackground = 'color';
      html.style.setProperty('--startup-background-color', color);
      applySolidPalette(color);
    }
  }

  function finishStartupBackground() {
    if (!html.hasAttribute('data-startup-background')) return;
    delete html.dataset.startupBackground;
    delete html.dataset.startupWallpaperSurface;
    html.style.removeProperty('background-color');
    html.style.removeProperty('--startup-background-color');
    html.style.removeProperty('--startup-wallpaper');
    html.style.removeProperty('--startup-overlay-strength');
    html.style.removeProperty('--startup-wallpaper-text-color');
  }

  window.__theme = {
    get: getTheme,
    set: applyTheme,
    defaultBackgroundColor: DEFAULT_BACKGROUND_COLOR,
    defaultRadius: DEFAULT_RADIUS,
    setSettingsButtonPosition,
    applySolidPalette,
    isLightWallpaperSurface,
    finishStartupBackground,
  };

  syncThemeAttributes(getTheme());
  prepareStartupBackground();

  mediaQuery.addEventListener('change', () => {
    if (getTheme() === 'auto') {
      html.setAttribute('data-color-scheme', resolveColorScheme('auto'));
    }
  });
})();
