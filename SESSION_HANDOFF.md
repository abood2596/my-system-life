# نظام حياتي — ملف التسليم بين الجلسات

> **آخر تحديث:** ٢ يونيو ٢٠٢٦  
> **الفرع:** `claude/adoring-lamport-AR9Ea`  
> **المستودع:** `abood2596/my-system-life`  
> **آخر commit:** `bcd0176` — v22

---

## ١. ما هو التطبيق؟

**نظام حياتي** — تطبيق Android إسلامي شامل يجمع:
- 📿 الورد اليومي (تسبيح بالعداد + سلسلة أيام)
- 🕌 مواقيت الصلاة وتتبّعها
- 📖 مراجعة سورة البقرة (خوارزمية SM-2)
- 💚 نظام التعافي من الإدمان (علم الأعصاب)
- 💪 تمارين يومية (ضغط + قرفصاء)
- 📊 إحصائيات وإنجازات

**بنية التطبيق:** Android WebView يحمّل HTML/CSS/JS من:
```
app/src/main/assets/web/
```

---

## ٢. بنية الملفات الكاملة

```
app/src/main/assets/web/
├── index.html              ← shell الكامل + كل CSS (560 سطر)
├── manifest.json           ← PWA manifest
├── sw.js                   ← Service Worker
├── js/
│   ├── app.js              ← bootstrap — يستورد كل شيء
│   ├── core/
│   │   ├── constants.js    ← DHIKR(8), PRAYERS(5), ACHIEVEMENTS(30), THEMES(6)
│   │   ├── storage.js      ← LS (LocalStorage) + IDB (IndexedDB v3)
│   │   ├── store.js        ← reactive state machine (21 مفتاح)
│   │   └── utils.js        ← helpers: $(), aN(), dStr(), toast(), vib()
│   ├── data/
│   │   └── science.js      ← brain recovery equations + RECOVERY_TIMELINE
│   ├── engines/
│   │   ├── tasbeeh.js      ← عداد + streak يومي
│   │   ├── prayer.js       ← AlAdhan API + IDB cache + offline fallback
│   │   ├── recovery.js     ← addiction tracker + freeze + relapse
│   │   ├── fitness.js      ← progressive overload + rest timer
│   │   ├── baqarah.js      ← SM-2 spaced repetition (37 مجموعة)
│   │   ├── adhkar.js       ← أذكار الصباح/المساء
│   │   └── xp.js           ← ⚠️ no-op shim (XP أُزيل)
│   └── ui/
│       ├── views/
│       │   ├── home.js          ← ✅ مُعاد بناؤه v22
│       │   ├── pray-view.js     ← مواقيت الصلاة
│       │   ├── bq-view.js       ← مراجعة البقرة
│       │   ├── recovery-view.js ← ✅ مُعمَّق v22
│       │   └── stats-view.js    ← ✅ مُعاد بناؤه v22
│       ├── overlays/
│       │   ├── counter.js    ← عداد غامر + wake lock
│       │   ├── bulk-add.js   ← لوحة مفاتيح إضافة يدوية
│       │   ├── focus.js      ← Pomodoro timer
│       │   ├── misbaha.js    ← سبحة رقمية
│       │   └── sos.js        ← بروتوكول إنقاذ طارئ (3 خطوات حالياً)
│       └── components/
│           ├── clock.js      ← ساعة الرأس + التاريخ الهجري
│           ├── nav.js        ← router للعروض والـ overlays
│           ├── particles.js  ← خلفية متحركة
│           ├── sound.js      ← Web Audio API
│           └── install.js    ← PWA install banner
```

---

## ٣. نظام التصميم (Design Tokens)

