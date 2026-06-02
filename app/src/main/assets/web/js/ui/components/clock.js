/* تَسَابِيح ∞ v21 — Clock Component */
import { setState } from '../../core/store.js';
import { $, getDayName, getHijriDate, isFridayToday } from '../../core/utils.js';

export function initClock() {
  _tick();
  setInterval(_tick, 1000);
}

function _tick() {
  const now  = new Date();
  const h    = String(now.getHours()).padStart(2,'0');
  const m    = String(now.getMinutes()).padStart(2,'0');
  const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
  const h12  = now.getHours() % 12 || 12;

  const clk = $('hdr-clock');
  if (clk) clk.textContent = `${h12}:${String(now.getMinutes()).padStart(2,'0')} ${ampm}`;

  const hijri = $('hdr-hijri');
  if (hijri && now.getSeconds() === 0) {
    hijri.textContent = getHijriDate(now);
  } else if (hijri && !hijri.textContent) {
    hijri.textContent = getHijriDate(now);
  }

  const day = $('hdr-day');
  if (day) day.textContent = getDayName(now);

  // Friday mode state
  setState({ isFriday: isFridayToday() }, true);
}
