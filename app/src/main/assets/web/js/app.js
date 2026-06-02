/* تَسَابِيح ∞ v21 — Application Bootstrap
   تسلسل التهيئة الكامل
   ──────────────────── */

import { initIDB, LS } from './core/storage.js';
import { setState }     from './core/store.js';
import { dStr, isFridayToday, toast } from './core/utils.js';

// Engines
import { loadTasbeeh }  from './engines/tasbeeh.js';
import { loadRecovery } from './engines/recovery.js';
import { loadFitness }  from './engines/fitness.js';
import { loadBaqarah }  from './engines/baqarah.js';
import { loadAdhkar }   from './engines/adhkar.js';
import { loadXP }       from './engines/xp.js';
import { initPrayer }   from './engines/prayer.js';

// UI
import { goTo, initNavHandlers }  from './ui/nav.js';
import { initHome }               from './ui/views/home.js';
import { initPrayView }           from './ui/views/pray-view.js';
import { initBqView }             from './ui/views/bq-view.js';
import { initRecoveryView }       from './ui/views/recovery-view.js';
import { initStatsView }          from './ui/views/stats-view.js';
import Particles                  from './ui/components/particles.js';
import { initClock }              from './ui/components/clock.js';
import { initSound, isSoundEnabled, toggleSound } from './ui/components/sound.js';
import { initInstall }            from './ui/components/install.js';

// ══════════════════════════════════════════════════════════
async function init() {
  // 1. IDB
  await initIDB();

  // 2. ثيم قبل أي render (يمنع وميض)
  const theme = LS.get('wirdi_theme', '');
  if (theme) document.documentElement.dataset.theme = theme;

  // 3. Meta state
  setState({ today: dStr(), isFriday: isFridayToday() }, true);

  // 4. تحميل البيانات
  loadXP();
  loadTasbeeh();
  loadRecovery();
  loadFitness();
  loadBaqarah();
  loadAdhkar();

  // 5. UI مستقل عن البيانات
  initClock();
  initSound();
  initNavHandlers();

  // 6. تهيئة الـ views
  initHome();
  initPrayView();
  initBqView();
  initRecoveryView();
  initStatsView();

  // 7. الشاشة الافتراضية
  const startTab = new URLSearchParams(location.search).get('tab') || 'home';
  goTo('v-' + startTab);

  // 8. الصلاة (async، لا يحجب)
  initPrayer().catch(console.warn);

  // 9. Particles
  requestAnimationFrame(() => Particles.init());

  // 10. PWA Install
  initInstall();

  // 11. Service Worker
  _registerSW();

  // 12. شاشة المزيد
  _initMoreTab(isSoundEnabled, toggleSound);

  // 13. تنظيف أسبوعي
  _weeklyCleanup();

  console.log('[تسابيح v21] 🌟 جاهز');
}

// ── Service Worker ────────────────────────────────────────
function _registerSW() {
  // مغلّف داخل تطبيق أندرويد — الملفات محلية بالكامل، لا حاجة لـ Service Worker
  return;
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js', { scope: './' })
    .then(reg => {
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            toast('🔄 تحديث جديد — أعد تحميل للتطبيق', 6000);
          }
        });
      });
    })
    .catch(console.warn);
}

// ── شاشة المزيد ───────────────────────────────────────────
function _initMoreTab(isSoundEnabledFn, toggleSoundFn) {
  // الثيمات
  document.querySelectorAll('.btn-theme').forEach(btn => {
    const cur = LS.get('wirdi_theme', '');
    if (btn.dataset.theme === cur) btn.classList.add('active');
    btn.addEventListener('click', () => {
      const t = btn.dataset.theme;
      document.documentElement.dataset.theme = t;
      LS.set('wirdi_theme', t);
      document.querySelectorAll('.btn-theme').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // الصوت
  const soundBtn = document.getElementById('btn-toggle-sound');
  if (soundBtn) {
    soundBtn.textContent = isSoundEnabledFn() ? '🔊 الصوت: مفعّل' : '🔇 الصوت: معطّل';
    soundBtn.addEventListener('click', () => {
      const s = toggleSoundFn();
      soundBtn.textContent = s ? '🔊 الصوت: مفعّل' : '🔇 الصوت: معطّل';
    });
  }

  // النسخ الاحتياطية
  document.getElementById('btn-backup')?.addEventListener('click',  _doBackup);
  document.getElementById('btn-restore')?.addEventListener('click', _doRestore);
}

async function _doBackup() {
  const { Backup } = await import('./core/storage.js');
  const data = LS.all();
  const ok   = await Backup.save(data);
  toast(ok ? '✅ تم الحفظ الاحتياطي بنجاح' : '❌ فشل الحفظ');
}

async function _doRestore() {
  const { Backup } = await import('./core/storage.js');
  const bks = await Backup.getAll();
  if (!bks.length) { toast('لا توجد نسخ احتياطية محفوظة'); return; }
  const date = new Date(bks[0].ts).toLocaleDateString('ar-SA');
  if (!confirm(`استعادة نسخة بتاريخ ${date}؟ سيُعاد تحميل التطبيق.`)) return;
  Object.entries(bks[0].data).forEach(([k, v]) => {
    try { LS.set(k, v); } catch {}
  });
  location.reload();
}

// ── تنظيف أسبوعي ─────────────────────────────────────────
function _weeklyCleanup() {
  const last = LS.get('wirdi_last_clean', '');
  if (last < dStr(-7)) {
    const n = LS.cleanup();
    if (n > 0) console.log(`[تسابيح] تنظيف ${n} مفتاح قديم`);
    LS.set('wirdi_last_clean', dStr());
  }
}

// ── تشغيل ─────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
