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
  searchAccent: 6.0,
  accentText: 4.5,
};

const styleSource = fs.readFileSync(path.join(__dirname, '..', 'css', 'style.css'), 'utf8');

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
  'search-placeholder-color': '#75745f',
  'search-control-color': '#606054',
  'search-control-hover-color': '#8c490b',
  'search-control-focus-color': '#8c490b',
  'search-focus-stroke': '#cd7e41',
  'engine-menu-text': 'var(--search-text-color)',
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
  'segment-selected-bg': '#a66631',
  'segment-selected-bg-hover': '#a66531',
  'segment-selected-text': '#fffdf5',
  'segment-selected-stroke': '#8f5529',
});

assertThemeTokens('Dark', darkThemeBlock, {
  'motto-text': '#7c776f',
  'danger-text': '#ef8176',
  'canvas-text-secondary': '#7e7e7a',
  'canvas-greeting-text': '#969691',
  'canvas-large-text': '#c1beb5',
  'search-text-color': '#918e87',
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
    if (role === 'searchAccent') {
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
  return palette;
}

const representativeColors = [
  '#F5F5DC', '#bfbb98', '#5577aa', '#bb00ff', '#ffffff', '#000000',
  '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff',
];

for (const background of representativeColors) validatePalette(background);

const adaptivePaletteSnapshots = {
  '#141311': {
    mode: 'light-text',
    surfaces: { input: '#0e0e0c', secondary: '#12110f', tertiary: '#10100e' },
    colors: {
      canvasPrimary: '#7f7d79',
      canvasSecondary: '#7c7f74',
      canvasLarge: '#95938e',
      canvasControl: '#646159',
      searchText: '#7d7b77',
      searchPlaceholder: '#797c71',
      searchControl: '#948f87',
      searchAccent: '#d48436',
      accentText: '#bc6e18',
    },
  },
  '#F5F5DC': {
    mode: 'dark-text',
    surfaces: { input: '#fafaee', secondary: '#f6f6e0', tertiary: '#f8f8e5' },
    colors: {
      canvasPrimary: '#736f69',
      canvasSecondary: '#647462',
      canvasLarge: '#5c5d56',
      canvasControl: '#8d8d7f',
      searchText: '#75716c',
      searchPlaceholder: '#687766',
      searchControl: '#606053',
      searchAccent: '#884704',
      accentText: '#9d5a22',
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
  ['dark large time', '#c1beb5', '#2a2721', 8],
  ['dark greeting', '#969691', '#2a2721', 5],
  ['dark motto', '#7c776f', '#1e1c18', 3.8],
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
      validatePalette(color.toHex({ r, g, b }));
      sampled += 1;
    }
  }
}

console.log(`Validated ${sampled} RGB-grid colors plus ${representativeColors.length} representative colors.`);
