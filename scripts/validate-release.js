const fs = require('fs');
const path = require('path');
const vm = require('vm');
const zlib = require('zlib');

const root = path.resolve(__dirname, '..');
const SUGGESTION_ORIGINS = [
  'https://suggestqueries.google.com/*',
  'https://www.baidu.com/*',
  'https://api.bing.com/*',
  'https://duckduckgo.com/*',
];
const targets = [
  {
    name: 'generic',
    cwd: root,
    manifest: path.join(root, 'manifest.json'),
    zipName(version) { return `WillowTab-v${version}.zip`; },
    versionFiles: ['newtab.html', 'README.md', 'README.zh-CN.md', 'js/i18n.js'],
  },
  {
    name: 'chrome',
    cwd: path.join(root, 'chrome-store'),
    manifest: path.join(root, 'chrome-store', 'manifest.json'),
    zipName(version) { return `WillowTab-for-Chrome-v${version}.zip`; },
    versionFiles: ['newtab.html', 'js/i18n.js'],
  },
];

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function getPackageFiles() {
  const packScript = fs.readFileSync(path.join(root, 'pack-zip.js'), 'utf8');
  const match = /const files = (\[[\s\S]*?\]);/.exec(packScript);
  if (!match) fail('Unable to find the package file list in pack-zip.js');
  return vm.runInNewContext(match[1], Object.create(null));
}

function readZipEntries(zipPath) {
  const buf = fs.readFileSync(zipPath);
  const label = path.relative(root, zipPath);
  let eocdOffset = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 0xffff); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50 && i + 22 + buf.readUInt16LE(i + 20) === buf.length) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) fail(`Invalid zip, missing EOCD: ${label}`);

  const entryCount = buf.readUInt16LE(eocdOffset + 10);
  const centralDirectorySize = buf.readUInt32LE(eocdOffset + 12);
  const centralDirectoryOffset = buf.readUInt32LE(eocdOffset + 16);
  if (buf.readUInt32LE(eocdOffset + 4) !== 0 || buf.readUInt16LE(eocdOffset + 8) !== entryCount ||
      centralDirectoryOffset + centralDirectorySize !== eocdOffset) {
    fail(`Invalid zip central directory: ${label}`);
  }
  const entries = [];
  let offset = centralDirectoryOffset;

  for (let i = 0; i < entryCount; i++) {
    if (offset + 46 > eocdOffset || buf.readUInt32LE(offset) !== 0x02014b50) {
      fail(`Invalid central directory entry in ${label}`);
    }
    const flags = buf.readUInt16LE(offset + 8);
    const method = buf.readUInt16LE(offset + 10);
    const crc = buf.readUInt32LE(offset + 16);
    const compressedSize = buf.readUInt32LE(offset + 20);
    const uncompressedSize = buf.readUInt32LE(offset + 24);
    const nameLength = buf.readUInt16LE(offset + 28);
    const extraLength = buf.readUInt16LE(offset + 30);
    const commentLength = buf.readUInt16LE(offset + 32);
    const nextOffset = offset + 46 + nameLength + extraLength + commentLength;
    const localOffset = buf.readUInt32LE(offset + 42);
    if (!nameLength || nextOffset > eocdOffset || (flags & 9) || ![0, 8].includes(method) ||
        localOffset + 30 > centralDirectoryOffset || buf.readUInt32LE(localOffset) !== 0x04034b50) {
      fail(`Invalid zip entry in ${label}`);
    }
    const nameBytes = buf.subarray(offset + 46, offset + 46 + nameLength);
    const name = nameBytes.toString('utf8');
    const localNameLength = buf.readUInt16LE(localOffset + 26);
    const dataOffset = localOffset + 30 + localNameLength + buf.readUInt16LE(localOffset + 28);
    const dataEnd = dataOffset + compressedSize;
    if (dataEnd > centralDirectoryOffset || localNameLength !== nameLength ||
        !nameBytes.equals(buf.subarray(localOffset + 30, localOffset + 30 + localNameLength)) ||
        buf.readUInt16LE(localOffset + 6) !== flags || buf.readUInt16LE(localOffset + 8) !== method ||
        buf.readUInt32LE(localOffset + 14) !== crc || buf.readUInt32LE(localOffset + 18) !== compressedSize ||
        buf.readUInt32LE(localOffset + 22) !== uncompressedSize) {
      fail(`Invalid local zip entry in ${label}: ${name}`);
    }
    entries.push({ name, method, crc, uncompressedSize, data: buf.subarray(dataOffset, dataEnd), localOffset, dataEnd });
    offset = nextOffset;
  }

  if (offset !== eocdOffset) fail(`Unexpected zip directory data in ${label}`);
  let localEnd = 0;
  for (const entry of [...entries].sort((first, second) => first.localOffset - second.localOffset)) {
    if (entry.localOffset !== localEnd) fail(`Unexpected local zip data in ${label}: ${entry.name}`);
    localEnd = entry.dataEnd;
  }
  if (localEnd !== centralDirectoryOffset) fail(`Unexpected zip data before central directory in ${label}`);
  return entries;
}

