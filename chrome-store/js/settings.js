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
  const colorPresets = document.getElementById('color-presets');
  const modeToggle = document.getElementById('mode-toggle');
  const colorSection = document.getElementById('color-section');
  const wallpaperSection = document.getElementById('wallpaper-section');
  const wallpaperFolderBtn = document.getElementById('wallpaper-folder-btn');
  const wallpaperFolderInput = document.getElementById('wallpaper-folder-input');
  const wallpaperGallery = document.getElementById('wallpaper-gallery');
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

  const aboutBtn = document.getElementById('about-btn');
  const aboutPanel = document.getElementById('about-panel');
  const aboutClose = document.getElementById('about-close');
  const aboutOverlay = document.getElementById('about-overlay');

  let settingsOverlay = null;

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
      }
    } catch (_) {
      settings = { ...DEFAULTS };
    }
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
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        // Storage full — clear wallpapers and save rest
        settings.wallpapers = [];
        settings.activeWallpaperId = '';
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        alert((window.__i18n && window.__i18n.t('error.quotaExceeded')) || '存储空间不足，已清除所有壁纸。请删除部分壁纸后重新添加。');
      }
    }
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

  // Analyze wallpaper brightness for adaptive text color
  function analyzeBrightness(dataUrl) {
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
        let total = 0;
        const pixels = imageData.data;
        for (let i = 0; i < pixels.length; i += 4) {
          total += (0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]) / 255;
        }
        resolve(total / (size * size));
      };
      img.onerror = () => resolve(-1);
      img.src = dataUrl;
    });
  }

  // --- Apply settings to page ---
  function applyBackground() {
    const root = document.documentElement;
    const body = document.body;
    body.classList.remove('has-wallpaper', 'has-custom-bg');
    body.style.setProperty('--wallpaper', '');
    root.style.removeProperty('--bg-primary');
    root.style.removeProperty('--overlay-strength');
    root.style.removeProperty('--wallpaper-text-color');
    root.style.removeProperty('--wallpaper-input-bg');

    // Wallpaper mode
    if (settings.bgMode === 'wallpaper' && settings.activeWallpaperId) {
      const active = settings.wallpapers.find((w) => w.id === settings.activeWallpaperId);
      if (active) {
        body.classList.add('has-wallpaper');
        body.style.setProperty('--wallpaper', `url(${active.data})`);
        root.style.setProperty('--overlay-strength', settings.overlayStrength / 100);

        // Adaptive text color based on wallpaper brightness + overlay
        let brightness = active.brightness;
        if (brightness == null) {
          // Old wallpaper without brightness — analyze now
          analyzeBrightness(active.data).then((b) => {
            active.brightness = b;
            saveSettings();
            applyBackground(); // re-apply with new brightness
          });
        } else if (brightness >= 0) {
          // 遮罩会压暗壁纸，将遮罩强度计入有效亮度，使文字颜色也响应遮罩滑块
          const effective = brightness * (1 - settings.overlayStrength / 100);
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
      }
    }

    // Color mode
    if (settings.bgMode === 'color' && settings.bgColor && !effectiveThemeIsDark()) {
      body.classList.add('has-custom-bg');
      root.style.setProperty('--bg-primary', settings.bgColor);
    }

    applyShadowStrength();
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

  function applyAll() {
    applyBackground();
    applyFont();
    applyRadius();
    applyShadowStrength();
    applySettingsBtnPosition();
    applyTabTitle();
  }

  // --- Settings panel ---
  function createOverlay() {
    settingsOverlay = document.createElement('div');
    settingsOverlay.className = 'panel-overlay';
    settingsOverlay.setAttribute('hidden', '');
    document.body.appendChild(settingsOverlay);
    settingsOverlay.addEventListener('click', closePanel);
  }

  function openPanel() {
    panel.removeAttribute('hidden');
    if (settingsOverlay) settingsOverlay.removeAttribute('hidden');
    syncUI();
  }

  function closePanel() {
    panel.setAttribute('hidden', '');
    if (settingsOverlay) settingsOverlay.setAttribute('hidden', '');
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
  }

  // Render wallpaper thumbnail gallery
  function renderWallpaperGallery() {
    wallpaperGallery.innerHTML = '';
    if (!settings.wallpapers.length) {
      const emptyText = (window.__i18n && window.__i18n.t('wallpaper.empty')) || '暂无壁纸，请选择文件夹添加';
      wallpaperGallery.innerHTML = `<div style="color:var(--text-tertiary);font-size:0.8rem;padding:8px;text-align:center">${emptyText}</div>`;
      return;
    }
    settings.wallpapers.forEach((w) => {
      const thumb = document.createElement('div');
      thumb.className = 'wallpaper-thumb' + (w.id === settings.activeWallpaperId ? ' active' : '');
      thumb.dataset.id = w.id;
      thumb.innerHTML = `
        <img src="${w.data}" alt="${w.name}" loading="lazy">
        <span class="wallpaper-thumb-name">${w.name}</span>
        <button class="wallpaper-thumb-delete" title="${(window.__i18n && window.__i18n.t('wallpaper.delete')) || '删除'}">×</button>
      `;
      wallpaperGallery.appendChild(thumb);
    });
  }

  // --- Events ---

  // Mode toggle
  modeToggle.addEventListener('click', (e) => {
    const opt = e.target.closest('.mode-option');
    if (!opt) return;
    settings.bgMode = opt.dataset.mode;
    saveSettings();
    applyBackground();
    syncUI();
  });

  // Theme options
  themeOptions.addEventListener('click', (e) => {
    const opt = e.target.closest('.theme-option');
    if (!opt) return;
    if (themeSection.hidden) return;
    if (window.__theme) window.__theme.set(opt.dataset.theme);
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
    syncUI();
  });

  // Custom color picker
  customColorPicker.addEventListener('input', () => {
    settings.bgMode = 'color';
    settings.bgColor = customColorPicker.value;
    customColorHex.value = settings.bgColor;
    saveSettings();
    applyBackground();
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
    syncUI();
  });

  // Wallpaper folder selection
  wallpaperFolderBtn.addEventListener('click', () => {
    wallpaperFolderInput.click();
  });

  wallpaperFolderInput.addEventListener('change', async () => {
    const files = Array.from(wallpaperFolderInput.files || []).filter((f) =>
      /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(f.name)
    );
    if (!files.length) return;

    let added = 0;
    let skipped = 0;
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
        const brightness = await analyzeBrightness(compressed);
        const id = generateId();
        settings.wallpapers.push({ id, data: compressed, name: file.name, brightness });
        added++;
      } catch (_) {
        // Skip files that fail to process
      }
    }

    if (added > 0) {
      // Auto-select first added if none active
      if (!settings.activeWallpaperId || !settings.wallpapers.find((w) => w.id === settings.activeWallpaperId)) {
        settings.activeWallpaperId = settings.wallpapers[settings.wallpapers.length - 1].id;
      }
      settings.bgMode = 'wallpaper';
      try {
        saveSettings();
      } catch (_) {
        // If save fails (quota), wallpapers were already cleared by saveSettings
      }
      applyBackground();
      syncUI();
    }

    if (skipped > 0) {
      const tWallpaper = (k, vars) => (window.__i18n && window.__i18n.t(k, vars)) || k;
      const msg = added > 0
        ? tWallpaper('toast.addedAndSkipped', { added, skipped })
        : tWallpaper('toast.allSkipped', { skipped });
      showToast(msg);
    }

    wallpaperFolderInput.value = '';
  });

  // Wallpaper gallery interaction (switch / delete)
  wallpaperGallery.addEventListener('click', (e) => {
    const thumb = e.target.closest('.wallpaper-thumb');
    if (!thumb) return;
    const id = thumb.dataset.id;

    // Delete button
    if (e.target.closest('.wallpaper-thumb-delete')) {
      settings.wallpapers = settings.wallpapers.filter((w) => w.id !== id);
      if (settings.activeWallpaperId === id) {
        settings.activeWallpaperId = settings.wallpapers.length > 0 ? settings.wallpapers[0].id : '';
        if (!settings.activeWallpaperId) settings.bgMode = 'color';
      }
      saveSettings();
      applyBackground();
      syncUI();
      return;
    }

    // Switch active wallpaper
    settings.activeWallpaperId = id;
    settings.bgMode = 'wallpaper';
    saveSettings();
    applyBackground();
    syncUI();
  });

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
    document.documentElement.style.setProperty('--overlay-strength', settings.overlayStrength / 100);
    saveSettings();
  });

  // Tab title input
  tabTitleInput.addEventListener('input', () => {
    settings.tabTitle = tabTitleInput.value.trim();
    applyTabTitle();
    saveSettings();
  });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!aboutPanel.hasAttribute('hidden')) {
        closeAbout();
      } else if (!panel.hasAttribute('hidden')) {
        closePanel();
      }
    }
  });

  // --- Init ---
  loadSettings();

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
  const t = (k) => (window.__i18n && window.__i18n.t(k)) || k;
  fontOptions.innerHTML = `
    <button class="font-option" data-font="serif">
      <span class="font-preview" style="font-family: ${FONT_STACKS.serif}">Aa</span>
      <span class="font-name">${t('settings.fontSerif')}</span>
    </button>
    <button class="font-option" data-font="system">
      <span class="font-preview" style="font-family: ${FONT_STACKS.system}">Aa</span>
      <span class="font-name">${t('settings.fontSystem')}</span>
    </button>
    <button class="font-option" data-font="mono">
      <span class="font-preview" style="font-family: ${FONT_STACKS.mono}">Aa</span>
      <span class="font-name">${t('settings.fontMono')}</span>
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

  // Expose for search.js dropdown settings entry
  window.__settingsPanel = { open: openPanel };

  // Apply on load
  applyAll();
})();
