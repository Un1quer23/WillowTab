const assert = require('assert');
const color = require('../js/color.js');
const wallpaperColor = require('../js/wallpaper-color.js');
const WALLPAPER_TARGET = 4.5;
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
  searchControl: 4.5,
  searchAccent: 4.5,
  accentText: 4.5,
};

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

assert.strictEqual(color.createSolidPalette('#5577aa').warning, false, 'Muted blue should be handled without a warning');
assert.strictEqual(color.createSolidPalette('#bfbb98').warning, false, 'Sage should be handled without a warning');
assert.strictEqual(color.createSolidPalette('#ffffff').warning, false, 'White should not be warned when the palette remains viable');
assert.strictEqual(color.createSolidPalette('#000000').warning, false, 'Black should not be warned when the palette remains viable');
assert.strictEqual(color.createSolidPalette('#bb00ff').warning, true, 'Extreme purple should produce a warning');

const fixedPairs = [
  ['light canvas primary', '#70706a', '#f5f5dc', 4.5],
  ['light canvas secondary', '#71715b', '#f5f5dc', 4.5],
  ['light large time', '#5c5d56', '#f5f5dc', 6],
  ['light search text hover', '#72726c', '#f8f8e5', 4.5],
  ['light search icon', '#747467', '#fafaee', 4.5],
  ['light search hover/focus', '#a65a16', '#f6f0e0', 4.5],
  ['light panel hover text', '#6a6a65', '#f2ebd0', 4.5],
  ['light panel accent text', '#a25610', '#f2ebd0', 4.5],
  ['light danger text', '#b24238', '#efe6ce', 4.5],
  ['light danger border', '#e16858', '#f5f5dc', 3],
  ['dark canvas primary', '#7f7d77', '#141311', 4.5],
  ['dark canvas secondary', '#7e7e7a', '#141311', 4.5],
  ['dark large time', '#a8a59d', '#2a2721', 6],
  ['dark search text hover', '#918e87', '#2a2721', 4.5],
  ['dark search icon', '#878479', '#1e1c18', 4.5],
  ['dark search hover/focus', '#be7834', '#282016', 4.5],
  ['dark panel hover text', '#918e87', '#2a2721', 4.5],
  ['dark panel accent text', '#ca7a39', '#2a2721', 4.5],
  ['dark danger text', '#cf635a', '#241a18', 4.5],
  ['dark danger border', '#a73f39', '#141311', 3],
  ['settings selected text', '#fffdf5', '#a66631', 4.5],
];

for (const [name, foreground, surface, target] of fixedPairs) {
  const ratio = color.contrast(color.parseHex(foreground), color.parseHex(surface));
  assert(ratio >= target, `${name} is ${ratio.toFixed(4)}, expected at least ${target}`);
  assert(ratio < target + 0.06, `${name} retains avoidable contrast: ${ratio.toFixed(4)}`);
}

const wallpaperCases = {
  light: [{ r: 245, g: 245, b: 245 }, { r: 255, g: 255, b: 255 }],
  dark: [{ r: 8, g: 8, b: 8 }, { r: 24, g: 24, b: 24 }],
  split: [{ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }],
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
  assert(
    result.minimumContrast >= WALLPAPER_TARGET,
    `${name} is ${result.minimumContrast.toFixed(4)}, expected at least ${WALLPAPER_TARGET}`,
  );
  assert(
    result.minimumContrast < WALLPAPER_TARGET + 0.1,
    `${name} retains avoidable contrast: ${result.minimumContrast.toFixed(4)}`,
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
  assert.strictEqual(solved.normal.fallback, name === 'split', `${name} fallback state is incorrect`);
}

const splitResult = wallpaperColor.solveControlStyle(
  analysisFor(wallpaperCases.split),
  WALLPAPER_LIGHT_CONTROL_COLOR,
  WALLPAPER_TARGET,
).normal;
assert(splitResult.scrimAlpha > 0, 'Split surface should need a local scrim');
const scrimIsWhite = splitResult.scrim.includes('255, 255, 255');
const lowerAlpha = Math.max(0, splitResult.scrimAlpha - 0.0001);
const lowerSurfaces = wallpaperCases.split.map((surface) => wallpaperColor.composite(surface, {
  r: scrimIsWhite ? 255 : 0,
  g: scrimIsWhite ? 255 : 0,
  b: scrimIsWhite ? 255 : 0,
  a: lowerAlpha,
}));
assert(
  color.minimumContrast(color.parseHex(splitResult.color), lowerSurfaces) < WALLPAPER_TARGET,
  `Local scrim alpha is not the minimum four-decimal value that meets ${WALLPAPER_TARGET}:1`,
);

const pairedCases = {
  identicalLight: {
    engine: wallpaperCases.light,
    submit: wallpaperCases.light,
    desired: WALLPAPER_LIGHT_CONTROL_COLOR,
    shared: true,
  },
  unequalLight: {
    engine: [{ r: 245, g: 245, b: 245 }, { r: 255, g: 255, b: 255 }],
    submit: [{ r: 175, g: 175, b: 175 }, { r: 190, g: 190, b: 190 }],
    desired: WALLPAPER_LIGHT_CONTROL_COLOR,
    shared: false,
  },
  opposite: {
    engine: wallpaperCases.light,
    submit: wallpaperCases.dark,
    desired: WALLPAPER_DARK_CONTROL_COLOR,
    shared: false,
  },
};

for (const [name, pairCase] of Object.entries(pairedCases)) {
  const pair = wallpaperColor.solveControlPair(
    analysisFor(pairCase.engine),
    analysisFor(pairCase.submit),
    pairCase.desired,
    WALLPAPER_TARGET,
  );
  for (const state of ['normal', 'hover']) {
    assert.strictEqual(pair.diagnostics[state].shared, pairCase.shared, `${name} ${state} shared state is incorrect`);
    assertTightWallpaperResult(`${name} engine ${state}`, pair.engine[state]);
    assertTightWallpaperResult(`${name} submit ${state}`, pair.submit[state]);
    if (pairCase.shared) {
      assert.strictEqual(pair.engine[state].color, pair.submit[state].color, `${name} ${state} should use one exact color`);
    } else {
      assert.notStrictEqual(pair.engine[state].color, pair.submit[state].color, `${name} ${state} should adapt locally`);
      assert(pair.diagnostics[state].hueDifference < 5, `${name} ${state} drifts out of the shared hue family`);
      assert(pair.diagnostics[state].chromaDifference < 0.03, `${name} ${state} has excessive chroma divergence`);
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

const fallbackPair = wallpaperColor.solveControlPair(
  analysisFor(wallpaperCases.split),
  analysisFor(wallpaperCases.light),
  WALLPAPER_LIGHT_CONTROL_COLOR,
  WALLPAPER_TARGET,
);
assert.strictEqual(fallbackPair.engine.normal.fallback, true, 'Only the split engine control should need fallback');
assert(fallbackPair.engine.normal.scrimAlpha > 0, 'Split engine control should receive a local scrim');
assert.strictEqual(fallbackPair.submit.normal.fallback, false, 'Light submit control should not need fallback');
assert.strictEqual(fallbackPair.submit.normal.scrimAlpha, 0, 'Light submit control should not receive a scrim');

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
