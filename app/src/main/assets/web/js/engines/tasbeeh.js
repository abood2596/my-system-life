/* تَسَابِيح ∞ v21 — Tasbeeh Engine
   العداد + الأهداف + الاستمرارية + الإضافة اليدوية
   ────────────────────────────────────────────────── */

import { getState, setState } from '../core/store.js';
import { LS } from '../core/storage.js';
import { dStr } from '../core/utils.js';
import { awardXP, checkAchievements } from './xp.js';
import { DHIKR } from '../core/constants.js';

// ── تحميل بيانات اليوم عند البدء ─────────────────────────
export function loadTasbeeh() {
  const today  = dStr();
  const counts = LS.get('wirdi_d_' + today, new Array(DHIKR.length).fill(0));
  const goals  = LS.get('wirdi_goals', DHIKR.map(d => d.b));

  // حساب الاستمرارية
  const streak = _calcStreak();
  const best   = LS.get('wirdi_best_streak', 0);

  setState({
    today,
    counts:        _padArr(counts, DHIKR.length),
    goals:         _padArr(goals,  DHIKR.length, DHIKR.map(d => d.b)),
    tasbeehStreak: streak,
    tasbeehBest:   best,
  }, true);
}

// ── نقرة واحدة على ذكر معين ──────────────────────────────
export function tapDhikr(idx, amount = 1) {
  const st    = getState();
  const counts = [...st.counts];
  counts[idx] = (counts[idx] || 0) + amount;

  setState({ counts });
  _saveCounts(counts);
  _checkWirdiComplete(counts, st.goals, st.isFriday);
}

// ── إضافة كمية يدوية (Bulk Add) ──────────────────────────
export function bulkAdd(idx, amount) {
  if (!Number.isInteger(amount) || amount <= 0) return;
  tapDhikr(idx, amount);
}

// ── إعادة ضبط ذكر معين ───────────────────────────────────
export function resetDhikr(idx) {
  const st     = getState();
  const counts = [...st.counts];
  counts[idx]  = 0;
  setState({ counts });
  _saveCounts(counts);
}

// ── تعديل الهدف اليومي ───────────────────────────────────
export function setGoal(idx, newGoal) {
  if (newGoal < 1) return;
  const goals = [...getState().goals];
  goals[idx]  = newGoal;
  setState({ goals });
  LS.set('wirdi_goals', goals);
}

// ── التحقق من إتمام الورد ────────────────────────────────
function _checkWirdiComplete(counts, goals, isFriday) {
  const key = 'wirdi_done_' + dStr();
  if (LS.get(key)) return; // مسجّل مسبقاً اليوم

  const allDone = counts.every((c, i) => c >= (goals[i] || 0));
  if (!allDone) return;

  LS.set(key, true);
  awardXP('wirdi_complete');
  checkAchievements();

  // تحديث streak
  _updateStreak();
}

// ── حفظ عداد اليوم في LS ─────────────────────────────────
function _saveCounts(counts) {
  LS.set('wirdi_d_' + dStr(), counts);
}

// ── حساب الاستمرارية من بيانات LS ────────────────────────
function _calcStreak() {
  let streak = 0;
  let offset = 0;

  while (true) {
    const key = 'wirdi_done_' + dStr(offset);
    if (!LS.get(key)) {
      // اليوم الحالي قد لا يكون مكتملاً بعد — لا يكسر السلسلة
      if (offset === 0) { offset--; continue; }
      break;
    }
    streak++;
    offset--;
    if (streak > 9999) break; // حماية من حلقة لا نهاية لها
  }
  return streak;
}

function _updateStreak() {
  const streak = _calcStreak();
  const best   = Math.max(streak, LS.get('wirdi_best_streak', 0));
  LS.set('wirdi_best_streak', best);
  setState({ tasbeehStreak: streak, tasbeehBest: best });
}

// ── مساعد: ملء مصفوفة لطول معين ─────────────────────────
function _padArr(arr, len, defaults = null) {
  const out = Array.isArray(arr) ? [...arr] : [];
  while (out.length < len) {
    out.push(defaults ? defaults[out.length] : 0);
  }
  return out.slice(0, len);
}
