// Live clock and contextual greeting
(() => {
  const timeEl = document.getElementById('time');
  const greetingEl = document.getElementById('greeting');

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function getGreeting(hours) {
    if (hours < 6) return '夜深了，注意休息';
    if (hours < 9) return '早上好';
    if (hours < 12) return '上午好';
    if (hours < 14) return '中午好';
    if (hours < 18) return '下午好';
    if (hours < 22) return '晚上好';
    return '夜深了，注意休息';
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
