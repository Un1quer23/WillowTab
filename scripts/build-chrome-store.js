const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const chromeDir = path.join(root, 'chrome-store');

const sharedFiles = [
  'css/style.css',
  'icons/icon128.png',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/ntp16.png',
  'icons/ntp48.png',
  'icons/ntp128.png',
  'js/clock.js',
  'js/color.js',
  'js/wallpaper-color.js',
  'js/wallpaper-policy.js',
  'js/assets.js',
  'js/theme.js',
  '_locales/en/messages.json',
  '_locales/zh_CN/messages.json',
  'LICENSE',
];

const chromeOverrides = [
  'manifest.json',
  'newtab.html',
  'README.md',
  'privacy-policy.html',
  'js/i18n.js',
  'js/search.js',
  'js/settings.js',
];

const sharedOverrideBlocks = [
  {
    file: 'newtab.html',
    start: '        <div class="setting-subgroup" id="color-section">',
    end: '\n      </section>\n\n      <div class="setting-group" id="wallpaper-section">',
  },
  {
    file: 'newtab.html',
    start: '          <span class="about-label" data-i18n="about.version">版本</span>',
    end: '          <span class="about-label" data-i18n="about.author">作者</span>',
  },
  {
    file: 'js/i18n.js',
    start: "      'settings.customColor': '自选颜色',",
    end: "      'settings.wallpaperSettings': '壁纸设置',",
  },
  {
    file: 'js/i18n.js',
    start: "      'settings.customColor': 'Custom Color',",
    end: "      'settings.wallpaperSettings': 'Wallpaper Settings',",
  },
  {
    file: 'js/i18n.js',
    start: "      'about.license': '本程序为开源软件，遵循 GNU General Public License v3 协议。',",
    end: "      'wallpaper.empty':",
  },
  {
    file: 'js/i18n.js',
    start: "      'about.license': 'This program is open source software, licensed under the GNU General Public License v3.',",
    end: "      'wallpaper.empty':",
  },
  {
    file: 'js/settings.js',
    start: '  const PRESET_COLORS = [',
    end: '  let settings = { ...DEFAULTS };',
  },
  {
    file: 'js/settings.js',
    start: "    bgMode: 'color',",
    end: '    wallpapers: [],',
  },
  {
    file: 'js/settings.js',
    start: "  const shadowValue = document.getElementById('shadow-value');",
    end: "  const themeSection = document.getElementById('theme-section');",
  },
  {
    file: 'js/settings.js',
    start: '  let resizeSyncTimer = null;',
    end: '  const selectedWallpaperIds = new Set();',
  },
  {
    file: 'js/settings.js',
    start: '  function effectiveThemeIsDark() {',
    end: '  async function migrateWallpaperStorage() {',
  },
  {
    file: 'js/settings.js',
    start: '  function clearColorReadabilityVars() {',
    end: '  function summarizeImageData(imageData, width, height) {',
  },
  {
    file: 'js/settings.js',
    start: "    colorPresets.querySelectorAll('.color-swatch').forEach((swatch) => {",
    end: '    renderWallpaperGallery();',
  },
  {
    file: 'js/settings.js',
    start: '  function applyAll() {',
    end: '  function createOverlay() {',
  },
  {
    file: 'js/settings.js',
    start: "  colorPresets.addEventListener('click', (e) => {",
    end: '  function isWallpaperFile(file) {',
  },
];

function copyFile(relativePath) {
  const from = path.join(root, relativePath);
  const to = path.join(chromeDir, relativePath);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function assertExists(relativePath) {
  const file = path.join(chromeDir, relativePath);
  if (!fs.existsSync(file)) {
    throw new Error(`Missing Chrome override: ${relativePath}`);
  }
}

function getBlock(source, start, end, label) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  if (startIndex === -1 || endIndex === -1) {
    throw new Error(`Missing shared block boundary in ${label}`);
  }
  if (source.indexOf(start, startIndex + start.length) !== -1) {
    throw new Error(`Duplicate shared block start in ${label}`);
  }
  return { startIndex, endIndex, content: source.slice(startIndex, endIndex) };
}

function syncOverrideBlock({ file, start, end }) {
  const from = path.join(root, file);
  const to = path.join(chromeDir, file);
  const source = fs.readFileSync(from, 'utf8');
  const target = fs.readFileSync(to, 'utf8');
  const sourceBlock = getBlock(source, start, end, file);
  const targetBlock = getBlock(target, start, end, `chrome-store/${file}`);
  const next = target.slice(0, targetBlock.startIndex)
    + sourceBlock.content
    + target.slice(targetBlock.endIndex);
  fs.writeFileSync(to, next);
}

for (const file of sharedFiles) {
  copyFile(file);
}

for (const block of sharedOverrideBlocks) {
  syncOverrideBlock(block);
}

for (const file of chromeOverrides) {
  assertExists(file);
}

console.log(`Synced ${sharedFiles.length} shared files into chrome-store.`);
console.log(`Synced ${sharedOverrideBlocks.length} shared override blocks into chrome-store.`);
console.log(`Kept ${chromeOverrides.length} Chrome Web Store override files.`);
