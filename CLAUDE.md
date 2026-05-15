# CLAUDE.md

## 语言偏好

请始终使用中文回复。

## 项目概述

WillowTab 是一个浏览器新标签页扩展，提供简洁的搜索体验，支持多搜索引擎切换、壁纸/纯色背景、深色/浅色主题等设置。

## 打包

使用 Node.js 打包 zip，**禁止**使用 PowerShell `Compress-Archive`（会丢弃目录结构，导致 `_locales/*/messages.json` 路径被展平为重名文件，Chrome Web Store 报"发现重复文件"）。

打包脚本模板（纯 stdlib，无第三方依赖）：

```js
const fs = require('fs');
const zlib = require('zlib');

const files = [
  'css/style.css',
  'icons/icon128.png', 'icons/icon16.png', 'icons/icon48.png',
  'icons/ntp16.png', 'icons/ntp48.png', 'icons/ntp128.png',
  'js/clock.js', 'js/i18n.js', 'js/search.js', 'js/settings.js', 'js/theme.js',
  '_locales/en/messages.json', '_locales/zh_CN/messages.json',
  'LICENSE', 'manifest.json', 'newtab.html', 'privacy-policy.html', 'README.md',
];

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

function dosDateTime() {
  const d = new Date();
  return ((d.getFullYear() - 1980) << 25) |
    ((d.getMonth() + 1) << 21) | (d.getDate() << 16) |
    (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
}

const localParts = [];
const cdEntries = [];
for (const file of files) {
  const content = fs.readFileSync(file);
  const nameBuf = Buffer.from(file.replace(/\\/g, '/'), 'utf8');
  const dt = dosDateTime();
  const crc = crc32(content);
  const compressed = zlib.deflateRawSync(content, { level: 9 });
  const useCompress = compressed.length < content.length;
  const method = useCompress ? 8 : 0;
  const data = useCompress ? compressed : content;
  const localOffset = localParts.reduce((s, p) => s + p.length, 0);
  const header = Buffer.alloc(30 + nameBuf.length);
  let i = 0;
  header.writeUInt32LE(0x04034b50, i); i += 4;
  header.writeUInt16LE(20, i); i += 2;
  header.writeUInt16LE(useCompress ? 2 : 0, i); i += 2;
  header.writeUInt16LE(method, i); i += 2;
  header.writeUInt32LE(dt, i); i += 4;
  header.writeUInt32LE(crc, i); i += 4;
  header.writeUInt32LE(data.length, i); i += 4;
  header.writeUInt32LE(content.length, i); i += 4;
  header.writeUInt16LE(nameBuf.length, i); i += 2;
  header.writeUInt16LE(0, i);
  nameBuf.copy(header, 30);
  localParts.push(header, data);
  cdEntries.push({ nameBuf, method, dt, crc, compSize: data.length, origSize: content.length, localOffset });
}
const cdOffset = localParts.reduce((s, p) => s + p.length, 0);
const cdParts = [];
for (const e of cdEntries) {
  const cd = Buffer.alloc(46 + e.nameBuf.length);
  let i = 0;
  cd.writeUInt32LE(0x02014b50, i); i += 4;
  cd.writeUInt16LE(20, i); i += 2;
  cd.writeUInt16LE(20, i); i += 2;
  cd.writeUInt16LE(e.method === 8 ? 2 : 0, i); i += 2;
  cd.writeUInt16LE(e.method, i); i += 2;
  cd.writeUInt32LE(e.dt, i); i += 4;
  cd.writeUInt32LE(e.crc, i); i += 4;
  cd.writeUInt32LE(e.compSize, i); i += 4;
  cd.writeUInt32LE(e.origSize, i); i += 4;
  cd.writeUInt16LE(e.nameBuf.length, i); i += 2;
  cd.writeUInt16LE(0, i); i += 2;
  cd.writeUInt16LE(0, i); i += 2;
  cd.writeUInt16LE(0, i); i += 2;
  cd.writeUInt16LE(0, i); i += 2;
  cd.writeUInt32LE(0, i); i += 4;
  cd.writeUInt32LE(e.localOffset, i); i += 4;
  e.nameBuf.copy(cd, i);
  cdParts.push(cd);
}
const cdSize = cdParts.reduce((s, c) => s + c.length, 0);
const eocd = Buffer.alloc(22);
let j = 0;
eocd.writeUInt32LE(0x06054b50, j); j += 4;
eocd.writeUInt16LE(0, j); j += 2;
eocd.writeUInt16LE(0, j); j += 2;
eocd.writeUInt16LE(cdEntries.length, j); j += 2;
eocd.writeUInt16LE(cdEntries.length, j); j += 2;
eocd.writeUInt32LE(cdSize, j); j += 4;
eocd.writeUInt32LE(cdOffset, j); j += 4;
eocd.writeUInt16LE(0, j);
const output = Buffer.concat([...localParts, ...cdParts, eocd]);
fs.writeFileSync('WillowTab-v<VERSION>.zip', output);
```

每次发版时，更新上面的 `files` 列表和版本号，运行 `node pack-zip.js` 即可。
