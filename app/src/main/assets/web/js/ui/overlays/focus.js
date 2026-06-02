/* تَسَابِيح ∞ v21 — Focus Mode Overlay */
import { $, aN, fmtCountdown, vib, toast, requestWakeLock, releaseWakeLock } from '../../core/utils.js';
import { openOverlay, closeOverlay } from '../nav.js';
import { awardXP } from '../../engines/xp.js';
import { LS } from '../../core/storage.js';
import { dStr } from '../../core/utils.js';

const DURATIONS = [15, 25, 30, 45, 60]; // دقائق
let _seconds  = 0;
let _total    = 0;
let _running  = false;
let _interval = null;

export function openFocus(minutes = 30) {
  _seconds = minutes * 60;
  _total   = _seconds;
  _running = false;
  _render();
  openOverlay('focus-ov');
}

function _render() {
  const ov = $('focus-ov');
  if (!ov) return;
  ov.innerHTML = `
    <div class="focus-wrap">
      <button class="ctr-close" id="focus-close">✕</button>
      <div class="focus-title">🎯 وضع التركيز</div>
      <div class="focus-durations">
        ${DURATIONS.map(d=>`<button class="btn-focus-dur ${_total===d*60?'active':''}" data-d="${d}">${aN(d)} دقيقة</button>`).join('')}
      </div>
      <div class="focus-timer-ring">
        <svg viewBox="0 0 120 120" class="focus-svg">
          <circle cx="60" cy="60" r="52" class="ring-bg"/>
          <circle cx="60" cy="60" r="52" class="ring-fill focus-ring-fill" id="focus-ring"
            stroke-dasharray="${2*Math.PI*52}"
            stroke-dashoffset="${2*Math.PI*52*(_seconds/_total)}"/>
        </svg>
        <div class="focus-time-display" id="focus-time">${fmtCountdown(_seconds)}</div>
      </div>
      <div class="focus-verse">وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ</div>
      <div class="focus-btns">
        <button class="btn-focus-action" id="focus-toggle">${_running?'⏸ إيقاف':'▶ ابدأ'}</button>
        <button class="btn-focus-reset"  id="focus-reset">↺ إعادة</button>
      </div>
    </div>`;

  $('focus-close')?.addEventListener('click', () => { _stop(); closeOverlay('focus-ov'); releaseWakeLock(); });
  $('focus-toggle')?.addEventListener('click', _toggleTimer);
  $('focus-reset')?.addEventListener('click',  () => { _stop(); _seconds=_total; _updateUI(); });

  ov.querySelectorAll('.btn-focus-dur').forEach(btn => {
    btn.addEventListener('click', () => {
      _stop();
      const d = parseInt(btn.dataset.d, 10);
      _seconds = _total = d * 60;
      _render();
    });
  });
}

function _toggleTimer() {
  if (_running) { _stop(); } else { _start(); }
}

function _start() {
  _running = true;
  requestWakeLock();
  $('focus-toggle').textContent = '⏸ إيقاف';
  _interval = setInterval(() => {
    _seconds--;
    _updateUI();
    if (_seconds <= 0) {
      _stop();
      _onComplete();
    }
  }, 1000);
}

function _stop() {
  _running = false;
  clearInterval(_interval);
  const btn = $('focus-toggle');
  if (btn) btn.textContent = '▶ ابدأ';
}

function _updateUI() {
  const timeEl = $('focus-time');
  const ringEl = $('focus-ring');
  if (timeEl) timeEl.textContent = fmtCountdown(_seconds);
  if (ringEl) {
    const pct = _total > 0 ? _seconds / _total : 0;
    ringEl.style.strokeDashoffset = 2 * Math.PI * 52 * pct;
  }
}

function _onComplete() {
  vib([300,100,300,100,300]);
  releaseWakeLock();
  // تسجيل جلسة تركيز مكتملة (30+ دقيقة)
  if (_total >= 30 * 60) {
    const key = 'wirdi_focus_' + dStr();
    if (!LS.get(key)) {
      LS.set(key, true);
      awardXP('focus_session_30m');
      toast('🎯 أحسنت — جلسة تركيز مكتملة!');
    }
  }
  closeOverlay('focus-ov');
}
