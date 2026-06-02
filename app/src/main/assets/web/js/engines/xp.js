/* إشراق — Progress (شِمّ خفيف بلا نظام نقاط)
   أُزيل نظام XP/المستويات/الإنجازات بالكامل.
   نُبقي فقط العدّادات الحقيقية (أيام صلاة مكتملة، جُمَع مكتملة).
   awardXP/checkAchievements فارغة للحفاظ على توافق الاستيرادات.
   ─────────────────────────────────────────── */

import { getState, setState } from '../core/store.js';
import { LS } from '../core/storage.js';
import { isFridayToday, dStr } from '../core/utils.js';

// ── تحميل العدّادات الحقيقية عند البدء ──────────────────────
export function loadXP() {
  setState({
    prayDaysAll:    LS.get('wirdi_pray_days_all', 0),
    fridayComplete: LS.get('wirdi_friday_complete', 0),
  }, true);
}

// ── لا نظام نقاط — دوال فارغة (توافق فقط) ──────────────────
export function awardXP() {}
export function checkAchievements() {}

// ── تسجيل يوم صلاة مكتمل (عدّاد حقيقي) ─────────────────────
export function recordFullPrayDay() {
  const key = 'wirdi_full_pray_' + dStr();
  if (LS.get(key)) return;
  LS.set(key, true);
  const total = (getState().prayDaysAll || 0) + 1;
  LS.set('wirdi_pray_days_all', total);
  setState({ prayDaysAll: total });
}

// ── تسجيل يوم جمعة مكتمل (عدّاد حقيقي) ─────────────────────
export function markFridayComplete() {
  if (!isFridayToday()) return;
  const key = 'wirdi_friday_' + dStr();
  if (LS.get(key)) return;
  LS.set(key, true);
  const total = (getState().fridayComplete || 0) + 1;
  LS.set('wirdi_friday_complete', total);
  setState({ fridayComplete: total });
}
