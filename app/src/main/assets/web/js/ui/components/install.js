/* تَسَابِيح ∞ v21 — PWA Install Component */
import { $ } from '../../core/utils.js';
import { LS } from '../../core/storage.js';

let _deferredPrompt = null;

export function initInstall() {
  // iOS Safari banner
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isInStandalone = window.navigator.standalone === true;

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    _deferredPrompt = e;
    if (!LS.get('wirdi_install_dismissed')) {
      setTimeout(() => _showBanner('android'), 30000);
    }
  });

  if (isIOS && !isInStandalone && !LS.get('wirdi_install_dismissed')) {
    setTimeout(() => _showBanner('ios'), 30000);
  }

  // SW update notification
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', e => {
      if (e.data?.type === 'SW_UPDATED') _showUpdateBanner();
    });
  }

  // زر التثبيت في المزيد
  const btn = $('btn-install');
  if (btn) btn.addEventListener('click', promptInstall);
}

function _showBanner(type) {
  const banner = $('install-banner');
  if (!banner) return;
  const msg = type === 'ios'
    ? '📲 ثبّت التطبيق: اضغط ‹مشاركة› ثم "إضافة للشاشة الرئيسية"'
    : '📲 ثبّت تَسَابِيح ∞ على هاتفك للوصول السريع';
  banner.querySelector('.install-msg').textContent = msg;
  banner.classList.add('on');
  banner.querySelector('.btn-install-now')?.addEventListener('click', promptInstall);
  banner.querySelector('.btn-install-dismiss')?.addEventListener('click', () => {
    banner.classList.remove('on');
    LS.set('wirdi_install_dismissed', true);
  });
}

function _showUpdateBanner() {
  const el = $('update-banner');
  if (el) {
    el.classList.add('on');
    el.querySelector('.btn-reload')?.addEventListener('click', () => window.location.reload());
  }
}

export async function promptInstall() {
  if (!_deferredPrompt) return;
  _deferredPrompt.prompt();
  const { outcome } = await _deferredPrompt.userChoice;
  if (outcome === 'accepted') LS.set('wirdi_install_dismissed', true);
  _deferredPrompt = null;
  $('install-banner')?.classList.remove('on');
}
