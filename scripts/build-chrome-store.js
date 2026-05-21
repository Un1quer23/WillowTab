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

for (const file of sharedFiles) {
  copyFile(file);
}

for (const file of chromeOverrides) {
  assertExists(file);
}

console.log(`Synced ${sharedFiles.length} shared files into chrome-store.`);
console.log(`Kept ${chromeOverrides.length} Chrome Web Store override files.`);
