const _rm = window.matchMedia('(prefers-reduced-motion: reduce)');

let _titleDone = false;
const _shownCards = new Set();
let _lastScore = null;
let _scoreAnimId = null;
let _lastHeaderScore = null;
let _headerScoreAnimId = null;

function resetCardCache(){ _shownCards.clear(); _lastScore = null; _lastHeaderScore = null; }

function initTitleAnimation() {
  if (_titleDone || _rm.matches) return;
  const el = document.getElementById('tsg-title-text');
  if (!el) return;
  _titleDone = true;

  const full = el.textContent;
  el.textContent = '';

  const cursor = document.createElement('span');
  cursor.className = 'type-cursor';
  cursor.textContent = '█';
  el.insertAdjacentElement('afterend', cursor);

  const sub = document.getElementById('tsg-subtitle');
  if (sub) { sub.style.opacity = '0'; }

  let i = 0;
  function tick() {
    if (i < full.length) {
      el.textContent += full[i++];
      setTimeout(tick, i === 1 ? 120 : 36);
    } else {
      cursor.classList.add('cursor-done');
      setTimeout(() => cursor.remove(), 900);
      if (sub) {
        sub.style.opacity = '';
        sub.classList.add('subtitle-reveal');
      }
    }
  }
  setTimeout(tick, 280);
}

function applyCascade() {
  if (_rm.matches) return;
  let delay = 0;
  document.querySelectorAll('.card').forEach(el => {
    const key = el.id || '';
    if (key && _shownCards.has(key)) return; // skip already-animated cards
    if (el.style.display === 'none') return;  // skip hidden cards
    el.style.animationDelay = delay ? `${delay}ms` : '';
    el.classList.add('card-new');
    if (key) _shownCards.add(key);
    delay += 48;
  });
}

function animateProgressBars() {
  if (_rm.matches) return;
  document.querySelectorAll('.prog-bar').forEach(bar => {
    const target = bar.style.width;
    bar.style.transition = 'none';
    bar.style.width = '0';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      bar.style.transition = '';
      bar.style.width = target;
    }));
  });
}

function animateScoreNum() {
  if (_rm.matches) return;
  const el = document.getElementById('score-num-val');
  if (!el) return;
  const target = parseInt(el.textContent, 10);
  if (isNaN(target)) return;
  const from = _lastScore !== null ? _lastScore : 0;
  _lastScore = target;
  if (from === target) return;
  if (_scoreAnimId) { cancelAnimationFrame(_scoreAnimId); _scoreAnimId = null; }
  const duration = 700;
  const startTime = performance.now();
  el.textContent = from;
  function tick(now) {
    const t = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(from + (target - from) * eased);
    if (t < 1) _scoreAnimId = requestAnimationFrame(tick);
    else { el.textContent = target; _scoreAnimId = null; }
  }
  _scoreAnimId = requestAnimationFrame(tick);
}

const _TAB_IND_BG  = {fleet:'#2a90d4', score:'#1aab6d', timer:'#c47a0a'};
const _TAB_IND_SHD = {fleet:'rgba(42,144,212,0.55)', score:'rgba(26,171,109,0.55)', timer:'rgba(196,122,10,0.55)'};

function initTabIndicator() {
  const ind = document.getElementById('tab-indicator');
  const aTab = document.querySelector('.tab.on');
  const row = ind?.parentElement;
  if (!ind || !aTab || !row) return;
  const tabId = aTab.dataset.tab;
  if (tabId && _TAB_IND_BG[tabId]) {
    ind.style.background = _TAB_IND_BG[tabId];
    ind.style.boxShadow = `0 0 8px ${_TAB_IND_SHD[tabId]}`;
  }
  const rRect = row.getBoundingClientRect();
  const tRect = aTab.getBoundingClientRect();
  ind.style.transition = 'none';
  ind.style.transform = `translateX(${Math.round(tRect.left - rRect.left + (row.scrollLeft || 0))}px)`;
  ind.style.width = `${Math.round(tRect.width)}px`;
  void ind.offsetHeight;
  ind.style.transition = '';
}

function animateHeaderScore() {
  if (_rm.matches) return;
  const el = document.getElementById('header-score-val');
  if (!el) return;
  const target = parseInt(el.textContent, 10);
  if (isNaN(target)) return;
  const from = _lastHeaderScore !== null ? _lastHeaderScore : 0;
  _lastHeaderScore = target;
  if (from === target) return;
  if (_headerScoreAnimId) { cancelAnimationFrame(_headerScoreAnimId); _headerScoreAnimId = null; }
  const duration = 700;
  const startTime = performance.now();
  el.textContent = from;
  function tick(now) {
    const t = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(from + (target - from) * eased);
    if (t < 1) _headerScoreAnimId = requestAnimationFrame(tick);
    else { el.textContent = target; _headerScoreAnimId = null; }
  }
  _headerScoreAnimId = requestAnimationFrame(tick);
}

function animateRecapUpdate() {
  if (_rm.matches) return;
  const rb = document.getElementById('recap-body');
  if (!rb) return;
  rb.querySelectorAll('.recap-member').forEach((el, i) => {
    el.classList.remove('recap-row-new');
    void el.offsetHeight;
    el.style.animationDelay = `${i * 25}ms`;
    el.classList.add('recap-row-new');
  });
}
