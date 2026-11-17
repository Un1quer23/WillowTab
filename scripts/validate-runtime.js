const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const policy = require(path.join(root, 'js', 'wallpaper-policy.js'));
const color = require(path.join(root, 'js', 'color.js'));

function fakeFile(name, size, relativePath = '') {
  return { name, size, webkitRelativePath: relativePath };
}

function assertPolicyBoundaries() {
  const { LIMITS } = policy;
  assert.deepStrictEqual(LIMITS, {
    maxFileBytes: 50 * 1024 * 1024,
    maxBatchFiles: 300,
    maxBatchBytes: 1024 * 1024 * 1024,
    maxPixels: 64_000_000,
  });

  const maximumCount = Array.from({ length: LIMITS.maxBatchFiles }, (_, index) => fakeFile(`${index}.png`, 0));
  assert.strictEqual(policy.validateBatch(maximumCount).ok, true);
  assert.strictEqual(policy.validateBatch([...maximumCount, fakeFile('overflow.png', 0)]).reason, 'too_many_files');

  assert.strictEqual(policy.validateBatch([fakeFile('exact.bin', LIMITS.maxBatchBytes)]).ok, true);
  assert.strictEqual(policy.validateBatch([fakeFile('over.bin', LIMITS.maxBatchBytes + 1)]).reason, 'batch_too_large');
  assert.strictEqual(policy.validateFile(fakeFile('exact.png', LIMITS.maxFileBytes)).ok, true);
  assert.strictEqual(policy.validateFile(fakeFile('over.png', LIMITS.maxFileBytes + 1)).reason, 'file_too_large');
  assert.strictEqual(policy.validateFile(fakeFile('pixels.png', 1), 8000, 8000).ok, true);
  assert.strictEqual(policy.validateFile(fakeFile('pixels.png', 1), 8000, 8001).reason, 'image_too_large');

  const first = fakeFile('cover.jpg', 1, 'album-a/cover.jpg');
  const second = fakeFile('cover.jpg', 1, 'album-b/cover.jpg');
  assert.notStrictEqual(policy.getFileIdentity(first, 'folder'), policy.getFileIdentity(second, 'folder'));
  assert.strictEqual(
    policy.getFileIdentity(first, 'folder'),
    policy.getFileIdentity({ name: 'cover.jpg', sourcePath: 'ALBUM-A\\cover.jpg' }, 'folder'),
  );
}

