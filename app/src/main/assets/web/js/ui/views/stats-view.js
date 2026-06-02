/* تَسَابِيح ∞ v21 — Stats View */
import { getState, subscribe } from '../../core/store.js';
import { $, aN, dStr, fmtNum } from '../../core/utils.js';
import { LS } from '../../core/storage.js';
import { ACHIEVEMENTS } from '../../core/constants.js';
import { getMasteredCount } from '../../engines/baqarah.js';
import { calcLevel, LEVELS } from '../../data/science.js';

export function initStatsView() {
  renderStats();
  subscribe('xp',          () => renderStats());
  subscribe('achievements', () => _refreshAchievements());
}

export function renderStats() {
  const st  = getState();
  const el  = $('v-stats');
  if (!el) return;

  const totalTasbeeh = LS.allTasbeehTotal();
  const lv = LEVELS[calcLevel(st.xp) - 1] || LEVELS[0];
  const fitDays = LS.get('wirdi_fit_meta', {}).totalFitDays || 0;

  el.innerHTML = `
    <div class="stats-hero">
      <div class="stats-level">${lv.icon} ${lv.title}</div>
      <div class="stats-xp">${aN(st.xp)} XP</div>
    </div>

    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-card-n">${aN(totalTasbeeh)}</div>
        <div class="stat-card-l">إجمالي التسبيحات</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-n">${aN(st.tasbeehStreak)}</div>
        <div class="stat-card-l">سلسلة الأيام</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-n">${aN(st.recovery.streak)}</div>
        <div class="stat-card-l">يوم تعافٍ</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-n">${aN(getMasteredCount())}</div>
        <div class="stat-card-l">مجموعة بقرة متقنة</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-n">${aN(st.prayDaysAll)}</div>
        <div class="stat-card-l">يوم صلاة مكتمل</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-n">${aN(fitDays)}</div>
        <div class="stat-card-l">يوم تمرين</div>
      </div>
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
      <div class="stats-section-title">🏅 الإنجازات (${aN(st.achievements.length)}/${aN(ACHIEVEMENTS.length)})</div>
      <div class="ach-grid" id="ach-grid">${_renderAchievements(st)}</div>
    </div>
  `;

  _drawChart();
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

function _renderAchievements(st) {
  const ctx = _buildAchCtx(st);
  return ACHIEVEMENTS.map(ach => {
    const done = st.achievements.includes(ach.id);
    const prog = ach.p(ctx);
    const pct  = Math.round(prog / ach.max * 100);
    return `
      <div class="ach-card ${done?'unlocked':'locked'}" title="${ach.desc}">
        <div class="ach-icon">${done ? ach.i : '🔒'}</div>
        <div class="ach-name">${ach.n}</div>
        ${!done ? `<div class="ach-prog-bar"><div class="ach-prog-fill" style="width:${pct}%"></div></div>` : ''}
      </div>`;
  }).join('');
}

function _buildAchCtx(st) {
  return {
    allTasbeeh:     LS.allTasbeehTotal(),
    streak:         st.tasbeehStreak,
    prayDaysAll:    st.prayDaysAll,
    bqMastered:     getMasteredCount(),
    recStreak:      st.recovery.streak,
    fitDays:        LS.get('wirdi_fit_meta', {}).totalFitDays || 0,
    level:          calcLevel(st.xp),
    xp:             st.xp,
    fridayComplete: st.fridayComplete,
  };
}

function _drawChart() {
  const canvas = $('stats-chart');
  if (!canvas || !canvas.getContext) return;
  const ctx    = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const pad = 24;

  const data = [];
  for (let i = 6; i >= 0; i--) {
    data.push(LS.dayTotal(-i));
  }
  const maxVal = Math.max(...data, 100);

  ctx.clearRect(0, 0, W, H);
  const barW = (W - pad * 2) / 7;

  data.forEach((v, i) => {
    const bH   = Math.round(((H - pad * 2) * v) / maxVal);
    const x    = pad + i * barW + barW * 0.15;
    const y    = H - pad - bH;
    const bwPx = barW * 0.7;

    // Gradient bar
    const grad = ctx.createLinearGradient(0, y, 0, H - pad);
    grad.addColorStop(0, 'rgba(212,160,23,0.9)');
    grad.addColorStop(1, 'rgba(212,160,23,0.2)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, bwPx, bH, 4) : ctx.rect(x, y, bwPx, bH);
    ctx.fill();

    // Label
    const days = ['أحد','اثن','ثلا','أرب','خمي','جمع','سبت'];
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '10px IBM Plex Sans Arabic, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(days[d.getDay()], x + bwPx / 2, H - 6);
  });
}

function _refreshAchievements() {
  const st  = getState();
  const el  = $('ach-grid');
  if (el) el.innerHTML = _renderAchievements(st);
}
