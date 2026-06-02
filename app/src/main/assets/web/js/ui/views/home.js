/* إشراق — Home View (اليوم) — بطل السلسلة + ملخّص اليوم (بلا XP) */
import { getState, subscribe } from '../../core/store.js';
import { $, aN, isFridayToday, vib, dStr } from '../../core/utils.js';
import { DHIKR, VERSES } from '../../core/constants.js';
import { LS } from '../../core/storage.js';
import { openCounter } from '../overlays/counter.js';
import { openBulkAdd } from '../overlays/bulk-add.js';
import { openMisbaha } from '../overlays/misbaha.js';
import { openFocus } from '../overlays/focus.js';
import { tapDhikr } from '../../engines/tasbeeh.js';
import { playTap } from '../components/sound.js';

let _verseIdx = 0;

function _greeting() {
  const h = new Date().getHours();
  if (h < 5)  return 'سَكينةُ الليل 🌙';
  if (h < 12) return 'أشرقَ صباحُك ☀️';
  if (h < 17) return 'نهارٌ مبارك 🌤️';
  if (h < 20) return 'مساءُ الخير 🌆';
  return 'مساءٌ مبارك 🌙';
}

function _todayTotal(st)  { return (st.counts || []).reduce((a, b) => a + (b || 0), 0); }
function _prayDone()      { return (LS.get('wirdi_pray_' + dStr(), []) || []).filter(Boolean).length; }

export function initHome() {
  renderHome();
  subscribe('counts',        () => _refreshCounts());
  subscribe('recovery',      () => _refreshHero());
  subscribe('tasbeehStreak', () => _refreshHero());
  subscribe('isFriday',      () => renderHome());

  // دوران الآيات كل 12 ثانية
  setInterval(() => {
    _verseIdx = (_verseIdx + 1) % VERSES.length;
    const el = $('home-verse');
    if (el) {
      el.style.opacity = '0';
      setTimeout(() => {
        el.textContent = VERSES[_verseIdx].v;
        const src = $('home-verse-src');
        if (src) src.textContent = VERSES[_verseIdx].s;
        el.style.opacity = '1';
      }, 400);
    }
  }, 12000);
}

export function renderHome() {
  const st    = getState();
  const isFri = isFridayToday();
  const streak  = st.tasbeehStreak || 0;
  const recStrk = st.recovery?.streak || 0;

  const homeEl = $('v-home');
  if (!homeEl) return;

  homeEl.innerHTML = `
    ${isFri ? `<div class="friday-banner">🌟 يوم الجمعة المبارك — أكثِر من الصلاة على النبي ﷺ</div>` : ''}

    <div class="hero-card" id="hero-card">
      <div class="hero-greeting">${_greeting()}</div>
      <div class="hero-streak-big">🔥 <span id="hero-streak-n">${aN(streak)}</span><small>يوم وِردٍ متواصل</small></div>
      <div class="hero-chips">
        <div class="hero-chip"><div class="hc-n" id="hc-today">${aN(_todayTotal(st))}</div><div class="hc-l">تسابيح اليوم</div></div>
        <div class="hero-chip"><div class="hc-n" id="hc-rec">${aN(recStrk)}</div><div class="hc-l">أيام نقاء</div></div>
        <div class="hero-chip"><div class="hc-n" id="hc-pray">${aN(_prayDone())}/٥</div><div class="hc-l">صلوات اليوم</div></div>
      </div>
    </div>

    <div class="verse-card">
      <div class="verse-text" id="home-verse" style="transition:opacity .4s">${VERSES[_verseIdx].v}</div>
      <div class="verse-src"  id="home-verse-src">${VERSES[_verseIdx].s}</div>
    </div>

    <div class="home-actions">
      <button class="btn-ha" id="btn-misbaha">📿<span>السبحة</span></button>
      <button class="btn-ha" id="btn-bulk-add">➕<span>إضافة يدوية</span></button>
      <button class="btn-ha" id="btn-focus">🎯<span>تركيز</span></button>
    </div>

    <div class="dhikr-list" id="dhikr-list">
      ${DHIKR.map((d,i) => _dhikrCard(d, i, st)).join('')}
    </div>

    ${isFri ? _fridaySection(st) : ''}
  `;

  // أحداث الأزرار
  $('btn-misbaha')?.addEventListener('click', openMisbaha);
  $('btn-bulk-add')?.addEventListener('click', () => openBulkAdd(0));
  $('btn-focus')?.addEventListener('click', () => openFocus(30));

  // أحداث بطاقات التسبيح
  document.querySelectorAll('.dhikr-card').forEach(card => {
    const idx = parseInt(card.dataset.idx, 10);

    card.querySelector('.dhikr-tap-zone')?.addEventListener('click', () => {
      tapDhikr(idx, 1);
      playTap(); vib(15);
    });

    let _longTimer = null;
    card.addEventListener('pointerdown', () => {
      _longTimer = setTimeout(() => openCounter(idx), 500);
    });
    card.addEventListener('pointerup',   () => clearTimeout(_longTimer));
    card.addEventListener('pointerleave',() => clearTimeout(_longTimer));

    card.querySelector('.btn-dhikr-add')?.addEventListener('click', e => {
      e.stopPropagation();
      openBulkAdd(idx);
    });
  });
}

