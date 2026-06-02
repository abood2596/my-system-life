/* تَسَابِيح ∞ v21 — Utilities
   دوال مساعدة مشتركة — لا dependencies
   ──────────────────────────────────── */

// ── DOM shorthand ─────────────────────────────────────────
export const $ = id => document.getElementById(id);
export const $$ = sel => document.querySelectorAll(sel);

// ── Vibration ─────────────────────────────────────────────
export const vib = pattern => {
  try { navigator.vibrate(pattern); } catch {}
};

// ── Date Utilities ────────────────────────────────────────
/**
 * إرجاع سلسلة التاريخ YYYY-MM-DD مع إمكانية الإزاحة
 * @param {number} offset - عدد الأيام (0 = اليوم، -1 = أمس)
 */
export function dStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

export function dStrFromDate(date) {
  return date.getFullYear() + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0');
}

/** هل الرقم المعطى يوم الجمعة؟ */
export function isFridayToday() {
  return new Date().getDay() === 5;
}

// ── Arabic Numerals ───────────────────────────────────────
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
export const aN = n => String(n).replace(/[0-9]/g, d => AR_DIGITS[d]);

/** تحويل رقم عربي لإنجليزي */
export const fromAN = s => String(s).replace(/[٠-٩]/g, d => AR_DIGITS.indexOf(d));

// ── 12-Hour Time Format ───────────────────────────────────
/**
 * تحويل "13:45" إلى "1:45 PM"
 */
export function fmt12(timeStr) {
  if (!timeStr || timeStr === '—') return '—';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const h = parseInt(parts[0], 10);
  const m = parts[1].substring(0, 2);
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

// ── Toast Notification ────────────────────────────────────
let _toastTimer = null;
export function toast(msg, duration = 2800) {
  const el = $('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('on'), duration);
}

// ── Countdown Timer Formatter ─────────────────────────────
export function fmtCountdown(seconds) {
  if (seconds <= 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// ── Hijri Date ────────────────────────────────────────────
/**
 * تقريب للتاريخ الهجري (دقيق لأغراض العرض)
 * خوارزمية مبنية على فروق التقويمين
 */
export function getHijriDate(date = new Date()) {
  try {
    return date.toLocaleDateString('ar-SA-u-ca-islamic', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch {
    return '';
  }
}

// ── Day Name (Arabic) ─────────────────────────────────────
const AR_DAYS = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
export const getDayName = (date = new Date()) => AR_DAYS[date.getDay()];

// ── Number Abbreviation ───────────────────────────────────
export function fmtNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'م';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'ك';
  return String(n);
}

// ── Smooth Counter Animation ──────────────────────────────
export function animBump(el) {
  if (!el) return;
  el.classList.remove('bump');
  void el.offsetWidth; // reflow
  el.classList.add('bump');
}

// ── Ripple Effect ─────────────────────────────────────────
export function createRipple(e) {
  const el = document.createElement('div');
  el.className = 'tap-ripple';
  el.style.left = e.clientX + 'px';
  el.style.top  = e.clientY + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 600);
}

// ── Days Between Two Date Strings ─────────────────────────
export function daysBetween(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

// ── Wake Lock ─────────────────────────────────────────────
let _wakeLock = null;

export async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      _wakeLock = await navigator.wakeLock.request('screen');
      _wakeLock.addEventListener('release', () => { _wakeLock = null; });
    }
  } catch { _wakeLock = null; }
}

export async function releaseWakeLock() {
  try { if (_wakeLock) { await _wakeLock.release(); _wakeLock = null; } } catch {}
}

// أعد الـ wake lock تلقائياً عند عودة الصفحة للمقدمة
document.addEventListener('visibilitychange', async () => {
  if (!document.hidden && _wakeLock === null) {
    // لا نُعيده تلقائياً — يُطلب صراحةً من counter/focus
  }
});
