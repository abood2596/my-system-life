/* تَسَابِيح ∞ v21 — Prayer View */
import { getState, subscribe } from '../../core/store.js';
import { $, aN, fmt12, fmtCountdown } from '../../core/utils.js';
import { PRAYERS } from '../../core/constants.js';
import { checkPrayer, detectLocation, fetchPrayerTimes } from '../../engines/prayer.js';

export function initPrayView() {
  renderPrayView();
  subscribe('prayerTimes',  () => renderPrayView());
  subscribe('prayerChecks', () => _refreshChecks());
  subscribe('nextPrayer',   () => _refreshCountdown());
  subscribe('prayerSource', () => _refreshSource());
}

export function renderPrayView() {
  const st  = getState();
  const el  = $('v-pray');
  if (!el) return;

  const times   = st.prayerTimes;
  const checks  = st.prayerChecks || {};
  const source  = st.prayerSource;
  const done    = PRAYERS.filter(p => checks[p.id]).length;
  const locName = st.userLocation?.city || 'غزة';

  el.innerHTML = `
    <div class="pray-hero">
      <div class="pray-city" id="pray-city">📍 ${locName}</div>
      <div class="pray-countdown-wrap" id="pray-countdown-wrap">
        ${st.nextPrayer
          ? `<div class="pray-next-label">حتى ${st.nextPrayer.name}</div>
             <div class="pray-countdown" id="pray-cd">${fmtCountdown(st.nextPrayer.secondsLeft)}</div>`
          : `<div class="pray-countdown" id="pray-cd">جارٍ التحميل...</div>`}
      </div>
      <div class="pray-done-count">${aN(done)}/٥ صلوات مكتملة</div>
      ${source === 'offline' ? '<div class="pray-src-badge offline">⚠️ حساب تقديري</div>' : ''}
      ${source === 'api'     ? '<div class="pray-src-badge api">✅ دقيق</div>' : ''}
    </div>

    <div class="pray-times-list" id="pray-list">
      ${PRAYERS.map(p => {
        const t = times ? fmt12(times[p.id] || '—') : '—';
        return `
          <div class="pray-row ${checks[p.id]?'done':''}" data-id="${p.id}">
            <div class="pray-ico">${p.ico}</div>
            <div class="pray-info">
              <div class="pray-name">${p.name}</div>
              <div class="pray-time">${t}</div>
            </div>
            <button class="btn-pray-check ${checks[p.id]?'checked':''}"
              aria-label="تأكيد ${p.name}" data-id="${p.id}">
              ${checks[p.id] ? '✅' : '○'}
            </button>
          </div>`;
      }).join('')}
    </div>

    <div class="pray-actions">
      <button class="btn-pray-action" id="btn-detect-loc">📍 تحديد موقعي</button>
      <button class="btn-pray-action" id="btn-refresh-pray">🔄 تحديث الأوقات</button>
    </div>
  `;

  // أحداث
  el.querySelectorAll('.btn-pray-check').forEach(btn => {
    btn.addEventListener('click', () => {
      const id   = btn.dataset.id;
      const cur  = getState().prayerChecks[id];
      checkPrayer(id, !cur);
    });
  });

  $('btn-detect-loc')?.addEventListener('click', async () => {
    $('pray-city').textContent = '📍 جارٍ التحديد...';
    const loc = await detectLocation();
    $('pray-city').textContent = '📍 ' + (loc.city || 'موقعك');
    await fetchPrayerTimes(loc);
  });

  $('btn-refresh-pray')?.addEventListener('click', async () => {
    await fetchPrayerTimes(getState().userLocation);
  });
}

function _refreshChecks() {
  const st     = getState();
  const checks = st.prayerChecks || {};
  PRAYERS.forEach(p => {
    const row = document.querySelector(`.pray-row[data-id="${p.id}"]`);
    const btn = document.querySelector(`.btn-pray-check[data-id="${p.id}"]`);
    if (row) row.classList.toggle('done', !!checks[p.id]);
    if (btn) { btn.classList.toggle('checked', !!checks[p.id]); btn.textContent = checks[p.id] ? '✅' : '○'; }
  });
  const done = PRAYERS.filter(p => checks[p.id]).length;
  const dEl  = document.querySelector('.pray-done-count');
  if (dEl) dEl.textContent = aN(done) + '/٥ صلوات مكتملة';
}

function _refreshCountdown() {
  const np = getState().nextPrayer;
  const el = $('pray-cd');
  if (!el || !np) return;
  el.textContent = fmtCountdown(np.secondsLeft);
  const lbl = document.querySelector('.pray-next-label');
  if (lbl) lbl.textContent = 'حتى ' + np.name;
}

function _refreshSource() {
  const src = getState().prayerSource;
  const el  = document.querySelector('.pray-src-badge');
  if (!el) return;
  if (src === 'offline') { el.textContent='⚠️ حساب تقديري'; el.className='pray-src-badge offline'; }
  if (src === 'api')     { el.textContent='✅ دقيق';         el.className='pray-src-badge api'; }
}
