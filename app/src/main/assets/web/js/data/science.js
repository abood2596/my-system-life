/* تَسَابِيح ∞ v21 — Science Data
   معادلات التعافي العلمية + نظام XP + المستويات
   مصادر: Nature Neuropsychopharmacology، PubMed DAT Recovery، Frontiers in Public Health 2023
   ──────────────────────────────────────────────────────────────────────────────────────────── */

// ══════════════════════════════════════════════════
//  RECOVERY EQUATIONS — مبنية على الأبحاث المنشورة
// ══════════════════════════════════════════════════

/**
 * حساب نسب تعافي الدماغ من عدد الأيام
 * D2 Receptor: يعود للطبيعي يوم 21 (إدمان خفيف)
 * PFC Focus: يوم 30 — DAT Energy: يوم 14
 * BDNF Memory: يوم 60 — Willpower: يوم 45
 * Sleep: أسرع تعافٍ يوم 10 — Confidence: يوم 90
 */
export function calcBrainRecovery(streak, exerciseDays = 0, prayerDaysThisWeek = 0) {
  const ex = Math.min(exerciseDays / 30 * 6, 6);       // +6% max من التمرين
  const pr = Math.min(prayerDaysThisWeek / 7 * 3, 3);  // +3% max من الصلاة
  const boost = ex + pr;

  return {
    dopamine:   parseFloat(Math.min(streak / 21 * 100 + boost, 100).toFixed(1)),
    focus:      parseFloat(Math.min(streak / 30 * 100, 100).toFixed(1)),
    energy:     parseFloat(Math.min(streak / 14 * 100, 100).toFixed(1)),
    memory:     parseFloat(Math.min(streak / 60 * 100, 100).toFixed(1)),
    willpower:  parseFloat(Math.min(streak / 45 * 100, 100).toFixed(1)),
    sleep:      parseFloat(Math.min(streak / 10 * 100, 100).toFixed(1)),
    confidence: parseFloat(Math.min(streak / 90 * 100, 100).toFixed(1)),
  };
}

/**
 * هل الـ streak في نافذة الـ Flatline؟
 * الفلاتلاين: اختفاء الدوافع بين يوم 12-45 — طبيعي، دليل نجاح التعافي
 */
export function isInFlatline(streak) {
  return streak >= 12 && streak <= 45;
}

/**
 * الحصول على مرحلة التعافي الحالية
 */
export function getRecoveryPhase(streak) {
  if (streak === 0)             return RECOVERY_TIMELINE[0];
  for (let i = RECOVERY_TIMELINE.length - 1; i >= 0; i--) {
    if (streak >= RECOVERY_TIMELINE[i].day) return RECOVERY_TIMELINE[i];
  }
  return RECOVERY_TIMELINE[0];
}

/**
 * الحصول على الـ milestone القادمة
 */
export function getNextMilestone(streak) {
  return RECOVERY_TIMELINE.find(m => m.day > streak) || null;
}

// الجدول الزمني الكامل للتعافي
export const RECOVERY_TIMELINE = [
  { day:0,  phase:'البداية',     label:'كسر الحلقة الكيميائية — الأصعب',     color:'#EF4444', icon:'🌱' },
  { day:7,  phase:'الأسبوع الأول',label:'المخ يُعيد ضبط نفسه — تستوستيرون↑', color:'#F59E0B', icon:'🌿' },
  { day:12, phase:'Flatline ⚠️',  label:'طبيعي — الدماغ يبني مستقبلات جديدة',color:'#8B5CF6', icon:'🧠' },
  { day:21, phase:'تحول D2',     label:'🎯 مستقبلات الدوبامين تعافت!',       color:'#10B981', icon:'⚡' },
  { day:30, phase:'استقرار',     label:'إرادتك تقوى علمياً — PFC↑',          color:'#10B981', icon:'💪' },
  { day:45, phase:'ما بعد الفلاتلاين',label:'انتهت أصعب مرحلة — أنت بأمان',  color:'#3B82F6', icon:'🛡️' },
  { day:60, phase:'عمق',         label:'ذاكرتك وتركيزك يعودان — BDNF↑',     color:'#3B82F6', icon:'🎓' },
  { day:90, phase:'تحويل',       label:'🏆 إعادة التشغيل اكتملت',            color:'#D4A017', icon:'👑' },
];

