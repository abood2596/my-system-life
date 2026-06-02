/* تَسَابِيح ∞ v21 — Immersive Counter Overlay */
import { getState } from '../../core/store.js';
import { $, aN, vib, animBump, requestWakeLock, releaseWakeLock } from '../../core/utils.js';
import { openOverlay, closeOverlay } from '../nav.js';
import { tapDhikr } from '../../engines/tasbeeh.js';
import { playTap, playGoal } from '../components/sound.js';
import { DHIKR } from '../../core/constants.js';

let _activeIdx = -1;

export function openCounter(idx) {
  _activeIdx = idx;
  _render();
  openOverlay('msb-ov');
  requestWakeLock();
}

export function closeCounter() {
  closeOverlay('msb-ov');
  releaseWakeLock();
  _activeIdx = -1;
}

function _render() {
  const st    = getState();
  const dhikr = DHIKR[_activeIdx];
  if (!dhikr) return;

  const count = st.counts[_activeIdx] || 0;
  const goal  = st.goals[_activeIdx]  || dhikr.b;
  const done  = count >= goal;
  const pct   = Math.min(count / goal, 1);

  const ov = $('msb-ov');
  if (!ov) return;

  ov.innerHTML = `
    <div class="ctr-wrap">
      <button class="ctr-close" id="ctr-close-btn" aria-label="إغلاق">✕</button>
      <div class="ctr-icon">${dhikr.i}</div>
      <div class="ctr-name">${dhikr.n}</div>
      <div class="ctr-arabic">${dhikr.ar}</div>
      <div class="ctr-ring-wrap">
        <svg class="ctr-ring" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" class="ring-bg"/>
          <circle cx="60" cy="60" r="52" class="ring-fill"
            stroke-dasharray="${2 * Math.PI * 52}"
            stroke-dashoffset="${2 * Math.PI * 52 * (1 - pct)}"
            ${done ? 'class="ring-fill ring-done"' : ''}/>
        </svg>
        <div class="ctr-num" id="ctr-num">${aN(count)}</div>
        <div class="ctr-goal">/ ${aN(goal)}</div>
      </div>
      ${done ? '<div class="ctr-done-badge">✅ مكتمل</div>' : ''}
      <button class="ctr-tap-btn" id="ctr-tap" aria-label="عدّ">
        <span class="ctr-tap-inner">اضغط</span>
      </button>
      <div class="ctr-quick-add">
        <button class="btn-qadd" data-a="33">+٣٣</button>
        <button class="btn-qadd" data-a="100">+١٠٠</button>
        <button class="btn-qadd" data-a="500">+٥٠٠</button>
      </div>
      <div class="ctr-info">${dhikr.info}</div>
    </div>`;

  $('ctr-close-btn')?.addEventListener('click', closeCounter);

  $('ctr-tap')?.addEventListener('click', () => {
    tapDhikr(_activeIdx, 1);
    playTap();
    vib(20);
    _refreshCount();
    if (getState().counts[_activeIdx] >= (getState().goals[_activeIdx] || DHIKR[_activeIdx].b)) {
      playGoal(); vib([100,50,100]);
    }
    animBump($('ctr-num'));
  });

  ov.querySelectorAll('.btn-qadd').forEach(btn => {
    btn.addEventListener('click', () => {
      const a = parseInt(btn.dataset.a, 10);
      tapDhikr(_activeIdx, a);
      playTap(); vib(30);
      _refreshCount();
    });
  });
}

function _refreshCount() {
  const st    = getState();
  const count = st.counts[_activeIdx] || 0;
  const goal  = st.goals[_activeIdx]  || DHIKR[_activeIdx].b;
  const pct   = Math.min(count / goal, 1);

  const numEl = $('ctr-num');
  if (numEl) numEl.textContent = aN(count);

  const ring = document.querySelector('#msb-ov .ring-fill');
  if (ring) {
    const circ = 2 * Math.PI * 52;
    ring.style.strokeDashoffset = circ * (1 - pct);
  }
}
