(() => {
  const timeEl = document.getElementById('time');
  const greetingEl = document.getElementById('greeting');
  const preferences = window.__willowPreferences;

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function getGreeting(hours) {
    const t = window.__i18n ? window.__i18n.t : (k) => k;
    if (hours < 6) return t('greeting.深夜');
    if (hours < 9) return t('greeting.早上好');
    if (hours < 12) return t('greeting.上午好');
    if (hours < 14) return t('greeting.中午好');
    if (hours < 18) return t('greeting.下午好');
    if (hours < 22) return t('greeting.晚上好');
    return t('greeting.深夜');
  }

  function update() {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    timeEl.textContent = `${pad(h)}:${pad(m)}`;
    timeEl.dateTime = `${pad(h)}:${pad(m)}`;
    if (!greetingEl.hidden) greetingEl.textContent = getGreeting(h);
  }

  let updateTimer = null;

  function millisecondsUntilNextMinute(now = Date.now()) {
    return 60000 - (now % 60000) + 25;
  }

  function scheduleUpdate() {
    clearTimeout(updateTimer);
    updateTimer = null;
    if (document.hidden) return;
    updateTimer = setTimeout(() => {
      update();
      scheduleUpdate();
    }, millisecondsUntilNextMinute());
  }

  function refreshAndSchedule() {
    try {
      greetingEl.hidden = preferences.readEntry('showGreeting').value === false;
    } catch (_) {
      greetingEl.hidden = false;
    }

    if (document.hidden) {
      clearTimeout(updateTimer);
      updateTimer = null;
      return;
    }
    update();
    scheduleUpdate();
  }

  document.addEventListener('visibilitychange', refreshAndSchedule);
  window.addEventListener('pagehide', () => clearTimeout(updateTimer));
  preferences.subscribe((field) => {
    if (field === 'showGreeting' || field === null) refreshAndSchedule();
  });
  refreshAndSchedule();
})();
