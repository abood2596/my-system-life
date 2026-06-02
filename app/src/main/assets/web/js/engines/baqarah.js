/* تَسَابِيح ∞ v21 — Baqarah Engine
   SM-2 للحفظ + تتبع القراءة اليومية + التحصين
   ─────────────────────────────────────────── */

import { getState, setState } from '../core/store.js';
import { LS } from '../core/storage.js';
import { dStr, toast } from '../core/utils.js';
import { awardXP, checkAchievements } from './xp.js';
import { BQ_GROUPS } from '../core/constants.js';

// ── تحميل ────────────────────────────────────────────────
export function loadBaqarah() {
  const data          = LS.get('wirdi_bq', {});
  const readToday     = LS.get('wirdi_bq_read_' + dStr(), false);
  const fortifiedToday= LS.get('wirdi_bq_fort_' + dStr(), false);

  setState({ bqData: data, bqReadToday: readToday, bqFortifiedToday: fortifiedToday }, true);
}

// ══════════════════════════════════════════════════
//  SM-2 — نظام التكرار المتباعد للحفظ
// ══════════════════════════════════════════════════

/**
 * تقييم مجموعة بعد مراجعة
 * @param {number} groupId
 * @param {number} quality - 0=لا أعرف، 1=صعب، 2=متوسط، 3=ممتاز
 */
export function rateGroup(groupId, quality) {
  const data  = { ...(getState().bqData || {}) };
  const card  = data[groupId] || _newCard();

  const updated = _sm2(card, quality);
  data[groupId] = updated;

  LS.set('wirdi_bq', data);
  setState({ bqData: data });

  awardXP('baqarah_session');
  checkAchievements();

  return updated;
}

/**
 * إرجاع قائمة المجموعات المستحقة للمراجعة اليوم
 */
export function getDueGroups() {
  const data  = getState().bqData || {};
  const today = dStr();
  return BQ_GROUPS.filter(g => {
    const card = data[g.id];
    if (!card) return true; // جديد → مستحق
    return card.nextReview <= today;
  });
}

/**
 * عدد المجموعات المتقنة (interval >= 7 أيام)
 */
export function getMasteredCount() {
  const data = getState().bqData || {};
  return Object.values(data).filter(c => c && c.interval >= 7).length;
}

// ══════════════════════════════════════════════════
//  القراءة اليومية
// ══════════════════════════════════════════════════
export function markReadToday() {
  if (getState().bqReadToday) { toast('📖 القراءة مسجّلة اليوم'); return; }
  LS.set('wirdi_bq_read_' + dStr(), true);
  setState({ bqReadToday: true });
  awardXP('baqarah_read_day');
  toast('📖 قراءة اليوم مسجّلة — بارك الله فيك');
  checkAchievements();
}

// ══════════════════════════════════════════════════
//  التحصين اليومي (آية الكرسي + خواتيم البقرة)
// ══════════════════════════════════════════════════
export function markFortifyToday() {
  if (getState().bqFortifiedToday) { toast('🛡 التحصين مسجّل اليوم'); return; }
  LS.set('wirdi_bq_fort_' + dStr(), true);
  setState({ bqFortifiedToday: true });
  awardXP('baqarah_fortify');
  toast('🛡 التحصين مكتمل — حفظك الله');
  checkAchievements();
}

// ══════════════════════════════════════════════════
//  SM-2 Algorithm
// ══════════════════════════════════════════════════
function _sm2(card, quality) {
  // quality: 0=لا أعرف, 1=صعب, 2=متوسط, 3=ممتاز
  // نحوّل لـ 0-5 scale المعتاد: 0→1, 1→2, 2→4, 3→5
  const q = [1, 2, 4, 5][quality] || 1;

  let { easeFactor, interval, repetitions } = card;

  if (q < 3) {
    // فشل — إعادة من البداية
    repetitions = 0;
    interval    = 1;
  } else {
    if (repetitions === 0)      interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);

    repetitions++;
    easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  }

  const next = new Date();
  next.setDate(next.getDate() + interval);

  return {
    ...card,
    easeFactor,
    interval,
    repetitions,
    nextReview: next.toISOString().slice(0, 10),
    lastReview: dStr(),
  };
}

function _newCard() {
  return { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: dStr(), lastReview: null };
}
