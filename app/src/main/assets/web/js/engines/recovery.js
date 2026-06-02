/* تَسَابِيح ∞ v21 — Recovery Engine
   نظام التعافي الإسلامي-العلمي الكامل
   ─────────────────────────────────── */

import { getState, setState } from '../core/store.js';
import { LS, TriggerJournal } from '../core/storage.js';
import { dStr, daysBetween, toast } from '../core/utils.js';
import { awardXP, checkAchievements } from './xp.js';
import { calcBrainRecovery, isInFlatline, FLATLINE_MESSAGES } from '../data/science.js';

// ── تحميل عند البدء ──────────────────────────────────────
export function loadRecovery() {
  const saved = LS.get('wirdi_rec', null);
  if (!saved) {
    // أول مرة
    const initial = {
      streak: 0, startDate: null, totalCleanDays: 0,
      bestStreak: 0, relapses: 0, exerciseDays: 0,
      lastCheckin: null, freezesLeft: 1, lastFreezeUsed: null,
      flatlineShown: false,
    };
    setState({ recovery: initial }, true);
    return;
  }

  // تحقق إذا انقطع الـ streak (لم يُسجَّل أمس)
  const today = dStr();
  const yesterday = dStr(-1);
  let rec = { ...saved };

  if (rec.lastCheckin && rec.lastCheckin !== today && rec.lastCheckin !== yesterday && rec.streak > 0) {
    // لا checkin أمس ولا اليوم — الـ streak انكسر
    // لكن نحتفظ بالأيام الكلية
    rec = { ...rec, streak: 0, startDate: null };
    LS.set('wirdi_rec', rec);
  }

  setState({ recovery: rec }, true);
}

// ── تسجيل يوم نقاء (أنا نقي اليوم) ──────────────────────
export function checkinClean() {
  const today = dStr();
  const st    = getState();
  const rec   = { ...st.recovery };

  if (rec.lastCheckin === today) {
    toast('✅ سجّلت يومك النقي بالفعل');
    return;
  }

  rec.streak++;
  rec.totalCleanDays++;
  rec.lastCheckin = today;
  if (!rec.startDate) rec.startDate = today;
  if (rec.streak > rec.bestStreak) rec.bestStreak = rec.streak;

  // Freeze يُجدَّد كل 7 أيام
  if (rec.streak % 7 === 0 && rec.streak > 0) {
    rec.freezesLeft = Math.min((rec.freezesLeft || 0) + 1, 3);
    toast('🧊 حصلت على Freeze جديد! لديك ' + rec.freezesLeft);
  }

  _save(rec);
  awardXP('recovery_day');
  checkAchievements();

  // تحذير Flatline (مرة واحدة فقط)
  if (isInFlatline(rec.streak) && !rec.flatlineShown) {
    rec.flatlineShown = true;
    _save(rec);
    const msg = FLATLINE_MESSAGES[Math.floor(Math.random() * FLATLINE_MESSAGES.length)];
    setTimeout(() => toast('⚠️ ' + msg, 5000), 1500);
  }

  toast(`✅ يوم ${rec.streak} — استمر!`);
}

// ── استخدام Freeze (حماية من انزلاق اليوم) ──────────────
export function useFreeze() {
  const rec = { ...getState().recovery };
  if ((rec.freezesLeft || 0) <= 0) {
    toast('❌ لا يوجد Freeze متاح');
    return false;
  }
  const today = dStr();
  if (rec.lastCheckin === today) {
    toast('✅ اليوم مسجّل بالفعل');
    return false;
  }
  rec.freezesLeft--;
  rec.lastCheckin = today;
  rec.totalCleanDays++;
  toast('🧊 تم استخدام Freeze — الـ Streak محمي');
  _save(rec);
  return true;
}

// ── بروتوكول الانتكاسة (التجديد) ────────────────────────
export async function triggerRelapse(reason = '', intensity = 3) {
  const today = dStr();
  const rec   = { ...getState().recovery };

  // حفظ السجل في IDB
  await TriggerJournal.add({
    date:      today,
    time:      new Date().toLocaleTimeString('ar'),
    trigger:   reason,
    intensity,
    type:      'relapse',
    notes:     '',
  });

  // الأيام الكلية لا تُمحى — الـ Streak يُعاد فقط
  const oldStreak = rec.streak;
  rec.relapses++;
  rec.streak    = 0;
  rec.startDate = null;
  rec.lastCheckin = null;
  // نحتفظ بـ totalCleanDays + bestStreak

  _save(rec);
  return oldStreak;
}

// ── تسجيل إغراء (بدون انتكاسة) ──────────────────────────
export async function logUrge(trigger, intensity = 3, resisted = true) {
  const today = dStr();
  await TriggerJournal.add({
    date:      today,
    time:      new Date().toLocaleTimeString('ar'),
    trigger,
    intensity,
    type:      resisted ? 'urge_resisted' : 'urge_failed',
    notes:     '',
  });
  if (resisted) toast('💪 صمدت — قيّدت اللحظة');
}

// ── جلب سجل الإغراءات ────────────────────────────────────
export async function getTriggerHistory(n = 10) {
  return await TriggerJournal.getLast(n);
}

// ── حساب إحصائيات التعافي ────────────────────────────────
export function getRecoveryStats() {
  const st  = getState();
  const rec = st.recovery;
  const brain = calcBrainRecovery(
    rec.streak,
    rec.exerciseDays,
    _prayerDaysThisWeek()
  );
  return { rec, brain };
}

// ── مساعدات ──────────────────────────────────────────────
function _save(rec) {
  LS.set('wirdi_rec', rec);
  setState({ recovery: rec });
}

function _prayerDaysThisWeek() {
  let count = 0;
  for (let i = 0; i < 7; i++) {
    const checks = LS.get('wirdi_pray_' + dStr(-i), {});
    const done   = Object.values(checks).filter(Boolean).length;
    if (done === 5) count++;
  }
  return count;
}
