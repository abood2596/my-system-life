/* تَسَابِيح ∞ v21 — Sound Engine */
import { LS } from '../../core/storage.js';

let _ctx = null;
let _enabled = true;

export function initSound() {
  _enabled = LS.get('wirdi_sound', true);
}

export function playTap() {
  if (!_enabled) return;
  try {
    if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = _ctx.createOscillator();
    const gain = _ctx.createGain();
    osc.connect(gain); gain.connect(_ctx.destination);
    osc.frequency.setValueAtTime(880, _ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, _ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.08, _ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, _ctx.currentTime + 0.12);
    osc.start(); osc.stop(_ctx.currentTime + 0.12);
  } catch {}
}

export function playGoal() {
  if (!_enabled) return;
  try {
    if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523,659,784].forEach((f,i) => {
      const osc  = _ctx.createOscillator();
      const gain = _ctx.createGain();
      osc.connect(gain); gain.connect(_ctx.destination);
      osc.frequency.value = f;
      const t = _ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.start(t); osc.stop(t + 0.2);
    });
  } catch {}
}

export function toggleSound() {
  _enabled = !_enabled;
  LS.set('wirdi_sound', _enabled);
  return _enabled;
}

export function isSoundEnabled() { return _enabled; }
