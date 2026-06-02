/* تَسَابِيح ∞ v21 — Fitness Engine
   تمارين الضغط والقرفصاء + Progressive Overload + مؤقت الراحة
   ─────────────────────────────────────────────────────────── */

import { getState, setState } from '../core/store.js';
import { LS } from '../core/storage.js';
import { dStr, toast } from '../core/utils.js';
import { awardXP, checkAchievements } from './xp.js';

// جداول Progressive Overload (يزيد كل أسبوعين)
const OVERLOAD_TABLE = [
  { week: 1,  push: 20, squat: 20 },
  { week: 3,  push: 30, squat: 30 },
  { week: 5,  push: 40, squat: 40 },
  { week: 9,  push: 50, squat: 50 },
  { week: 13, push: 60, squat: 60 },
  { week: 17, push: 75, squat: 75 },
];

// ── تحميل ────────────────────────────────────────────────
export function loadFitness() {
  const today    = dStr();
  const saved    = LS.get('wirdi_fit_' + today, { push: 0, squat: 0 });
  const meta     = LS.get('wirdi_fit_meta', {
    weekNumber: 1, consecutiveDays: 0, lastFitDate: null, totalFitDays: 0,
  });

  const goals = _calcGoals(meta.weekNumber);

  setState({
    fitness: {
      todayPush:       saved.push  || 0,
      todaySquat:      saved.squat || 0,
      pushGoal:        goals.push,
      squatGoal:       goals.squat,
      weekNumber:      meta.weekNumber,
      consecutiveDays: meta.consecutiveDays,
      lastFitDate:     meta.lastFitDate,
      restTimerActive: false,
      restSecondsLeft: 90,
    },
  }, true);

  // sync التمرين مع نظام التعافي
  _syncWithRecovery(meta.totalFitDays);
}

// ── إضافة ضغط ─────────────────────────────────────────────
export function addPush(amount) {
  const st  = getState();
  const fit = { ...st.fitness };
  fit.todayPush = (fit.todayPush || 0) + amount;
  setState({ fitness: fit });
  _saveToday(fit);
  _checkComplete(fit);
  startRestTimer();
}

// ── إضافة قرفصاء ──────────────────────────────────────────
export function addSquat(amount) {
  const st  = getState();
  const fit = { ...st.fitness };
  fit.todaySquat = (fit.todaySquat || 0) + amount;
  setState({ fitness: fit });
  _saveToday(fit);
  _checkComplete(fit);
  startRestTimer();
}

// ── تسجيل يدوي (numpad) ──────────────────────────────────
export function setManual(type, value) {
  if (!['push','squat'].includes(type)) return;
  const v   = Math.max(0, parseInt(value, 10) || 0);
  const st  = getState();
  const fit = { ...st.fitness };
  if (type === 'push')  fit.todayPush  = v;
  if (type === 'squat') fit.todaySquat = v;
  setState({ fitness: fit });
  _saveToday(fit);
  _checkComplete(fit);
}

// ── مؤقت الراحة بين الجولات ──────────────────────────────
let _restInterval = null;

export function startRestTimer(seconds = 90) {
  const st  = getState();
  const fit = { ...st.fitness, restTimerActive: true, restSecondsLeft: seconds };
  setState({ fitness: fit });

  if (_restInterval) clearInterval(_restInterval);
  _restInterval = setInterval(() => {
    const cur = getState().fitness;
    if (!cur.restTimerActive) { clearInterval(_restInterval); return; }
    const left = (cur.restSecondsLeft || 1) - 1;
    if (left <= 0) {
      clearInterval(_restInterval);
      setState({ fitness: { ...getState().fitness, restTimerActive: false, restSecondsLeft: 0 } });
      toast('⏱ انتهى وقت الراحة — استمر!');
      try { navigator.vibrate([200, 100, 200]); } catch {}
    } else {
      setState({ fitness: { ...getState().fitness, restSecondsLeft: left } });
    }
  }, 1000);
}

export function cancelRestTimer() {
  if (_restInterval) clearInterval(_restInterval);
  setState({ fitness: { ...getState().fitness, restTimerActive: false } });
}

// ── التحقق من إتمام التمرين ──────────────────────────────
function _checkComplete(fit) {
  const key = 'wirdi_fit_done_' + dStr();
  if (LS.get(key)) return;
  if (fit.todayPush >= fit.pushGoal && fit.todaySquat >= fit.squatGoal) {
    LS.set(key, true);
    _updateMeta();
    awardXP('fitness_complete');
    checkAchievements();
    toast('🏆 تمرين اليوم مكتمل! +2% في تعافي الدوبامين');
  }
}

// ── تحديث Meta (streaks، weeks) ──────────────────────────
function _updateMeta() {
  const today = dStr();
  const yesterday = dStr(-1);
  const meta = LS.get('wirdi_fit_meta', {
    weekNumber: 1, consecutiveDays: 0, lastFitDate: null, totalFitDays: 0,
  });

  meta.totalFitDays = (meta.totalFitDays || 0) + 1;
  if (meta.lastFitDate === yesterday) {
    meta.consecutiveDays = (meta.consecutiveDays || 0) + 1;
  } else if (meta.lastFitDate !== today) {
    meta.consecutiveDays = 1;
  }
  meta.lastFitDate = today;

  // تقدم الأسبوع: كل 14 يوم تمرين = أسبوع جديد
  meta.weekNumber = Math.floor((meta.totalFitDays - 1) / 14) + 1;

  LS.set('wirdi_fit_meta', meta);
  const goals = _calcGoals(meta.weekNumber);

  setState({
    fitness: {
      ...getState().fitness,
      weekNumber:      meta.weekNumber,
      consecutiveDays: meta.consecutiveDays,
      pushGoal:        goals.push,
      squatGoal:       goals.squat,
    },
  });

  _syncWithRecovery(meta.totalFitDays);
}

function _calcGoals(weekNumber) {
  let g = OVERLOAD_TABLE[0];
  for (const entry of OVERLOAD_TABLE) {
    if (weekNumber >= entry.week) g = entry;
    else break;
  }
  return g;
}

function _saveToday(fit) {
  LS.set('wirdi_fit_' + dStr(), { push: fit.todayPush, squat: fit.todaySquat });
}

function _syncWithRecovery(totalFitDays) {
  const rec = { ...getState().recovery, exerciseDays: totalFitDays };
  setState({ recovery: rec });
  const saved = LS.get('wirdi_rec', {});
  LS.set('wirdi_rec', { ...saved, exerciseDays: totalFitDays });
}
