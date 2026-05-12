// i18n — Simplified Chinese ↔ English
(() => {
  const DICT = {
    'zh-CN': {
      // Greetings
      'greeting.default': '你好',
      'greeting.深夜': '夜深了，注意休息',
      'greeting.早上好': '早上好',
      'greeting.上午好': '上午好',
      'greeting.中午好': '中午好',
      'greeting.下午好': '下午好',
      'greeting.晚上好': '晚上好',

      // Search
      'search.placeholder': 'Think Different.',
      'search.toggleEngine': '切换搜索引擎',
      'search.settings': '设置',

      // Engine names
      'engine.baidu': '百度',

      // Settings panel
      'settings.title': '设置',
      'settings.close': '关闭',
      'settings.background': '背景',
      'settings.bgMode': '背景模式',
      'settings.bgColorMode': '纯色背景',
      'settings.bgWallpaperMode': '壁纸',
      'settings.presetColors': '预设颜色',
      'settings.customColor': '自选颜色',
      'settings.wallpaperSettings': '壁纸设置',
      'settings.selectFolder': '选择文件夹',
      'settings.overlayStrength': '遮罩强度',
      'settings.displayMode': '显示模式',
      'settings.followSystem': '跟随系统',
      'settings.dark': '深色',
      'settings.light': '浅色',
      'settings.font': '字体',
      'settings.fontSerif': '衬线体',
      'settings.fontSystem': '系统默认',
      'settings.fontMono': '等宽体',
      'settings.radius': '圆角',
      'settings.radiusRounded': '圆润',
      'settings.radiusSquare': '方正',
      'settings.radiusSlight': '微圆',
      'settings.radiusCapsule': '胶囊',
      'settings.shadow': '阴影',
      'settings.shadowStrength': '阴影强度',
      'settings.settingsBtnPosition': '设置按钮位置',
      'settings.btnPosFooter': '搜索框底部',
      'settings.btnPosDropdown': '搜索引擎菜单',

      // About
      'about.title': '关于 UniTab',
      'about.close': '关闭',
      'about.description': 'UniTab 是一个特别的浏览器新标签页扩展，致力于为您带来简洁高效的浏览器启动与搜索体验。',
      'about.author': '作者',
      'about.github': 'GitHub',
      'about.license': '本程序为开源软件，遵循 GNU General Public License v3 协议。',

      // Colors
      'color.beige': '米灰',
      'color.sage': '鼠尾草',

      // Wallpaper
      'wallpaper.empty': '暂无壁纸，请选择文件夹添加',
      'wallpaper.delete': '删除',
      'wallpaper.oldWallpaper': '旧壁纸',

      // Toast
      'toast.addedAndSkipped': '新增 {added} 张，跳过 {skipped} 张重复',
      'toast.allSkipped': '全部 {skipped} 张已存在，已跳过',

      // Error
      'error.quotaExceeded': '存储空间不足，已清除所有壁纸。请删除部分壁纸后重新添加。',

      // Hint
      'hint.darkColorDisabled': '仅在浅色模式下可用',
    },
    en: {
      // Greetings
      'greeting.default': 'Hello',
      'greeting.深夜': 'Good night',
      'greeting.早上好': 'Good morning',
      'greeting.上午好': 'Good morning',
      'greeting.中午好': 'Good afternoon',
      'greeting.下午好': 'Good afternoon',
      'greeting.晚上好': 'Good evening',

      // Search
      'search.placeholder': 'Think Different.',
      'search.toggleEngine': 'Switch search engine',
      'search.settings': 'Settings',

      // Engine names
      'engine.baidu': 'Baidu',

      // Settings panel
      'settings.title': 'Settings',
      'settings.close': 'Close',
      'settings.background': 'Background',
      'settings.bgMode': 'Background Mode',
      'settings.bgColorMode': 'Solid Color',
      'settings.bgWallpaperMode': 'Wallpaper',
      'settings.presetColors': 'Preset Colors',
      'settings.customColor': 'Custom Color',
      'settings.wallpaperSettings': 'Wallpaper Settings',
      'settings.selectFolder': 'Select Folder',
      'settings.overlayStrength': 'Overlay Opacity',
      'settings.displayMode': 'Display Mode',
      'settings.followSystem': 'Follow System',
      'settings.dark': 'Dark',
      'settings.light': 'Light',
      'settings.font': 'Font',
      'settings.fontSerif': 'Serif',
      'settings.fontSystem': 'System Default',
      'settings.fontMono': 'Monospace',
      'settings.radius': 'Corner Radius',
      'settings.radiusRounded': 'Rounded',
      'settings.radiusSquare': 'Square',
      'settings.radiusSlight': 'Slightly Round',
      'settings.radiusCapsule': 'Capsule',
      'settings.shadow': 'Shadow',
      'settings.shadowStrength': 'Shadow Strength',
      'settings.settingsBtnPosition': 'Settings Button',
      'settings.btnPosFooter': 'Below Search',
      'settings.btnPosDropdown': 'Engine Menu',

      // About
      'about.title': 'About UniTab',
      'about.close': 'Close',
      'about.description': 'UniTab is a distinctive browser new tab extension, dedicated to bringing you a clean and efficient browser launch and search experience.',
      'about.author': 'Author',
      'about.github': 'GitHub',
      'about.license': 'This program is open source software, licensed under the GNU General Public License v3.',

      // Colors
      'color.beige': 'Beige',
      'color.sage': 'Sage',

      // Wallpaper
      'wallpaper.empty': 'No wallpapers. Select a folder to add some.',
      'wallpaper.delete': 'Delete',
      'wallpaper.oldWallpaper': 'Old Wallpaper',

      // Toast
      'toast.addedAndSkipped': '{added} added, {skipped} duplicates skipped',
      'toast.allSkipped': 'All {skipped} already exist, skipped',

      // Error
      'error.quotaExceeded': 'Storage full. All wallpapers cleared. Please remove some wallpapers and try again.',

      // Hint
      'hint.darkColorDisabled': 'Only available in light mode',
    },
  };

  // 只检查浏览器首选语言；非中文一律返回英文，不做 zh-TW/zh-HK 细分
  function detectLang() {
    const primary = navigator.language;
    if (primary && primary.startsWith('zh')) return 'zh-CN';
    return 'en';
  }
  const state = { lang: detectLang() };

  window.__i18n = {
    get lang() { return state.lang; },
    set lang(v) { state.lang = v; },
    // 回退链：当前语言 → 英语（最完整）→ 原始 key（兜底，避免显示 undefined）
    t(key, vars) {
      let text = (DICT[state.lang] && DICT[state.lang][key]) || DICT.en[key] || key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          text = text.replace(`{${k}}`, v);
        }
      }
      return text;
    },
  };

  // Apply translations to DOM on load
  function applyDOM() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = window.__i18n.t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.setAttribute('placeholder', window.__i18n.t(el.getAttribute('data-i18n-placeholder')));
    });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      el.setAttribute('title', window.__i18n.t(el.getAttribute('data-i18n-title')));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      el.setAttribute('aria-label', window.__i18n.t(el.getAttribute('data-i18n-aria')));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyDOM);
  } else {
    applyDOM();
  }
})();
