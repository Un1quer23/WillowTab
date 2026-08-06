(() => {
  const ANALYSIS_CACHE_LIMIT = 32;
  const SOLVER_VERSION = 'paired-3.3-v1';
  const analysisCache = new Map();

  function colorApi() {
    if (typeof window !== 'undefined' && window.__willowColor) return window.__willowColor;
    if (typeof require === 'function') return require('./color.js');
    return null;
  }

  function clamp(value, minimum = 0, maximum = 1) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function normalizeColor(value, fallback = { r: 0, g: 0, b: 0, a: 0 }) {
    if (!value) return { ...fallback };
    if (typeof value === 'object') {
      return {
        r: clamp(Number(value.r) || 0, 0, 255),
        g: clamp(Number(value.g) || 0, 0, 255),
        b: clamp(Number(value.b) || 0, 0, 255),
        a: clamp(value.a == null ? 1 : Number(value.a)),
      };
    }
    const text = String(value).trim();
    const hex = /^#([0-9a-f]{6})$/i.exec(text);
    if (hex) {
      return {
        r: parseInt(hex[1].slice(0, 2), 16),
        g: parseInt(hex[1].slice(2, 4), 16),
        b: parseInt(hex[1].slice(4, 6), 16),
        a: 1,
      };
    }
    const rgba = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i.exec(text);
    if (!rgba) return { ...fallback };
    const rawAlpha = rgba[4] == null ? 1 : parseFloat(rgba[4]);
    return {
      r: clamp(parseFloat(rgba[1]), 0, 255),
      g: clamp(parseFloat(rgba[2]), 0, 255),
      b: clamp(parseFloat(rgba[3]), 0, 255),
      a: clamp(rgba[4]?.endsWith('%') ? rawAlpha / 100 : rawAlpha),
    };
  }

  function composite(base, overlay) {
    const alpha = clamp(overlay.a == null ? 1 : overlay.a);
    return {
      r: base.r * (1 - alpha) + overlay.r * alpha,
      g: base.g * (1 - alpha) + overlay.g * alpha,
      b: base.b * (1 - alpha) + overlay.b * alpha,
    };
  }

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Unable to load wallpaper image.'));
      image.src = source;
    });
  }

  function canvasSupportsFilter() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context || !('filter' in context)) return false;
    context.filter = 'blur(1px)';
    return context.filter === 'blur(1px)';
  }

  function boxBlurAxis(source, width, height, radius, horizontal) {
    const output = new Uint8ClampedArray(source.length);
    const span = radius * 2 + 1;
    const outer = horizontal ? height : width;
    const inner = horizontal ? width : height;
    for (let line = 0; line < outer; line += 1) {
      const sums = [0, 0, 0, 0];
      const pixelIndex = (position) => {
        const bounded = Math.max(0, Math.min(inner - 1, position));
        const x = horizontal ? bounded : line;
        const y = horizontal ? line : bounded;
        return (y * width + x) * 4;
      };
      for (let offset = -radius; offset <= radius; offset += 1) {
        const index = pixelIndex(offset);
        for (let channel = 0; channel < 4; channel += 1) sums[channel] += source[index + channel];
      }
      for (let position = 0; position < inner; position += 1) {
        const index = pixelIndex(position);
        for (let channel = 0; channel < 4; channel += 1) output[index + channel] = Math.round(sums[channel] / span);
        const removeIndex = pixelIndex(position - radius);
        const addIndex = pixelIndex(position + radius + 1);
        for (let channel = 0; channel < 4; channel += 1) {
          sums[channel] += source[addIndex + channel] - source[removeIndex + channel];
        }
      }
    }
    return output;
  }

  function threePassBoxBlur(imageData, radius) {
    const { width, height } = imageData;
    const passRadius = Math.max(1, Math.round(radius * 0.58));
    let pixels = new Uint8ClampedArray(imageData.data);
    for (let pass = 0; pass < 3; pass += 1) {
      pixels = boxBlurAxis(pixels, width, height, passRadius, true);
      pixels = boxBlurAxis(pixels, width, height, passRadius, false);
    }
    return new ImageData(pixels, width, height);
  }

  function applyBackdropLayers(imageData, region, context) {
    const pixels = imageData.data;
    const dpr = context.viewport.dpr;
    const overlay = clamp(context.overlayAlpha || 0);
    const protection = normalizeColor(context.protectionColor);
    const protectionAlpha = context.readability ? clamp(context.protectionAlpha || protection.a || 0) : 0;
    const viewportWidth = context.viewport.width;
    const viewportHeight = context.viewport.height;
    const originX = viewportWidth * 0.5;
    const originY = viewportHeight * 0.42;
    const radialStop = Math.max(
      Math.hypot(originX, originY),
      Math.hypot(viewportWidth - originX, viewportHeight - originY),
    ) * 0.58;
    for (let y = 0; y < imageData.height; y += 1) {
      for (let x = 0; x < imageData.width; x += 1) {
        const index = (y * imageData.width + x) * 4;
        let color = { r: pixels[index], g: pixels[index + 1], b: pixels[index + 2] };
        color = composite(color, { r: 0, g: 0, b: 0, a: overlay });
        if (context.readability) {
          const cssX = region.left + (x + 0.5) / dpr;
          const cssY = region.top + (y + 0.5) / dpr;
          const bottomAlpha = 0.08 * clamp(cssY / viewportHeight);
          color = composite(color, { r: 0, g: 0, b: 0, a: bottomAlpha });
          const distance = Math.hypot(cssX - originX, cssY - originY);
          const localAlpha = protectionAlpha * clamp(1 - distance / radialStop);
          color = composite(color, { ...protection, a: localAlpha });
        }
        pixels[index] = Math.round(color.r);
        pixels[index + 1] = Math.round(color.g);
        pixels[index + 2] = Math.round(color.b);
        pixels[index + 3] = 255;
      }
    }
  }

  function blurCanvas(source, radius) {
    const output = document.createElement('canvas');
    output.width = source.width;
    output.height = source.height;
    const context = output.getContext('2d', { willReadFrequently: true });
    if (canvasSupportsFilter()) {
      context.filter = `blur(${radius}px)`;
      context.drawImage(source, 0, 0);
      context.filter = 'none';
      return { canvas: output, fallback: false };
    }
    const sourceContext = source.getContext('2d', { willReadFrequently: true });
    context.putImageData(threePassBoxBlur(
      sourceContext.getImageData(0, 0, source.width, source.height),
      radius,
    ), 0, 0);
    return { canvas: output, fallback: true };
  }

  function svgMask(svg, visualRect, svgRect, width, height, dpr) {
    return new Promise((resolve) => {
      if (!svg) {
        resolve(null);
        return;
      }
      const clone = svg.cloneNode(true);
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clone.setAttribute('x', String(svgRect.left - visualRect.left));
      clone.setAttribute('y', String(svgRect.top - visualRect.top));
      clone.setAttribute('width', String(svgRect.width));
      clone.setAttribute('height', String(svgRect.height));
      clone.setAttribute('color', '#000');
      clone.style.color = '#000';
      const wrapper = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${visualRect.width} ${visualRect.height}">${clone.outerHTML}</svg>`;
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(image, 0, 0, width, height);
        resolve(context.getImageData(0, 0, width, height).data);
      };
      image.onerror = () => resolve(null);
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(wrapper)}`;
    });
  }

  function surfaceLimits(imageData, mask, surfaceOverlays, lowChannelAdjustment = 0) {
    let low = null;
    let high = null;
    let coveredPixels = 0;
    const api = colorApi();
    for (let index = 0; index < imageData.data.length; index += 4) {
      if (mask && mask[index + 3] < 8) continue;
      let color = {
        r: imageData.data[index],
        g: imageData.data[index + 1],
        b: imageData.data[index + 2],
      };
      surfaceOverlays.forEach((surfaceOverlay) => {
        color = composite(color, surfaceOverlay);
      });
      const luminance = api.relativeLuminance(color);
      if (!low || luminance < low.luminance) low = { color, luminance };
      if (!high || luminance > high.luminance) high = { color, luminance };
      coveredPixels += 1;
    }
    const fallback = { color: { r: 127, g: 127, b: 127 }, luminance: 0.212 };
    const lowLimit = low || fallback;
    const highLimit = high || fallback;
    const adjustedLow = lowChannelAdjustment
      ? {
        r: clamp(lowLimit.color.r - lowChannelAdjustment, 0, 255),
        g: clamp(lowLimit.color.g - lowChannelAdjustment, 0, 255),
        b: clamp(lowLimit.color.b - lowChannelAdjustment, 0, 255),
      }
      : lowLimit.color;
    return {
      surfaces: [adjustedLow, highLimit.color],
      minLuminance: colorApi().relativeLuminance(adjustedLow),
      maxLuminance: (high || fallback).luminance,
      coveredPixels,
      rawMinLuminance: lowLimit.luminance,
    };
  }

  function cacheKey(context) {
    const controls = Object.entries(context.controls || {}).map(([name, control]) => {
      const visualRect = control.visual.getBoundingClientRect();
      return [name, visualRect.left, visualRect.top, visualRect.width, visualRect.height, control.svg?.outerHTML || ''];
    });
    return JSON.stringify([
      context.wallpaperId || context.wallpaperUrl,
      context.viewport,
      context.overlayAlpha,
      context.readability,
      context.protectionColor,
      context.protectionAlpha,
      context.inputColor,
      context.hoverColor,
      context.blurRadius,
      context.targetContrast,
      context.solverVersion || SOLVER_VERSION,
      controls,
    ]);
  }

  async function analyzeControlSurface(context) {
    if (typeof document === 'undefined' || !context?.wallpaperUrl) return null;
    const key = cacheKey(context);
    if (analysisCache.has(key)) return analysisCache.get(key);
    const image = await loadImage(context.wallpaperUrl);
    const dpr = clamp(context.viewport?.dpr || window.devicePixelRatio || 1, 1, 4);
    const viewport = {
      width: context.viewport?.width || window.innerWidth,
      height: context.viewport?.height || window.innerHeight,
      dpr,
    };
    const normalizedContext = { ...context, viewport };
    const scale = Math.max(viewport.width / image.naturalWidth, viewport.height / image.naturalHeight);
    const drawnWidth = image.naturalWidth * scale;
    const drawnHeight = image.naturalHeight * scale;
    const offsetX = (viewport.width - drawnWidth) / 2;
    const offsetY = (viewport.height - drawnHeight) / 2;
    const halo = Math.max(48, (context.blurRadius || 16) * 3);
    const results = {};
    let usedBlurFallback = false;

    for (const [name, control] of Object.entries(context.controls || {})) {
      const visualRect = control.visual.getBoundingClientRect();
      const svgRect = control.svg?.getBoundingClientRect();
      if (!svgRect || !visualRect.width || !visualRect.height) continue;
      const expanded = {
        left: visualRect.left - halo,
        top: visualRect.top - halo,
        width: visualRect.width + halo * 2,
        height: visualRect.height + halo * 2,
      };
      const source = document.createElement('canvas');
      source.width = Math.max(1, Math.ceil(expanded.width * dpr));
      source.height = Math.max(1, Math.ceil(expanded.height * dpr));
      const sourceContext = source.getContext('2d', { willReadFrequently: true });
      sourceContext.drawImage(
        image,
        (offsetX - expanded.left) * dpr,
        (offsetY - expanded.top) * dpr,
        drawnWidth * dpr,
        drawnHeight * dpr,
      );
      const layered = sourceContext.getImageData(0, 0, source.width, source.height);
      applyBackdropLayers(layered, expanded, normalizedContext);
      sourceContext.putImageData(layered, 0, 0);
      const blurred = blurCanvas(source, (context.blurRadius || 16) * dpr);
      usedBlurFallback ||= blurred.fallback;

      const width = Math.max(1, Math.round(visualRect.width * dpr));
      const height = Math.max(1, Math.round(visualRect.height * dpr));
      const crop = document.createElement('canvas');
      crop.width = width;
      crop.height = height;
      const cropContext = crop.getContext('2d', { willReadFrequently: true });
      cropContext.drawImage(
        blurred.canvas,
        Math.round(halo * dpr),
        Math.round(halo * dpr),
        width,
        height,
        0,
        0,
        width,
        height,
      );
      const pixels = cropContext.getImageData(0, 0, width, height);
      const mask = await svgMask(control.svg, visualRect, svgRect, width, height, dpr);
      results[name] = {
        normal: surfaceLimits(
          pixels,
          mask,
          [normalizeColor(context.inputColor)],
          1,
        ),
        hover: surfaceLimits(
          pixels,
          mask,
          [normalizeColor(context.inputColor), normalizeColor(context.hoverColor)],
          1,
        ),
        diagnostics: {
          visualRect: { x: visualRect.x, y: visualRect.y, width: visualRect.width, height: visualRect.height },
          svgRect: { x: svgRect.x, y: svgRect.y, width: svgRect.width, height: svgRect.height },
        },
      };
    }
    const analysis = {
      controls: results,
      diagnostics: {
        cacheKey: key,
        dpr,
        halo,
        usedBlurFallback,
        hoverLowChannelAdjustment: 2,
      },
    };
    api.lastAnalysis = analysis;
    analysisCache.set(key, analysis);
    if (analysisCache.size > ANALYSIS_CACHE_LIMIT) analysisCache.delete(analysisCache.keys().next().value);
    return analysis;
  }

  function minimumContrast(candidate, surfaces) {
    return colorApi().minimumContrast(candidate, surfaces);
  }

  function tightenToTarget(candidate, surfaces, target) {
    const api = colorApi();
    let resolved = api.parseHex(candidate);
    let ratio = minimumContrast(resolved, surfaces);
    if (ratio <= target + 0.1) return { color: api.toHex(resolved), ratio };
    let limiting = surfaces[0];
    surfaces.forEach((surface) => {
      if (api.contrast(resolved, surface) < api.contrast(resolved, limiting)) limiting = surface;
    });
    let low = 0;
    let high = 1;
    for (let iteration = 0; iteration < 24; iteration += 1) {
      const middle = (low + high) / 2;
      const mixed = api.mix(resolved, limiting, middle);
      if (minimumContrast(mixed, surfaces) >= target) low = middle;
      else high = middle;
    }
    let hex = api.toHex(api.mix(resolved, limiting, low));
    ratio = minimumContrast(api.parseHex(hex), surfaces);
    if (ratio < target) {
      for (let step = 1; step <= 255; step += 1) {
        const amount = Math.max(0, low - step / 65535);
        hex = api.toHex(api.mix(resolved, limiting, amount));
        ratio = minimumContrast(api.parseHex(hex), surfaces);
        if (ratio >= target) break;
      }
    }
    return { color: hex, ratio };
  }

  function solveState(state, desiredColor, target) {
    const api = colorApi();
    const desired = api.parseHex(desiredColor) || api.parseHex('#9f5300');
    const black = api.parseHex('#000000');
    const white = api.parseHex('#ffffff');
    const surfaces = state.surfaces;
    const endpoints = [black, white].map((endpoint) => ({
      endpoint,
      ratio: minimumContrast(endpoint, surfaces),
    })).sort((a, b) => b.ratio - a.ratio);
    let scrim = { r: 0, g: 0, b: 0, a: 0 };
    let solvedSurfaces = surfaces;
    let endpoint = endpoints[0].endpoint;
    let fallback = false;

    if (endpoints[0].ratio < target) {
      fallback = true;
      const candidates = [
        { scrimColor: black, endpoint: white },
        { scrimColor: white, endpoint: black },
      ].map((candidate) => {
        let low = 0;
        let high = 1;
        for (let iteration = 0; iteration < 24; iteration += 1) {
          const middle = (low + high) / 2;
          const composited = surfaces.map((surface) => composite(surface, { ...candidate.scrimColor, a: middle }));
          if (minimumContrast(candidate.endpoint, composited) >= target) high = middle;
          else low = middle;
        }
        const alpha = Math.ceil(high * 10000) / 10000;
        return { ...candidate, alpha };
      }).sort((a, b) => a.alpha - b.alpha);
      const selected = candidates[0];
      scrim = { ...selected.scrimColor, a: selected.alpha };
      endpoint = selected.endpoint;
      solvedSurfaces = surfaces.map((surface) => composite(surface, scrim));
    }

    const readable = api.readableColor(solvedSurfaces, desired, endpoint, target);
    const tightened = tightenToTarget(readable.hex, solvedSurfaces, target);
    return {
      color: tightened.color,
      scrim: `rgba(${Math.round(scrim.r)}, ${Math.round(scrim.g)}, ${Math.round(scrim.b)}, ${scrim.a.toFixed(4)})`,
      scrimAlpha: scrim.a,
      minimumContrast: tightened.ratio,
      fallback,
      surfaces: solvedSurfaces,
    };
  }

  function controlResult(color, surfaces) {
    const api = colorApi();
    return {
      color,
      scrim: 'rgba(0, 0, 0, 0.0000)',
      scrimAlpha: 0,
      minimumContrast: minimumContrast(api.parseHex(color), surfaces),
      fallback: false,
      surfaces,
    };
  }

  function solvePairedState(engineState, submitState, desiredColor, target) {
    const shared = solveState({
      surfaces: [...engineState.surfaces, ...submitState.surfaces],
    }, desiredColor, target);
    const engineShared = controlResult(shared.color, engineState.surfaces);
    const submitShared = controlResult(shared.color, submitState.surfaces);
    const ratioDifference = Math.abs(
      engineShared.minimumContrast - submitShared.minimumContrast,
    );
    const maximumTightRatio = target + 0.1;
    const canShare = !shared.fallback
      && shared.scrimAlpha === 0
      && engineShared.minimumContrast >= target
      && submitShared.minimumContrast >= target
      && engineShared.minimumContrast < maximumTightRatio
      && submitShared.minimumContrast < maximumTightRatio
      && ratioDifference <= 0.1;

    if (canShare) {
      return {
        engine: engineShared,
        submit: submitShared,
        diagnostics: {
          shared: true,
          color: shared.color,
          ratioDifference,
        },
      };
    }

    const engine = solveState(engineState, desiredColor, target);
    const submit = solveState(submitState, desiredColor, target);
    const api = colorApi();
    const engineOklch = api.rgbToOklch(api.parseHex(engine.color));
    const submitOklch = api.rgbToOklch(api.parseHex(submit.color));
    const hueDifference = Math.min(
      Math.abs(engineOklch.h - submitOklch.h),
      360 - Math.abs(engineOklch.h - submitOklch.h),
    );
    return {
      engine,
      submit,
      diagnostics: {
        shared: false,
        sharedCandidate: shared.color,
        sharedEngineRatio: engineShared.minimumContrast,
        sharedSubmitRatio: submitShared.minimumContrast,
        ratioDifference,
        hueDifference,
        chromaDifference: Math.abs(engineOklch.c - submitOklch.c),
      },
    };
  }

  function solveControlPair(engineAnalysis, submitAnalysis, desiredColor, target = 3.3) {
    if (!engineAnalysis?.normal || !engineAnalysis?.hover
      || !submitAnalysis?.normal || !submitAnalysis?.hover) return null;
    const normal = solvePairedState(
      engineAnalysis.normal,
      submitAnalysis.normal,
      desiredColor,
      target,
    );
    const hover = solvePairedState(
      engineAnalysis.hover,
      submitAnalysis.hover,
      desiredColor,
      target,
    );
    return {
      engine: { normal: normal.engine, hover: hover.engine },
      submit: { normal: normal.submit, hover: hover.submit },
      diagnostics: {
        target,
        solverVersion: SOLVER_VERSION,
        normal: normal.diagnostics,
        hover: hover.diagnostics,
      },
    };
  }

  function solveControlStyle(analysis, desiredColor, target = 3.3) {
    if (!analysis?.normal || !analysis?.hover) return null;
    return {
      normal: solveState(analysis.normal, desiredColor, target),
      hover: solveState(analysis.hover, desiredColor, target),
    };
  }

  const api = {
    analyzeControlSurface,
    solveControlPair,
    solveControlStyle,
    solverVersion: SOLVER_VERSION,
    normalizeColor,
    composite,
    clearCache: () => analysisCache.clear(),
    lastAnalysis: null,
  };

  if (typeof window !== 'undefined') window.__willowWallpaperColor = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
