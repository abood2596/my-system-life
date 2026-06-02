/* تَسَابِيح ∞ v21 — Particles Component
   جزيئات خلفية — تُعطَّل على الأجهزة الضعيفة
   ─────────────────────────────────────────── */

const Particles = {
  _canvas: null, _ctx: null, _animId: null,
  _enabled: false, _particles: [],

  init() {
    const cpu = navigator.hardwareConcurrency || 2;
    const mem = navigator.deviceMemory || 2;
    this._enabled = cpu >= 4 && mem >= 2;
    if (!this._enabled) return;

    this._canvas = document.getElementById('pcv');
    if (!this._canvas) return;
    this._ctx = this._canvas.getContext('2d');
    this._resize();
    this._spawn();
    this._start();

    window.addEventListener('resize', () => this._resize());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this._stop();
      else this._start();
    });
  },

  _resize() {
    if (!this._canvas) return;
    this._canvas.width  = window.innerWidth;
    this._canvas.height = window.innerHeight;
  },

  _spawn() {
    const count = Math.min(20, Math.floor(window.innerWidth / 20));
    this._particles = Array.from({ length: count }, () => this._newP());
  },

  _newP() {
    return {
      x:    Math.random() * window.innerWidth,
      y:    Math.random() * window.innerHeight,
      r:    Math.random() * 1.5 + 0.5,
      vx:   (Math.random() - 0.5) * 0.15,
      vy:   -(Math.random() * 0.2 + 0.05),
      alpha:Math.random() * 0.4 + 0.1,
    };
  },

  _loop() {
    if (!this._ctx || !this._canvas) return;
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.y < -5 || p.x < -5 || p.x > this._canvas.width + 5) {
        Object.assign(p, this._newP());
        p.y = this._canvas.height + 5;
      }
      this._ctx.beginPath();
      this._ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      this._ctx.fillStyle = `rgba(212,160,23,${p.alpha})`;
      this._ctx.fill();
    });
    this._animId = requestAnimationFrame(() => this._loop());
  },

  _start() {
    if (!this._enabled || this._animId) return;
    this._loop();
  },

  _stop() {
    if (this._animId) { cancelAnimationFrame(this._animId); this._animId = null; }
  },
};

export default Particles;
