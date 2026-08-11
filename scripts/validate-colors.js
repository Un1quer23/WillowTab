const assert = require('assert');
const fs = require('fs');
const path = require('path');
const color = require('../js/color.js');
const wallpaperColor = require('../js/wallpaper-color.js');
const WALLPAPER_TARGET = 6.0;
const WALLPAPER_TIME_TARGET = 6.0;
const WALLPAPER_LIGHT_CONTROL_COLOR = '#272016';
const WALLPAPER_DARK_CONTROL_COLOR = '#f3eddf';
const TIME_DARK_ENDPOINT = '#241f18';
const TIME_LIGHT_ENDPOINT = '#f6efe2';

const TARGETS = {
  canvasPrimary: 4.5,
  canvasSecondary: 4.5,
  canvasLarge: 6.0,
  canvasControl: 3,
  searchText: 4.5,
  searchPlaceholder: 4.5,
  searchControl: 6.0,
  brandAccent: 6.0,
  searchAccent: 6.0,
  accentText: 4.5,
  searchSelectedText: 4.5,
};

function paletteColorDistance(first, second) {
  const a = color.rgbToOklch(color.parseHex(first));
  const b = color.rgbToOklch(color.parseHex(second));
  const hueDelta = Math.min(Math.abs(a.h - b.h), 360 - Math.abs(a.h - b.h)) / 180;
  return Math.sqrt(
    (a.l - b.l) ** 2
    + (a.c - b.c) ** 2
    + (hueDelta * Math.min(a.c, b.c)) ** 2,
  );
}

function circularHueDistance(first, second) {
  return Math.min(Math.abs(first - second), 360 - Math.abs(first - second));
}

function validateSolidConstraint(background) {
  const initial = color.inspectSolidBackground(background);
  assert(initial.valid, `${background} must be a valid source color`);
  const constrained = color.constrainSolidBackground(background);
  assert(constrained, `${background} did not produce a constrained color`);
  const resolved = color.inspectSolidBackground(constrained);
  assert.strictEqual(resolved.safe, true, `${background} constrained outside the safe solid-color range`);
  assert(
    resolved.oklch.l >= color.SOLID_COLOR_LIMITS.lightnessMin,
    `${background} constrained lightness is ${resolved.oklch.l}`,
  );
  assert(
    resolved.oklch.c <= color.SOLID_COLOR_LIMITS.chromaMax,
    `${background} constrained chroma is ${resolved.oklch.c}`,
  );
  assert.strictEqual(
    color.constrainSolidBackground(constrained),
    constrained,
    `${background} constraint must be idempotent`,
  );
  if (initial.safe) {
    assert.strictEqual(constrained, initial.normalized, `${background} safe color was changed`);
  }
  return { initial, constrained, resolved };
}