function assertSameList(actual, expected, label) {
  const actualNames = actual.map((entry) => entry.name);
  const missing = expected.filter((item) => !actualNames.includes(item));
  const extra = actualNames.filter((item) => !expected.includes(item));
  if (missing.length || extra.length) {
    fail(`${label} mismatch. Missing: ${missing.join(', ') || 'none'}; Extra: ${extra.join(', ') || 'none'}`);
  }
}

function assertNoDuplicateEntries(entries, label) {
  const seen = new Set();
  const duplicates = new Set();
  for (const entry of entries) {
    if (seen.has(entry.name)) duplicates.add(entry.name);
    seen.add(entry.name);
  }
  if (duplicates.size) {
    fail(`${label} has duplicate entries: ${Array.from(duplicates).join(', ')}`);
  }
}

function crc32(buf) {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  let c = 0xffffffff;
  for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function assertZipFresh(target, entries) {
  for (const entry of entries) {
    const source = fs.readFileSync(path.join(target.cwd, entry.name));
    if (entry.uncompressedSize !== source.length) {
      fail(`${target.name} zip contains stale content for ${entry.name}`);
    }
    let content = entry.data;
    if (entry.method === 8) {
      try {
        const result = zlib.inflateRawSync(entry.data, { maxOutputLength: Math.max(1, source.length), info: true });
        if (result.engine.bytesWritten !== entry.data.length) throw new Error('Unexpected trailing compressed data');
        content = result.buffer;
      } catch (error) {
        fail(`${target.name} zip entry could not be extracted: ${entry.name} (${error.message})`);
      }
    }
    if (content.length !== entry.uncompressedSize || crc32(content) !== entry.crc) {
      fail(`${target.name} zip entry has corrupt content: ${entry.name}`);
    }
    if (!content.equals(source)) {
      fail(`${target.name} zip contains stale content for ${entry.name}`);
    }
  }
}

function assertVersionReferences(target, version) {
  const expectedVersionText = `v${version}`;
  const expectedGenericZip = `WillowTab-v${version}.zip`;
  const expectedChromeZip = `WillowTab-for-Chrome-v${version}.zip`;

  for (const relativeFile of target.versionFiles) {
    const file = path.join(target.cwd, relativeFile);
    if (!fs.existsSync(file)) fail(`Missing versioned file for ${target.name}: ${relativeFile}`);
    const text = fs.readFileSync(file, 'utf8');

    if (relativeFile.endsWith('newtab.html') && !text.includes(expectedVersionText)) {
      fail(`${target.name}/${relativeFile} does not contain ${expectedVersionText}`);
    }

    if (relativeFile.endsWith('i18n.js')) {
      const versionRefs = Array.from(text.matchAll(/WillowTab v(\d+\.\d+\.\d+)/g), (match) => match[1]);
      const staleRefs = versionRefs.filter((ref) => ref !== version);
      if (staleRefs.length) {
        fail(`${target.name}/${relativeFile} contains stale WillowTab version refs: ${staleRefs.join(', ')}`);
      }
    }

    if (target.name === 'generic' && relativeFile.startsWith('README')) {
      if (!text.includes(expectedGenericZip)) fail(`README.md does not contain ${expectedGenericZip}`);
      if (!text.includes(expectedChromeZip)) fail(`README.md does not contain ${expectedChromeZip}`);
    }
  }
}

function assertLocalesNotFlattened(entries, label) {
  const requiredLocales = ['_locales/en/messages.json', '_locales/zh_CN/messages.json'];
  const names = entries.map((entry) => entry.name);
  for (const localePath of requiredLocales) {
    if (!names.includes(localePath)) fail(`${label} is missing ${localePath}`);
  }
  if (names.includes('messages.json')) {
    fail(`${label} contains flattened messages.json at zip root`);
  }
}

function assertExactStringSet(actual, expected, label) {
  const actualValues = Array.isArray(actual) ? actual : [];
  const missing = expected.filter((value) => !actualValues.includes(value));
  const extra = actualValues.filter((value) => !expected.includes(value));
  if (missing.length || extra.length || actualValues.length !== expected.length) {
    fail(`${label} mismatch. Missing: ${missing.join(', ') || 'none'}; Extra: ${extra.join(', ') || 'none'}`);
  }
}

function assertVariantSemantics(manifests) {
  const generic = manifests.find(({ target }) => target.name === 'generic');
  const chrome = manifests.find(({ target }) => target.name === 'chrome');
  if (!generic || !chrome) fail('Missing generic or Chrome release target');

  assertExactStringSet(generic.manifest.host_permissions, SUGGESTION_ORIGINS, 'generic host_permissions');
  assertExactStringSet(generic.manifest.permissions, [], 'generic permissions');
  assertExactStringSet(generic.manifest.optional_host_permissions, [], 'generic optional_host_permissions');

  assertExactStringSet(chrome.manifest.permissions, ['search'], 'chrome permissions');
  assertExactStringSet(chrome.manifest.optional_host_permissions, SUGGESTION_ORIGINS, 'chrome optional_host_permissions');
  assertExactStringSet(chrome.manifest.host_permissions, [], 'chrome host_permissions');

  for (const { target } of manifests) {
    const html = fs.readFileSync(path.join(target.cwd, 'newtab.html'), 'utf8');
    if (/<html\b[^>]*\bdata-variant="chrome-store"/.test(html) !== (target.name === 'chrome')) {
      fail(`${target.name} has an incorrect runtime variant`);
    }
  }
  for (const file of ['assets.js', 'preferences.js', 'search.js', 'settings.js', 'theme.js', 'wallpaper-color.js', 'wallpaper-policy.js']) {
    const genericFile = fs.readFileSync(path.join(generic.target.cwd, 'js', file));
    const chromeFile = fs.readFileSync(path.join(chrome.target.cwd, 'js', file));
    if (!genericFile.equals(chromeFile)) fail(`generic and Chrome Store ${file} differ`);
  }
}

function main() {
  const files = getPackageFiles();
  const manifests = targets.map((target) => ({ target, manifest: readJson(target.manifest) }));
  const versions = new Set(manifests.map(({ manifest }) => manifest.version));
  if (versions.size !== 1) {
    fail(`Manifest versions differ: ${manifests.map(({ target, manifest }) => `${target.name}=${manifest.version}`).join(', ')}`);
  }
  const version = manifests[0].manifest.version;
  if (!version) fail('Manifest version is empty');
  assertVariantSemantics(manifests);

  for (const { target } of manifests) {
    for (const file of files) {
      const absolute = path.join(target.cwd, file);
      if (!fs.existsSync(absolute)) {
        fail(`${target.name} package file is missing: ${file}`);
      }
    }

    assertVersionReferences(target, version);

    const zipPath = path.join(target.cwd, target.zipName(version));
    if (!fs.existsSync(zipPath)) {
      fail(`${target.name} zip is missing: ${path.relative(root, zipPath)}`);
    }

    const entries = readZipEntries(zipPath);
    assertNoDuplicateEntries(entries, `${target.name} zip`);
    assertSameList(entries, files, `${target.name} zip entries`);
    assertLocalesNotFlattened(entries, `${target.name} zip`);
    assertZipFresh(target, entries);
  }

  console.log(`Release validation passed for v${version}.`);
}

try {
  main();
} catch (error) {
  console.error(`Release validation failed: ${error.message}`);
  process.exit(1);
}
