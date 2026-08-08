(() => {
  const MIB = 1024 * 1024;
  const LIMITS = Object.freeze({
    maxFileBytes: 50 * MIB,
    maxBatchFiles: 300,
    maxBatchBytes: 1024 * MIB,
    maxPixels: 64_000_000,
  });

  function normalizeSourcePath(value) {
    return String(value || '')
      .trim()
      .replace(/\\/g, '/')
      .replace(/^\.\//, '')
      .toLocaleLowerCase();
  }

  function getImportPath(file, source) {
    const rawPath = source === 'folder'
      ? (file && (file.webkitRelativePath || file.name))
      : (file && file.name);
    return String(rawPath || '')
      .trim()
      .replace(/\\/g, '/')
      .replace(/^\.\//, '');
  }

  function getFileIdentity(value, source) {
    if (!value) return '';
    const path = value.sourcePath || getImportPath(value, source);
    return normalizeSourcePath(path || value.name);
  }

  function validateBatch(files) {
    const list = Array.from(files || []);
    if (list.length > LIMITS.maxBatchFiles) {
      return {
        ok: false,
        reason: 'too_many_files',
        actual: list.length,
        limit: LIMITS.maxBatchFiles,
      };
    }

    const totalBytes = list.reduce((sum, file) => sum + Math.max(0, Number(file && file.size) || 0), 0);
    if (totalBytes > LIMITS.maxBatchBytes) {
      return {
        ok: false,
        reason: 'batch_too_large',
        actual: totalBytes,
        limit: LIMITS.maxBatchBytes,
      };
    }

    return { ok: true, reason: null, totalBytes };
  }

  function validateFile(file, width, height) {
    const fileBytes = Math.max(0, Number(file && file.size) || 0);
    if (fileBytes > LIMITS.maxFileBytes) {
      return {
        ok: false,
        reason: 'file_too_large',
        actual: fileBytes,
        limit: LIMITS.maxFileBytes,
      };
    }

    const pixelCount = Math.max(0, Number(width) || 0) * Math.max(0, Number(height) || 0);
    if (pixelCount > LIMITS.maxPixels) {
      return {
        ok: false,
        reason: 'image_too_large',
        actual: pixelCount,
        limit: LIMITS.maxPixels,
      };
    }

    return { ok: true, reason: null, pixelCount };
  }

  const api = {
    LIMITS,
    normalizeSourcePath,
    getImportPath,
    getFileIdentity,
    validateBatch,
    validateFile,
  };

  if (typeof window !== 'undefined') window.__willowWallpaperPolicy = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
