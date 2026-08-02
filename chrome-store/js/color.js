(() => {
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  function parseHex(value) {
    if (typeof value !== 'string') return null;
    const match = /^#([0-9a-f]{6})$/i.exec(value.trim());
    if (!match) return null;
    return {
      r: parseInt(match[1].slice(0, 2), 16),
      g: parseInt(match[1].slice(2, 4), 16),
      b: parseInt(match[1].slice(4, 6), 16),
    };
  }

  function toHex(color) {
    const channel = (value) => Math.round(clamp(value, 0, 255)).toString(16).padStart(2, '0');
    return `#${channel(color.r)}${channel(color.g)}${channel(color.b)}`;
  }

  function mix(from, to, amount) {
    return {
      r: from.r + (to.r - from.r) * amount,
      g: from.g + (to.g - from.g) * amount,
      b: from.b + (to.b - from.b) * amount,
    };
  }

  function composite(foreground, background, alpha) {
    return mix(background, foreground, clamp(alpha));
  }

  function relativeLuminance(color) {
    const convert = (channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * convert(color.r) + 0.7152 * convert(color.g) + 0.0722 * convert(color.b);
  }

  function contrast(first, second) {
    const firstLuminance = typeof first === 'number' ? first : relativeLuminance(first);
    const secondLuminance = typeof second === 'number' ? second : relativeLuminance(second);
    const high = Math.max(firstLuminance, secondLuminance);
    const low = Math.min(firstLuminance, secondLuminance);
    return (high + 0.05) / (low + 0.05);
  }

  function minimumContrast(color, surfaces) {
    return Math.min(...surfaces.map((surface) => contrast(color, surface)));
  }

  function srgbToLinear(value) {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }

  function linearToSrgb(value) {
    const channel = value <= 0.0031308 ? value * 12.92 : 1.055 * (value ** (1 / 2.4)) - 0.055;
    return channel * 255;
  }

  function rgbToOklch(color) {
    const r = srgbToLinear(color.r);
    const g = srgbToLinear(color.g);
    const b = srgbToLinear(color.b);
    const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
    const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
    const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
    const lRoot = Math.cbrt(l);
    const mRoot = Math.cbrt(m);
    const sRoot = Math.cbrt(s);
    const lightness = 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot;
    const a = 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot;
    const labB = 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot;
    const chroma = Math.sqrt(a * a + labB * labB);
    const hue = chroma < 0.00001 ? 0 : (Math.atan2(labB, a) * 180 / Math.PI + 360) % 360;
    return { l: lightness, c: chroma, h: hue };
  }

  function oklchToRgb(color) {
    const hue = color.h * Math.PI / 180;
    const a = color.c * Math.cos(hue);
    const labB = color.c * Math.sin(hue);
    const lRoot = color.l + 0.3963377774 * a + 0.2158037573 * labB;
    const mRoot = color.l - 0.1055613458 * a - 0.0638541728 * labB;
    const sRoot = color.l - 0.0894841775 * a - 1.291485548 * labB;
    const l = lRoot ** 3;
    const m = mRoot ** 3;
    const s = sRoot ** 3;
    const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    const b = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
    return { r: linearToSrgb(r), g: linearToSrgb(g), b: linearToSrgb(b) };
  }

  function gamutMappedOklch(color) {
    let chroma = Math.max(0, color.c);
    for (let index = 0; index < 32; index += 1) {
      const candidate = oklchToRgb({ l: clamp(color.l), c: chroma, h: color.h });
      const inGamut = [candidate.r, candidate.g, candidate.b].every((channel) => channel >= 0 && channel <= 255);
      if (inGamut) return candidate;
      chroma *= 0.9;
    }
    return oklchToRgb({ l: clamp(color.l), c: 0, h: color.h });
  }

  function readableColor(surfaces, desired, endpoint, target) {
    const desiredColor = typeof desired === 'string' ? parseHex(desired) : desired;
    const endpointColor = typeof endpoint === 'string' ? parseHex(endpoint) : endpoint;
    const desiredOklch = rgbToOklch(desiredColor);
    const endpointIsDark = relativeLuminance(endpointColor)
      < Math.min(...surfaces.map((surface) => relativeLuminance(surface)));
    const seen = new Set();
    let best = null;
    let undershoot = null;

    const scanChroma = (chromaScale) => {
      for (let step = 0; step <= 2048; step += 1) {
        const lightness = step / 2048;
        const candidateRgb = gamutMappedOklch({
          l: lightness,
          c: desiredOklch.c * chromaScale,
          h: desiredOklch.h,
        });
        const hex = toHex(candidateRgb);
        if (seen.has(hex)) continue;
        seen.add(hex);
        const candidate = parseHex(hex);
        const candidateLuminance = relativeLuminance(candidate);
        const onCorrectSide = endpointIsDark
          ? candidateLuminance <= Math.min(...surfaces.map((surface) => relativeLuminance(surface)))
          : candidateLuminance >= Math.max(...surfaces.map((surface) => relativeLuminance(surface)));
        if (!onCorrectSide) continue;
        const ratio = minimumContrast(candidate, surfaces);
        if (ratio >= target) {
          const distance = Math.abs(lightness - desiredOklch.l) + Math.abs(1 - chromaScale) * 0.05;
          if (!best || ratio < best.ratio || (ratio === best.ratio && distance < best.distance)) {
            best = { hex, ratio, distance, lightness };
          }
        } else if (!undershoot || ratio > undershoot.ratio) {
          undershoot = { hex, ratio };
        }
      }
    };

    scanChroma(1);
    const endpointHex = toHex(endpointColor);
    if (!best || best.hex === endpointHex) {
      [0.75, 0.5, 0.25, 0.1, 0].forEach(scanChroma);
    }

    if (best) {
      return {
        hex: best.hex,
        ratio: best.ratio,
        amount: best.distance,
        previousHex: undershoot ? undershoot.hex : null,
        previousRatio: undershoot ? undershoot.ratio : 0,
        target,
      };
    }

    const hex = toHex(endpointColor);
    return {
      hex,
      ratio: minimumContrast(parseHex(hex), surfaces),
      amount: 1,
      previousHex: undershoot ? undershoot.hex : null,
      previousRatio: undershoot ? undershoot.ratio : 0,
      target,
    };
  }

  function colorDistance(first, second) {
    const a = rgbToOklch(typeof first === 'string' ? parseHex(first) : first);
    const b = rgbToOklch(typeof second === 'string' ? parseHex(second) : second);
    const hueDelta = Math.min(Math.abs(a.h - b.h), 360 - Math.abs(a.h - b.h)) / 180;
    return Math.sqrt((a.l - b.l) ** 2 + (a.c - b.c) ** 2 + (hueDelta * Math.min(a.c, b.c)) ** 2);
  }

  function createSolidPalette(backgroundHex) {
    const background = parseHex(backgroundHex);
    if (!background) return null;
    const black = parseHex('#000000');
    const white = parseHex('#ffffff');
    const backgroundOklch = rgbToOklch(background);
    const darkInput = parseHex(toHex(mix(background, white, 0.5)));
    const lightInput = parseHex(toHex(mix(background, black, 0.28)));
    const schemes = [
      { name: 'dark-text', endpoint: black, input: darkInput },
      { name: 'light-text', endpoint: white, input: lightInput },
    ];
    schemes.forEach((scheme) => {
      scheme.score = contrast(scheme.endpoint, background);
    });
    const scheme = schemes.reduce((best, candidate) => candidate.score > best.score ? candidate : best);
    const darkText = scheme.name === 'dark-text';
    const endpoint = scheme.endpoint;
    const input = scheme.input;
    const hue = backgroundOklch.h;
    const neutralChroma = Math.min(0.018, backgroundOklch.c * 0.12 + 0.006);
    const desiredLightness = darkText ? 0.46 : 0.72;
    const desiredPrimary = gamutMappedOklch({
      l: desiredLightness,
      c: neutralChroma,
      h: darkText ? 70 : 80,
    });
    const desiredSecondary = gamutMappedOklch({
      l: desiredLightness,
      c: Math.min(0.065, backgroundOklch.c * 0.55 + 0.014),
      h: (hue + 35) % 360,
    });
    const desiredLarge = gamutMappedOklch({ l: darkText ? 0.58 : 0.63, c: neutralChroma, h: hue });
    const desiredControl = gamutMappedOklch({
      l: darkText ? 0.58 : 0.63,
      c: Math.min(0.055, backgroundOklch.c * 0.28 + 0.012),
      h: hue,
    });
    const brandAccent = darkText ? '#c87a3c' : '#e8964a';
    const canvasPrimary = readableColor([background], desiredPrimary, endpoint, 4.5);
    const canvasSecondary = readableColor([background], desiredSecondary, endpoint, 4.5);
    const canvasLarge = readableColor([background], desiredLarge, endpoint, 3);
    const canvasControl = readableColor([background], desiredControl, endpoint, 3);
    const searchText = readableColor([input], desiredPrimary, endpoint, 4.5);
    const searchPlaceholder = readableColor([input], desiredSecondary, endpoint, 4.5);
    const searchControl = readableColor([input], desiredControl, endpoint, 3);
    const searchAccent = readableColor([input], brandAccent, endpoint, 3);
    const accentColor = parseHex(searchAccent.hex);
    const selectedSurface = composite(accentColor, input, 0.08);
    const accentText = readableColor([selectedSurface], accentColor, endpoint, 4.5);
    const bgSecondary = toHex(mix(background, darkText ? white : black, darkText ? 0.12 : 0.1));
    const bgTertiary = toHex(mix(background, darkText ? white : black, darkText ? 0.25 : 0.18));
    const hierarchyDistance = colorDistance(canvasPrimary.hex, canvasSecondary.hex);
    const maximumPull = Math.max(
      canvasPrimary.amount,
      canvasSecondary.amount,
      searchText.amount,
      searchControl.amount,
      searchAccent.amount,
    );
    const rawExtreme = backgroundOklch.c >= 0.24 || backgroundOklch.l <= 0.1 || backgroundOklch.l >= 0.94;
    const warning = backgroundOklch.c >= 0.24
      || (rawExtreme && maximumPull >= 0.55);
    const suggestedRgb = gamutMappedOklch({
      l: clamp(backgroundOklch.l, 0.14, 0.9),
      c: Math.min(backgroundOklch.c, 0.18),
      h: backgroundOklch.h,
    });

    return {
      mode: scheme.name,
      background: toHex(background),
      warning,
      suggested: toHex(suggestedRgb),
      diagnostics: {
        lightness: backgroundOklch.l,
        chroma: backgroundOklch.c,
        hierarchyDistance,
        maximumPull,
      },
      surfaces: {
        input: toHex(input),
        secondary: bgSecondary,
        tertiary: bgTertiary,
      },
      colors: {
        canvasPrimary: canvasPrimary.hex,
        canvasSecondary: canvasSecondary.hex,
        canvasLarge: canvasLarge.hex,
        canvasControl: canvasControl.hex,
        searchText: searchText.hex,
        searchPlaceholder: searchPlaceholder.hex,
        searchControl: searchControl.hex,
        searchAccent: searchAccent.hex,
        accentText: accentText.hex,
      },
      results: {
        canvasPrimary,
        canvasSecondary,
        canvasLarge,
        canvasControl,
        searchText,
        searchPlaceholder,
        searchControl,
        searchAccent,
        accentText,
      },
    };
  }

  const api = {
    parseHex,
    toHex,
    mix,
    composite,
    relativeLuminance,
    contrast,
    minimumContrast,
    rgbToOklch,
    oklchToRgb,
    gamutMappedOklch,
    readableColor,
    createSolidPalette,
  };

  if (typeof window !== 'undefined') window.__willowColor = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
