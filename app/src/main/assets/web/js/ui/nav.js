/* تَسَابِيح ∞ v21 — Navigation & Overlay Manager
   State Machine للـ views والـ overlays — mutex صارم
   ────────────────────────────────────────────────── */

import { getState, setState } from '../core/store.js';
import { $ } from '../core/utils.js';

// أولويات الـ overlays (رقم أكبر = يغلق ما تحته)
const OVERLAY_PRIORITY = {
  'gmod':        1,
  'cmod':        1,
  'bqmod':       2,
  'bq-tmod':     2,
  'msb-ov':      2,
  'bulk-add-ov': 2,
  'focus-ov':    3,
  'sos-ov':      4,   // طارئ — لا شيء يغلقه غير زر الإغلاق
  'cel':         5,   // celebration — يُغلق تلقائياً
};

const VIEWS = ['v-home','v-pray','v-bq','v-recovery','v-stats','v-more'];

// ══════════════════════════════════════════════════
//  VIEW SWITCHING
// ══════════════════════════════════════════════════
export function goTo(viewId) {
  if (!VIEWS.includes(viewId)) return;

  // أغلق كل overlays غير الطارئة
  const st = getState();
  st.overlayStack
    .filter(id => (OVERLAY_PRIORITY[id] || 1) < 4)
    .forEach(id => closeOverlay(id));

  // إخفاء كل الشاشات
  VIEWS.forEach(v => {
    const el = $(v);
    if (el) el.classList.remove('active');
  });

  // إظهار الشاشة المطلوبة
  const target = $(viewId);
  if (target) target.classList.add('active');

  // تحديث الـ nav tabs
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.view === viewId);
  });

  setState({ activeView: viewId });
}

// ══════════════════════════════════════════════════
//  OVERLAY MANAGER — mutex صارم
// ══════════════════════════════════════════════════
export function openOverlay(id) {
  const priority = OVERLAY_PRIORITY[id] || 1;
  const st = getState();

  // أغلق أي overlay بنفس أو أقل أولوية (ليس الطارئ 'sos-ov')
  const toClose = st.overlayStack.filter(ov => {
    const p = OVERLAY_PRIORITY[ov] || 1;
    return p <= priority && ov !== 'sos-ov';
  });
  toClose.forEach(ov => _hideOverlay(ov));

  const newStack = st.overlayStack
    .filter(ov => !toClose.includes(ov))
    .concat(id);

  _showOverlay(id);
  setState({ activeOverlay: id, overlayStack: newStack });
}

export function closeOverlay(id) {
  _hideOverlay(id);
  const st = getState();
  const newStack = st.overlayStack.filter(x => x !== id);
  const top = newStack[newStack.length - 1] || null;
  setState({ activeOverlay: top, overlayStack: newStack });
}

export function closeAllOverlays() {
  const st = getState();
  st.overlayStack.forEach(id => _hideOverlay(id));
  setState({ activeOverlay: null, overlayStack: [] });
}

export function isOverlayOpen(id) {
  return getState().overlayStack.includes(id);
}

// ── مساعدات DOM ──────────────────────────────────────────
function _showOverlay(id) {
  const el = $(id);
  if (!el) return;
  el.classList.add('on');
  el.setAttribute('aria-hidden', 'false');
  // منع scroll في الخلفية
  document.body.style.overflow = 'hidden';
}

function _hideOverlay(id) {
  const el = $(id);
  if (!el) return;
  el.classList.remove('on');
  el.setAttribute('aria-hidden', 'true');
  // أعد scroll إذا لا overlays مفتوحة
  const st = getState();
  const remaining = st.overlayStack.filter(x => x !== id);
  if (remaining.length === 0) document.body.style.overflow = '';
}

// ══════════════════════════════════════════════════
//  GLOBAL BACK / ESCAPE HANDLER
// ══════════════════════════════════════════════════
export function initNavHandlers() {
  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const st = getState();
      const top = st.overlayStack[st.overlayStack.length - 1];
      if (top && top !== 'sos-ov') closeOverlay(top);
    }
  });

  // Click outside overlay content
  document.addEventListener('click', e => {
    const st = getState();
    if (!st.activeOverlay) return;
    if (st.activeOverlay === 'sos-ov') return;
    const el = $(st.activeOverlay);
    if (!el) return;
    // إذا النقر على الـ overlay نفسه (الخلفية المعتمة) وليس على المحتوى
    if (e.target === el) closeOverlay(st.activeOverlay);
  });

  // Bottom nav tabs
  document.querySelectorAll('.tab[data-view]').forEach(tab => {
    tab.addEventListener('click', () => goTo(tab.dataset.view));
  });
}
