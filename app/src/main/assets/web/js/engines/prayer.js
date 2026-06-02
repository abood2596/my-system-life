/* تَسَابِيح ∞ v21 — Prayer Engine (Hybrid)
   AlAdhan API → IDB Cache → Julian Day Offline Fallback
   ────────────────────────────────────────────────────── */

import { getState, setState } from '../core/store.js';
import { LS, PrayerCache } from '../core/storage.js';
import { dStr, fmt12, isFridayToday } from '../core/utils.js';
import { awardXP, recordFullPrayDay } from './xp.js';
import { PRAYERS } from '../core/constants.js';

const GAZA_DEFAULT = { lat: 31.5017, lng: 34.4668, city: 'غزة' };
const API_METHOD   = 4; // Umm Al-Qura (مناسب لغزة والمنطقة)

// ── تهيئة النظام ──────────────────────────────────────────
export async function initPrayer() {
  // تحميل الموقع المحفوظ
  const saved = LS.get('wirdi_loc', null);
  const loc   = saved || GAZA_DEFAULT;
  setState({ userLocation: loc }, true);

  // تحميل checks اليوم
  const checks = LS.get('wirdi_pray_' + dStr(), {});
  setState({ prayerChecks: checks }, true);

  // جلب الأوقات
  await fetchPrayerTimes(loc);

  // بدء مؤقت العداد التنازلي للصلاة القادمة
  _startCountdown();
}

// ── جلب أوقات الصلاة (الجوهر) ────────────────────────────
export async function fetchPrayerTimes(loc = null) {
  const location = loc || getState().userLocation || GAZA_DEFAULT;
  setState({ prayerSource: 'loading' }, true);

  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth() + 1;
  const cKey  = `${year}-${String(month).padStart(2,'0')}`;

  // ── 1. تحقق من IDB Cache أولاً ───────────────────────────
  const isCacheStale = await PrayerCache.isStale(cKey);
  if (!isCacheStale) {
    const cached = await PrayerCache.get(cKey);
    if (cached?.data) {
      _applyMonthData(cached.data, location);
      setState({ prayerSource: 'api' }, true);
      return;
    }
  }

  // ── 2. حاول API إذا متصل ─────────────────────────────────
  if (navigator.onLine) {
    try {
      const url = `https://api.aladhan.com/v1/calendar/${year}/${month}` +
                  `?latitude=${location.lat}&longitude=${location.lng}&method=${API_METHOD}`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (resp.ok) {
        const json = await resp.json();
        if (json.code === 200 && json.data) {
          const monthData = _parseAPIResponse(json.data);
          await PrayerCache.set(cKey, monthData);
          _applyMonthData(monthData, location);
          setState({ prayerSource: 'api' });
          return;
        }
      }
    } catch (e) {
      // API فشل — ننتقل للحساب الـ offline
    }
  }

  // ── 3. حساب Julian Day offline ────────────────────────────
  const times = _calcJulianDay(now, location.lat, location.lng);
  setState({
    prayerTimes:  times,
    prayerSource: 'offline',
  });
}

// ── تسجيل صلاة ───────────────────────────────────────────
export function checkPrayer(prayerId, done) {
  const st     = getState();
  const checks = { ...st.prayerChecks, [prayerId]: done };
  LS.set('wirdi_pray_' + dStr(), checks);
  setState({ prayerChecks: checks });

  if (done) awardXP('prayer_single');

  // هل أتمّ الخمس؟
  const allDone = PRAYERS.every(p => checks[p.id] === true);
  if (allDone) recordFullPrayDay();
}

// ── تحديد الموقع بـ Geolocation ──────────────────────────
export async function detectLocation() {
  return new Promise(resolve => {
    if (!navigator.geolocation) { resolve(GAZA_DEFAULT); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = {
          lat:  parseFloat(pos.coords.latitude.toFixed(4)),
          lng:  parseFloat(pos.coords.longitude.toFixed(4)),
          city: 'موقعك الحالي',
        };
        LS.set('wirdi_loc', loc);
        setState({ userLocation: loc });
        resolve(loc);
      },
      () => resolve(GAZA_DEFAULT),
      { timeout: 8000, maximumAge: 3600000 }
    );
  });
}

// ── تطبيق بيانات الشهر على اليوم الحالي ─────────────────
function _applyMonthData(monthData, location) {
  const today = new Date();
  const dayKey = String(today.getDate()).padStart(2, '0');
  const todayTimes = monthData[dayKey];
  if (todayTimes) setState({ prayerTimes: todayTimes });
}