```css
/* الألوان الأساسية */
--bg:    #060410   /* AMOLED black خلفية */
--bg2:   #0C0820   /* خلفية ثانوية */
--bg3:   #110D28   /* خلفية البطاقات */
--gold:  #D4A017   /* accent رئيسي */
--goldM: #E8B830
--goldL: #F5D060
--green: #10B981   /* مكتمل + تعافي */
--purple:#8B5CF6   /* flatline + تحذير */
--blue:  #3B82F6
--red:   #EF4444

/* الثيمات الست */
gold | sapphire | emerald | amethyst | rose | teal

/* الخطوط */
--f-ui:    'IBM Plex Sans Arabic'
--f-quran: 'Amiri'

/* التخطيط */
--nav-h:  62px
--hdr-h:  52px
```

---

## ٤. State الكامل (store.js)

```javascript
STATE = {
  // اليوم
  today, theme, isFriday,

  // تسبيح
  counts[8], goals[8], tasbeehStreak, tasbeehBest,

  // صلاة
  prayerChecks, prayerTimes, prayerSource,
  nextPrayer, userLocation, prayDaysAll,

  // تعافي
  recovery: {
    streak, startDate, totalCleanDays,
    bestStreak, relapses, exerciseDays,
    lastCheckin, freezesLeft, flatlineShown
  },

  // تمرين
  fitness: {
    todayPush, todaySquat, pushGoal, squatGoal,
    weekNumber, consecutiveDays, lastFitDate,
    restTimerActive, restSecondsLeft
  },

  // بقرة
  bqData{},  bqReadToday, bqFortifiedToday,

  // أذكار
  adhkarDone{},

  // XP (غير مستخدم في الواجهة)
  achievements[], prayDaysAll, fridayComplete
}
```

---

## ٥. التخزين

| البيانات | المكان | المفتاح |
|----------|--------|---------|
| عدّادات يومية | LS | `wirdi_d_YYYY-MM-DD` |
| streak التسبيح | LS | `wirdi_done_YYYY-MM-DD` |
| حالة التعافي | LS | `wirdi_rec` |
| meta التمرين | LS | `wirdi_fit_meta` |
| بيانات البقرة SM-2 | LS | `wirdi_bq` |
| مواقيت الصلاة | IDB | `pray_c` (monthly cache) |
| سجل الإغراءات | IDB | `triggers` |
| نسخ احتياطية | IDB | `bk` (max 5) |
| الإنجازات | LS | `wirdi_achievements` |

---

## ٦. ما تغيّر في v22 (الجلسة الحالية)

### `xp.js` — no-op shim
```javascript
// awardXP أصبح فارغاً تماماً
export function awardXP(_source, _override = null) {}

// loadXP لا يحمّل XP أو مستويات — فقط achievements و prayDaysAll
export function loadXP() {
  const unlocked = LS.get('wirdi_achievements', []);
  const prayAll  = LS.get('wirdi_pray_days_all', 0);
  setState({ achievements: unlocked, prayDaysAll: prayAll, ... }, true);
}
// checkAchievements بقيت تعمل (مبنية على مقاييس حقيقية)
```

### `home.js` — Hero جديد
- **قبل:** بطاقة XP/مستوى/شريط تقدّم
- **بعد:** تحية وقتية + حلقة SVG لسلسلة الأيام + 3 chips:
  - 🕌 صلوات اليوم (x/5)
  - 📿 نسبة الورد (%)
  - 💚 أيام النقاء (عدد)
- **الجمعة:** "صلِّ على النبي ﷺ" بدل "نقاط مضاعفة"

### `stats-view.js` — بدون XP
- **حُذف:** XP hero (المستوى + الرقم)
- **بقي:** 6 KPIs حقيقية + خريطة السنة + مخطط 7 أيام
- **تغيّر الاسم:** "الإنجازات" → "محطّاتك"

### `recovery-view.js` — تعميق
- **Flatline banner:** 3 pills علمية + نبضة CSS + tip
- **Brain bars:** animation entrance عند أول render
- **Total row:** "أيام نقاء محفوظة للأبد" بشكل بارز
- **Milestone:** أيقونة + label + remaining مستقلة

### `android.yml` — CI مُحسَّن
```yaml
# يوقّع release إذا وُجدت الأسرار، وإلا يبني debug
- name: Decode keystore
  if: env.KEYSTORE_B64 != ''
  run: echo "$KEYSTORE_B64" | base64 -d > app/release.keystore
```

