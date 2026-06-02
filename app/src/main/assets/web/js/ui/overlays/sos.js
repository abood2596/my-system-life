/* تَسَابِيح ∞ v21 — SOS Emergency Overlay */
import { $, vib, toast } from '../../core/utils.js';
import { openOverlay, closeOverlay } from '../nav.js';
import { logUrge, triggerRelapse } from '../../engines/recovery.js';
import { addPush, addSquat } from '../../engines/fitness.js';

const EMERGENCY_DUA = 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْفَوَاحِشِ، مَا ظَهَرَ مِنْهَا وَمَا بَطَنَ';
const AYAT_KURSI    = 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ...';

const TRIGGERS_LIST = [
  'الفراغ وعدم الانشغال',
  'الوحدة والعزلة',
  'التوتر والضغط النفسي',
  'محتوى مثير على الإنترنت',
  'الملل وانعدام الهدف',
  'الحزن أو الاكتئاب',
  'أسباب أخرى',
];

let _step = 1;
let _selectedTrigger = '';

export function openSOS() {
  _step = 1;
  _render();
  openOverlay('sos-ov');
  vib([300, 100, 300]);
}

function _render() {
  const ov = $('sos-ov');
  if (!ov) return;

  if (_step === 1) {
    ov.innerHTML = `
      <div class="sos-wrap">
        <div class="sos-title">🚨 بروتوكول الإنقاذ</div>
        <div class="sos-step">الخطوة ١: تنفّس ببطء ٣ مرات</div>
        <div class="sos-dua">${EMERGENCY_DUA}</div>
        <div class="sos-ayah">${AYAT_KURSI}</div>
        <div class="sos-exercise-title">💪 تمرين طارئ — افعل الآن:</div>
        <div class="sos-exercises">
          <button class="btn-sos-ex" id="sos-push">+١٠ ضغط</button>
          <button class="btn-sos-ex" id="sos-squat">+١٠ قرفصاء</button>
        </div>
        <button class="btn-sos-next" id="sos-step2-btn">✅ تجاوزت الموجة → التالي</button>
        <button class="btn-sos-relapse" id="sos-relapse-btn">😔 انتكست — بروتوكول التجديد</button>
        <button class="btn-sos-close" id="sos-close-btn">إغلاق</button>
      </div>`;

    $('sos-push')?.addEventListener('click',  () => { addPush(10);  toast('💪 +١٠ ضغط'); });
    $('sos-squat')?.addEventListener('click', () => { addSquat(10); toast('🦵 +١٠ قرفصاء'); });
    $('sos-step2-btn')?.addEventListener('click',   () => { _step=2; _render(); });
    $('sos-relapse-btn')?.addEventListener('click', () => { _step=3; _render(); });
    $('sos-close-btn')?.addEventListener('click',   () => closeOverlay('sos-ov'));

  } else if (_step === 2) {
    ov.innerHTML = `
      <div class="sos-wrap">
        <div class="sos-title">💚 أحسنت — صمدت!</div>
        <div class="sos-msg">سجّل سبب الإغراء لمنعه في المستقبل:</div>
        <div class="sos-triggers">
          ${TRIGGERS_LIST.map(t=>`<button class="btn-trigger-opt ${_selectedTrigger===t?'selected':''}" data-t="${t}">${t}</button>`).join('')}
        </div>
        <button class="btn-sos-save" id="sos-save-urge">💾 حفظ وإغلاق</button>
      </div>`;

    ov.querySelectorAll('.btn-trigger-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        ov.querySelectorAll('.btn-trigger-opt').forEach(b=>b.classList.remove('selected'));
        btn.classList.add('selected');
        _selectedTrigger = btn.dataset.t;
      });
    });

    $('sos-save-urge')?.addEventListener('click', async () => {
      if (_selectedTrigger) await logUrge(_selectedTrigger, 3, true);
      toast('✅ تم التسجيل — استمر، أنت قوي!');
      closeOverlay('sos-ov');
    });

  } else if (_step === 3) {
    ov.innerHTML = `
      <div class="sos-wrap">
        <div class="sos-title">🔄 بروتوكول التجديد</div>
        <div class="sos-renewal-msg">
          <p>الله يُحب التوابين والمتطهرين</p>
          <p>أيامك النظيفة الكلية محفوظة — الـ Streak يبدأ من الآن</p>
          <p>قل: <strong>أستغفر الله وأتوب إليه</strong></p>
        </div>
        <div class="sos-msg">ما السبب؟</div>
        <div class="sos-triggers">
          ${TRIGGERS_LIST.map(t=>`<button class="btn-trigger-opt" data-t="${t}">${t}</button>`).join('')}
        </div>
        <button class="btn-sos-confirm-relapse" id="sos-confirm-rel">✅ تجديد النية والبدء من الآن</button>
      </div>`;

    ov.querySelectorAll('.btn-trigger-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        ov.querySelectorAll('.btn-trigger-opt').forEach(b=>b.classList.remove('selected'));
        btn.classList.add('selected');
        _selectedTrigger = btn.dataset.t;
      });
    });

    $('sos-confirm-rel')?.addEventListener('click', async () => {
      const oldStreak = await triggerRelapse(_selectedTrigger || 'غير محدد', 3);
      toast(`🔄 بدأت من جديد — أيامك الكلية محفوظة`);
      closeOverlay('sos-ov');
      // أعد render شاشة التعافي
      document.dispatchEvent(new CustomEvent('recovery:updated'));
    });
  }
}
