// Search engine dropdown + suggestions + form submission
(() => {
  const ENGINES = [
    {
      id: 'default',
      get name() { return (window.__i18n && window.__i18n.t('engine.default')) || '浏览器默认'; },
      url: '',
      suggestUrl: '',
      iconClass: 'engine-icon-default',
      logo: '<svg viewBox="1 1 22 22" fill="none"><g transform="translate(3.05 3.05) scale(0.746)" stroke="currentColor" stroke-width="2.05" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></g></svg>',
    },
    {
      id: 'google',
      name: 'Google',
      url: 'https://www.google.com/search?q=',
      suggestUrl: 'https://suggestqueries.google.com/complete/search?client=chrome&q=',
      iconClass: 'engine-icon-google',
      logo: '<svg viewBox="1 1 22 22" fill="none"><path d="M19.76 10.77L19.67 10.42H12.23V13.58H16.68C16.4317 14.5443 15.8672 15.3974 15.0767 16.0029C14.2863 16.6084 13.3156 16.9313 12.32 16.92C11.0208 16.9093 9.77254 16.4135 8.81999 15.53C8.35174 15.0685 7.97912 14.5191 7.72344 13.9134C7.46777 13.3077 7.33407 12.6575 7.33 12C7.34511 10.6795 7.86792 9.41544 8.79 8.47002C9.7291 7.58038 10.9764 7.08932 12.27 7.10002C13.3779 7.10855 14.4446 7.52101 15.27 8.26002L17.47 6.00002C16.02 4.70638 14.1432 3.9941 12.2 4.00002C11.131 3.99367 10.0713 4.19793 9.08127 4.60115C8.09125 5.00436 7.19034 5.59863 6.43 6.35002C4.98369 7.8523 4.16827 9.85182 4.15152 11.9371C4.13478 14.0224 4.918 16.0347 6.34 17.56C7.12784 18.3449 8.06422 18.965 9.09441 19.3839C10.1246 19.8029 11.2279 20.0123 12.34 20C13.3484 20.0075 14.3479 19.8102 15.2779 19.42C16.2078 19.0298 17.0488 18.4549 17.75 17.73C19.1259 16.2171 19.8702 14.2347 19.83 12.19C19.8408 11.7156 19.8174 11.2411 19.76 10.77Z" fill="currentColor"/></svg>',
      parseSuggestions(data) {
        return (data && data[1]) ? data[1] : [];
      },
    },
    {
      id: 'baidu',
      /* 百度需要 i18n：中文显示"百度"，英文显示"Baidu"；其他引擎名是专有名词，无需翻译 */
      get name() { return (window.__i18n && window.__i18n.t('engine.baidu')) || '百度'; },
      url: 'https://www.baidu.com/s?wd=',
      suggestUrl: 'https://www.baidu.com/sugrec?prod=pc&wd=',
      iconClass: 'engine-icon-baidu',
      logo: '<svg viewBox="1 1 22 22" fill="currentColor"><g transform="translate(3.65 3.55) scale(0.535)"><path d="M11.156 22.427c-0.597 0.171-1.071 0.596-1.307 1.147l-0.005 0.013c-0.119 0.297-0.187 0.641-0.187 1.001 0 0.207 0.023 0.409 0.066 0.603l-0.003-0.018c0.161 0.759 0.782 1.335 1.551 1.429l0.009 0.001h1.712v-4.174zM17.977 20.994v4.85c0.12 0.516 0.765 0.61 0.765 0.61h2.017v-5.427h2.111v7.225h-4.892c-1.896-0.487-1.987-1.831-1.987-1.831v-5.395zM13.023 18.007l1.927 0.030v10.243h-4.251c-1.144-0.183-2.1-0.864-2.652-1.809l-0.010-0.018c-0.27-0.584-0.427-1.268-0.427-1.988 0-0.333 0.034-0.658 0.098-0.971l-0.005 0.031c0.385-1.436 1.57-2.517 3.037-2.742l0.021-0.003h2.262zM15.815 13.208c-1.754 0.075-3.271 1.020-4.14 2.411l-0.013 0.022c-1.108 1.613-2.393 2.997-3.852 4.174l-0.037 0.029c-0.312 0.386-4.511 2.644-3.579 6.773 0.228 2.191 1.996 3.903 4.192 4.044l0.013 0.001c0.376 0.027 0.815 0.043 1.257 0.043 1.401 0 2.766-0.157 4.078-0.454l-0.123 0.023c0.688-0.153 1.478-0.24 2.289-0.24 1.040 0 2.046 0.144 3 0.412l-0.078-0.019s6.539 2.184 8.329-2.019c0.415-0.734 0.659-1.612 0.659-2.546 0-1.514-0.641-2.878-1.666-3.835l-0.003-0.003c-2.234-1.761-4.18-3.732-5.86-5.917l-0.058-0.078c-0.852-1.624-2.492-2.733-4.397-2.82l-0.011-0zM26.142 10.112c-2.884 0-3.27 2.648-3.27 4.519 0 1.787 0.151 4.28 3.734 4.201s3.19-4.046 3.19-4.984c-0.021-2.026-1.635-3.669-3.648-3.736l-0.006-0zM5.481 7.921q-0.098 0.002-0.195 0.010c-2.647 0.237-3.034 4.049-3.034 4.049-0.359 1.762 0.857 5.53 4.12 4.829 3.27-0.701 2.827-4.599 2.728-5.451-0.313-1.819-1.775-3.219-3.599-3.435l-0.020-0.002zM21.222 1.747c-1.648-0.018-3.539 2.493-3.723 4.165-0.234 2.181 0.312 4.357 2.723 4.667 2.416 0.312 3.968-2.257 4.276-4.204 0.014-0.133 0.023-0.287 0.023-0.444 0-1.916-1.23-3.544-2.943-4.138l-0.031-0.009c-0.098-0.023-0.21-0.037-0.326-0.037h-0zM12.444 1.004c-1.804 0-3.267 2.072-3.267 4.632 0 2.563 1.463 4.636 3.268 4.636 1.807 0 3.267-2.073 3.267-4.636-0.001-2.561-1.461-4.632-3.268-4.632z"/></g></svg>',
      parseSuggestions(data) {
        return (data && data.g) ? data.g.map((item) => item.q) : [];
      },
    },
    {
      id: 'bing',
      name: 'Bing',
      url: 'https://www.bing.com/search?q=',
      suggestUrl: 'https://api.bing.com/osjson.aspx?query=',
      iconClass: 'engine-icon-bing',
      logo: '<svg viewBox="1 1 22 22" fill="currentColor"><g transform="translate(5.58 4) scale(0.801)"><path d="M15.973 8.57a.483.483 0 0 0-.317-.434L6.273 5.23c-.175-.054-.255.039-.178.206L7.84 9.269c.077.168.276.367.442.443l2.394 1.096c.166.076.17.209.008.295L.47 16.535c-.161.086-.182.056-.046-.067l3.924-3.534a.86.86 0 0 0 .248-.558L4.6 1.664a.484.484 0 0 0-.318-.435L.355.014C.18-.04.037.067.037.252v16.25c0 .185.122.423.272.529l3.99 2.827c.15.106.4.115.557.02l10.832-6.523a.658.658 0 0 0 .286-.507V8.57z"/></g></svg>',
      parseSuggestions(data) {
        return (data && data[1]) ? data[1] : [];
      },
    },
    {
      id: 'duckduckgo',
      name: 'DuckDuckGo',
      url: 'https://duckduckgo.com/?q=',
      suggestUrl: 'https://duckduckgo.com/ac/?q=',
      iconClass: 'engine-icon-duckduckgo',
      logo: '<svg viewBox="1 1 22 22" fill="none"><g transform="translate(2.4 2.4) scale(0.100)" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="12"><path d="M96 170c40.869 0 74-33.131 74-74 0-40.87-33.131-74-74-74S22 55.13 22 96c0 40.869 33.131 74 74 74Z"/><path d="M80 166 64.844 94.354C61.318 77.686 74.033 62 91.07 62v0c12.301 0 23.023 8.372 26.006 20.305L118 86c6 28-28 14-20 40s16 38 16 38M90 62c-2-8-10-12-18-12"/><path d="M118 100c6 0 14-2 20-6m-34 18c6 4 16 6 27 4"/></g></svg>',
      parseSuggestions(data) {
        if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
          return data.map((item) => item.phrase);
        }
        return (data && data[1]) ? data[1].map((item) => item.phrase) : [];
      },
    },
  ];

  const STORAGE_KEY = 'search-engine';

  const toggle = document.getElementById('engine-toggle');
  const engineDropdown = document.getElementById('engine-dropdown');
  const suggestionsEl = document.getElementById('suggestions-dropdown');
  const form = document.getElementById('search-form');
  const input = document.getElementById('search-input');
  const wrapper = document.querySelector('.search-input-wrapper');

  let activeIndex = 0;
  let selectedSuggestIndex = -1;
  let abortController = null;

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const idx = ENGINES.findIndex((e) => e.id === saved);
    if (idx !== -1) activeIndex = idx;
  }

  // --- Engine dropdown ---
  function renderEngineDropdown() {
    const items = ENGINES.map((engine, i) => `
      <li class="engine-dropdown-item ${i === activeIndex ? 'active' : ''}" data-index="${i}" role="menuitem">
        <span class="engine-dropdown-name">${engine.name}</span>
        ${i === activeIndex ? '<svg class="engine-dropdown-check" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
      </li>
    `).join('');

    const suffix = document.body.dataset.settingsBtnPosition === 'dropdown' ? `
      <li class="engine-dropdown-separator"></li>
      <li class="engine-dropdown-item engine-dropdown-settings" data-action="settings" role="menuitem">
        <span class="engine-dropdown-name">${(window.__i18n && window.__i18n.t('search.settings')) || '设置'}</span>
      </li>
    ` : '';

    engineDropdown.innerHTML = items + suffix;
  }

  function openEngineDropdown() {
    closeSuggestions();
    renderEngineDropdown();
    engineDropdown.classList.add('visible');
  }

  function closeEngineDropdown() {
    engineDropdown.classList.remove('visible');
  }

  function updateToggleIcon() {
    const engine = ENGINES[activeIndex];
    if (!engine.logo) return;
    toggle.innerHTML = engine.logo;
    const svg = toggle.querySelector('svg');
    if (svg) {
      svg.classList.add('engine-icon', engine.iconClass);
    }
  }

  function selectEngine(index) {
    activeIndex = index;
    localStorage.setItem(STORAGE_KEY, ENGINES[index].id);
    updateToggleIcon();
    closeEngineDropdown();
    input.focus();
  }

  // --- Suggestions ---
  function closeSuggestions() {
    suggestionsEl.hidden = true;
    suggestionsEl.innerHTML = '';
    selectedSuggestIndex = -1;
    wrapper.classList.remove('has-suggestions');
  }

  function showSuggestions() {
    closeEngineDropdown();
    suggestionsEl.hidden = false;
    wrapper.classList.add('has-suggestions');
  }

  function doSearch(query) {
    const q = query.trim();
    if (!q) return;
    if (ENGINES[activeIndex].id === 'default') {
      chrome.search.query({ text: q, disposition: 'CURRENT_TAB' });
      return;
    }
    window.location.href = ENGINES[activeIndex].url + encodeURIComponent(q);
  }

  function renderSuggestions(suggestions) {
    selectedSuggestIndex = -1;
    if (!suggestions || suggestions.length === 0) {
      closeSuggestions();
      return;
    }
    suggestionsEl.innerHTML = suggestions.map((text, i) => `
      <li class="suggest-item ${i === selectedSuggestIndex ? 'active' : ''}" data-index="${i}">
        <svg class="suggest-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <span class="suggest-text">${escapeHtml(text)}</span>
      </li>
    `).join('');
    showSuggestions();
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async function fetchSuggestions(query) {
    if (document.body.dataset.suggestionsEnabled !== 'true') {
      closeSuggestions();
      return;
    }
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();
    const requestController = abortController;

    const engine = ENGINES[activeIndex];
    if (!engine.suggestUrl) {
      closeSuggestions();
      return;
    }

    try {
      const resp = await fetch(engine.suggestUrl + encodeURIComponent(query), {
        signal: abortController.signal,
      });
      if (!resp.ok) {
        closeSuggestions();
        return;
      }
      const data = await resp.json();
      if (requestController !== abortController ||
          input.value.trim() !== query ||
          document.body.dataset.suggestionsEnabled !== 'true') {
        return;
      }
      const suggestions = engine.parseSuggestions(data).slice(0, 8);
      renderSuggestions(suggestions);
    } catch (err) {
      if (err.name !== 'AbortError') {
        closeSuggestions();
      }
    }
  }

  let debounceTimer = null;
  function onInput() {
    clearTimeout(debounceTimer);
    const query = input.value.trim();

    if (query.length < 2) {
      if (abortController) {
        abortController.abort();
        abortController = null;
      }
      closeSuggestions();
      return;
    }

    debounceTimer = setTimeout(() => {
      fetchSuggestions(query);
    }, 250);
  }

  // --- Events ---

  // Engine toggle
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (engineDropdown.classList.contains('visible')) {
      closeEngineDropdown();
    } else {
      openEngineDropdown();
    }
  });

  engineDropdown.addEventListener('click', (e) => {
    const settingsItem = e.target.closest('.engine-dropdown-settings');
    if (settingsItem) {
      closeEngineDropdown();
      if (window.__settingsPanel) window.__settingsPanel.open();
      return;
    }
    const item = e.target.closest('.engine-dropdown-item');
    if (!item) return;
    selectEngine(parseInt(item.dataset.index, 10));
  });

  // Suggestion clicks
  suggestionsEl.addEventListener('click', (e) => {
    const item = e.target.closest('.suggest-item');
    if (!item) return;
    const text = item.querySelector('.suggest-text').textContent;
    doSearch(text);
  });

  // Close dropdowns on outside click
  document.addEventListener('click', (e) => {
    if (engineDropdown.classList.contains('visible') &&
        !toggle.contains(e.target) && !engineDropdown.contains(e.target)) {
      closeEngineDropdown();
    }
    if (!suggestionsEl.hidden && !input.contains(e.target) && !suggestionsEl.contains(e.target)) {
      closeSuggestions();
    }
  });

  // Input events
  input.addEventListener('input', onInput);

  // Keyboard
  document.addEventListener('keydown', (e) => {
    // Escape
    if (e.key === 'Escape') {
      if (engineDropdown.classList.contains('visible')) {
        closeEngineDropdown();
        input.focus();
        return;
      }
      if (!suggestionsEl.hidden) {
        closeSuggestions();
        return;
      }
    }

    // Arrow keys for suggestions
    if (!suggestionsEl.hidden) {
      const items = suggestionsEl.querySelectorAll('.suggest-item');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedSuggestIndex = Math.min(selectedSuggestIndex + 1, items.length - 1);
        updateSuggestHighlight(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedSuggestIndex = Math.max(selectedSuggestIndex - 1, -1);
        updateSuggestHighlight(items);
      } else if (e.key === 'Enter' && selectedSuggestIndex >= 0) {
        e.preventDefault();
        const text = items[selectedSuggestIndex].querySelector('.suggest-text').textContent;
        doSearch(text);
      }
    }
  });

  function updateSuggestHighlight(items) {
    items.forEach((item, i) => {
      item.classList.toggle('active', i === selectedSuggestIndex);
    });
  }

  // Submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    doSearch(input.value);
  });

  // Init
  renderEngineDropdown();
  updateToggleIcon();
})();
