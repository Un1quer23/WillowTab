(() => {
  const STORAGE_KEY = 'theme';
  const html = document.documentElement;
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function getTheme() {
    const storedTheme = localStorage.getItem(STORAGE_KEY);
    return storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'auto';
  }

  function resolveColorScheme(theme) {
    return theme === 'auto' ? (mediaQuery.matches ? 'dark' : 'light') : theme;
  }

  function syncThemeAttributes(theme) {
    if (theme === 'light' || theme === 'dark') {
      html.setAttribute('data-theme', theme);
    } else {
      html.removeAttribute('data-theme');
    }
    html.setAttribute('data-color-scheme', resolveColorScheme(theme));
  }

  function applyTheme(theme) {
    const normalizedTheme = theme === 'light' || theme === 'dark' ? theme : 'auto';
    syncThemeAttributes(normalizedTheme);
    localStorage.setItem(STORAGE_KEY, normalizedTheme);
  }

  window.__theme = { get: getTheme, set: applyTheme };

  applyTheme(getTheme());

  mediaQuery.addEventListener('change', () => {
    if (getTheme() === 'auto') {
      html.setAttribute('data-color-scheme', resolveColorScheme('auto'));
    }
  });
})();