function assertRuntimeWiring() {
  const expectedPresetColors = [
    '#BFBB98', '#E7E1D3', '#C9D5CF', '#C8D4E3', '#D7CEDC', '#DDBFB2',
  ];
  let genericPresetBlock = '';
  for (const prefix of ['', 'chrome-store/']) {
    const html = fs.readFileSync(path.join(root, prefix, 'newtab.html'), 'utf8');
    assert.match(html, /id="toast-region"[^>]*role="status"[^>]*aria-live="polite"[^>]*aria-atomic="true"/);
    assert.match(html, /<script src="js\/wallpaper-policy\.js"><\/script>/);
    assert.match(html, /<script src="js\/color\.js"><\/script>\s*<script src="js\/preferences\.js"><\/script>\s*<script src="js\/assets\.js"><\/script>\s*<script src="js\/theme\.js"><\/script>\s*<link rel="stylesheet"/);
    assert.match(html, /id="search-submit"[^>]*data-i18n-aria="search\.submit"[^>]*data-i18n-title="search\.submit"/);
    assert.doesNotMatch(html, /type="color"/);
    assert.match(html, /id="custom-color-hue"[^>]*min="0"[^>]*max="359"/);
    assert.match(html, /id="custom-color-chroma"[^>]*min="0"[^>]*max="140"/);
    assert.match(html, /id="custom-color-lightness"[^>]*min="320"[^>]*max="1000"/);
    assert.match(html, /id="custom-color-error"[^>]*role="status"[^>]*aria-live="polite"/);
    assert.match(html, /id="custom-color-hex"[^>]*placeholder="#BFBB98"/);

    const search = fs.readFileSync(path.join(root, prefix, 'js', 'search.js'), 'utf8');
    assert.match(search, /requestId === suggestionRequestId/);
    assert.match(search, /ENGINES\[activeIndex\]\.id === engineId/);
    assert.match(search, /if \(!isCurrentRequest\(\)\) return;/);
    assert.match(search, /error\.name !== 'AbortError' && isCurrentRequest\(\)/);
    assert.match(search, /value === undefined \? !isChromeStore : value === true/);
    assert.match(search, /hasPermission\(\[suggestionOrigin\(engine\)\]\)/);
    assert.match(search, /onRemoved\?\.addListener\(refreshAvailability\)/);
    assert.match(search, /addEventListener\('compositionend'/);
    assert.match(search, /document\.documentElement\.dataset\.settingsBtnPosition === 'dropdown'/);

    const theme = fs.readFileSync(path.join(root, prefix, 'js', 'theme.js'), 'utf8');
    assert.match(theme, /const DEFAULT_BACKGROUND_COLOR = '#BFBB98'/);
    assert.match(theme, /wallpaperAssets\.readStartupLibrary\(\)/);
    assert.match(theme, /setSettingsButtonPosition\(settings\.settingsBtnPosition\)/);
    assert.match(theme, /applySolidPalette\(color\)/);
    const settings = fs.readFileSync(path.join(root, prefix, 'js', 'settings.js'), 'utf8');
    assert.match(settings, /const DEFAULTS = \{[\s\S]*?bgColor: window\.__theme\.defaultBackgroundColor/);
    const presetStart = settings.indexOf('  const PRESET_COLORS = [');
    const presetEnd = settings.indexOf('  let settings = { ...DEFAULTS };', presetStart);
    assert(presetStart >= 0 && presetEnd > presetStart, `${prefix || 'generic'} preset block was not found`);
    const presetBlock = settings.slice(presetStart, presetEnd);
    assert.doesNotMatch(presetBlock, /#F5F5DC/i, 'Beige must not remain in the preset list');
    assert.deepStrictEqual(
      [...presetBlock.matchAll(/value:\s*'(#[0-9A-F]{6})'/g)].map((match) => match[1]),
      expectedPresetColors,
      `${prefix || 'generic'} preset color order changed unexpectedly`,
    );
    if (!prefix) genericPresetBlock = presetBlock;
    else assert.strictEqual(presetBlock, genericPresetBlock, 'Chrome preset colors drifted from the generic build');
    assert.match(settings, /wallpaperAssets\.initialize\(/);
    assert.doesNotMatch(settings, /reconcileWallpaperStorage|serializeSettings/);
    assert.match(settings, /sourcePath: wallpaperPolicy\.getImportPath/);
    assert.match(settings, /wallpaperAssets\.getThumbnail\(/);
    assert.match(settings, /preferences\.write\(field, value\)/);
    assert.match(settings, /activeColorPalette = window\.__theme\.applySolidPalette\(bgColor\)/);
    assert.match(theme, /--search-control-hover-surface/);
    assert.match(theme, /--search-control-focus-ring/);
    assert.match(theme, /colors\.searchSelectedText/);
    assert.match(settings, /function normalizeLoadedCustomColor\(\)/);
    assert.match(settings, /constrainSolidBackground\(settings\.bgColor\)/);
    assert.match(settings, /if \(normalizeLoadedCustomColor\(\)\) saveSetting\('bgColor'\);/);
    assert.match(settings, /showToast\(t\(customColorMigrationNotice\)\)/);
    assert.match(settings, /setCustomColorValidation\(inspection\.violations\)/);
    assert.match(settings, /\[customColorHue, customColorChroma, customColorLightness\]/);
    assert.doesNotMatch(settings, /useSuggestedColor|customColorPicker/);
  }
}

function assertPrivacyDisclosure() {
  for (const prefix of ['', 'chrome-store/']) {
    const label = prefix || 'generic';
    const privacy = fs.readFileSync(path.join(root, prefix, 'privacy-policy.html'), 'utf8');
    const html = fs.readFileSync(path.join(root, prefix, 'newtab.html'), 'utf8');
    const i18n = fs.readFileSync(path.join(root, prefix, 'js', 'i18n.js'), 'utf8');

    assert.match(privacy, /datetime="2026-08-11"/, `${label} privacy date is stale`);
    assert.match(privacy, /privacy\.section4\.li3/, `${label} privacy policy omits the search permission`);
    assert.match(privacy, /搜索联想开关/, `${label} privacy policy omits the local suggestions setting`);
    assert.match(privacy, /IP 地址和浏览器请求头/, `${label} privacy policy omits routine network information`);
    assert.doesNotMatch(privacy, /不收集、不存储、不传输|不存在服务器端数据泄露的风险/);

    assert.match(html, /settings\.suggestionsDesc">开启后，输入的关键词会发送到当前选择的搜索引擎/);
    assert.match(i18n, /'privacy\.section4\.li3':/);
    assert.match(i18n, /August 11, 2026/);
    assert.match(i18n, /such as an IP address and browser request headers/);
    assert.doesNotMatch(i18n, /completely offline|no risk of server-side data breaches/);
  }

  const genericManifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  const chromeManifest = JSON.parse(fs.readFileSync(path.join(root, 'chrome-store', 'manifest.json'), 'utf8'));
  assert.strictEqual(genericManifest.permissions?.includes('search') || false, false);
  assert.strictEqual(chromeManifest.permissions?.includes('search'), true);
}

function runCustomColorMigration(settingsSource, bgColor) {
  const start = settingsSource.indexOf('  function normalizeLoadedCustomColor() {');
  const end = settingsSource.indexOf('  function loadSettings() {', start);
  assert(start >= 0 && end > start, 'Custom-color migration function was not found');
  const functionSource = settingsSource.slice(start, end);
  const sandbox = {
    DEFAULTS: { bgColor: '#BFBB98' },
    settings: { bgColor },
    window: { __willowColor: color },
    customColorMigrationNotice: '',
    migrationChanged: null,
  };
  vm.runInNewContext(
    `${functionSource}\nmigrationChanged = normalizeLoadedCustomColor();`,
    sandbox,
    { filename: 'custom-color-migration.js' },
  );
  return {
    changed: sandbox.migrationChanged,
    bgColor: sandbox.settings.bgColor,
    notice: sandbox.customColorMigrationNotice,
  };
}

function assertCustomColorMigration() {
  const source = fs.readFileSync(path.join(root, 'js', 'settings.js'), 'utf8');
  assert.deepStrictEqual(runCustomColorMigration(source, '#5577AA'), {
    changed: false,
    bgColor: '#5577AA',
    notice: '',
  });
  assert.deepStrictEqual(runCustomColorMigration(source, '#000000'), {
    changed: true,
    bgColor: '#333333',
    notice: 'notice.customColorAdjusted',
  });
  for (const invalid of ['not-a-color', 42, null]) {
    assert.deepStrictEqual(runCustomColorMigration(source, invalid), {
      changed: true,
      bgColor: '#BFBB98',
      notice: 'notice.customColorReset',
    });
  }
  assert.deepStrictEqual(runCustomColorMigration(source, ''), {
    changed: true,
    bgColor: '#BFBB98',
    notice: '',
  });
}

function assertMinuteClock() {
  const source = fs.readFileSync(path.join(root, 'js', 'clock.js'), 'utf8');
  assert.doesNotMatch(source, /setInterval\s*\(/);

  const scheduled = [];
  const cleared = [];
  const listeners = {};
  let now = new Date(2026, 0, 1, 8, 59).getTime();
  let showGreeting;
  const elements = {
    time: { textContent: '', dateTime: '' },
    greeting: { textContent: '', hidden: true },
  };
  const sandbox = {
    Date: class extends Date {
      constructor() { super(now); }
      static now() { return now; }
    },
    document: {
      hidden: false,
      getElementById(id) { return elements[id]; },
      addEventListener(type, listener) { listeners[`document:${type}`] = listener; },
    },
    window: {
      __i18n: { t(key) { return key; } },
      __willowPreferences: {
        readEntry() { return { value: showGreeting }; },
        subscribe(listener) { listeners.preferences = listener; },
      },
      addEventListener(type, listener) { listeners[`window:${type}`] = listener; },
    },
    setTimeout(callback, delay) {
      scheduled.push({ callback, delay });
      return scheduled.length;
    },
    clearTimeout(timer) { cleared.push(timer); },
  };
  vm.runInNewContext(source, sandbox, { filename: 'js/clock.js' });
  assert.strictEqual(scheduled.length, 1);
  assert(scheduled[0].delay > 0 && scheduled[0].delay <= 60025);
  assert.strictEqual(elements.greeting.hidden, false);
  assert.strictEqual(elements.greeting.textContent, 'greeting.早上好');
  assert.strictEqual(typeof listeners['document:visibilitychange'], 'function');
  assert.strictEqual(typeof listeners['window:pagehide'], 'function');

  sandbox.document.hidden = true;
  listeners['document:visibilitychange']();
  assert.strictEqual(scheduled.length, 1);
  assert(cleared.length > 0);

  sandbox.document.hidden = false;
  listeners['document:visibilitychange']();
  assert.strictEqual(scheduled.length, 2);
  assert.match(elements.time.textContent, /^\d{2}:\d{2}$/);

  showGreeting = false;
  listeners.preferences('showGreeting');
  assert.strictEqual(elements.greeting.hidden, true);
  now += 60000;
  scheduled.at(-1).callback();
  assert.strictEqual(elements.time.textContent, '09:00');
  assert.strictEqual(elements.greeting.hidden, true);

  showGreeting = true;
  listeners.preferences('showGreeting');
  assert.strictEqual(elements.greeting.hidden, false);
  assert.strictEqual(elements.greeting.textContent, 'greeting.上午好');

  const clearsBeforePageHide = cleared.length;
  listeners['window:pagehide']();
  assert.strictEqual(cleared.length, clearsBeforePageHide + 1);
}

assertPolicyBoundaries();
assertRuntimeWiring();
assertPrivacyDisclosure();
assertCustomColorMigration();
assertMinuteClock();
console.log('Runtime validation passed.');
