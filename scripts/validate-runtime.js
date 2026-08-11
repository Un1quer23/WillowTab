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
    assert.doesNotMatch(html, /type="color"/);
    assert.match(html, /id="custom-color-hue"[^>]*min="0"[^>]*max="359"/);
    assert.match(html, /id="custom-color-chroma"[^>]*min="0"[^>]*max="140"/);
    assert.match(html, /id="custom-color-lightness"[^>]*min="320"[^>]*max="1000"/);
    assert.match(html, /id="custom-color-error"[^>]*role="status"[^>]*aria-live="polite"/);
    assert.match(html, /id="custom-color-hex"[^>]*placeholder="#BFBB98"/);

    const search = fs.readFileSync(path.join(root, prefix, 'js', 'search.js'), 'utf8');
    assert.match(search, /requestId === suggestionRequestId/);
    assert.match(search, /ENGINES\[activeIndex\]\.id === engine\.id/);
    assert.match(search, /if \(!isCurrentRequest\(\)\) return;/);
    assert.match(search, /err\.name !== 'AbortError' && isCurrentRequest\(\)/);

    const settings = fs.readFileSync(path.join(root, prefix, 'js', 'settings.js'), 'utf8');
    assert.match(settings, /const DEFAULTS = \{[\s\S]*?bgColor: '#BFBB98'/);
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
    assert.match(settings, /\.then\(reconcileWallpaperStorage\)/);
    assert.match(settings, /await wallpaperAssets\.removeMany\(addedIds\)/);
    assert.match(settings, /sourcePath,/);
    assert.match(settings, /settings\.wallpapers = validWallpapers;\s+normalizeSettings\(\);\s+if \(!saveSettingsNow\(\)\)/);
    assert.match(settings, /const brandAccent = palette\.colors\.brandAccent/);
    assert.match(settings, /const searchAccent = palette\.colors\.searchAccent/);
    assert.match(settings, /--search-control-hover-surface/);
    assert.match(settings, /--search-control-focus-ring/);
    assert.match(settings, /palette\.colors\.searchSelectedText/);
    assert.match(settings, /function normalizeLoadedCustomColor\(\)/);
    assert.match(settings, /constrainSolidBackground\(settings\.bgColor\)/);
    assert.match(settings, /const customColorChanged = normalizeLoadedCustomColor\(\);\s+normalizeSettings\(\);\s+if \(customColorChanged\) saveSettingsNow\(\);/);
    assert.match(settings, /showToast\(t\(customColorMigrationNotice\)\)/);
    assert.match(settings, /setCustomColorValidation\(inspection\.violations\)/);
    assert.match(settings, /\[customColorHue, customColorChroma, customColorLightness\]/);
    assert.doesNotMatch(settings, /useSuggestedColor|customColorPicker/);
  }
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
  const elements = {
    time: { textContent: '', dateTime: '' },
    greeting: { textContent: '' },
  };
  const sandbox = {
    Date,
    document: {
      hidden: false,
      getElementById(id) { return elements[id]; },
      addEventListener(type, listener) { listeners[`document:${type}`] = listener; },
    },
    window: {
      __i18n: { t(key) { return key; } },
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

  const clearsBeforePageHide = cleared.length;
  listeners['window:pagehide']();
  assert.strictEqual(cleared.length, clearsBeforePageHide + 1);
}

assertPolicyBoundaries();
assertRuntimeWiring();
assertCustomColorMigration();
assertMinuteClock();
console.log('Runtime validation passed.');