// ── تحليل استجابة API ─────────────────────────────────────
function _parseAPIResponse(dataArr) {
  const result = {};
  dataArr.forEach(entry => {
    const day = String(entry.date?.gregorian?.day || entry.date?.day || '').padStart(2,'0');
    if (!day) return;
    const t = entry.timings;
    result[day] = {
      fajr:    t.Fajr?.split(' ')[0]    || '—',
      dhuhr:   t.Dhuhr?.split(' ')[0]   || '—',
      asr:     t.Asr?.split(' ')[0]     || '—',
      maghrib: t.Maghrib?.split(' ')[0] || '—',
      isha:    t.Isha?.split(' ')[0]    || '—',
    };
  });
  return result;
}

// ── حساب أوقات الصلاة بدون إنترنت (Julian Day Algorithm) ──
// مبنية على "Astronomical Algorithms" by Jean Meeus
function _calcJulianDay(date, lat, lng) {
  const year  = date.getFullYear();
  const month = date.getMonth() + 1;
  const day   = date.getDate();

  const JD   = _toJD(year, month, day);
  const D    = JD - 2451545.0;
  const g    = (357.529 + 0.98560028 * D) * Math.PI / 180;
  const q    = 280.459 + 0.98564736 * D;
  const L    = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * Math.PI / 180;
  const e    = (23.439 - 0.00000036 * D) * Math.PI / 180;
  const RA   = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
  const dec  = Math.asin(Math.sin(e) * Math.sin(L));
  const EqT  = q / 15 - RA * 12 / Math.PI;
  const Jtransit = 2451545.0 + D + 0.0009 - lng / 360 - EqT / 24;

  const latR = lat * Math.PI / 180;

  const _prayHour = (angle, isRise) => {
    const cosH = (Math.sin(angle * Math.PI / 180) - Math.sin(latR) * Math.sin(dec)) /
                 (Math.cos(latR) * Math.cos(dec));
    if (Math.abs(cosH) > 1) return null;
    const H = Math.acos(cosH) * 12 / Math.PI;
    return _jdToTime(Jtransit + (isRise ? -H : H) / 24, lng);
  };

  const fajr    = _prayHour(-18, true);  // 18° Fajr angle (Umm Al-Qura)
  const sunrise = _prayHour(-0.833, true);
  const dhuhr   = _jdToTime(Jtransit, lng);
  const asr     = _calcAsr(Jtransit, dec, latR, lng, 1); // Shafi (factor=1)
  const maghrib = _prayHour(-0.833, false);
  const isha    = _prayHour(-17, false); // 17° Isha angle

  return {
    fajr:    fajr    || '—',
    dhuhr:   dhuhr   || '—',
    asr:     asr     || '—',
    maghrib: maghrib || '—',
    isha:    isha    || '—',
  };
}

function _toJD(y, m, d) {
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

function _jdToTime(jd, lng) {
  const frac = ((jd + 0.5) % 1 + 1) % 1;
  const utc  = frac * 24;
  // تقريب لـ UTC+2 (غزة) + timezone offset
  const offset = -(lng / 15); // تقريبي
  let h = ((utc - offset) + 24) % 24;
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
}

function _calcAsr(Jtransit, dec, latR, lng, factor = 1) {
  const x = Math.atan(1 / (factor + Math.tan(Math.abs(latR - dec))));
  const cosH = (Math.sin(x) - Math.sin(latR) * Math.sin(dec)) /
               (Math.cos(latR) * Math.cos(dec));
  if (Math.abs(cosH) > 1) return null;
  const H = Math.acos(cosH) * 12 / Math.PI;
  return _jdToTime(Jtransit + H / 24, lng);
}

// ── مؤقت الصلاة القادمة ──────────────────────────────────
let _countdownInterval = null;

function _startCountdown() {
  if (_countdownInterval) clearInterval(_countdownInterval);
  _tick();
  _countdownInterval = setInterval(_tick, 1000);
}

function _tick() {
  const st = getState();
  if (!st.prayerTimes) return;

  const now   = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const order = ['fajr','dhuhr','asr','maghrib','isha'];
  let next = null;

  for (const pid of order) {
    const t = st.prayerTimes[pid];
    if (!t || t === '—') continue;
    const [h, m] = t.split(':').map(Number);
    const pMin = h * 60 + m;
    if (pMin > nowMin) {
      const secsLeft = (pMin - nowMin) * 60 - now.getSeconds();
      const pr = PRAYERS.find(p => p.id === pid);
      next = { name: pr?.name || pid, secondsLeft: secsLeft };
      break;
    }
  }

  // إذا لم نجد صلاة (بعد العشاء) → الفجر غداً
  if (!next) {
    const fajr = st.prayerTimes.fajr;
    if (fajr && fajr !== '—') {
      const [h, m] = fajr.split(':').map(Number);
      const fajrMin = h * 60 + m + 1440; // +24 ساعة
      const secsLeft = (fajrMin - nowMin) * 60 - now.getSeconds();
      next = { name: 'الفجر', secondsLeft: Math.max(secsLeft, 0) };
    }
  }

  setState({ nextPrayer: next }, true);
}