// مراحل المخ مع وصف علمي للعرض
export const BRAIN_METRICS = [
  { key:'dopamine',   label:'مستقبلات D2',  icon:'⚡', src:'Nature Neuropsychopharmacology', fullDay:21 },
  { key:'focus',      label:'التركيز (PFC)',  icon:'🎯', src:'Journal of Neuroscience',        fullDay:30 },
  { key:'energy',     label:'الطاقة (DAT)',  icon:'⚡', src:'PubMed DAT Recovery',             fullDay:14 },
  { key:'memory',     label:'الذاكرة (BDNF)', icon:'🧠', src:'Frontiers in Neuroscience',      fullDay:60 },
  { key:'willpower',  label:'الإرادة',       icon:'💎', src:'Neuropsychologia',               fullDay:45 },
  { key:'sleep',      label:'النوم',         icon:'🌙', src:'Sleep Medicine Reviews',          fullDay:10 },
  { key:'confidence', label:'الثقة بالنفس',  icon:'🌟', src:'Journal of Behavioral Medicine', fullDay:90 },
];

// رسائل الـ Flatline
export const FLATLINE_MESSAGES = [
  'أنت في مرحلة الـ Flatline — الشعور بالفتور طبيعي 100٪',
  'دماغك يبني مستقبلات جديدة الآن — هذا دليل نجاح، لا فشل 💚',
  'من يوم 12 إلى 45 — أصعب مرحلة علمياً، لكنك تتجاوزها',
  'الفتور والخمول الآن؟ هذا يعني أن الإعادة التشغيل تعمل',
];

// ══════════════════════════════════════════════════
//  XP SYSTEM — نظام النقاط الموحّد
// ══════════════════════════════════════════════════
export const XP = {
  prayer_single:      20,
  prayer_all_five:   130,   // إضافي لإتمام الخمس (+ 5×20 = 230 total)
  wirdi_complete:    100,
  adhkar_morning:     30,
  adhkar_evening:     30,
  baqarah_session:    50,
  baqarah_read_day:   30,
  baqarah_fortify:    40,
  fitness_complete:   60,
  recovery_day:       20,
  focus_session_30m:  50,
  misbaha_complete:   15,
  // يوم الجمعة: المضاعف يُطبَّق في engine
  friday_multiplier:   3,
};

// ── مستويات XP ────────────────────────────────────────────
export const LEVELS = [
  { lv:1,  title:'المبتدئ',  icon:'🌱', xp:0      },
  { lv:2,  title:'الساعي',   icon:'🚶', xp:500    },
  { lv:3,  title:'المجتهد',  icon:'📖', xp:2000   },
  { lv:4,  title:'العابد',   icon:'🕌', xp:6000   },
  { lv:5,  title:'الورع',    icon:'⭐', xp:15000  },
  { lv:6,  title:'الزاهد',   icon:'🌙', xp:35000  },
  { lv:7,  title:'العارف',   icon:'💡', xp:70000  },
  { lv:8,  title:'المتقي',   icon:'💎', xp:120000 },
  { lv:9,  title:'القانت',   icon:'👑', xp:200000 },
  { lv:10, title:'الصالح',   icon:'✨', xp:350000 },
];

/**
 * احسب المستوى الحالي من XP
 */
export function calcLevel(xp) {
  let lv = 1;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xp) { lv = LEVELS[i].lv; break; }
  }
  return lv;
}

/**
 * احسب نسبة التقدم نحو المستوى القادم
 */
export function calcLevelProgress(xp) {
  const lv = calcLevel(xp);
  if (lv >= 10) return 1;
  const cur = LEVELS[lv - 1].xp;
  const nxt = LEVELS[lv].xp;
  return Math.min((xp - cur) / (nxt - cur), 1);
}

/**
 * XP للمستوى القادم
 */
export function xpToNextLevel(xp) {
  const lv = calcLevel(xp);
  if (lv >= 10) return 0;
  return LEVELS[lv].xp - xp;
}
