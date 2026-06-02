/* تَسَابِيح ∞ v21 — Home View */
import { getState, subscribe } from '../../core/store.js';
import { $, aN, isFridayToday, vib } from '../../core/utils.js';
import { DHIKR, VERSES } from '../../core/constants.js';
import { calcLevel, calcLevelProgress, xpToNextLevel, LEVELS } from '../../data/science.js';
import { openCounter } from '../overlays/counter.js';
import { openBulkAdd } from '../overlays/bulk-add.js';
import { openMisbaha } from '../overlays/misbaha.js';
import { openFocus } from '../overlays/focus.js';
import { tapDhikr } from '../../engines/tasbeeh.js';
import { playTap } from '../components/sound.js';

let _verseIdx = 0;

export function initHome() {
  renderHome();
  subscribe('counts', () => _refreshCounts());
  subscribe('xp',     () => _refreshHero());
  subscribe('tasbeehStreak', () => _refreshHero());
  subscribe('isFriday', () => renderHome());

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
  const st     = getState();
  const isFri  = isFridayToday();
  const lv     = LEVELS[calcLevel(st.xp) - 1] || LEVELS[0];
  const pct    = calcLevelProgress(st.xp);
  const toNext = xpToNextLevel(st.xp);

  const homeEl = $('v-home');
  if (!homeEl) return;

  homeEl.innerHTML = `
    ${isFri ? `<div class="friday-banner">🌟 يوم الجمعة المبارك — النقاط مضاعفة ×٣</div>` : ''}

    <div class="hero-card" id="hero-card">
      <div class="hero-level">${lv.icon} ${lv.title}</div>
      <div class="hero-xp">${aN(st.xp)} XP</div>
      <div class="hero-bar-wrap">
        <div class="hero-bar" style="width:${Math.round(pct*100)}%"></div>
      </div>
      <div class="hero-to-next">${toNext > 0 ? `${aN(toNext)} XP للمستوى القادم` : '🏆 أعلى مستوى'}</div>
      <div class="hero-streak">🔥 ${aN(st.tasbeehStreak)} يوم متواصل</div>
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

    // نقرة → زيادة مباشرة
    card.querySelector('.dhikr-tap-zone')?.addEventListener('click', () => {
      tapDhikr(idx, 1);
      playTap(); vib(15);
    });

    // ضغط مطوّل → فتح العداد الغامر
    let _longTimer = null;
    card.addEventListener('pointerdown', () => {
      _longTimer = setTimeout(() => openCounter(idx), 500);
    });
    card.addEventListener('pointerup',   () => clearTimeout(_longTimer));
    card.addEventListener('pointerleave',() => clearTimeout(_longTimer));

    // زر الإضافة اليدوية
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
}

function _refreshHero() {
  const st  = getState();
  const lv  = LEVELS[calcLevel(st.xp) - 1] || LEVELS[0];
  const pct = calcLevelProgress(st.xp);

  const xpEl    = document.querySelector('.hero-xp');
  const lvEl    = document.querySelector('.hero-level');
  const barEl   = document.querySelector('.hero-bar');
  const strkEl  = document.querySelector('.hero-streak');

  if (xpEl)   xpEl.textContent   = aN(st.xp) + ' XP';
  if (lvEl)   lvEl.textContent   = lv.icon + ' ' + lv.title;
  if (barEl)  barEl.style.width  = Math.round(pct*100) + '%';
  if (strkEl) strkEl.textContent = '🔥 ' + aN(st.tasbeehStreak) + ' يوم متواصل';
}