function _dhikrCard(d, i, st) {
  const count = st.counts[i] || 0;
  const goal  = st.goals[i]  || d.b;
  const pct   = Math.min(count / goal, 1);
  const done  = pct >= 1;

  return `
    <div class="dhikr-card ${done?'done':''}" data-idx="${i}">
      <div class="dhikr-tap-zone">
        <div class="dhikr-icon">${d.i}</div>
        <div class="dhikr-info">
          <div class="dhikr-name">${d.n}</div>
          <div class="dhikr-sub">${d.s}</div>
        </div>
        <div class="dhikr-count-wrap">
          <div class="dhikr-count" id="dc-${i}">${aN(count)}</div>
          <div class="dhikr-goal">/${aN(goal)}</div>
        </div>
      </div>
      <div class="dhikr-progress-bar"><div class="dhikr-pb-fill" style="width:${Math.round(pct*100)}%"></div></div>
      <button class="btn-dhikr-add" title="إضافة يدوية">+</button>
    </div>`;
}

function _fridaySection(st) {
  const salawatGoal = 1000;
  const salawatCount = st.counts[5] || 0;
  return `
    <div class="friday-section">
      <div class="friday-title">🌟 أهداف يوم الجمعة</div>
      <div class="friday-item">
        <span>📖 قراءة سورة الكهف</span>
        <button class="btn-check" id="btn-kahf-check">تأكيد</button>
      </div>
      <div class="friday-item">
        <span>💛 الصلاة على النبي ﷺ — ${aN(salawatCount)}/${aN(salawatGoal)}</span>
        <div class="friday-bar"><div class="friday-bar-fill" style="width:${Math.min(salawatCount/salawatGoal,1)*100}%"></div></div>
      </div>
    </div>`;
}

function _refreshCounts() {
  const st = getState();
  DHIKR.forEach((d, i) => {
    const el = document.getElementById('dc-' + i);
    if (el) el.textContent = aN(st.counts[i] || 0);
    const card = document.querySelector(`.dhikr-card[data-idx="${i}"]`);
    if (card) {
      const pct = Math.min((st.counts[i]||0) / (st.goals[i]||d.b), 1);
      const bar = card.querySelector('.dhikr-pb-fill');
      if (bar) bar.style.width = Math.round(pct*100) + '%';
      card.classList.toggle('done', pct >= 1);
    }
  });
  const tEl = $('hc-today');
  if (tEl) tEl.textContent = aN(_todayTotal(st));
}

function _refreshHero() {
  const st = getState();
  const sEl = $('hero-streak-n');
  const rEl = $('hc-rec');
  const pEl = $('hc-pray');
  if (sEl) sEl.textContent = aN(st.tasbeehStreak || 0);
  if (rEl) rEl.textContent = aN(st.recovery?.streak || 0);
  if (pEl) pEl.textContent = aN(_prayDone()) + '/٥';
}
