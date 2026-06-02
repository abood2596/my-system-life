/* تَسَابِيح ∞ v21 — Central State Store
   نظام state أحادي الاتجاه مع reactivity انتقائية
   المبدأ: كل تعديل يمر عبر setState() فقط
   ─────────────────────────────────────────────── */

// ══════════════════════════════════════════════════
//  STATE — الحالة المركزية الوحيدة
// ══════════════════════════════════════════════════
const STATE = {
  // ─── Meta ──────────────────────────────────────
  today:    '',       // 'YYYY-MM-DD'
  theme:    '',       // '' | 'sapphire' | 'emerald' | ...
  isFriday: false,

  // ─── Tasbeeh ───────────────────────────────────
  counts:          new Array(8).fill(0),  // عداد كل ذكر اليوم
  goals:           [33,33,33,100,70,50,33,100],
  tasbeehStreak:   0,
  tasbeehBest:     0,

  // ─── Prayer ────────────────────────────────────
  prayerChecks:  {},        // { fajr:true, dhuhr:false, ... }
  prayerTimes:   null,      // { fajr:'5:12 AM', ... } | null
  prayerSource:  'loading', // 'api' | 'offline' | 'loading' | 'error'
  nextPrayer:    null,      // { name:'الفجر', secondsLeft:3600 }
  userLocation:  null,      // { lat, lng, city }
  prayDaysAll:   0,         // عدد أيام أتمّ فيها الصلوات الخمس (كلّها)

  // ─── Recovery ──────────────────────────────────
  recovery: {
    streak:         0,
    startDate:      null,
    totalCleanDays: 0,
    bestStreak:     0,
    relapses:       0,
    exerciseDays:   0,
    lastCheckin:    null,
    freezesLeft:    1,
    lastFreezeUsed: null,
    flatlineShown:  false,
  },

  // ─── Fitness ───────────────────────────────────
  fitness: {
    todayPush:       0,
    todaySquat:      0,
    pushGoal:        20,
    squatGoal:       20,
    weekNumber:      1,
    consecutiveDays: 0,
    lastFitDate:     null,
    restTimerActive: false,
    restSecondsLeft: 90,
  },

  // ─── Baqarah ───────────────────────────────────
  bqData:         {},     // SM2 data per group id
  bqReadToday:    false,
  bqFortifiedToday: false,

  // ─── Adhkar ────────────────────────────────────
  adhkarDone: {},         // { 'm1_YYYY-MM-DD': count, ... }

  // ─── XP & Gamification ─────────────────────────
  xp:           0,
  level:        1,
  achievements: [],       // array of unlocked achievement IDs
  dailyXP:      0,
  fridayComplete: 0,      // عدد أيام جمعة مكتملة

  // ─── UI State (لا تُحفظ في LS) ──────────────────
  activeView:    'v-home',
  activeOverlay: null,
  overlayStack:  [],
};

// ══════════════════════════════════════════════════
//  REACTIVE ENGINE — subscribers مبنية على المفاتيح
// ══════════════════════════════════════════════════
const _subs = new Map(); // key → [handler, ...]

/**
 * اقرأ حالة معينة أو كل الحالة
 */
export function getState(key) {
  if (key !== undefined) return STATE[key];
  return STATE;
}

/**
 * عدّل الحالة وأخطر المشتركين
 * @param {Object} patch - الكائن الجزئي للتعديل
 * @param {boolean} silent - إذا true، لا يُخطر المشتركين
 */
export function setState(patch, silent = false) {
  const changed = Object.keys(patch);
  changed.forEach(k => {
    if (patch[k] !== null && typeof patch[k] === 'object' && !Array.isArray(patch[k])) {
      // Deep merge للكائنات (recovery, fitness فقط)
      STATE[k] = { ...STATE[k], ...patch[k] };
    } else {
      STATE[k] = patch[k];
    }
  });

  if (!silent) {
    changed.forEach(k => {
      (_subs.get(k) || []).forEach(fn => {
        try { fn(STATE[k], STATE); } catch (e) { console.warn('[Store] subscriber error:', k, e); }
      });
    });
  }
}

/**
 * اشترك في تغييرات مفتاح معين
 * @param {string} key
 * @param {Function} fn - يُستدعى بـ (newValue, fullState)
 * @param {boolean} immediate - استدعاء فوري بالقيمة الحالية
 * @returns {Function} unsubscribe function
 */
export function subscribe(key, fn, immediate = true) {
  if (!_subs.has(key)) _subs.set(key, []);
  _subs.get(key).push(fn);
  if (immediate) {
    try { fn(STATE[key], STATE); } catch {}
  }
  // إرجاع دالة إلغاء الاشتراك
  return () => {
    const arr = _subs.get(key);
    if (arr) {
      const idx = arr.indexOf(fn);
      if (idx > -1) arr.splice(idx, 1);
    }
  };
}

/**
 * اشترك في تغييرات مفاتيح متعددة
 */
export function subscribeMany(keys, fn) {
  const unsubs = keys.map(k => subscribe(k, () => fn(STATE), false));
  fn(STATE); // استدعاء فوري
  return () => unsubs.forEach(u => u());
}

// ══════════════════════════════════════════════════
//  COMPUTED VALUES — قيم محسوبة من الحالة
// ══════════════════════════════════════════════════
export const computed = {
  totalTodayTasbeeh: () =>
    STATE.counts.reduce((a, b) => a + b, 0),

  totalGoal: () =>
    STATE.goals.reduce((a, b) => a + b, 0),

  tasbeehProgress: () => {
    const tot = computed.totalTodayTasbeeh();
    const goal = computed.totalGoal();
    return goal > 0 ? Math.min(tot / goal, 1) : 0;
  },

  prayerDoneCount: () =>
    Object.values(STATE.prayerChecks).filter(Boolean).length,

  isFriday: () => new Date().getDay() === 5,

  recoveryBrainPct: () => {
    const { streak, exerciseDays } = STATE.recovery;
    const exBoost = Math.min(exerciseDays / 30 * 6, 6);
    return {
      dopamine:   Math.min(streak / 21 * 100 + exBoost, 100),
      focus:      Math.min(streak / 30 * 100, 100),
      energy:     Math.min(streak / 14 * 100, 100),
      memory:     Math.min(streak / 60 * 100, 100),
      willpower:  Math.min(streak / 45 * 100, 100),
      sleep:      Math.min(streak / 10 * 100, 100),
      confidence: Math.min(streak / 90 * 100, 100),
    };
  },

  isFlatline: () => {
    const s = STATE.recovery.streak;
    return s >= 12 && s <= 45;
  },
};
