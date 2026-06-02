/* تَسَابِيح ∞ v21 — Adhkar Engine
   أذكار الصباح والمساء
   ──────────────────── */

import { getState, setState } from '../core/store.js';
import { LS } from '../core/storage.js';
import { dStr, toast } from '../core/utils.js';
import { awardXP, checkAchievements } from './xp.js';
import { MORNING_ADHKAR, EVENING_ADHKAR } from '../core/constants.js';

// ── تحميل ────────────────────────────────────────────────
export function loadAdhkar() {
  const done = LS.get('wirdi_adhkar_' + dStr(), {});
  setState({ adhkarDone: done }, true);
}

// ── تحديث عداد ذكر معين ──────────────────────────────────
export function tapAdhkar(id, required) {
  const done    = { ...(getState().adhkarDone || {}) };
  const cur     = done[id] || 0;
  if (cur >= required) return; // مكتمل بالفعل
  done[id] = cur + 1;
  LS.set('wirdi_adhkar_' + dStr(), done);
  setState({ adhkarDone: done });
  _checkSession(done);
}

// ── هل اكتملت كل الأذكار لجلسة معينة؟ ───────────────────
export function isSessionComplete(session) {
  const list = session === 'morning' ? MORNING_ADHKAR : EVENING_ADHKAR;
  const done = getState().adhkarDone || {};
  return list.every(a => (done[a.id] || 0) >= a.c);
}

// ── نسبة التقدم ───────────────────────────────────────────
export function sessionProgress(session) {
  const list = session === 'morning' ? MORNING_ADHKAR : EVENING_ADHKAR;
  const done = getState().adhkarDone || {};
  const total = list.reduce((s, a) => s + a.c, 0);
  const cur   = list.reduce((s, a) => s + Math.min(done[a.id] || 0, a.c), 0);
  return total > 0 ? cur / total : 0;
}

// ── تحقق من منح XP بعد إتمام جلسة ──────────────────────
function _checkSession(done) {
  const mKey = 'wirdi_adhkar_m_done_' + dStr();
  const eKey = 'wirdi_adhkar_e_done_' + dStr();

  if (!LS.get(mKey) && isSessionComplete('morning')) {
    LS.set(mKey, true);
    awardXP('adhkar_morning');
    toast('🌅 أذكار الصباح مكتملة — بارك الله فيك');
    checkAchievements();
  }
  if (!LS.get(eKey) && isSessionComplete('evening')) {
    LS.set(eKey, true);
    awardXP('adhkar_evening');
    toast('🌆 أذكار المساء مكتملة — حفظك الله');
    checkAchievements();
  }
}
