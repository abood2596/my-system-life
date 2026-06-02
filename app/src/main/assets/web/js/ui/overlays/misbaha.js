/* تَسَابِيح ∞ v21 — Misbaha Overlay */
import { $, aN, vib } from '../../core/utils.js';
import { openOverlay, closeOverlay } from '../nav.js';
import { playTap, playGoal } from '../components/sound.js';
import { MISB_OPTIONS } from '../../core/constants.js';

let _count = 0;
let _goal  = 33;
let _optIdx = 0;

export function openMisbaha() {
  _count = 0;
  _render();
  openOverlay('msb-ov');
}

function _render() {
  const ov = $('msb-ov');
  if (!ov) return;
  const opt = MISB_OPTIONS[_optIdx];
  _goal = opt.g;

  ov.innerHTML = `
    <div class="misb-wrap">
      <button class="ctr-close" id="misb-close">✕</button>
      <div class="misb-opt-select">
        ${MISB_OPTIONS.map((o,i)=>`<button class="btn-misb-opt ${i===_optIdx?'active':''}" data-i="${i}">${o.n}</button>`).join('')}
      </div>
      <div class="misb-text">${opt.t}</div>
      <div class="misb-count" id="misb-cnt">${aN(_count)}</div>
      <div class="misb-goal">الهدف: ${aN(_goal)}</div>
      <button class="misb-tap-btn" id="misb-tap">اضغط للتسبيح</button>
      <button class="misb-reset" id="misb-reset">إعادة</button>
    </div>`;

  $('misb-close')?.addEventListener('click', () => closeOverlay('msb-ov'));
  $('misb-tap')?.addEventListener('click', _tap);
  $('misb-reset')?.addEventListener('click', () => { _count=0; _refresh(); });
  ov.querySelectorAll('.btn-misb-opt').forEach(btn => {
    btn.addEventListener('click', () => { _optIdx=parseInt(btn.dataset.i,10); _count=0; _render(); });
  });
}

function _tap() {
  _count++;
  playTap(); vib(15);
  if (_count % _goal === 0) {
    playGoal(); vib([100,50,100]);
  }
  _refresh();
}

function _refresh() {
  const el = $('misb-cnt');
  if (el) el.textContent = aN(_count % _goal || (_count > 0 && _count % _goal === 0 ? _goal : _count % _goal));
}
