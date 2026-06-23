(() => {
  const STORAGE_KEY = 'theme';
  const html = document.documentElement;
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function getTheme() {
    return localStorage.getItem(STORAGE_KEY) || 'auto';
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      html.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      html.setAttribute('data-theme', 'light');
    } else {
      html.removeAttribute('data-theme');
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }

  window.__theme = { get: getTheme, set: applyTheme };

  applyTheme(getTheme());

  mediaQuery.addEventListener('change', () => {
    if (getTheme() === 'auto') {
      html.removeAttribute('data-theme');
    }
  });
})();
