// Search engine dropdown + suggestions + form submission
(() => {
  const ENGINES = [
    {
      id: 'google',
      name: 'Google',
      url: 'https://www.google.com/search?q=',
      suggestUrl: 'https://suggestqueries.google.com/complete/search?client=chrome&q=',
      parseSuggestions(data) {
        return (data && data[1]) ? data[1] : [];
      },
    },
    {
      id: 'baidu',
      name: '百度',
      url: 'https://www.baidu.com/s?wd=',
      suggestUrl: 'https://www.baidu.com/sugrec?prod=pc&wd=',
      parseSuggestions(data) {
        return (data && data.g) ? data.g.map((item) => item.q) : [];
      },
    },
    {
      id: 'bing',
      name: 'Bing',
      url: 'https://www.bing.com/search?q=',
      suggestUrl: 'https://api.bing.com/osjson.aspx?query=',
      parseSuggestions(data) {
        return (data && data[1]) ? data[1] : [];
      },
    },
    {
      id: 'duckduckgo',
      name: 'DuckDuckGo',
      url: 'https://duckduckgo.com/?q=',
      suggestUrl: 'https://duckduckgo.com/ac/?q=',
      parseSuggestions(data) {
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
        <span class="engine-dropdown-name">设置</span>
      </li>
    ` : '';

    engineDropdown.innerHTML = items + suffix;
  }

  function openEngineDropdown() {
    renderEngineDropdown();
    engineDropdown.classList.add('visible');
  }

  function closeEngineDropdown() {
    engineDropdown.classList.remove('visible');
  }

  function selectEngine(index) {
    activeIndex = index;
    localStorage.setItem(STORAGE_KEY, ENGINES[index].id);
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
    suggestionsEl.hidden = false;
    wrapper.classList.add('has-suggestions');
  }

  function doSearch(query) {
    const q = query.trim();
    if (!q) return;
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
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();

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
})();
