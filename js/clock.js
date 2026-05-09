// Live clock and contextual greeting
(() => {
  const timeEl = document.getElementById('time');
  const greetingEl = document.getElementById('greeting');

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
    greetingEl.textContent = getGreeting(h);
  }

  update();
  setInterval(update, 1000);
})();
