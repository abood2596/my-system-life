/* تَسَابِيح ∞ v21 — Storage Layer
   LocalStorage (سريع، يومي) + IndexedDB (ثقيل: cache، trigger، backup)
   ──────────────────────────────────────────────────────────────────── */

// ══════════════════════════════════════════════════════
//  LOCAL STORAGE — بيانات سريعة يومية
// ══════════════════════════════════════════════════════
export const LS = {
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v != null ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('[LS] write failed:', key, e);
      return false;
    }
  },

  remove(key) {
    try { localStorage.removeItem(key); } catch {}
  },

  /** إرجاع كل مفاتيح LS بصيغة object */
  all() {
    const out = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        try { out[k] = JSON.parse(localStorage.getItem(k)); }
        catch { out[k] = localStorage.getItem(k); }
      }
    } catch {}
    return out;
  },

  /** مجموع تسبيحات يوم معين (offset = 0 → اليوم) */
  dayTotal(offset = 0) {
    const d = _dStr(offset);
    const v = this.get('wirdi_d_' + d, {});
    return Object.values(v).reduce((a, b) => a + (b || 0), 0);
  },

  /** مجموع كل التسبيحات في التاريخ (محسوب من المفاتيح المعروفة) */
  allTasbeehTotal() {
    let s = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('wirdi_d_')) {
          try {
            const obj = JSON.parse(localStorage.getItem(k) || '{}');
            s += Object.values(obj).reduce((a, b) => a + (Number(b) || 0), 0);
          } catch {}
        }
      }
    } catch {}
    return s;
  },

  /** تنظيف البيانات الأقدم من 365 يوماً */
  cleanup() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 365);
    const cutStr = cutoff.toISOString().slice(0, 10);
    const toDelete = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        const match = k.match(/wirdi_[a-z]+_(\d{4}-\d{2}-\d{2})/);
        if (match && match[1] < cutStr) toDelete.push(k);
      }
      toDelete.forEach(k => localStorage.removeItem(k));
    } catch {}
    return toDelete.length;
  },
};

function _dStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

// ══════════════════════════════════════════════════════
//  INDEX DB — بيانات ثقيلة (3 متاجر)
// ══════════════════════════════════════════════════════
const IDB_NAME    = 'tasabeeh_v21';
const IDB_VERSION = 3;

let _db = null;

/** تهيئة IDB — يُستدعى مرة واحدة عند بدء التطبيق */
export async function initIDB() {
  if (_db) return _db;
  return new Promise((resolve) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);

    req.onupgradeneeded = e => {
      const db = e.target.result;
      // ── Backups store ───────────────────────────────
      if (!db.objectStoreNames.contains('bk')) {
        db.createObjectStore('bk', { keyPath: 'id', autoIncrement: true });
      }
      // ── Prayer cache store ──────────────────────────
      if (!db.objectStoreNames.contains('pray_c')) {
        db.createObjectStore('pray_c', { keyPath: 'key' });
      }
      // ── Trigger journal store ───────────────────────
      if (!db.objectStoreNames.contains('triggers')) {
        const ts = db.createObjectStore('triggers', { keyPath: 'id', autoIncrement: true });
        ts.createIndex('by_date', 'date', { unique: false });
      }
    };

    req.onsuccess  = e => { _db = e.target.result; resolve(_db); };
    req.onerror    = () => { console.warn('[IDB] open failed'); resolve(null); };
    req.onblocked  = () => { console.warn('[IDB] blocked'); resolve(null); };
  });
}

function getDB() {
  if (_db) return Promise.resolve(_db);
  return initIDB();
}

// ── Backups ───────────────────────────────────────────────
export const Backup = {
  async save(data) {
    const db = await getDB(); if (!db) return false;
    return new Promise(res => {
      const tx = db.transaction('bk', 'readwrite');
      const st = tx.objectStore('bk');
      st.add({ ts: Date.now(), data });
      // الاحتفاظ بـ 5 نسخ فقط
      st.getAllKeys().onsuccess = e => {
        const keys = e.target.result;
        if (keys.length > 5) keys.slice(0, keys.length - 5).forEach(k => st.delete(k));
      };
      tx.oncomplete = () => res(true);
      tx.onerror    = () => res(false);
    });
  },

  async getAll() {
    const db = await getDB(); if (!db) return [];
    return new Promise(res => {
      const req = db.transaction('bk', 'readonly').objectStore('bk').getAll();
      req.onsuccess = e => res((e.target.result || []).reverse());
      req.onerror   = () => res([]);
    });
  },

  async deleteById(id) {
    const db = await getDB(); if (!db) return;
    return new Promise(res => {
      const tx = db.transaction('bk', 'readwrite');
      tx.objectStore('bk').delete(id);
      tx.oncomplete = () => res(true);
      tx.onerror    = () => res(false);
    });
  },
};

// ── Prayer Cache ──────────────────────────────────────────
export const PrayerCache = {
  /** key = 'YYYY-MM' */
  async get(key) {
    const db = await getDB(); if (!db) return null;
    return new Promise(res => {
      const req = db.transaction('pray_c', 'readonly').objectStore('pray_c').get(key);
      req.onsuccess = e => res(e.target.result || null);
      req.onerror   = () => res(null);
    });
  },

  async set(key, data) {
    const db = await getDB(); if (!db) return false;
    return new Promise(res => {
      const tx = db.transaction('pray_c', 'readwrite');
      tx.objectStore('pray_c').put({ key, data, cached_at: Date.now() });
      tx.oncomplete = () => res(true);
      tx.onerror    = () => res(false);
    });
  },

  async isStale(key, maxAgeMs = 3 * 24 * 60 * 60 * 1000) {
    const cached = await this.get(key);
    if (!cached) return true;
    return (Date.now() - cached.cached_at) > maxAgeMs;
  },
};

// ── Trigger Journal ───────────────────────────────────────
export const TriggerJournal = {
  /** أضف سجل إغراء جديد */
  async add(entry) {
    // entry = { date, time, trigger, intensity(1-5), howResisted, notes }
    const db = await getDB(); if (!db) return false;
    return new Promise(res => {
      const tx = db.transaction('triggers', 'readwrite');
      tx.objectStore('triggers').add({ ...entry, ts: Date.now() });
      tx.oncomplete = () => res(true);
      tx.onerror    = () => res(false);
    });
  },

  /** إرجاع آخر N سجل */
  async getLast(n = 10) {
    const db = await getDB(); if (!db) return [];
    return new Promise(res => {
      const req = db.transaction('triggers', 'readonly').objectStore('triggers').getAll();
      req.onsuccess = e => res((e.target.result || []).slice(-n).reverse());
      req.onerror   = () => res([]);
    });
  },

  /** الحصول على سجلات بتاريخ معين */
  async getByDate(dateStr) {
    const db = await getDB(); if (!db) return [];
    return new Promise(res => {
      const idx = db.transaction('triggers', 'readonly')
                    .objectStore('triggers')
                    .index('by_date');
      const req = idx.getAll(IDBKeyRange.only(dateStr));
      req.onsuccess = e => res(e.target.result || []);
      req.onerror   = () => res([]);
    });
  },
};
