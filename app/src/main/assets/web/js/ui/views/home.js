/* تَسَابِيح — Home View v2 */
import { getState, subscribe } from '../../core/store.js';
import { $, aN, isFridayToday, vib } from '../../core/utils.js';
import { DHIKR, VERSES } from '../../core/constants.js';
import { openCounter } from '../overlays/counter.js';
import { openBulkAdd } from '../overlays/bulk-add.js';
import { openMisbaha } from '../overlays/misbaha.js';
import { openFocus } from '../overlays/focus.js';
import { tapDhikr } from '../../engines/tasbeeh.js';
import { playTap } from '../components/sound.js';

let _verseIdx = 0;

export function initHome() {
  renderHome();
  subscribe('counts',       () => _refreshCounts());
  subscribe('tasbeehStreak',() => _refreshHero());
  subscribe('prayerChecks', () => _refreshHero());
  subscribe('recovery',     () => _refreshHero());
  subscribe('isFriday',     () => renderHome());

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
  const homeEl = $('v-home');
  if (!homeEl) return;

  const { greeting, greetingIcon } = _getGreeting();
  const wirdiPct = _wirdiPct(st);
  const prayDone = _prayDone(st);
  const recStreak = st.recovery?.streak || 0;
  const streak = st.tasbeehStreak || 0;
  const ringOffset = 2 * Math.PI * 42 * (1 - Math.min(streak, 90) / 90);

  homeEl.innerHTML = `
    ${isFri ? `<div class="friday-banner">🌟 يوم الجمعة المبارك — صلِّ على النبي ﷺ وتقرّب إلى الله</div>` : ''}

    <div class="hero-card home-hero" id="hero-card">
      <div class="home-greeting">${greetingIcon} ${greeting}</div>
      <div class="home-hero-body">
        <div class="home-ring-wrap">
          <svg viewBox="0 0 100 100" class="home-ring-svg">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="7"/>
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--gold)" stroke-width="7"
              stroke-linecap="round"
              stroke-dasharray="${(2 * Math.PI * 42).toFixed(2)}"
              stroke-dashoffset="${ringOffset.toFixed(2)}"
              transform="rotate(-90 50 50)"
              style="transition:stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)"/>
          </svg>
          <div class="home-ring-inner">
            <div class="home-ring-num" id="hero-streak-num">${aN(streak)}</div>
            <div class="home-ring-lbl">🔥 يوم</div>
          </div>
        </div>
        <div class="home-chips-col">
          <div class="home-chip ${prayDone === 5 ? 'chip-done' : ''}" id="chip-pray">
            <span class="chip-ico">🕌</span>
            <div class="chip-body">
              <div class="chip-val">${aN(prayDone)}<span class="chip-of">/٥</span></div>
              <div class="chip-lbl">صلوات</div>
            </div>
          </div>
          <div class="home-chip ${wirdiPct >= 100 ? 'chip-done' : ''}" id="chip-wirdi">
            <span class="chip-ico">📿</span>
            <div class="chip-body">
              <div class="chip-val">${aN(wirdiPct)}<span class="chip-of">٪</span></div>
              <div class="chip-lbl">الورد</div>
            </div>
          </div>
          <div class="home-chip ${recStreak > 0 ? 'chip-rec-active' : ''}" id="chip-rec">
            <span class="chip-ico">💚</span>
            <div class="chip-body">
              <div class="chip-val">${aN(recStreak)}</div>
              <div class="chip-lbl">يوم نقاء</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="verse-card">
      <div class="verse-text" id="home-verse" style="transition:opacity .4s">${VERSES[_verseIdx].v}</div>
      <div class="verse-src"  id="home-verse-src">${VERSES[_verseIdx].s}</div>
    </div>

    <div class="home-actions">
      <button class="btn-ha" id="btn-misbaha">📿<span>السبحة</span></button>
      <button class="btn-ha" id="btn-bulk-add">➕<span>إضافة</span></button>
      <button class="btn-ha" id="btn-focus">🎯<span>تركيز</span></button>
    </div>

    <div class="dhikr-list" id="dhikr-list">
      ${DHIKR.map((d, i) => _dhikrCard(d, i, st)).join('')}
    </div>

    ${isFri ? _fridaySection(st) : ''}
  `;

  $('btn-misbaha')?.addEventListener('click', openMisbaha);
  $('btn-bulk-add')?.addEventListener('click', () => openBulkAdd(0));
  $('btn-focus')?.addEventListener('click', () => openFocus(30));

  document.querySelectorAll('.dhikr-card').forEach(card => {
    const idx = parseInt(card.dataset.idx, 10);
    card.querySelector('.dhikr-tap-zone')?.addEventListener('click', () => {
      tapDhikr(idx, 1); playTap(); vib(15);
    });
    let _longTimer = null;
    card.addEventListener('pointerdown', () => { _longTimer = setTimeout(() => openCounter(idx), 500); });
    card.addEventListener('pointerup',   () => clearTimeout(_longTimer));
    card.addEventListener('pointerleave',() => clearTimeout(_longTimer));
    card.querySelector('.btn-dhikr-add')?.addEventListener('click', e => {
      e.stopPropagation(); openBulkAdd(idx);
    });
  });
}

