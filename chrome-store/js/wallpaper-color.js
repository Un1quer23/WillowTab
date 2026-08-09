(() => {
  const ANALYSIS_CACHE_LIMIT = 32;
  const SOLVER_VERSION = 'paired-6-shared-warm-controls-no-scrim-time-6-warm-no-scrim-v8';
  const CONTROL_DARK_ENDPOINT = '#272016';
  const CONTROL_LIGHT_ENDPOINT = '#f3eddf';
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
      'controls',
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

  function textCacheKey(context, rect) {
    return JSON.stringify([
      'text',
      context.wallpaperId || context.wallpaperUrl,
      context.viewport,
      context.overlayAlpha,
      context.readability,
      context.protectionColor,
      context.protectionAlpha,
      context.solverVersion || SOLVER_VERSION,
      [rect.left, rect.top, rect.width, rect.height],
    ]);
  }

  async function analyzeTextSurface(context) {
    if (typeof document === 'undefined' || !context?.wallpaperUrl || !context?.element) return null;
    const rect = context.element.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const dpr = clamp(context.viewport?.dpr || window.devicePixelRatio || 1, 1, 4);
    const viewport = {
      width: context.viewport?.width || window.innerWidth,
      height: context.viewport?.height || window.innerHeight,
      dpr,
    };
    const normalizedContext = { ...context, viewport };
    const key = textCacheKey(normalizedContext, rect);
    if (analysisCache.has(key)) return analysisCache.get(key);

    const image = await loadImage(context.wallpaperUrl);
    const scale = Math.max(viewport.width / image.naturalWidth, viewport.height / image.naturalHeight);
    const drawnWidth = image.naturalWidth * scale;
    const drawnHeight = image.naturalHeight * scale;
    const offsetX = (viewport.width - drawnWidth) / 2;
    const offsetY = (viewport.height - drawnHeight) / 2;
    const width = Math.max(1, Math.ceil(rect.width * dpr));
    const height = Math.max(1, Math.ceil(rect.height * dpr));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const canvasContext = canvas.getContext('2d', { willReadFrequently: true });
    canvasContext.drawImage(
      image,
      (offsetX - rect.left) * dpr,
      (offsetY - rect.top) * dpr,
      drawnWidth * dpr,
      drawnHeight * dpr,
    );
    const pixels = canvasContext.getImageData(0, 0, width, height);
    applyBackdropLayers(pixels, rect, normalizedContext);
    const limits = surfaceLimits(pixels, null, []);
    const analysis = {
      ...limits,
      diagnostics: {
        cacheKey: key,
        dpr,
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      },
    };
    api.lastTextAnalysis = analysis;
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
    const darkEndpoint = api.parseHex(CONTROL_DARK_ENDPOINT);
    const lightEndpoint = api.parseHex(CONTROL_LIGHT_ENDPOINT);
    const surfaces = state.surfaces;
    const endpoints = [darkEndpoint, lightEndpoint].map((endpoint) => ({
      endpoint,
      ratio: minimumContrast(endpoint, surfaces),
    })).sort((a, b) => b.ratio - a.ratio);
    const endpoint = endpoints[0].endpoint;
    const readable = api.readableColor(surfaces, desired, endpoint, target);
    const resolved = readable.ratio >= target
      ? tightenToTarget(readable.hex, surfaces, target)
      : { color: api.toHex(endpoint), ratio: endpoints[0].ratio };
    const meetsTarget = resolved.ratio >= target;
    return {
      color: resolved.color,
      scrim: 'rgba(0, 0, 0, 0.0000)',
      scrimAlpha: 0,
      minimumContrast: resolved.ratio,
      target,
      meetsTarget,
      bestEffort: !meetsTarget,
      surfaces,
    };
  }

  function controlResult(color, surfaces, target) {
    const api = colorApi();
    const minimum = minimumContrast(api.parseHex(color), surfaces);
    const meetsTarget = minimum >= target;
    return {
      color,
      scrim: 'rgba(0, 0, 0, 0.0000)',
      scrimAlpha: 0,
      minimumContrast: minimum,
      target,
      meetsTarget,
      bestEffort: !meetsTarget,
      surfaces,
    };
  }

  function oklchDistance(first, second) {
    const api = colorApi();
    const fallback = api.parseHex('#9f5300');
    const resolve = (value) => (typeof value === 'string' ? api.parseHex(value) : value) || fallback;
    const a = api.rgbToOklch(resolve(first));
    const b = api.rgbToOklch(resolve(second));
    const hueDelta = Math.min(Math.abs(a.h - b.h), 360 - Math.abs(a.h - b.h)) / 180;
    return Math.sqrt(
      (a.l - b.l) ** 2
      + (a.c - b.c) ** 2
      + (hueDelta * Math.min(a.c, b.c)) ** 2,
    );
  }

  function controlPolarity(color) {
    return oklchDistance(color, CONTROL_LIGHT_ENDPOINT)
      <= oklchDistance(color, CONTROL_DARK_ENDPOINT) ? 'light' : 'dark';
  }

  function evaluatePairedCandidate(candidate, engineState, submitState, desiredColor, target) {
    const engine = controlResult(candidate.color, engineState.surfaces, target);
    const submit = controlResult(candidate.color, submitState.surfaces, target);
    return {
      ...candidate,
      engine,
      submit,
      sharedMinimumContrast: Math.min(engine.minimumContrast, submit.minimumContrast),
      ratioDifference: Math.abs(engine.minimumContrast - submit.minimumContrast),
      meetsTarget: engine.meetsTarget && submit.meetsTarget,
      desiredDistance: oklchDistance(candidate.color, desiredColor),
      polarity: controlPolarity(candidate.color),
    };
  }

  function solvePairedState(engineState, submitState, desiredColor, target) {
    const engineCandidate = solveState(engineState, desiredColor, target);
    const submitCandidate = solveState(submitState, desiredColor, target);
    const candidates = engineCandidate.color === submitCandidate.color
      ? [{ source: 'identical', color: engineCandidate.color }]
      : [
        { source: 'engine', color: engineCandidate.color },
        { source: 'submit', color: submitCandidate.color },
      ];
    const evaluated = candidates.map((candidate) => evaluatePairedCandidate(
      candidate,
      engineState,
      submitState,
      desiredColor,
      target,
    )).sort((first, second) => {
      if (first.meetsTarget !== second.meetsTarget) return second.meetsTarget - first.meetsTarget;
      if (Math.abs(first.sharedMinimumContrast - second.sharedMinimumContrast) > 1e-9) {
        return second.sharedMinimumContrast - first.sharedMinimumContrast;
      }
      if (Math.abs(first.desiredDistance - second.desiredDistance) > 1e-9) {
        return first.desiredDistance - second.desiredDistance;
      }
      if (Math.abs(first.ratioDifference - second.ratioDifference) > 1e-9) {
        return first.ratioDifference - second.ratioDifference;
      }
      return first.source.localeCompare(second.source);
    });
    const selected = evaluated[0];
    return {
      engine: selected.engine,
      submit: selected.submit,
      diagnostics: {
        shared: true,
        color: selected.color,
        selectionSource: selected.source,
        selectedPolarity: selected.polarity,
        sharedMinimumContrast: selected.sharedMinimumContrast,
        engineRatio: selected.engine.minimumContrast,
        submitRatio: selected.submit.minimumContrast,
        ratioDifference: selected.ratioDifference,
        meetsTarget: selected.meetsTarget,
        bestEffort: !selected.meetsTarget,
        candidates: evaluated.map((candidate) => ({
          source: candidate.source,
          color: candidate.color,
          polarity: candidate.polarity,
          sharedMinimumContrast: candidate.sharedMinimumContrast,
          engineRatio: candidate.engine.minimumContrast,
          submitRatio: candidate.submit.minimumContrast,
          ratioDifference: candidate.ratioDifference,
          meetsTarget: candidate.meetsTarget,
          desiredDistance: candidate.desiredDistance,
        })),
      },
    };
  }

  function solveControlPair(engineAnalysis, submitAnalysis, desiredColor, target = 4.5) {
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

  function solveControlStyle(analysis, desiredColor, target = 4.5) {
    if (!analysis?.normal || !analysis?.hover) return null;
    return {
      normal: solveState(analysis.normal, desiredColor, target),
      hover: solveState(analysis.hover, desiredColor, target),
    };
  }

  function solveTextStyle(analysis, desiredColor, target = 6.0) {
    if (!analysis?.surfaces?.length) return null;
    const color = colorApi();
    const black = color.parseHex('#000000');
    const white = color.parseHex('#ffffff');
    const endpoint = [black, white].sort((first, second) => (
      minimumContrast(second, analysis.surfaces) - minimumContrast(first, analysis.surfaces)
    ))[0];
    const readable = color.readableColor(analysis.surfaces, desiredColor, endpoint, target);
    const tightened = readable.ratio >= target
      ? tightenToTarget(readable.hex, analysis.surfaces, target)
      : ['#241f18', '#f6efe2']
        .map((candidate) => ({
          color: candidate,
          ratio: minimumContrast(color.parseHex(candidate), analysis.surfaces),
        }))
        .sort((first, second) => second.ratio - first.ratio)[0];
    return {
      color: tightened.color,
      scrim: 'rgba(0, 0, 0, 0.0000)',
      scrimAlpha: 0,
      minimumContrast: tightened.ratio,
      fallback: false,
      meetsTarget: tightened.ratio >= target,
      surfaces: analysis.surfaces,
    };
  }

  const api = {
    analyzeControlSurface,
    analyzeTextSurface,
    solveControlPair,
    solveControlStyle,
    solveTextStyle,
    solverVersion: SOLVER_VERSION,
    normalizeColor,
    composite,
    clearCache: () => analysisCache.clear(),
    lastAnalysis: null,
    lastTextAnalysis: null,
    lastTextResult: null,
  };

  if (typeof window !== 'undefined') window.__willowWallpaperColor = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
