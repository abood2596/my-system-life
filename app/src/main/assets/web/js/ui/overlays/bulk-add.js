/* تَسَابِيح ∞ v21 — Bulk Add Overlay (Bottom Sheet) */
import { $ } from '../../core/utils.js';
import { openOverlay, closeOverlay } from '../nav.js';
import { bulkAdd } from '../../engines/tasbeeh.js';
import { DHIKR } from '../../core/constants.js';
import { aN, toast, vib } from '../../core/utils.js';

export function openBulkAdd(defaultIdx = 0) {
  const el = $('bulk-add-ov');
  if (!el) return;

  el.innerHTML = `
    <div class="bulk-sheet">
      <div class="bulk-handle"></div>
      <h3 class="bulk-title">➕ إضافة من المسبحة</h3>
      <div class="bulk-select-wrap">
        <select id="bulk-dhikr-sel" class="bulk-sel">
          ${DHIKR.map((d,i) => `<option value="${i}" ${i===defaultIdx?'selected':''}>${d.i} ${d.n}</option>`).join('')}
        </select>
      </div>
      <div class="bulk-display" id="bulk-num-display">${aN(0)}</div>
      <div class="bulk-quick-btns">
        <button class="btn-bulk-quick" data-v="33">+${aN(33)}</button>
        <button class="btn-bulk-quick" data-v="100">+${aN(100)}</button>
        <button class="btn-bulk-quick" data-v="500">+${aN(500)}</button>
      </div>
      <div class="bulk-numpad" id="bulk-numpad">
        ${[1,2,3,4,5,6,7,8,9,'⌫',0,'✓'].map(k => `
          <button class="btn-np ${k==='✓'?'btn-np-confirm':''} ${k==='⌫'?'btn-np-del':''}" data-k="${k}">${k==='⌫'?'⌫':k==='✓'?'حفظ':aN(k)}</button>
        `).join('')}
      </div>
      <button class="btn-bulk-cancel" id="bulk-cancel-btn">إلغاء</button>
    </div>`;

  let typed = '';

  const display = $('bulk-num-display');

  el.querySelectorAll('.btn-bulk-quick').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt($('bulk-dhikr-sel').value, 10);
      const v   = parseInt(btn.dataset.v, 10);
      bulkAdd(idx, v);
      vib(30);
      toast(`✅ تم إضافة ${aN(v)} لـ ${DHIKR[idx].n}`);
      closeOverlay('bulk-add-ov');
    });
  });

  el.querySelectorAll('.btn-np').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.k;
      if (k === '⌫') {
        typed = typed.slice(0, -1);
      } else if (k === '✓') {
        const v = parseInt(typed, 10);
        if (v > 0) {
          const idx = parseInt($('bulk-dhikr-sel').value, 10);
          bulkAdd(idx, v);
          vib(30);
          toast(`✅ تم إضافة ${aN(v)} لـ ${DHIKR[idx].n}`);
          closeOverlay('bulk-add-ov');
        } else toast('أدخل رقماً صحيحاً');
        return;
      } else {
        if (typed.length >= 5) return;
        typed += k;
      }
      if (display) display.textContent = typed ? aN(parseInt(typed,10)) : aN(0);
    });
  });

  $('bulk-cancel-btn')?.addEventListener('click', () => closeOverlay('bulk-add-ov'));

  openOverlay('bulk-add-ov');
}
