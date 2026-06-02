/* تَسَابِيح — Stats View v2 */
import { getState, subscribe } from '../../core/store.js';
import { $, aN, dStr } from '../../core/utils.js';
import { LS } from '../../core/storage.js';
import { ACHIEVEMENTS } from '../../core/constants.js';
import { getMasteredCount } from '../../engines/baqarah.js';

export function initStatsView() {
  renderStats();
  subscribe('achievements', () => _refreshMilestones());
  subscribe('prayDaysAll',  () => renderStats());
}

export function renderStats() {
  const st       = getState();
  const el       = $('v-stats');
  if (!el) return;

  const totalTasbeeh = LS.allTasbeehTotal();
  const fitMeta      = LS.get('wirdi_fit_meta', {});
  const fitDays      = fitMeta.totalFitDays || 0;
  const bqMastered   = getMasteredCount();
  const recStreak    = st.recovery?.streak       || 0;
  const recTotal     = st.recovery?.totalCleanDays || 0;

  el.innerHTML = `
    <!-- KPI Cards -->
    <div class="stats-cards">
      <div class="stat-card gold-card">
        <div class="stat-card-ico">📿</div>
        <div class="stat-card-n">${aN(totalTasbeeh)}</div>
        <div class="stat-card-l">إجمالي التسبيحات</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-ico">🔥</div>
        <div class="stat-card-n">${aN(st.tasbeehStreak || 0)}</div>
        <div class="stat-card-l">سلسلة الورد</div>
      </div>
      <div class="stat-card ${recTotal > 0 ? 'green-card' : ''}">
        <div class="stat-card-ico">💚</div>
        <div class="stat-card-n">${aN(recTotal)}</div>
        <div class="stat-card-l">يوم نقاء محفوظ</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-ico">🕌</div>
        <div class="stat-card-n">${aN(st.prayDaysAll || 0)}</div>
        <div class="stat-card-l">يوم صلاة مكتمل</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-ico">📖</div>
        <div class="stat-card-n">${aN(bqMastered)}<span style="font-size:.9rem;color:var(--t50)">/٣٧</span></div>
        <div class="stat-card-l">مجموعة بقرة متقنة</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-ico">💪</div>
        <div class="stat-card-n">${aN(fitDays)}</div>
        <div class="stat-card-l">يوم تمرين</div>
      </div>
    </div>

    <!-- Heatmap -->
    <div class="stats-heatmap-section">
      <div class="stats-section-title">🗓 خريطة السنة</div>
      <div class="heatmap-wrap" id="heatmap">${_renderHeatmap()}</div>
    </div>

    <!-- 7-day chart -->
    <div class="stats-chart-section">
      <div class="stats-section-title">📈 آخر ٧ أيام (تسبيحات)</div>
      <canvas id="stats-chart" width="360" height="140"></canvas>
    </div>

    <!-- Milestones -->
    <div class="stats-achievements">
      <div class="stats-section-title">🏅 محطّاتك (${aN(st.achievements.length)}/${aN(ACHIEVEMENTS.length)})</div>
      <div class="ach-grid" id="ach-grid">${_renderMilestones(st)}</div>
    </div>
  `;

  _drawChart();
}

function _renderHeatmap() {
  const cells = [];
  for (let i = 364; i >= 0; i--) {
    const d   = dStr(-i);
    const tot = LS.get('wirdi_d_' + d, null);
    const sum = tot ? Object.values(tot).reduce((a, b) => a + (Number(b) || 0), 0) : 0;
    const intensity = sum === 0 ? 0 : sum < 100 ? 1 : sum < 300 ? 2 : sum < 700 ? 3 : 4;
    cells.push(`<div class="hm-cell hm-${intensity}" title="${d}: ${aN(sum)} تسبيحة"></div>`);
  }
  return cells.join('');
}

function _renderMilestones(st) {
  const ctx = _buildCtx(st);
  return ACHIEVEMENTS.map(ach => {
    const done = st.achievements.includes(ach.id);
    const prog = ach.p(ctx);
    const pct  = Math.round(prog / ach.max * 100);
    return `
      <div class="ach-card ${done ? 'unlocked' : 'locked'}" title="${ach.desc}">
        <div class="ach-icon">${done ? ach.i : '🔒'}</div>
        <div class="ach-name">${ach.n}</div>
        ${!done ? `<div class="ach-prog-bar"><div class="ach-prog-fill" style="width:${pct}%"></div></div>` : ''}
      </div>`;
  }).join('');
}

function _buildCtx(st) {
  return {
    allTasbeeh:     LS.allTasbeehTotal(),
    streak:         st.tasbeehStreak    || 0,
    prayDaysAll:    st.prayDaysAll      || 0,
    bqMastered:     getMasteredCount(),
    recStreak:      st.recovery?.streak || 0,
    fitDays:        LS.get('wirdi_fit_meta', {}).totalFitDays || 0,
    level:          1,
    xp:             0,
    fridayComplete: st.fridayComplete   || 0,
  };
}

function _drawChart() {
  const canvas = $('stats-chart');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 360;
  canvas.width = W;
  const H = 140, pad = 24;

  const data = [];
  for (let i = 6; i >= 0; i--) data.push(LS.dayTotal(-i));
  const maxVal = Math.max(...data, 100);

  ctx.clearRect(0, 0, W, H);
  const barW = (W - pad * 2) / 7;
  const days = ['أحد', 'اثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

  data.forEach((v, i) => {
    const bH   = Math.round(((H - pad * 2) * v) / maxVal);
    const x    = pad + i * barW + barW * 0.15;
    const y    = H - pad - bH;
    const bwPx = barW * 0.7;

    const grad = ctx.createLinearGradient(0, y, 0, H - pad);
    grad.addColorStop(0, 'rgba(212,160,23,.9)');
    grad.addColorStop(1, 'rgba(212,160,23,.15)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, bwPx, bH, 4);
    else ctx.rect(x, y, bwPx, bH);
    ctx.fill();

    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.font = '10px IBM Plex Sans Arabic, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(days[d.getDay()], x + bwPx / 2, H - 6);
  });
}

function _refreshMilestones() {
  const st = getState();
  const el = $('ach-grid');
  if (el) el.innerHTML = _renderMilestones(st);
}