---

## ٧. إجراء واحد منك (مهم للمستقبل)

### إعداد التوقيع الآمن
أضِف هذه الأسرار في **GitHub → Settings → Secrets → Actions**:

| الاسم | القيمة |
|-------|--------|
| `KEYSTORE_B64` | `base64 -w0 release.keystore` |
| `KEY_ALIAS` | اسم الـ alias |
| `KEY_PASSWORD` | كلمة مرور المفتاح |
| `STORE_PASSWORD` | كلمة مرور الـ keystore |

**لتوليد keystore جديد:**
```bash
keytool -genkey -v \
  -keystore release.keystore \
  -alias mykey \
  -keyalg RSA -keysize 2048 \
  -validity 10000
```

---

## ٨. ما لم يُنجز بعد (المرحلة 3)

### أ) بروتوكول الإنقاذ الخماسي (`sos.js`)
الحالي: 3 خطوات بسيطة  
المطلوب: 5 خطوات غامرة:
1. **تنفّس 4-7-8** — دائرة متحركة CSS (4 ثوانٍ شهيق → 7 احتباس → 8 زفير)
2. **تغيير البيئة** — قائمة اقتراحات (اخرج، اشرب ماء، غيّر الغرفة)
3. **تسبيح 33** — عداد سريع مدمج في الـ overlay
4. **دعاء الإنقاذ** — نص قرآني + دعاء مأثور
5. **تعهّد** — زر "أنا أقوى من هذا" يُسجَّل في IDB

### ب) Freeze محسّن (`recovery.js` + `recovery-view.js`)
- إضافة `lastFreezeDate` للتتبّع
- تحذير مرئي عند استخدام الأخير
- عدّاد إعادة الشحن (كل 7 أيام)

### ج) خارطة التعافي التفاعلية (`recovery-view.js`)
- كل محطة قابلة للنقر → modal بالتفاصيل العلمية
- مصادر بحثية لكل مؤشر دماغي
- مقارنة يوم المستخدم الحالي مع الخارطة

### د) الرئيسية — إضافات
- أذكار الصباح/المساء تظهر حسب الوقت في الرئيسية
- ردّ فعل بصري عند إكمال كل ورد

### هـ) Figma
- حساب Figma وصل للحد اليومي (Starter plan)
- يمكن الاستئناف بعد 24 ساعة لإكمال التصاميم
- تصاميم 3 شاشات كُتبت بالكامل (Home + Recovery + Stats) جاهزة للرفع

---

## ٩. كيف تستأنف الجلسة القادمة

انسخ هذا الـ prompt وأعطه للـ AI:

---

> أنا أعمل على مستودع `abood2596/my-system-life`، الفرع `claude/adoring-lamport-AR9Ea`.
>
> التطبيق: نظام حياتي — تطبيق Android WebView إسلامي للورد اليومي والتعافي.
>
> آخر commit كان `bcd0176` (v22):
> - حُذف نظام XP من الواجهة (xp.js → no-op)
> - أُعيد بناء home.js (hero جديد: streak ring + 3 chips)
> - أُعيد بناء stats-view.js (بدون XP)
> - عُمِّق recovery-view.js (flatline محسّن + brain bars animation)
>
> المطلوب الآن — المرحلة 3:
> 1. `sos.js`: بروتوكول إنقاذ خماسي (تنفّس 4-7-8 متحرك + تغيير بيئة + تسبيح + دعاء + تعهّد)
> 2. تحسين Freeze في recovery.js
> 3. خارطة التعافي التفاعلية
>
> اقرأ ملف `SESSION_HANDOFF.md` في جذر المستودع للتفاصيل الكاملة.

---

## ١٠. الـ APK الحالي

يُبنى تلقائياً عند كل push:
- **GitHub Actions** → Build APK → Release "نظام حياتي — v22"
- يشتغل بتوقيع debug حتى تُضاف أسرار الـ keystore
