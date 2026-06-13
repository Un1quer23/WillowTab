const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const targets = [
  {
    name: 'generic',
    cwd: root,
    manifest: path.join(root, 'manifest.json'),
    zipName(version) { return `WillowTab-v${version}.zip`; },
    versionFiles: ['newtab.html', 'README.md', 'js/i18n.js'],
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
  let eocdOffset = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) fail(`Invalid zip, missing EOCD: ${path.relative(root, zipPath)}`);

  const entryCount = buf.readUInt16LE(eocdOffset + 10);
  const centralDirectoryOffset = buf.readUInt32LE(eocdOffset + 16);
  const entries = [];
  let offset = centralDirectoryOffset;

  for (let i = 0; i < entryCount; i++) {
    if (buf.readUInt32LE(offset) !== 0x02014b50) {
      fail(`Invalid central directory entry in ${path.relative(root, zipPath)}`);
    }
    const nameLength = buf.readUInt16LE(offset + 28);
    const extraLength = buf.readUInt16LE(offset + 30);
    const commentLength = buf.readUInt16LE(offset + 32);
    entries.push({
      name: buf.toString('utf8', offset + 46, offset + 46 + nameLength),
      crc: buf.readUInt32LE(offset + 16),
      uncompressedSize: buf.readUInt32LE(offset + 24),
    });
    offset += 46 + nameLength + extraLength + commentLength;
  }

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
  const byName = new Map(entries.map((entry) => [entry.name, entry]));
  for (const [name, entry] of byName) {
    const content = fs.readFileSync(path.join(target.cwd, name));
    const actualCrc = crc32(content);
    if (entry.uncompressedSize !== content.length || entry.crc !== actualCrc) {
      fail(`${target.name} zip contains stale content for ${name}`);
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

    if (relativeFile.endsWith('i18n.js') && !text.includes(`WillowTab ${expectedVersionText}`)) {
      fail(`${target.name}/${relativeFile} does not contain WillowTab ${expectedVersionText}`);
    }

    if (target.name === 'generic' && relativeFile === 'README.md') {
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

function main() {
  const files = getPackageFiles();
  const manifests = targets.map((target) => ({ target, manifest: readJson(target.manifest) }));
  const versions = new Set(manifests.map(({ manifest }) => manifest.version));
  if (versions.size !== 1) {
    fail(`Manifest versions differ: ${manifests.map(({ target, manifest }) => `${target.name}=${manifest.version}`).join(', ')}`);
  }
  const version = manifests[0].manifest.version;
  if (!version) fail('Manifest version is empty');

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
