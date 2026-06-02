/* تَسَابِيح ∞ v21 — XP Engine
   نظام النقاط الموحّد — يستقبل من كل الأنظمة
   ─────────────────────────────────────────── */

import { getState, setState } from '../core/store.js';
import { LS } from '../core/storage.js';
import { XP, LEVELS, calcLevel, calcLevelProgress } from '../data/science.js';
import { ACHIEVEMENTS } from '../core/constants.js';
import { toast, isFridayToday, dStr } from '../core/utils.js';

// ── تحميل XP من LS عند البدء ──────────────────────────────
export function loadXP() {
  const xp       = LS.get('wirdi_xp', 0);
  const daily    = LS.get('wirdi_xp_daily_' + dStr(), 0);
  const unlocked = LS.get('wirdi_achievements', []);
  const prayAll  = LS.get('wirdi_pray_days_all', 0);
  const fridayC  = LS.get('wirdi_friday_complete', 0);

  setState({
    xp,
    level:        calcLevel(xp),
    dailyXP:      daily,
    achievements: unlocked,
    prayDaysAll:  prayAll,
    fridayComplete: fridayC,
  }, true);
}

// ── منح XP ────────────────────────────────────────────────
export function awardXP(source, override = null) {
  let amount = override !== null ? override : (XP[source] || 0);
  if (amount <= 0) return;

  // مضاعفة يوم الجمعة
  if (isFridayToday() && source !== 'friday_multiplier') {
    amount *= XP.friday_multiplier;
  }

  const st       = getState();
  const oldLevel = st.level;
  const newXP    = (st.xp || 0) + amount;
  const newLevel = calcLevel(newXP);
  const newDaily = (st.dailyXP || 0) + amount;

  LS.set('wirdi_xp', newXP);
  LS.set('wirdi_xp_daily_' + dStr(), newDaily);
  setState({ xp: newXP, level: newLevel, dailyXP: newDaily });

  // إشعار ترقية
  if (newLevel > oldLevel) {
    const lvData = LEVELS[newLevel - 1];
    toast(`🎉 ترقية! وصلت لمستوى "${lvData.icon} ${lvData.title}"`, 4000);
    _triggerLevelUpEffect();
  }
}

// ── التحقق من الإنجازات ───────────────────────────────────
export function checkAchievements() {
  const st  = getState();
  const ctx = {
    allTasbeeh:     LS.allTasbeehTotal(),
    streak:         st.tasbeehStreak || 0,
    prayDaysAll:    st.prayDaysAll   || 0,
    bqMastered:     _countBqMastered(st.bqData),
    recStreak:      st.recovery?.streak || 0,
    fitDays:        LS.get('wirdi_fit_meta', {}).totalFitDays || 0,
    level:          st.level || 1,
    xp:             st.xp   || 0,
    fridayComplete: st.fridayComplete || 0,
  };

  const unlocked  = [...(st.achievements || [])];
  const newUnlock = [];

  ACHIEVEMENTS.forEach(ach => {
    if (!unlocked.includes(ach.id) && ach.f(ctx)) {
      unlocked.push(ach.id);
      newUnlock.push(ach);
    }
  });

  if (newUnlock.length > 0) {
    LS.set('wirdi_achievements', unlocked);
    setState({ achievements: unlocked });
    newUnlock.forEach((ach, i) => {
      setTimeout(() => toast(`${ach.i} إنجاز جديد: "${ach.n}"!`, 3500), i * 900);
    });
  }
}

// ── تسجيل يوم صلاة مكتمل ─────────────────────────────────
export function recordFullPrayDay() {
  const key = 'wirdi_full_pray_' + dStr();
  if (LS.get(key)) return;
  LS.set(key, true);
  const total = (getState().prayDaysAll || 0) + 1;
  LS.set('wirdi_pray_days_all', total);
  setState({ prayDaysAll: total });
  awardXP('prayer_all_five');
}

// ── تسجيل يوم جمعة مكتمل ─────────────────────────────────
export function markFridayComplete() {
  if (!isFridayToday()) return;
  const key = 'wirdi_friday_' + dStr();
  if (LS.get(key)) return;
  LS.set(key, true);
  const total = (getState().fridayComplete || 0) + 1;
  LS.set('wirdi_friday_complete', total);
  setState({ fridayComplete: total });
}

// ── مساعدات ──────────────────────────────────────────────
function _countBqMastered(bqData) {
  if (!bqData) return 0;
  return Object.values(bqData).filter(g => g && g.interval >= 7).length;
}

function _triggerLevelUpEffect() {
  const el = document.getElementById('cel');
  if (!el) return;
  el.classList.add('on');
  setTimeout(() => el.classList.remove('on'), 3000);
}
