/* بروتوكول الإنقاذ الخماسي v23
   ١) تنفّس ٤-٧-٨   ٢) غيّر بيئتك   ٣) تسبيح ٣٣
   ٤) دعاء الإنقاذ  ٥) تعهّد + حفظ
   ─────────────────────────────────────────────── */
import { $, vib, toast, aN } from '../../core/utils.js';
import { openOverlay, closeOverlay } from '../nav.js';
import { logUrge, triggerRelapse } from '../../engines/recovery.js';

const TRIGGERS = [
  'الفراغ وعدم الانشغال',
  'الوحدة والعزلة',
  'التوتر والضغط النفسي',
  'محتوى مثير على الإنترنت',
  'الملل وانعدام الهدف',
  'الحزن أو الاكتئاب',
  'أسباب أخرى',
];

const ENV_ACTIONS = [
  { icon: '🚶', text: 'اخرج من الغرفة فوراً' },
  { icon: '💧', text: 'اشرب كوب ماء بارد' },
  { icon: '📵', text: 'ضع الهاتف بعيداً' },
  { icon: '🚿', text: 'اغسل وجهك بماء بارد' },
  { icon: '🤲', text: 'توضّأ الآن' },
  { icon: '🏃', text: '٢٠ ضغط أو اقفز محلك' },
];

const RESCUE_DUA  = 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْفَوَاحِشِ مَا ظَهَرَ مِنْهَا وَمَا بَطَنَ';
const RESCUE_AYAH = 'إِنَّ الَّذِينَ اتَّقَوْا إِذَا مَسَّهُمْ طَائِفٌ مِنَ الشَّيْطَانِ تَذَكَّرُوا فَإِذَا هُم مُّبْصِرُونَ ﴿الأعراف:٢٠١﴾';

const BREATH_PHASES = [
  { label: 'شهيق',   dur: 4, toScale: '1',    bg: 'var(--blue)',  ease: 'ease-out' },
  { label: 'احبس',   dur: 7, toScale: '1',    bg: 'var(--gold)',  ease: 'linear'   },
  { label: 'زفير',   dur: 8, toScale: '0.35', bg: 'var(--green)', ease: 'ease-in'  },
];

let _step = 1;
let _trigger = '';
let _tbCount = 0;
let _breathTimer = null;
let _phaseIdx = 0;
let _cycles = 0;

export function openSOS() {
  _step = 1; _trigger = ''; _tbCount = 0;
  _clearBreath();
  _render();
  openOverlay('sos-ov');
  vib([300, 100, 300]);
}

// ── Render ────────────────────────────────────────────────
function _render() {
  const ov = $('sos-ov');
  if (!ov) return;
  ov.innerHTML = _html();
  _wire(ov);
}

function _dots() {
  return `<div class="sos-dots">${[1,2,3,4,5].map(i =>
    `<div class="sos-dot ${i===_step?'active':i<_step?'done':''}"></div>`
  ).join('')}</div>`;
}

