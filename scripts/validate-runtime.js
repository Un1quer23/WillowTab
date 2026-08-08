const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const policy = require(path.join(root, 'js', 'wallpaper-policy.js'));

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
  for (const prefix of ['', 'chrome-store/']) {
    const html = fs.readFileSync(path.join(root, prefix, 'newtab.html'), 'utf8');
    assert.match(html, /id="toast-region"[^>]*role="status"[^>]*aria-live="polite"[^>]*aria-atomic="true"/);
    assert.match(html, /<script src="js\/wallpaper-policy\.js"><\/script>/);

    const search = fs.readFileSync(path.join(root, prefix, 'js', 'search.js'), 'utf8');
    assert.match(search, /requestId === suggestionRequestId/);
    assert.match(search, /ENGINES\[activeIndex\]\.id === engine\.id/);
    assert.match(search, /if \(!isCurrentRequest\(\)\) return;/);
    assert.match(search, /err\.name !== 'AbortError' && isCurrentRequest\(\)/);

    const settings = fs.readFileSync(path.join(root, prefix, 'js', 'settings.js'), 'utf8');
    assert.match(settings, /\.then\(reconcileWallpaperStorage\)/);
    assert.match(settings, /await wallpaperAssets\.removeMany\(addedIds\)/);
    assert.match(settings, /sourcePath,/);
    assert.match(settings, /settings\.wallpapers = validWallpapers;\s+normalizeSettings\(\);\s+if \(!saveSettingsNow\(\)\)/);
  }
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
assertMinuteClock();
console.log('Runtime validation passed.');
