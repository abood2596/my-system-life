/* تَسَابِيح — XP Engine (no-op shim)
   الواجهة البرمجية محفوظة لعدم كسر المحرّكات الأخرى
   نقاط XP ومستوياتها لم تعُد تُعرض أو تُخزَّن
   ─────────────────────────────────────────────── */

import { getState, setState } from '../core/store.js';
import { LS } from '../core/storage.js';
import { ACHIEVEMENTS } from '../core/constants.js';
import { toast, isFridayToday, dStr } from '../core/utils.js';

export function loadXP() {
  const unlocked = LS.get('wirdi_achievements', []);
  const prayAll  = LS.get('wirdi_pray_days_all', 0);
  const fridayC  = LS.get('wirdi_friday_complete', 0);
  setState({ achievements: unlocked, prayDaysAll: prayAll, fridayComplete: fridayC }, true);
}

// no-op — نقاط الـ XP أُزيلت من الواجهة
export function awardXP(_source, _override = null) {}

// الإنجازات مبنية على مقاييس حقيقية — تبقى تعمل
export function checkAchievements() {
  const st  = getState();
  const ctx = {
    allTasbeeh:     LS.allTasbeehTotal(),
    streak:         st.tasbeehStreak    || 0,
    prayDaysAll:    st.prayDaysAll      || 0,
    bqMastered:     _countBqMastered(st.bqData),
    recStreak:      st.recovery?.streak || 0,
    fitDays:        LS.get('wirdi_fit_meta', {}).totalFitDays || 0,
    level:          1,
    xp:             0,
    fridayComplete: st.fridayComplete   || 0,
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
      setTimeout(() => toast(`${ach.i} محطّة جديدة: "${ach.n}"`, 3500), i * 900);
    });
  }
}

export function recordFullPrayDay() {
  const key = 'wirdi_full_pray_' + dStr();
  if (LS.get(key)) return;
  LS.set(key, true);
  const total = (getState().prayDaysAll || 0) + 1;
  LS.set('wirdi_pray_days_all', total);
  setState({ prayDaysAll: total });
}

export function markFridayComplete() {
  if (!isFridayToday()) return;
  const key = 'wirdi_friday_' + dStr();
  if (LS.get(key)) return;
  LS.set(key, true);
  const total = (getState().fridayComplete || 0) + 1;
  LS.set('wirdi_friday_complete', total);
  setState({ fridayComplete: total });
}

function _countBqMastered(bqData) {
  if (!bqData) return 0;
  return Object.values(bqData).filter(g => g && g.interval >= 7).length;
}