function _html() {
  const d = _dots();

  if (_step === 1) return `<div class="sos-wrap">
    ${d}
    <div class="sos-title">🫁 تنفّس معي — ٤-٧-٨</div>
    <div class="sos-breath-wrap">
      <div class="sos-breath-ring">
        <div class="sos-breath-circle" id="sos-bc"></div>
      </div>
      <div class="sos-breath-label" id="sos-bl">استعدّ...</div>
      <div class="sos-breath-cycles" id="sos-bcy">○○</div>
    </div>
    <button class="btn-sos-next" id="sos-next">التالي ←</button>
    <button class="btn-sos-relapse" id="sos-relapse">😔 انتكست</button>
    <button class="btn-sos-close" id="sos-cls">إغلاق</button>
  </div>`;

  if (_step === 2) return `<div class="sos-wrap">
    ${d}
    <div class="sos-title">🚶 غيّر بيئتك الآن</div>
    <div class="sos-sub">افعل شيئاً واحداً فوراً:</div>
    <div class="sos-env-list">
      ${ENV_ACTIONS.map(a=>`<button class="sos-env-item">${a.icon} ${a.text}</button>`).join('')}
    </div>
    <button class="btn-sos-next" id="sos-next">✅ فعلتُها — التالي</button>
    <button class="btn-sos-relapse" id="sos-relapse">😔 انتكست</button>
  </div>`;

  if (_step === 3) return `<div class="sos-wrap">
    ${d}
    <div class="sos-title">📿 سبحان الله ٣٣</div>
    <div class="sos-tasbeeh-outer" id="sos-to">
      <div class="sos-tasbeeh-inner">
        <div class="sos-tb-num" id="sos-tbn">٠</div>
        <div class="sos-tb-sub">/ ٣٣</div>
      </div>
    </div>
    <div class="sos-tb-arabic">سُبْحَانَ اللهِ</div>
    <button class="btn-sos-tb" id="sos-tb-btn">اضغط للتسبيح</button>
    <button class="btn-sos-next" id="sos-next" style="opacity:.35;pointer-events:none">✅ أكملتُ — التالي</button>
    <button class="btn-sos-relapse" id="sos-relapse">😔 انتكست</button>
  </div>`;

  if (_step === 4) return `<div class="sos-wrap">
    ${d}
    <div class="sos-title">🤲 دعاء الإنقاذ</div>
    <div class="sos-dua-big">${RESCUE_DUA}</div>
    <div class="sos-ayah-wrap">
      <div class="sos-ayah-text">${RESCUE_AYAH}</div>
    </div>
    <div class="sos-instruct">اقرأه ثلاث مرات — الله يسمعك</div>
    <button class="btn-sos-next" id="sos-next">✅ قرأتُ — التالي</button>
    <button class="btn-sos-relapse" id="sos-relapse">😔 انتكست</button>
  </div>`;

  if (_step === 5) return `<div class="sos-wrap">
    ${d}
    <div class="sos-title">💚 تجاوزت الموجة!</div>
    <div class="sos-pledge-msg">
      <p>كل مقاومة تُعيد برمجة دماغك</p>
      <p>سجّل ما أثار الإغراء لتتعلّم منه:</p>
    </div>
    <div class="sos-triggers">
      ${TRIGGERS.map(t=>`<button class="btn-trigger-opt${_trigger===t?' selected':''}" data-t="${t}">${t}</button>`).join('')}
    </div>
    <button class="btn-sos-pledge" id="sos-pledge">🏆 أنا أقوى — حفظ وإغلاق</button>
  </div>`;

  // step 6: relapse renewal
  return `<div class="sos-wrap">
    <div class="sos-title">🔄 بروتوكول التجديد</div>
    <div class="sos-renewal-msg">
      <p>الله يُحبّ التوابين والمتطهرين</p>
      <p>أيامك النقية الكلية محفوظة للأبد</p>
      <p>قل الآن: <strong>أستغفر الله وأتوب إليه</strong></p>
    </div>
    <div class="sos-msg">ما السبب؟</div>
    <div class="sos-triggers">
      ${TRIGGERS.map(t=>`<button class="btn-trigger-opt" data-t="${t}">${t}</button>`).join('')}
    </div>
    <button class="btn-sos-confirm-relapse" id="sos-confirm-rel">✅ تجديد النية — ابدأ الآن</button>
    <button class="btn-sos-close" id="sos-cls">إغلاق</button>
  </div>`;
}