function _getGreeting() {
  const h = new Date().getHours();
  if (h < 5)       return { greetingIcon: '🌙', greeting: 'الليل ذكر وقرآن' };
  if (h < 7)       return { greetingIcon: '🌅', greeting: 'صباح البركة والنور' };
  if (h < 12)      return { greetingIcon: '☀️', greeting: 'صباح الطاعة' };
  if (h < 15)      return { greetingIcon: '🌤', greeting: 'نهار مبارك' };
  if (h < 18)      return { greetingIcon: '🌇', greeting: 'عصر متقن' };
  if (h < 21)      return { greetingIcon: '🌆', greeting: 'مساء الخير' };
  return           { greetingIcon: '🌙', greeting: 'ليلة مباركة' };
}

function _wirdiPct(st) {
  if (!DHIKR.length) return 0;
  const done = DHIKR.filter((d, i) => (st.counts[i] || 0) >= (st.goals[i] || d.b)).length;
  return Math.round(done / DHIKR.length * 100);
}

function _prayDone(st) {
  return Object.values(st.prayerChecks || {}).filter(Boolean).length;
}

function _dhikrCard(d, i, st) {
  const count = st.counts[i] || 0;
  const goal  = st.goals[i]  || d.b;
  const pct   = Math.min(count / goal, 1);
  const done  = pct >= 1;
  return `
    <div class="dhikr-card ${done ? 'done' : ''}" data-idx="${i}">
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
      <div class="dhikr-progress-bar"><div class="dhikr-pb-fill" style="width:${Math.round(pct * 100)}%"></div></div>
      <button class="btn-dhikr-add" title="إضافة يدوية">+</button>
    </div>`;
}

function _fridaySection(st) {
  const salawatGoal  = 1000;
  const salawatCount = st.counts[5] || 0;
  return `
    <div class="friday-section">
      <div class="friday-title">🌟 سنن يوم الجمعة</div>
      <div class="friday-item">
        <span>📖 قراءة سورة الكهف</span>
        <button class="btn-check" id="btn-kahf-check">تأكيد</button>
      </div>
      <div class="friday-item">
        <span>💛 الصلاة على النبي ﷺ — ${aN(salawatCount)}/${aN(salawatGoal)}</span>
        <div class="friday-bar"><div class="friday-bar-fill" style="width:${Math.min(salawatCount / salawatGoal, 1) * 100}%"></div></div>
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
      const pct = Math.min((st.counts[i] || 0) / (st.goals[i] || d.b), 1);
      const bar = card.querySelector('.dhikr-pb-fill');
      if (bar) bar.style.width = Math.round(pct * 100) + '%';
      card.classList.toggle('done', pct >= 1);
    }
  });
  _refreshChips(st);
}

function _refreshHero() {
  const st = getState();
  const streak = st.tasbeehStreak || 0;
  const numEl = $('hero-streak-num');
  if (numEl) numEl.textContent = aN(streak);

  const r = 42;
  const ringEl = document.querySelector('.home-ring-svg circle:last-child');
  if (ringEl) {
    const offset = 2 * Math.PI * r * (1 - Math.min(streak, 90) / 90);
    ringEl.setAttribute('stroke-dashoffset', offset.toFixed(2));
  }
  _refreshChips(st);
}

function _refreshChips(st) {
  const wirdiPct  = _wirdiPct(st);
  const prayDone  = _prayDone(st);
  const recStreak = st.recovery?.streak || 0;

  const cp = $('chip-pray');
  const cw = $('chip-wirdi');
  const cr = $('chip-rec');

  if (cp) {
    cp.querySelector('.chip-val').innerHTML = `${aN(prayDone)}<span class="chip-of">/٥</span>`;
    cp.classList.toggle('chip-done', prayDone === 5);
  }
  if (cw) {
    cw.querySelector('.chip-val').innerHTML = `${aN(wirdiPct)}<span class="chip-of">٪</span>`;
    cw.classList.toggle('chip-done', wirdiPct >= 100);
  }
  if (cr) {
    cr.querySelector('.chip-val').textContent = aN(recStreak);
    cr.classList.toggle('chip-rec-active', recStreak > 0);
  }
}