const styleSource = fs.readFileSync(path.join(__dirname, '..', 'css', 'style.css'), 'utf8');
const settingsSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'settings.js'), 'utf8');
const htmlSource = fs.readFileSync(path.join(__dirname, '..', 'newtab.html'), 'utf8');
const presetBlockStart = settingsSource.indexOf('  const PRESET_COLORS = [');
const presetBlockEnd = settingsSource.indexOf('  let settings = { ...DEFAULTS };', presetBlockStart);
assert(presetBlockStart >= 0 && presetBlockEnd > presetBlockStart, 'Preset color block was not found');
const presetBlock = settingsSource.slice(presetBlockStart, presetBlockEnd);
const presetColors = [...presetBlock.matchAll(/value:\s*'(#[0-9A-F]{6})'/g)].map((match) => match[1]);
assert.deepStrictEqual(
  presetColors,
  ['#BFBB98', '#E7E1D3', '#C9D5CF', '#C8D4E3', '#D7CEDC', '#DDBFB2'],
  'The curated soft preset palette changed unexpectedly',
);
assert.match(settingsSource, /const DEFAULTS = \{[\s\S]*?bgColor: '#BFBB98'/);
assert.strictEqual(presetColors[0], '#BFBB98', 'Sage must be the first preset and the default background');
assert.doesNotMatch(presetBlock, /#F5F5DC/i, 'Beige must not remain in the preset list');

assert.deepStrictEqual(color.SOLID_COLOR_LIMITS, {
  hueMin: 0,
  hueMax: 359,
  lightnessMin: 0.32,
  lightnessMax: 1,
  chromaMin: 0,
  chromaMax: 0.14,
});
assert.doesNotMatch(htmlSource, /type="color"/, 'The unrestricted system color picker must be removed');
assert.match(htmlSource, /id="custom-color-hue"[^>]*min="0"[^>]*max="359"/);
assert.match(htmlSource, /id="custom-color-chroma"[^>]*min="0"[^>]*max="140"/);
assert.match(htmlSource, /id="custom-color-lightness"[^>]*min="320"[^>]*max="1000"/);
assert.doesNotMatch(htmlSource, /use-suggested-color|color-quality-warning/);
assert.match(styleSource, /background:\s*var\(--range-track,\s*var\(--border\)\);/);
assert.match(settingsSource, /inspectSolidBackground\(customColorHex\.value\.trim\(\)\)/);
assert.match(settingsSource, /setAttribute\('aria-invalid', String\(customColorHexInvalid\)\)/);

assert.match(
  styleSource,
  /body\.has-custom-bg\s+\.panel-overlay\s*\{[^}]*background:\s*transparent;/,
  'Custom solid-color previews must not be darkened by the settings overlay',
);

assert.doesNotMatch(
  styleSource,
  /(?:^|\n)\.search-input-wrapper:focus-within\s+\.engine-toggle,\s*\n\.search-input-wrapper:focus-within\s+\.search-submit\s*\{[^}]*color:/,
  'Focusing the search input must not pre-highlight both search controls',
);
assert.match(
  styleSource,
  /\.engine-toggle:focus-visible,\s*\n\.search-submit:focus-visible\s*\{[^}]*color:\s*var\(--search-control-focus-color\);/,
  'Search controls must keep their own keyboard-focus highlight',
);
assert.match(
  styleSource,
  /\.engine-toggle:hover\s+\.search-control-visual\s*\{[^}]*background:\s*var\(--search-control-hover-surface\);/,
  'Search controls must use the search-specific hover surface',
);
assert.match(
  styleSource,
  /\.engine-dropdown-item:focus-visible\s*\{[^}]*outline-color:\s*var\(--search-control-focus-ring\);/,
  'The engine menu must use the search-specific focus ring',
);
assert.match(
  settingsSource,
  /const brandAccent = palette\.colors\.brandAccent;[\s\S]*--accent', brandAccent\);[\s\S]*--search-control-hover-color', searchAccent\);/,
  'Custom colors must keep brand and search accents wired to separate roles',
);

function extractThemeBlock(pattern, name) {
  const match = styleSource.match(pattern);
  assert(match, `${name} theme token block was not found`);
  return match[1];
}

function themeToken(block, name) {
  const match = block.match(new RegExp(`--${name}:\\s*([^;]+);`));
  assert(match, `Theme token --${name} was not found`);
  return match[1].trim().toLowerCase();
}

function assertThemeTokens(name, block, expected) {
  for (const [token, value] of Object.entries(expected)) {
    assert.strictEqual(
      themeToken(block, token),
      value.toLowerCase(),
      `${name} --${token} changed unexpectedly`,
    );
  }
}

const baseThemeBlock = extractThemeBlock(/^\s*:root,[^{]*\{([\s\S]*?)\r?\n\}/, 'Base');
const darkThemeBlock = extractThemeBlock(/html\[data-color-scheme="dark"\]\s*\{([\s\S]*?)\r?\n\}/, 'Dark');

assertThemeTokens('Light', baseThemeBlock, {
  'motto-text': '#918d83',
  'danger-text': '#b24238',
  'canvas-text-secondary': '#71715b',
  'canvas-greeting-text': 'var(--canvas-text-secondary)',
  'canvas-large-text': '#5c5d56',
  'search-text-color': '#72726c',
  'search-input-text': 'var(--search-text-color)',
  'search-placeholder-color': '#75745f',
  'search-control-color': '#606054',
  'search-control-hover-color': '#8c490b',
  'search-control-hover-surface': 'var(--accent-subtle)',
  'search-control-focus-color': '#8c490b',
  'search-control-focus-ring': 'var(--focus-ring-color)',
  'search-focus-stroke': '#cd7e41',
  'engine-menu-text': 'var(--search-text-color)',
  'engine-menu-hover-surface': 'var(--bg-tertiary)',
  'engine-menu-hover-text': 'var(--engine-menu-text)',
  'engine-menu-selected-text': 'var(--search-selected-text)',
  'panel-text-primary': '#70706a',
  'panel-text-secondary': '#71715b',
  'panel-control-text': '#73736d',
  'panel-control-secondary': '#75745f',
  'panel-control-icon': '#919183',
  'panel-control-hover-text': '#6a6a65',
  'panel-accent-text': '#a25610',
  'panel-heading-text': 'var(--panel-text-primary)',
  'panel-section-heading-text': 'var(--panel-text-secondary)',
  'panel-focus-stroke': '#cd7e41',
  'panel-warning-text': '#6a6a64',
  'segment-border': 'color-mix(in srgb, var(--border) 88%, var(--accent))',
  'segment-hover-bg': 'color-mix(in srgb, var(--input-bg) 92%, var(--accent))',
  'segment-selected-bg': '#a66631',
  'segment-selected-bg-hover': '#a66531',
  'segment-selected-text': '#fffdf5',
  'segment-selected-stroke': '#8f5529',
  'selection-stroke-color': 'var(--segment-selected-stroke)',
});

assertThemeTokens('Dark', darkThemeBlock, {
  'motto-text': '#7c776f',
  'danger-text': '#ef8176',
  'canvas-text-secondary': '#7e7e7a',
  'canvas-greeting-text': '#969691',
  'canvas-large-text': '#cdc9bf',
  'search-text-color': '#918e87',
  'search-input-text': '#c1bcb3',
  'search-placeholder-color': '#848480',
  'search-control-color': '#aaa79a',
  'search-control-hover-color': '#e49c5a',
  'search-control-focus-color': '#e49c5a',
  'search-focus-stroke': '#9f5300',
  'engine-menu-text': '#a9a69f',
  'engine-menu-hover-text': '#b5b2aa',
  'engine-menu-selected-text': '#ea9959',
  'panel-text-primary': '#9b9991',
  'panel-text-secondary': '#9e998c',
  'panel-control-text': '#a3a098',
  'panel-control-secondary': '#a1a09d',
  'panel-control-icon': '#8f8b82',
  'panel-control-hover-text': '#afaba3',
  'panel-accent-text': '#ec9859',
  'panel-heading-text': '#a19f97',
  'panel-section-heading-text': '#a19f97',
  'panel-focus-stroke': '#9f5300',
  'panel-warning-text': '#a3a099',
  'segment-selected-bg': '#82512a',
  'segment-selected-bg-hover': '#825129',
});

function validatePalette(background) {
  const palette = color.createSolidPalette(background);
  assert(palette, `Palette was not generated for ${background}`);
  for (const [role, target] of Object.entries(TARGETS)) {
    const result = palette.results[role];
    if (role === 'canvasLarge' && result.ratio < target) {
      const surfaces = [palette.background, palette.surfaces.secondary, palette.surfaces.tertiary]
        .map((surface) => color.parseHex(surface));
      const bestEndpointRatio = Math.max(
        color.minimumContrast(color.parseHex(TIME_DARK_ENDPOINT), surfaces),
        color.minimumContrast(color.parseHex(TIME_LIGHT_ENDPOINT), surfaces),
      );
      assert(
        Math.abs(result.ratio - bestEndpointRatio) < 0.000001,
        `${background} ${role} should use the best possible text endpoint without a scrim`,
      );
      assert.strictEqual(result.meetsTarget, false, `${background} ${role} target state is incorrect`);
      continue;
    }
    assert(
      result.ratio >= target,
      `${background} ${role} is ${result.ratio.toFixed(4)}, expected at least ${target}`,
    );
    if (role === 'brandAccent' || role === 'searchAccent') {
      assert(result.hoverSurface, `${background} ${role} hover surface was not recorded`);
      assert(
        result.ratio < target + 0.1,
        `${background} ${role} retains avoidable hover contrast: ${result.ratio.toFixed(4)}`,
      );
    } else {
      assert(
        result.previousRatio < target,
        `${background} ${role} retains avoidable contrast: previous candidate is ${result.previousRatio.toFixed(4)}`,
      );
    }
    if (role === 'canvasLarge') {
      assert.strictEqual(result.meetsTarget, true, `${background} ${role} target state is incorrect`);
    }
  }

  const backgroundOklch = color.rgbToOklch(color.parseHex(background));
  const diagnostics = palette.diagnostics.searchAccent;
  assert(diagnostics, `${background} search accent diagnostics are missing`);
  assert(
    diagnostics.overlayAlpha === 0.08 || diagnostics.overlayAlpha === 0.12,
    `${background} search accent overlay alpha is invalid`,
  );
  assert.strictEqual(
    palette.surfaces.searchSelected,
    palette.results.searchAccent.hoverSurface,
    `${background} search selected surface is stale`,
  );
  assert(
    Math.abs(
      diagnostics.distance
      - paletteColorDistance(palette.colors.searchControl, palette.colors.searchAccent)
    ) < 0.000001,
    `${background} search accent distance diagnostic is stale`,
  );

  if (backgroundOklch.c < 0.035) {
    assert.strictEqual(diagnostics.strategy, 'brand', `${background} should use the brand accent`);
    assert.strictEqual(diagnostics.hueOffset, null, `${background} brand accent must not report a hue offset`);
    assert.strictEqual(diagnostics.overlayAlpha, 0.08, `${background} brand accent alpha changed unexpectedly`);
    assert.strictEqual(diagnostics.candidates.length, 1, `${background} brand diagnostics must have one candidate`);
    assert.strictEqual(palette.colors.searchAccent, palette.colors.brandAccent, `${background} neutral accents diverged`);
  } else {
    assert.strictEqual(diagnostics.strategy, 'analogous', `${background} should use an analogous accent`);
    assert([0, -25, 25].includes(diagnostics.hueOffset), `${background} selected hue offset is invalid`);
    assert.strictEqual(diagnostics.candidates.length, 3, `${background} analogous diagnostics must have three candidates`);
    assert.deepStrictEqual(
      diagnostics.candidates.map((candidate) => candidate.hueOffset),
      [0, -25, 25],
      `${background} analogous candidate order changed`,
    );
    const selectedDiagnostic = diagnostics.candidates.find((candidate) => (
      candidate.hueOffset === diagnostics.hueOffset
      && candidate.color === palette.colors.searchAccent
    ));
    assert(selectedDiagnostic, `${background} selected analogous candidate is missing`);
    assert.strictEqual(selectedDiagnostic.meetsTarget, true, `${background} selected analogous candidate misses contrast`);
    for (const candidate of diagnostics.candidates) {
      const candidateOklch = color.rgbToOklch(color.parseHex(candidate.color));
      if (candidateOklch.c < 0.01) continue;
      const expectedHue = (backgroundOklch.h + candidate.hueOffset + 360) % 360;
      assert(
        circularHueDistance(candidate.actualHue, expectedHue) <= 10,
        `${background} candidate ${candidate.hueOffset} drifted outside its analogous hue`,
      );
    }
  }
  return palette;
}

const representativeColors = [
  '#F5F5DC', '#bfbb98', '#5577aa', '#bb00ff', '#ffffff', '#000000',
  '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff',
];

const safeCustomColors = [
  '#5577AA', '#3F8F72', '#8F5AA8', '#B85F52', '#F5F5DC', '#BFBB98', '#FFFFFF',
];
for (const background of safeCustomColors) {
  const result = validateSolidConstraint(background);
  assert.strictEqual(result.constrained, background.toLowerCase(), `${background} must remain unchanged`);
}

const blackConstraint = validateSolidConstraint('#000000');
assert.strictEqual(blackConstraint.constrained, '#333333', 'Black must map to the safe neutral floor');
validateSolidConstraint('#141311');
for (const background of ['#FF0000', '#00FF00', '#0000FF', '#BB00FF']) {
  const result = validateSolidConstraint(background);
  assert(result.initial.violations.includes('too-saturated'), `${background} must be classified as too saturated`);
  if (result.resolved.oklch.c >= 0.01) {
    assert(
      circularHueDistance(result.initial.oklch.h, result.resolved.oklch.h) <= 2,
      `${background} constrained hue drifted unexpectedly`,
    );
  }
}
const combinedConstraint = validateSolidConstraint('#180080');
assert.deepStrictEqual(combinedConstraint.initial.violations, ['too-dark', 'too-saturated']);
assert.strictEqual(color.inspectSolidBackground('not-a-color').valid, false);
assert.strictEqual(color.constrainSolidBackground('not-a-color'), null);

for (let hue = 0; hue <= 359; hue += 30) {
  for (const chroma of [0, 0.07, 0.14]) {
    for (const lightness of [0.32, 0.66, 1]) {
      const generated = color.toHex(color.gamutMappedOklch({ l: lightness, c: chroma, h: hue }));
      validateSolidConstraint(generated);
    }
  }
}

for (const background of representativeColors) validatePalette(background);

for (const background of presetColors) {
  const inspection = color.inspectSolidBackground(background);
  assert.strictEqual(inspection.safe, true, `${background} preset is outside the safe solid-color range`);
  assert(inspection.oklch.l >= 0.78, `${background} preset is too dark for the soft preset palette`);
  assert(inspection.oklch.c <= 0.05, `${background} preset is too saturated for the soft preset palette`);
  validatePalette(background);
}

for (const background of representativeColors) {
  assert.deepStrictEqual(
    color.createSolidPalette(background),
    color.createSolidPalette(background),
    `${background} palette generation must be deterministic`,
  );
}

const whitePalette = color.createSolidPalette('#ffffff');
assert(
  paletteColorDistance(whitePalette.colors.searchControl, whitePalette.colors.searchAccent) >= 0.12,
  'White search controls must have a visibly distinct hover color',
);

const blackPalette = color.createSolidPalette('#000000');
assert.strictEqual(whitePalette.colors.brandAccent, '#9a3f0c', 'White brand accent changed unexpectedly');
assert.strictEqual(whitePalette.colors.searchAccent, '#9a3f0c', 'White search accent changed unexpectedly');
assert.strictEqual(blackPalette.colors.brandAccent, '#cb7b2c', 'Black brand accent changed unexpectedly');
assert.strictEqual(blackPalette.colors.searchAccent, '#cb7b2c', 'Black search accent changed unexpectedly');

const bluePalette = color.createSolidPalette('#5577aa');
assert.deepStrictEqual(
  {
    input: bluePalette.surfaces.input,
    brandAccent: bluePalette.colors.brandAccent,
    searchAccent: bluePalette.colors.searchAccent,
    strategy: bluePalette.diagnostics.searchAccent.strategy,
    hueOffset: bluePalette.diagnostics.searchAccent.hueOffset,
    overlayAlpha: bluePalette.diagnostics.searchAccent.overlayAlpha,
  },
  {
    input: '#aabbd5',
    brandAccent: '#541f03',
    searchAccent: '#082e62',
    strategy: 'analogous',
    hueOffset: 0,
    overlayAlpha: 0.08,
  },
  'Blue search accent must remain coordinated and distinct from the brand accent',
);

for (const background of ['#5577aa', '#3f8f72', '#8f5aa8', '#b85f52']) {
  const palette = color.createSolidPalette(background);
  const backgroundHue = color.rgbToOklch(color.parseHex(background)).h;
  const accentHue = color.rgbToOklch(color.parseHex(palette.colors.searchAccent)).h;
  const expectedHue = (backgroundHue + palette.diagnostics.searchAccent.hueOffset + 360) % 360;
  assert(
    circularHueDistance(accentHue, expectedHue) <= 5,
    `${background} search accent is not analogous to the background`,
  );
}

const adaptivePaletteSnapshots = {
  '#141311': {
    mode: 'light-text',
    surfaces: { input: '#0e0e0c', secondary: '#12110f', tertiary: '#10100e', searchSelected: '#1e170f' },
    colors: {
      canvasPrimary: '#7f7d79',
      canvasSecondary: '#7c7f74',
      canvasLarge: '#95938e',
      canvasControl: '#646159',
      searchText: '#7d7b77',
      searchPlaceholder: '#797c71',
      searchControl: '#948f87',
      brandAccent: '#d48436',
      searchAccent: '#d48436',
      accentText: '#bc6e18',
      searchSelectedText: '#bc6e18',
    },
  },
  '#F5F5DC': {
    mode: 'dark-text',
    surfaces: { input: '#fafaee', secondary: '#f6f6e0', tertiary: '#f8f8e5', searchSelected: '#f2ebdc' },
    colors: {
      canvasPrimary: '#736f69',
      canvasSecondary: '#647462',
      canvasLarge: '#5c5d56',
      canvasControl: '#8d8d7f',
      searchText: '#75716c',
      searchPlaceholder: '#687766',
      searchControl: '#606053',
      brandAccent: '#963b07',
      searchAccent: '#963b07',
      accentText: '#ad4f24',
      searchSelectedText: '#ad4f24',
    },
  },
};

for (const [background, expected] of Object.entries(adaptivePaletteSnapshots)) {
  const palette = color.createSolidPalette(background);
  assert.deepStrictEqual(
    { mode: palette.mode, surfaces: palette.surfaces, colors: palette.colors },
    expected,
    `${background} adaptive palette changed unexpectedly`,
  );
}

assert.strictEqual(color.createSolidPalette('#5577aa').warning, false, 'Muted blue should be handled without a warning');
assert.strictEqual(color.createSolidPalette('#bfbb98').warning, false, 'Sage should be handled without a warning');
assert.strictEqual(color.createSolidPalette('#ffffff').warning, false, 'White should not be warned when the palette remains viable');
assert.strictEqual(color.createSolidPalette('#000000').warning, false, 'Black should not be warned when the palette remains viable');
assert.strictEqual(color.createSolidPalette('#bb00ff').warning, true, 'Extreme purple should produce a warning');

const darkEngineSelectedSurface = {
  r: 30 * 0.92 + 159 * 0.08,
  g: 28 * 0.92 + 83 * 0.08,
  b: 24 * 0.92,
};

const lightControlHoverSurface = {
  r: 250 * 0.92 + 205 * 0.08,
  g: 250 * 0.92 + 126 * 0.08,
  b: 238 * 0.92 + 65 * 0.08,
};

const darkControlHoverSurface = {
  r: 30 * 0.92 + 159 * 0.08,
  g: 28 * 0.92 + 83 * 0.08,
  b: 24 * 0.92,
};

const fixedPairs = [
  ['light canvas primary', '#70706a', '#f5f5dc', 4.5],
  ['light canvas secondary', '#71715b', '#f5f5dc', 4.5],
  ['light large time', '#5c5d56', '#f5f5dc', 6],
  ['light search text hover', '#72726c', '#f8f8e5', 4.5],
  ['light search controls', '#606054', '#fafaee', 6],
  ['light search controls hover', '#8c490b', lightControlHoverSurface, 6],
  ['light panel hover text', '#6a6a65', '#f2ebd0', 4.5],
  ['light panel accent text', '#a25610', '#f2ebd0', 4.5],
  ['light danger text', '#b24238', '#efe6ce', 4.5],
  ['light danger border', '#e16858', '#f5f5dc', 3],
  ['dark canvas primary', '#7f7d77', '#141311', 4.5],
  ['dark canvas secondary', '#7e7e7a', '#141311', 4.5],
  ['dark large time', '#cdc9bf', '#2a2721', 9],
  ['dark greeting', '#969691', '#2a2721', 5],
  ['dark motto', '#7c776f', '#1e1c18', 3.8],
  ['dark search input text', '#c1bcb3', '#1e1c18', 9],
  ['dark search text hover', '#918e87', '#2a2721', 4.5],
  ['dark search controls', '#aaa79a', '#1e1c18', 7],
  ['dark search controls hover', '#e49c5a', darkControlHoverSurface, 7],
  ['dark engine menu text', '#a9a69f', '#1e1c18', 7],
  ['dark engine menu hover text', '#b5b2aa', '#2a2721', 7],
  ['dark engine menu selected text', '#ea9959', darkEngineSelectedSurface, 7],
  ['dark panel primary text', '#9b9991', '#141311', 6.5],
  ['dark panel secondary text', '#9e998c', '#141311', 6.5],
  ['dark panel control text', '#a3a098', '#1e1c18', 6.5],
  ['dark panel control secondary', '#a1a09d', '#1e1c18', 6.5],
  ['dark panel icon', '#8f8b82', '#1e1c18', 5],
  ['dark panel hover text', '#afaba3', '#2a2721', 6.5],
  ['dark panel accent text', '#ec9859', '#2a2721', 6.5],
  ['dark panel warning text', '#a3a099', '#241a18', 6.5],
  ['dark panel heading', '#a19f97', '#141311', 7],
  ['dark danger text', '#ef8176', '#241a18', 6.5],
  ['dark danger border', '#a73f39', '#141311', 3],
  ['light settings selected text', '#fffdf5', '#a66631', 4.5],
  ['dark settings selected text', '#fffdf5', '#82512a', 6.5],
  ['dark settings selected hover text', '#fffdf5', '#825129', 6.5],
];

for (const [name, foreground, surface, target] of fixedPairs) {
  const resolvedSurface = typeof surface === 'string' ? color.parseHex(surface) : surface;
  const ratio = color.contrast(color.parseHex(foreground), resolvedSurface);
  assert(ratio >= target, `${name} is ${ratio.toFixed(4)}, expected at least ${target}`);
  assert(ratio < target + 0.06, `${name} retains avoidable contrast: ${ratio.toFixed(4)}`);
}

const minimumOnlyPairs = [
  ['light segment hover text', '#6a6a65', lightControlHoverSurface, 4.5],
  ['dark segment hover text', '#afaba3', darkControlHoverSurface, 6.5],
];

for (const [name, foreground, surface, target] of minimumOnlyPairs) {
  const ratio = color.contrast(color.parseHex(foreground), surface);
  assert(ratio >= target, `${name} is ${ratio.toFixed(4)}, expected at least ${target}`);
}

const wallpaperCases = {
  light: [{ r: 245, g: 245, b: 245 }, { r: 255, g: 255, b: 255 }],
  dark: [{ r: 8, g: 8, b: 8 }, { r: 24, g: 24, b: 24 }],
  split: [{ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }],
  highComplexity: [
    { r: 12, g: 20, b: 30 },
    { r: 48, g: 38, b: 32 },
    { r: 205, g: 190, b: 160 },
    { r: 245, g: 248, b: 250 },
  ],
};

function analysisFor(surfaces) {
  return {
    normal: { surfaces },
    hover: { surfaces },
  };
}

function assertTightWallpaperResult(name, result) {
  assert(
    !['#000000', '#ffffff'].includes(result.color),
    `${name} must retain a warm endpoint`,
  );
  assert.strictEqual(result.scrimAlpha, 0, `${name} must not receive a local scrim`);
  assert.strictEqual(result.scrim, 'rgba(0, 0, 0, 0.0000)', `${name} scrim must stay transparent`);
  assert.strictEqual(result.target, WALLPAPER_TARGET, `${name} target is incorrect`);
  assert.strictEqual(result.bestEffort, !result.meetsTarget, `${name} best-effort state is incorrect`);
  if (result.meetsTarget) {
    assert(
      result.minimumContrast >= WALLPAPER_TARGET,
      `${name} is ${result.minimumContrast.toFixed(4)}, expected at least ${WALLPAPER_TARGET}`,
    );
    assert(
      result.minimumContrast < WALLPAPER_TARGET + 0.1,
      `${name} retains avoidable contrast: ${result.minimumContrast.toFixed(4)}`,
    );
    return;
  }
  const bestEndpointRatio = Math.max(
    color.minimumContrast(color.parseHex(WALLPAPER_LIGHT_CONTROL_COLOR), result.surfaces),
    color.minimumContrast(color.parseHex(WALLPAPER_DARK_CONTROL_COLOR), result.surfaces),
  );
  assert(
    Math.abs(result.minimumContrast - bestEndpointRatio) < 0.000001,
    `${name} should use the best possible warm endpoint without a scrim`,
  );
}

function stepTowardSurface(candidate, surface) {
  return {
    r: candidate.r + Math.sign(surface.r - candidate.r),
    g: candidate.g + Math.sign(surface.g - candidate.g),
    b: candidate.b + Math.sign(surface.b - candidate.b),
  };
}

function assertOneStepTight(name, result, target = WALLPAPER_TARGET) {
  const candidate = color.parseHex(result.color);
  const limitingSurface = result.surfaces.reduce((limiting, surface) => (
    color.contrast(candidate, surface) < color.contrast(candidate, limiting) ? surface : limiting
  ));
  const closer = stepTowardSurface(candidate, limitingSurface);
  assert(
    color.minimumContrast(closer, result.surfaces) < target,
    `${name} can move one RGB step closer to its limiting surface without dropping below target`,
  );
}

for (const [name, surfaces] of Object.entries(wallpaperCases)) {
  const solved = wallpaperColor.solveControlStyle(
    analysisFor(surfaces),
    name === 'dark' ? WALLPAPER_DARK_CONTROL_COLOR : WALLPAPER_LIGHT_CONTROL_COLOR,
    WALLPAPER_TARGET,
  );
  for (const state of ['normal', 'hover']) {
    const result = solved[state];
    assertTightWallpaperResult(`${name} ${state}`, result);
  }
  assert.strictEqual(
    solved.normal.meetsTarget,
    !['split', 'highComplexity'].includes(name),
    `${name} target state is incorrect`,
  );
}

const splitResult = wallpaperColor.solveControlStyle(
  analysisFor(wallpaperCases.split),
  WALLPAPER_LIGHT_CONTROL_COLOR,
  WALLPAPER_TARGET,
).normal;
assert.strictEqual(splitResult.meetsTarget, false, 'Split surface should use best-effort color');
assert.strictEqual(splitResult.bestEffort, true, 'Split surface should record best-effort state');
assert.strictEqual(splitResult.scrimAlpha, 0, 'Split surface must not receive a local scrim');

const pairedCases = {
  identicalLight: {
    engine: wallpaperCases.light,
    submit: wallpaperCases.light,
    desired: WALLPAPER_LIGHT_CONTROL_COLOR,
  },
  unequalLight: {
    engine: [{ r: 245, g: 245, b: 245 }, { r: 255, g: 255, b: 255 }],
    submit: [{ r: 175, g: 175, b: 175 }, { r: 190, g: 190, b: 190 }],
    desired: WALLPAPER_LIGHT_CONTROL_COLOR,
  },
  unequalDark: {
    engine: wallpaperCases.dark,
    submit: [{ r: 45, g: 45, b: 45 }, { r: 60, g: 60, b: 60 }],
    desired: WALLPAPER_DARK_CONTROL_COLOR,
  },
  opposite: {
    engine: wallpaperCases.light,
    submit: wallpaperCases.dark,
    desired: WALLPAPER_DARK_CONTROL_COLOR,
  },
  highComplexity: {
    engine: wallpaperCases.highComplexity,
    submit: [{ r: 20, g: 28, b: 40 }, { r: 55, g: 45, b: 38 }],
    desired: WALLPAPER_DARK_CONTROL_COLOR,
  },
};

function assertSharedWallpaperResult(name, result) {
  assert(
    !['#000000', '#ffffff'].includes(result.color),
    `${name} must retain a warm color`,
  );
  assert.strictEqual(result.scrimAlpha, 0, `${name} must not receive a local scrim`);
  assert.strictEqual(result.scrim, 'rgba(0, 0, 0, 0.0000)', `${name} scrim must stay transparent`);
  assert.strictEqual(result.target, WALLPAPER_TARGET, `${name} target is incorrect`);
  const actual = color.minimumContrast(color.parseHex(result.color), result.surfaces);
  assert(Math.abs(result.minimumContrast - actual) < 0.000001, `${name} diagnostic contrast is stale`);
  assert.strictEqual(result.meetsTarget, actual >= WALLPAPER_TARGET, `${name} target state is incorrect`);
  assert.strictEqual(result.bestEffort, !result.meetsTarget, `${name} best-effort state is incorrect`);
}

function pairedCandidateScore(candidate, engineSurfaces, submitSurfaces) {
  const parsed = color.parseHex(candidate);
  return Math.min(
    color.minimumContrast(parsed, engineSurfaces),
    color.minimumContrast(parsed, submitSurfaces),
  );
}

for (const [name, pairCase] of Object.entries(pairedCases)) {
  const engineAnalysis = analysisFor(pairCase.engine);
  const submitAnalysis = analysisFor(pairCase.submit);
  const pair = wallpaperColor.solveControlPair(
    engineAnalysis,
    submitAnalysis,
    pairCase.desired,
    WALLPAPER_TARGET,
  );
  const independentEngine = wallpaperColor.solveControlStyle(
    engineAnalysis,
    pairCase.desired,
    WALLPAPER_TARGET,
  );
  const independentSubmit = wallpaperColor.solveControlStyle(
    submitAnalysis,
    pairCase.desired,
    WALLPAPER_TARGET,
  );
  for (const state of ['normal', 'hover']) {
    const diagnostics = pair.diagnostics[state];
    const candidates = [...new Set([
      independentEngine[state].color,
      independentSubmit[state].color,
    ])];
    assert.strictEqual(diagnostics.shared, true, `${name} ${state} must always share one color`);
    assert.strictEqual(pair.engine[state].color, pair.submit[state].color, `${name} ${state} should use one exact color`);
    assert.strictEqual(diagnostics.color, pair.engine[state].color, `${name} ${state} shared color diagnostic is stale`);
    assert(candidates.includes(diagnostics.color), `${name} ${state} must select one independent candidate`);
    assert(['identical', 'engine', 'submit'].includes(diagnostics.selectionSource), `${name} ${state} source is invalid`);
    assert(['light', 'dark'].includes(diagnostics.selectedPolarity), `${name} ${state} polarity is invalid`);
    assertSharedWallpaperResult(`${name} engine ${state}`, pair.engine[state]);
    assertSharedWallpaperResult(`${name} submit ${state}`, pair.submit[state]);
    const selectedScore = pairedCandidateScore(diagnostics.color, pairCase.engine, pairCase.submit);
    const bestCandidateScore = Math.max(...candidates.map((candidate) => (
      pairedCandidateScore(candidate, pairCase.engine, pairCase.submit)
    )));
    assert(
      selectedScore >= bestCandidateScore - 0.000001,
      `${name} ${state} did not maximize the worse control contrast`,
    );
    assert(
      Math.abs(diagnostics.sharedMinimumContrast - selectedScore) < 0.000001,
      `${name} ${state} shared minimum diagnostic is stale`,
    );
    assert.strictEqual(
      diagnostics.meetsTarget,
      pair.engine[state].meetsTarget && pair.submit[state].meetsTarget,
      `${name} ${state} shared target state is incorrect`,
    );
    assert.strictEqual(diagnostics.bestEffort, !diagnostics.meetsTarget, `${name} ${state} best effort is incorrect`);
    assert.strictEqual(diagnostics.candidates.length, candidates.length, `${name} ${state} candidate diagnostics are incomplete`);
    const candidatePolarities = new Set(diagnostics.candidates.map((candidate) => candidate.polarity));
    if (name.startsWith('unequal') && candidates.length > 1 && candidatePolarities.size === 1) {
      const luminances = candidates.map((candidate) => color.relativeLuminance(color.parseHex(candidate)));
      const selectedLuminance = color.relativeLuminance(color.parseHex(diagnostics.color));
      if (diagnostics.selectedPolarity === 'light') {
        assert(
          selectedLuminance >= Math.max(...luminances) - 0.000001,
          `${name} ${state} should choose the brighter warm-light candidate`,
        );
      } else {
        assert(
          selectedLuminance <= Math.min(...luminances) + 0.000001,
          `${name} ${state} should choose the darker warm-dark candidate`,
        );
      }
    }
  }
}

const identicalPair = wallpaperColor.solveControlPair(
  analysisFor(wallpaperCases.light),
  analysisFor(wallpaperCases.light),
  WALLPAPER_LIGHT_CONTROL_COLOR,
  WALLPAPER_TARGET,
);
assertOneStepTight('identical light shared color', identicalPair.engine.normal);

const bestEffortPair = wallpaperColor.solveControlPair(
  analysisFor(wallpaperCases.split),
  analysisFor(wallpaperCases.light),
  WALLPAPER_LIGHT_CONTROL_COLOR,
  WALLPAPER_TARGET,
);
assert.strictEqual(bestEffortPair.engine.normal.meetsTarget, false, 'Split engine control should use best effort');
assert.strictEqual(bestEffortPair.engine.normal.scrimAlpha, 0, 'Split engine control must not receive a scrim');
assert.strictEqual(bestEffortPair.submit.normal.meetsTarget, true, 'Light submit control should meet the target');
assert.strictEqual(bestEffortPair.submit.normal.scrimAlpha, 0, 'Light submit control must not receive a scrim');
assert.strictEqual(bestEffortPair.engine.normal.color, bestEffortPair.submit.normal.color, 'Best-effort controls must stay the same color');
assert.strictEqual(bestEffortPair.diagnostics.normal.bestEffort, true, 'Best-effort pair diagnostic is incorrect');

const wallpaperTimeCases = {
  light: { surfaces: wallpaperCases.light, desired: '#241f18', meetsTarget: true },
  dark: { surfaces: wallpaperCases.dark, desired: '#f6efe2', meetsTarget: true },
  split: { surfaces: wallpaperCases.split, desired: '#f6efe2', meetsTarget: false },
};

for (const [name, timeCase] of Object.entries(wallpaperTimeCases)) {
  const result = wallpaperColor.solveTextStyle(
    { surfaces: timeCase.surfaces },
    timeCase.desired,
    WALLPAPER_TIME_TARGET,
  );
  assert(result, `${name} wallpaper time style was not generated`);
  assert.strictEqual(result.scrimAlpha, 0, `${name} wallpaper time must not receive a scrim`);
  assert.strictEqual(result.scrim, 'rgba(0, 0, 0, 0.0000)', `${name} wallpaper time scrim must stay transparent`);
  assert.strictEqual(result.meetsTarget, timeCase.meetsTarget, `${name} wallpaper time target state is incorrect`);
  if (timeCase.meetsTarget) {
    assert(
      result.minimumContrast >= WALLPAPER_TIME_TARGET,
      `${name} wallpaper time is ${result.minimumContrast.toFixed(4)}, expected at least ${WALLPAPER_TIME_TARGET}`,
    );
    assert(
      result.minimumContrast < WALLPAPER_TIME_TARGET + 0.1,
      `${name} wallpaper time retains avoidable contrast: ${result.minimumContrast.toFixed(4)}`,
    );
    assertOneStepTight(`${name} wallpaper time`, result, WALLPAPER_TIME_TARGET);
  } else {
    const bestEndpointRatio = Math.max(
      color.minimumContrast(color.parseHex(TIME_DARK_ENDPOINT), timeCase.surfaces),
      color.minimumContrast(color.parseHex(TIME_LIGHT_ENDPOINT), timeCase.surfaces),
    );
    assert(
      Math.abs(result.minimumContrast - bestEndpointRatio) < 0.000001,
      `${name} wallpaper time should use the best possible text endpoint without a scrim`,
    );
  }
}

assert(
  color.contrast(color.parseHex('#8c490b'), color.parseHex('#fafaee')) >= 6,
  'Light search controls focus color must reach 6:1 on the input surface',
);
assert(
  color.contrast(color.parseHex('#e49c5a'), color.parseHex('#1e1c18')) >= 7,
  'Dark search controls focus color must reach 7:1 on the input surface',
);

let sampled = 0;
for (let r = 0; r <= 255; r += 17) {
  for (let g = 0; g <= 255; g += 17) {
    for (let b = 0; b <= 255; b += 17) {
      const background = color.toHex({ r, g, b });
      validateSolidConstraint(background);
      validatePalette(background);
      sampled += 1;
    }
  }
}

console.log(`Validated ${sampled} RGB-grid colors plus ${representativeColors.length} representative colors.`);