// ── Wire Events ───────────────────────────────────────────
function _wire(ov) {
  $('sos-next')?.addEventListener('click', () => {
    _clearBreath();
    if (_step < 5) { _step++; _render(); }
  });
  $('sos-relapse')?.addEventListener('click', () => { _clearBreath(); _step = 6; _render(); });
  $('sos-cls')?.addEventListener('click',     () => { _clearBreath(); closeOverlay('sos-ov'); });

  if (_step === 1) _startBreathing();

  ov.querySelectorAll('.sos-env-item').forEach(b => {
    b.addEventListener('click', () => {
      ov.querySelectorAll('.sos-env-item').forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      vib([40]);
    });
  });

  if (_step === 3) {
    $('sos-tb-btn')?.addEventListener('click', () => {
      if (_tbCount >= 33) return;
      _tbCount++;
      const n  = $('sos-tbn');
      const o  = $('sos-to');
      const nx = $('sos-next');
      if (n) n.textContent = aN(_tbCount);
      if (o) o.style.background = `conic-gradient(var(--gold) ${(_tbCount/33)*360}deg,var(--bg-card2) 0deg)`;
      vib([30]);
      if (_tbCount >= 33) {
        toast('ماشاءالله! ٣٣ تسبيحة 🌟');
        vib([100, 50, 100, 50, 200]);
        if (nx) {
          nx.style.opacity = '1';
          nx.style.pointerEvents = 'auto';
          nx.textContent = '✅ ماشاءالله — التالي';
        }
        const btn = $('sos-tb-btn');
        if (btn) btn.disabled = true;
      }
    });
  }

  ov.querySelectorAll('.btn-trigger-opt').forEach(b => {
    b.addEventListener('click', () => {
      ov.querySelectorAll('.btn-trigger-opt').forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      _trigger = b.dataset.t;
    });
  });

  $('sos-pledge')?.addEventListener('click', async () => {
    if (_trigger) await logUrge(_trigger, 3, true);
    toast('✅ صمدتَ — انتصار حقيقي! 💚');
    vib([100, 50, 200]);
    _clearBreath();
    closeOverlay('sos-ov');
  });

  $('sos-confirm-rel')?.addEventListener('click', async () => {
    await triggerRelapse(_trigger || 'غير محدد', 3);
    toast('🔄 بدأت من جديد — أيامك الكلية محفوظة');
    _clearBreath();
    closeOverlay('sos-ov');
    document.dispatchEvent(new CustomEvent('recovery:updated'));
  });
}

// ── Breathing 4-7-8 ──────────────────────────────────────
function _startBreathing() {
  _phaseIdx = 0; _cycles = 0;
  const c = $('sos-bc');
  if (c) {
    c.style.transition = 'none';
    c.style.transform  = 'scale(0.35)';
    c.style.background = 'var(--blue)';
  }
  _breathTimer = setTimeout(_tick, 700);
}

function _tick() {
  const c  = $('sos-bc');
  const bl = $('sos-bl');
  if (!c || !bl) return;

  const p = BREATH_PHASES[_phaseIdx];
  c.style.transition = `transform ${p.dur}s ${p.ease}, background .5s`;
  c.style.transform  = `scale(${p.toScale})`;
  c.style.background = p.bg;

  let rem = p.dur;
  bl.textContent = `${p.label}... (${rem})`;

  const countdown = () => {
    rem--;
    const lbl = $('sos-bl');
    if (!lbl) return;
    if (rem > 0) {
      lbl.textContent = `${p.label}... (${rem})`;
      _breathTimer = setTimeout(countdown, 1000);
    } else {
      _phaseIdx = (_phaseIdx + 1) % BREATH_PHASES.length;
      if (_phaseIdx === 0) {
        _cycles++;
        const cy = $('sos-bcy');
        if (cy) cy.textContent = _cycles >= 2 ? '●●' : '●○';
        if (_cycles >= 2) {
          const l2 = $('sos-bl');
          if (l2) l2.textContent = '✅ ممتاز!';
          const nx = $('sos-next');
          if (nx) nx.textContent = '✅ انتهيت — التالي';
          return;
        }
      }
      _breathTimer = setTimeout(_tick, 400);
    }
  };
  _breathTimer = setTimeout(countdown, 1000);
}

function _clearBreath() {
  if (_breathTimer) { clearTimeout(_breathTimer); _breathTimer = null; }
  _phaseIdx = 0; _cycles = 0;
}
