/* تَسَابِيح ∞ v21 — Baqarah View */
import { getState, subscribe } from '../../core/store.js';
import { $, aN, dStr } from '../../core/utils.js';
import { BQ_GROUPS } from '../../core/constants.js';
import { getDueGroups, getMasteredCount, rateGroup, markReadToday, markFortifyToday } from '../../engines/baqarah.js';
import { openOverlay, closeOverlay } from '../nav.js';

export function initBqView() {
  renderBqView();
  subscribe('bqData',            () => renderBqView());
  subscribe('bqReadToday',       () => _refreshFlags());
  subscribe('bqFortifiedToday',  () => _refreshFlags());
}

export function renderBqView() {
  const st       = getState();
  const mastered = getMasteredCount();
  const due      = getDueGroups();
  const pct      = Math.round(mastered / BQ_GROUPS.length * 100);

  const el = $('v-bq');
  if (!el) return;

  el.innerHTML = `
    <div class="bq-hero">
      <div class="bq-hero-title">📖 سورة البقرة</div>
      <div class="bq-progress-ring-wrap">
        <svg viewBox="0 0 80 80" class="bq-ring-svg">
          <circle cx="40" cy="40" r="34" class="ring-bg"/>
          <circle cx="40" cy="40" r="34" class="ring-fill"
            stroke-dasharray="${2*Math.PI*34}"
            stroke-dashoffset="${2*Math.PI*34*(1-pct/100)}"/>
        </svg>
        <div class="bq-ring-pct">${aN(pct)}%</div>
      </div>
      <div class="bq-stats-row">
        <div class="bq-stat"><div class="bq-stat-n">${aN(mastered)}</div><div class="bq-stat-l">متقن</div></div>
        <div class="bq-stat"><div class="bq-stat-n">${aN(due.length)}</div><div class="bq-stat-l">مستحق</div></div>
        <div class="bq-stat"><div class="bq-stat-n">${aN(BQ_GROUPS.length - mastered)}</div><div class="bq-stat-l">متبقي</div></div>
      </div>
    </div>

    <div class="bq-mode-btns">
      <button class="btn-bq-mode" id="btn-bq-session">
        📚 ابدأ جلسة حفظ ${due.length > 0 ? `(${aN(due.length)} مستحقة)` : ''}
      </button>
      <button class="btn-bq-mode ${st.bqReadToday?'done':''}" id="btn-bq-read">
        ${st.bqReadToday ? '✅ قرأت اليوم' : '📖 تتبع القراءة اليومية'}
      </button>
      <button class="btn-bq-mode ${st.bqFortifiedToday?'done':''}" id="btn-bq-fort">
        ${st.bqFortifiedToday ? '🛡 تحصّنت اليوم' : '🛡 التحصين اليومي'}
      </button>
    </div>

    <div class="bq-groups-list">
      ${BQ_GROUPS.map(g => _groupCard(g, st.bqData)).join('')}
    </div>
  `;

  $('btn-bq-session')?.addEventListener('click', () => _openSession(due));
  $('btn-bq-read')?.addEventListener('click',    markReadToday);
  $('btn-bq-fort')?.addEventListener('click',    () => _openFortification());
}

function _groupCard(g, bqData) {
  const card = bqData?.[g.id];
  const mastered = card && card.interval >= 7;
  const due      = !card || card.nextReview <= dStr();
  return `
    <div class="bq-group-card ${mastered?'mastered':''}" data-gid="${g.id}">
      <div class="bq-group-main">
        <div class="bq-group-num">${aN(g.id+1)}</div>
        <div class="bq-group-info">
          <div class="bq-group-title">${g.t}</div>
          <div class="bq-group-ayah">آيات ${g.a}</div>
        </div>
        <div class="bq-group-status">
          ${mastered ? '✅' : due ? '📚' : '⏳'}
        </div>
      </div>
      ${due ? `<button class="btn-bq-review" data-gid="${g.id}">مراجعة</button>` : ''}
    </div>`;
}

function _openSession(groups) {
  if (groups.length === 0) { alert('🎉 لا توجد مجموعات مستحقة اليوم!'); return; }
  let idx = 0;
  _showReview(groups, idx);
}

function _showReview(groups, idx) {
  const g   = groups[idx];
  if (!g) { closeOverlay('bqmod'); renderBqView(); return; }

  const ov = $('bqmod');
  if (!ov) return;

  ov.innerHTML = `
    <div class="bq-review-wrap">
      <div class="bq-rev-progress">${aN(idx+1)}/${aN(groups.length)}</div>
      <div class="bq-rev-title">${g.t}</div>
      <div class="bq-rev-ayah">آيات ${g.a}</div>
      <div class="bq-rev-hint">${g.h}</div>
      <div class="bq-rev-q">كيف كانت المراجعة؟</div>
      <div class="bq-rate-btns">
        <button class="btn-bq-rate btn-rate-0" data-q="0">😕 لا أعرف</button>
        <button class="btn-bq-rate btn-rate-1" data-q="1">😐 صعب</button>
        <button class="btn-bq-rate btn-rate-2" data-q="2">🙂 متوسط</button>
        <button class="btn-bq-rate btn-rate-3" data-q="3">😊 ممتاز</button>
      </div>
      <button class="btn-bq-close" id="bq-rev-close">إغلاق</button>
    </div>`;

  ov.querySelectorAll('.btn-bq-rate').forEach(btn => {
    btn.addEventListener('click', () => {
      rateGroup(g.id, parseInt(btn.dataset.q, 10));
      _showReview(groups, idx + 1);
    });
  });
  $('bq-rev-close')?.addEventListener('click', () => closeOverlay('bqmod'));
  openOverlay('bqmod');
}

function _openFortification() {
  const ov = $('bqmod');
  if (!ov) return;
  ov.innerHTML = `
    <div class="bq-fort-wrap">
      <div class="bq-fort-title">🛡 التحصين اليومي</div>
      <div class="bq-fort-item">
        <div class="bq-fort-label">آية الكرسي</div>
        <div class="bq-fort-text">اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...</div>
      </div>
      <div class="bq-fort-item">
        <div class="bq-fort-label">خواتيم البقرة (آخر آيتين)</div>
        <div class="bq-fort-text">آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ...</div>
      </div>
      <button class="btn-bq-mode" id="btn-fort-confirm">✅ أتممت التحصين</button>
      <button class="btn-bq-close" id="btn-fort-close">إغلاق</button>
    </div>`;

  $('btn-fort-confirm')?.addEventListener('click', () => { markFortifyToday(); closeOverlay('bqmod'); });
  $('btn-fort-close')?.addEventListener('click',   () => closeOverlay('bqmod'));
  openOverlay('bqmod');
}

function _refreshFlags() {
  const st = getState();
  const rBtn = $('btn-bq-read');
  const fBtn = $('btn-bq-fort');
  if (rBtn) { rBtn.classList.toggle('done', st.bqReadToday);       rBtn.textContent = st.bqReadToday       ? '✅ قرأت اليوم' : '📖 تتبع القراءة اليومية'; }
  if (fBtn) { fBtn.classList.toggle('done', st.bqFortifiedToday);  fBtn.textContent = st.bqFortifiedToday  ? '🛡 تحصّنت اليوم' : '🛡 التحصين اليومي'; }
}
