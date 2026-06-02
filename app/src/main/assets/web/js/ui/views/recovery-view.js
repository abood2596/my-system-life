/* تَسَابِيح — Recovery & Fitness View v2 */
import { getState, subscribe } from '../../core/store.js';
import { $, aN, fmtCountdown } from '../../core/utils.js';
import { BRAIN_METRICS, RECOVERY_TIMELINE, getRecoveryPhase, getNextMilestone, isInFlatline } from '../../data/science.js';
import { checkinClean, useFreeze, getRecoveryStats } from '../../engines/recovery.js';
import { addPush, addSquat, setManual, cancelRestTimer } from '../../engines/fitness.js';
import { openSOS } from '../overlays/sos.js';

export function initRecoveryView() {
  renderRecoveryView();
  subscribe('recovery', () => renderRecoveryView());
  subscribe('fitness',  () => _refreshFitness());
  document.addEventListener('recovery:updated', () => renderRecoveryView());
}

export function renderRecoveryView() {
  const { rec, brain } = getRecoveryStats();
  const st       = getState();
  const fit      = st.fitness;
  const phase    = getRecoveryPhase(rec.streak);
  const next     = getNextMilestone(rec.streak);
  const inFL     = isInFlatline(rec.streak);
  const checkedIn = rec.lastCheckin === _today();
  const el       = $('v-recovery');
  if (!el) return;

  el.innerHTML = `
    <!-- ── Streak Hero ── -->
    <div class="rec-hero">
      <div class="rec-streak-ring-wrap">
        <svg viewBox="0 0 120 120" class="rec-ring-svg">
          <circle cx="60" cy="60" r="52" class="ring-bg"/>
          <circle cx="60" cy="60" r="52" class="ring-fill rec-ring"
            stroke-dasharray="${(2 * Math.PI * 52).toFixed(2)}"
            stroke-dashoffset="${(2 * Math.PI * 52 * (1 - Math.min(rec.streak, 90) / 90)).toFixed(2)}"/>
        </svg>
        <div class="rec-streak-num">${aN(rec.streak)}</div>
        <div class="rec-streak-lbl">يوم</div>
      </div>
      <div class="rec-meta">
        <div class="rec-phase" style="color:${phase.color}">${phase.icon} ${phase.phase}</div>
        <div class="rec-phase-label">${phase.label}</div>
        <div class="rec-total-row">
          <span class="rec-total-ico">🏆</span>
          <span class="rec-total-num">${aN(rec.totalCleanDays)}</span>
          <span class="rec-total-lbl">يوم نقاء محفوظ للأبد</span>
        </div>
        <div class="rec-best">أفضل سلسلة: <strong>${aN(rec.bestStreak)}</strong> يوم</div>
      </div>
    </div>

    <!-- ── Flatline Banner (enhanced) ── -->
    ${inFL ? `
    <div class="flatline-banner flatline-pulse">
      <div class="flatline-header">
        <span class="flatline-icon">🧠</span>
        <div>
          <div class="flatline-title">مرحلة Flatline — يوم ${aN(rec.streak)} من ٤٥</div>
          <div class="flatline-subtitle">هذا طبيعي ومتوقّع علمياً</div>
        </div>
      </div>
      <div class="flatline-pills">
        <div class="flatline-pill">دماغك يُعيد بناء مستقبلات الدوبامين D2</div>
        <div class="flatline-pill">الفتور والضجر = علامة شفاء، ليست ضعفاً</div>
        <div class="flatline-pill">أصعب الأيام تُولَد منها أقوى الانتصارات</div>
      </div>
      <div class="flatline-tip">💡 الآن أكثر من أي وقت: تمرين + قرآن + نوم مبكر</div>
    </div>` : ''}

    <!-- ── Next Milestone ── -->
    ${next ? `
    <div class="rec-milestone">
      <span class="milestone-icon">${next.icon}</span>
      <div>
        <div class="milestone-label">هدفك القادم: يوم ${aN(next.day)} — ${next.label}</div>
        <div class="milestone-remaining">${aN(next.day - rec.streak)} يوم متبقي</div>
      </div>
    </div>` : ''}

    <!-- ── Action Buttons ── -->
    <div class="rec-actions">
      <button class="btn-rec-action btn-checkin ${checkedIn ? 'done' : ''}" id="btn-rec-checkin">
        ${checkedIn ? '✅ سجّلتَ يومك' : '✅ أنا نقي اليوم'}
      </button>
      <button class="btn-rec-action btn-freeze" id="btn-rec-freeze">
        🧊 تجميد (${aN(rec.freezesLeft || 0)})
      </button>
      <button class="btn-rec-action btn-sos" id="btn-rec-sos">🚨 إنقاذ فوري</button>
    </div>

    <!-- ── Brain Recovery ── -->
    <div class="brain-section">
      <div class="brain-title">🧬 تعافي الدماغ — مؤشرات علمية</div>
      <div class="brain-metrics" id="brain-metrics">
        ${BRAIN_METRICS.map((m, idx) => `
          <div class="brain-metric" style="animation-delay:${idx * 80}ms">
            <div class="bm-header">
              <span class="bm-icon">${m.icon}</span>
              <span class="bm-label">${m.label}</span>
              <span class="bm-pct">${aN(Math.round(brain[m.key]))}٪</span>
            </div>
            <div class="bm-bar-wrap">
              <div class="bm-bar bm-bar-animate" style="--bm-w:${Math.round(brain[m.key])}%"></div>
            </div>
            <div class="bm-full-day">يكتمل يوم ${aN(m.fullDay)} · ${m.note || ''}</div>
          </div>`).join('')}
      </div>
      <div class="brain-boost-note">
        💪 التمرين يُسرّع D2 +٦٪ &nbsp;|&nbsp; 🕌 الصلاة المنتظمة +٣٪
      </div>
    </div>

    <!-- ── Fitness ── -->
    <div class="fit-section" id="fit-section">
      <div class="fit-title">💪 التمرين اليومي</div>
      <div class="fit-week-badge">الأسبوع ${aN(fit.weekNumber)}</div>
      <div class="fit-exercise" id="fit-push-card">
        <div class="fit-ex-header">
          <span class="fit-ex-icon">💪</span>
          <span class="fit-ex-name">ضغط</span>
          <span class="fit-ex-count" id="fit-push-count">${aN(fit.todayPush)}/${aN(fit.pushGoal)}</span>
        </div>
        <div class="fit-bar-wrap"><div class="fit-bar" id="fit-push-bar" style="width:${Math.min(fit.todayPush / fit.pushGoal, 1) * 100}%"></div></div>
        <div class="fit-btns">
          <button class="btn-fit-add" data-type="push" data-a="5">+٥</button>
          <button class="btn-fit-add" data-type="push" data-a="10">+١٠</button>
          <button class="btn-fit-add" data-type="push" data-a="20">+٢٠</button>
          <button class="btn-fit-manual" data-type="push">يدوي</button>
        </div>
      </div>
      <div class="fit-exercise" id="fit-squat-card">
        <div class="fit-ex-header">
          <span class="fit-ex-icon">🦵</span>
          <span class="fit-ex-name">قرفصاء</span>
          <span class="fit-ex-count" id="fit-squat-count">${aN(fit.todaySquat)}/${aN(fit.squatGoal)}</span>
        </div>
        <div class="fit-bar-wrap"><div class="fit-bar" id="fit-squat-bar" style="width:${Math.min(fit.todaySquat / fit.squatGoal, 1) * 100}%"></div></div>
        <div class="fit-btns">
          <button class="btn-fit-add" data-type="squat" data-a="5">+٥</button>
          <button class="btn-fit-add" data-type="squat" data-a="10">+١٠</button>
          <button class="btn-fit-add" data-type="squat" data-a="20">+٢٠</button>
          <button class="btn-fit-manual" data-type="squat">يدوي</button>
        </div>
      </div>
      ${fit.restTimerActive ? `
      <div class="rest-timer" id="rest-timer">
        <span>⏱ الراحة: ${fmtCountdown(fit.restSecondsLeft)}</span>
        <button id="btn-cancel-rest">إلغاء</button>
      </div>` : ''}
    </div>

    <!-- ── Timeline ── -->
    <div class="rec-timeline">
      <div class="rec-timeline-title">🗓 خارطة الطريق العلمية</div>
      ${RECOVERY_TIMELINE.map(m => `
        <div class="timeline-item ${rec.streak >= m.day ? 'reached' : ''}">
          <div class="timeline-dot" style="background:${m.color}"></div>
          <div class="timeline-content">
            <div class="timeline-day" style="color:${m.color}">يوم ${aN(m.day)}</div>
            <div class="timeline-label">${m.icon} ${m.label}</div>
          </div>
        </div>`).join('')}
    </div>
  `;

  $('btn-rec-checkin')?.addEventListener('click', () => { checkinClean(); renderRecoveryView(); });
  $('btn-rec-freeze')?.addEventListener('click',  () => { useFreeze();    renderRecoveryView(); });
  $('btn-rec-sos')?.addEventListener('click', openSOS);

  el.querySelectorAll('.btn-fit-add').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.type, a = parseInt(btn.dataset.a, 10);
      if (t === 'push')  addPush(a);
      if (t === 'squat') addSquat(a);
    });
  });

  el.querySelectorAll('.btn-fit-manual').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.type;
      const v = prompt(`أدخل عدد ${t === 'push' ? 'الضغط' : 'القرفصاء'}:`);
      if (v) setManual(t, parseInt(v, 10));
    });
  });

  $('btn-cancel-rest')?.addEventListener('click', cancelRestTimer);

  // trigger bar animations after paint
  requestAnimationFrame(() => {
    el.querySelectorAll('.bm-bar-animate').forEach(bar => bar.classList.add('bm-bar-run'));
  });
}

function _refreshFitness() {
  const fit = getState().fitness;
  const pc  = $('fit-push-count');
  const sc  = $('fit-squat-count');
  const pb  = $('fit-push-bar');
  const sb  = $('fit-squat-bar');

  if (pc) pc.textContent = aN(fit.todayPush)  + '/' + aN(fit.pushGoal);
  if (sc) sc.textContent = aN(fit.todaySquat) + '/' + aN(fit.squatGoal);
  if (pb) pb.style.width = Math.min(fit.todayPush  / fit.pushGoal,  1) * 100 + '%';
  if (sb) sb.style.width = Math.min(fit.todaySquat / fit.squatGoal, 1) * 100 + '%';
}

function _today() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
