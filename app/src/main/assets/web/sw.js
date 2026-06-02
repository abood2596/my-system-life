/* إشراق — Service Worker
   الاستراتيجية: Network-First للـ HTML، Cache-First للباقي
   لا skipWaiting() — بدلاً منه: إشعار المستخدم بالتحديث
   ────────────────────────────────────────────────── */

const CACHE_V    = 'ishraq-v2-r1';
const FONT_CACHE = 'ishraq-fonts-v1';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon.svg',
  './fonts/cairo-arabic.woff2',
  './fonts/cairo-latin.woff2',
  './fonts/amiri-regular.woff2',
  './fonts/amiri-bold.woff2',
  './js/app.js',
  './js/core/constants.js',
  './js/core/utils.js',
  './js/core/storage.js',
  './js/core/store.js',
  './js/data/science.js',
  './js/engines/xp.js',
  './js/engines/tasbeeh.js',
  './js/engines/prayer.js',
  './js/engines/recovery.js',
  './js/engines/fitness.js',
  './js/engines/baqarah.js',
  './js/engines/adhkar.js',
  './js/ui/nav.js',
  './js/ui/components/particles.js',
  './js/ui/components/sound.js',
  './js/ui/components/clock.js',
  './js/ui/components/install.js',
  './js/ui/overlays/counter.js',
  './js/ui/overlays/misbaha.js',
  './js/ui/overlays/bulk-add.js',
  './js/ui/overlays/sos.js',
  './js/ui/overlays/focus.js',
  './js/ui/views/home.js',
  './js/ui/views/pray-view.js',
  './js/ui/views/bq-view.js',
  './js/ui/views/recovery-view.js',
  './js/ui/views/stats-view.js',
];

// ── INSTALL: cache بدون skipWaiting ──────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_V)
      .then(c => c.addAll(CORE_ASSETS))
      .catch(err => console.warn('[SW] Cache addAll partial fail:', err))
  );
  // لا self.skipWaiting() هنا — ينتظر إغلاق كل تبويب
});

// ── ACTIVATE: تنظيف القديم + claim ───────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_V && k !== FONT_CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
      .then(() => {
        // أخبر كل الصفحات المفتوحة أن هناك تحديثاً
        return self.clients.matchAll({ type: 'window' })
          .then(clients => clients.forEach(c => c.postMessage({ type: 'SW_UPDATED', version: CACHE_V })));
      })
  );
});

// ── FETCH: استراتيجيات ذكية حسب نوع الطلب ───────────────
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // ── Google Fonts → Cache First
  if (url.hostname.includes('googleapis') || url.hostname.includes('gstatic')) {
    e.respondWith(fontStrategy(e.request));
    return;
  }

  // ── AlAdhan API → Network Only (IDB تتولى التخزين في app layer)
  if (url.hostname.includes('aladhan')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // ── index.html → Network First + Fallback
  if (url.pathname === '/' || url.pathname.endsWith('index.html')) {
    e.respondWith(networkFirstStrategy(e.request));
    return;
  }

  // ── JS modules + icons → Cache First + Background Revalidate
  e.respondWith(cacheFirstStrategy(e.request));
});

async function fontStrategy(req) {
  const cache = await caches.open(FONT_CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return new Response('', { status: 503 });
  }
}

async function networkFirstStrategy(req) {
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(CACHE_V);
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(req);
    return cached || caches.match('./index.html');
  }
}

async function cacheFirstStrategy(req) {
  const cached = await caches.match(req);
  if (cached) {
    // Background revalidate (stale-while-revalidate)
    fetch(req).then(res => {
      if (res.ok) caches.open(CACHE_V).then(c => c.put(req, res));
    }).catch(() => {});
    return cached;
  }
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(CACHE_V);
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    return new Response('', { status: 404 });
  }
}
