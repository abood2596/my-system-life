/* إشراق — Stats View (الإحصائيات) — مقاييس حقيقية + أوسمة هادفة (بلا XP) */
import { getState, subscribe } from '../../core/store.js';
import { $, aN, dStr } from '../../core/utils.js';
import { LS } from '../../core/storage.js';
import { getMasteredCount } from '../../engines/baqarah.js';

export function initStatsView() {
  renderStats();
  subscribe('recovery',      () => renderStats());
  subscribe('tasbeehStreak', () => renderStats());
  subscribe('prayDaysAll',   () => renderStats());
}

export function renderStats() {
  const st = getState();
  const el = $('v-stats');
  if (!el) return;

  const totalTasbeeh = LS.allTasbeehTotal();
  const fitDays = LS.get('wirdi_fit_meta', {}).totalFitDays || 0;

  el.innerHTML = `
    <div class="stats-hero">
      <div class="stats-title">رحلتك مع إشراق ☀</div>
      <div class="stats-sub">تبني نورَك يوماً بيوم</div>
    </div>

    <div class="stats-cards">
      <div class="stat-card"><div class="stat-card-n">${aN(totalTasbeeh)}</div><div class="stat-card-l">إجمالي التسبيحات</div></div>
      <div class="stat-card"><div class="stat-card-n">${aN(st.tasbeehStreak)}</div><div class="stat-card-l">سلسلة الأيام</div></div>
      <div class="stat-card"><div class="stat-card-n">${aN(st.recovery.streak)}</div><div class="stat-card-l">يوم تعافٍ</div></div>
      <div class="stat-card"><div class="stat-card-n">${aN(getMasteredCount())}</div><div class="stat-card-l">مجموعة بقرة متقنة</div></div>
      <div class="stat-card"><div class="stat-card-n">${aN(st.prayDaysAll)}</div><div class="stat-card-l">يوم صلاة مكتمل</div></div>
      <div class="stat-card"><div class="stat-card-n">${aN(fitDays)}</div><div class="stat-card-l">يوم تمرين</div></div>
    </div>

    <div class="stats-heatmap-section">
      <div class="stats-section-title">🗓 خريطة السنة</div>
      <div class="heatmap-wrap" id="heatmap">${_renderHeatmap()}</div>
    </div>

    <div class="stats-chart-section">
      <div class="stats-section-title">📈 آخر ٧ أيام</div>
      <canvas id="stats-chart" width="360" height="160"></canvas>
    </div>

    <div class="stats-achievements">
      <div class="stats-section-title">🏅 محطّاتك</div>
      <div class="ach-grid">${_renderMilestones(st)}</div>
    </div>
  `;

  _drawChart();
}

// ── أوسمة هادفة مبنية على إنجازات حقيقية (لا نقاط) ─────────
function _milestones(st) {
  const all  = LS.allTasbeehTotal();
  const strk = st.tasbeehStreak || 0;
  const rec  = st.recovery?.streak || 0;
  const bq   = getMasteredCount();
  const pray = st.prayDaysAll || 0;
  return [
    { i:'🌅', n:'أول إشراق',     done: all  >= 1 },
    { i:'📿', n:'ألف تسبيحة',    done: all  >= 1000 },
    { i:'🌟', n:'١٠ آلاف',       done: all  >= 10000 },
    { i:'🔥', n:'أسبوع وِرد',     done: strk >= 7 },
    { i:'💎', n:'شهر وِرد',       done: strk >= 30 },
    { i:'🛡️', n:'٧ أيام نقاء',   done: rec  >= 7 },
    { i:'🧠', n:'٢١ يوم نقاء',   done: rec  >= 21 },
    { i:'👑', n:'٩٠ يوم نقاء',   done: rec  >= 90 },
    { i:'📖', n:'١٠ متقنة',      done: bq   >= 10 },
    { i:'🕌', n:'٤٠ يوم صلاة',   done: pray >= 40 },
  ];
}

function _renderMilestones(st) {
  return _milestones(st).map(m => `
    <div class="ach-card ${m.done ? 'unlocked' : 'locked'}">
      <div class="ach-icon">${m.done ? m.i : '🔒'}</div>
      <div class="ach-name">${m.n}</div>
    </div>`).join('');
}

function _renderHeatmap() {
  const cells = [];
  for (let i = 364; i >= 0; i--) {
    const d   = dStr(-i);
    const tot = LS.get('wirdi_d_' + d, null);
    const sum = tot ? Object.values(tot).reduce((a,b)=>a+(Number(b)||0),0) : 0;
    const intensity = sum === 0 ? 0 : sum < 100 ? 1 : sum < 300 ? 2 : sum < 700 ? 3 : 4;
    cells.push(`<div class="hm-cell hm-${intensity}" title="${d}: ${aN(sum)} تسبيحة"></div>`);
  }
  return cells.join('');
}

function _drawChart() {
  const canvas = $('stats-chart');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const pad = 24;

  const data = [];
  for (let i = 6; i >= 0; i--) data.push(LS.dayTotal(-i));
  const maxVal = Math.max(...data, 100);

  ctx.clearRect(0, 0, W, H);
  const barW = (W - pad * 2) / 7;

  data.forEach((v, i) => {
    const bH   = Math.round(((H - pad * 2) * v) / maxVal);
    const x    = pad + i * barW + barW * 0.15;
    const y    = H - pad - bH;
    const bwPx = barW * 0.7;

    const grad = ctx.createLinearGradient(0, y, 0, H - pad);
    grad.addColorStop(0, 'rgba(255,180,84,0.95)');
    grad.addColorStop(1, 'rgba(255,138,91,0.20)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, bwPx, bH, 5) : ctx.rect(x, y, bwPx, bH);
    ctx.fill();

    const days = ['أحد','اثن','ثلا','أرب','خمي','جمع','سبت'];
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '11px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(days[d.getDay()], x + bwPx / 2, H - 6);
  });
}
