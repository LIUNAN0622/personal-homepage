/* ============================================================
   particles.js — 首屏深蓝动态粒子背景（深色玻璃风适配版）
   粒子使用更亮的蓝白色，在深蓝背景上更醒目
   ============================================================ */
(function () {
  'use strict';

  var canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var particles = [];
  var mouse = { x: -9999, y: -9999, active: false };
  var rafId = null;
  var running = false;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var CONFIG = {
    linkDistance: 140,
    mouseRadius: 170,
    speed: 0.45,
    colorParticle: 'rgba(190, 220, 255, 0.9)',
    colorLink: 'rgba(120, 170, 255, ',
    radiusMin: 1,
    radiusMax: 2.8
  };

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function setSize() {
    var w = canvas.offsetWidth || window.innerWidth;
    var h = canvas.offsetHeight || window.innerHeight;
    canvas.width = w * DPR;
    canvas.height = h * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function particleCount() {
    var w = window.innerWidth;
    if (w < 480) return 28;
    if (w < 768) return 44;
    if (w < 1200) return 70;
    return 95;
  }

  function createParticles() {
    var w = canvas.offsetWidth || window.innerWidth;
    var h = canvas.offsetHeight || window.innerHeight;
    var n = particleCount();
    particles = [];
    for (var i = 0; i < n; i++) {
      particles.push({
        x: rand(0, w), y: rand(0, h),
        vx: rand(-CONFIG.speed, CONFIG.speed),
        vy: rand(-CONFIG.speed, CONFIG.speed),
        r: rand(CONFIG.radiusMin, CONFIG.radiusMax)
      });
    }
  }

  function draw() {
    var w = canvas.offsetWidth || window.innerWidth;
    var h = canvas.offsetHeight || window.innerHeight;
    ctx.clearRect(0, 0, w, h);

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = CONFIG.colorParticle;
      ctx.shadowColor = 'rgba(120, 170, 255, 0.5)';
      ctx.shadowBlur = 6;
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    for (i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        var a = particles[i], b = particles[j];
        var dx = a.x - b.x, dy = a.y - b.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.linkDistance) {
          var alpha = (1 - dist / CONFIG.linkDistance) * 0.55;
          ctx.strokeStyle = CONFIG.colorLink + alpha + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    if (mouse.active) {
      for (i = 0; i < particles.length; i++) {
        var mp = particles[i];
        var mdx = mp.x - mouse.x, mdy = mp.y - mouse.y;
        var mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < CONFIG.mouseRadius) {
          var mAlpha = (1 - mdist / CONFIG.mouseRadius) * 0.75;
          ctx.strokeStyle = 'rgba(165, 200, 255, ' + mAlpha + ')';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(mp.x, mp.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
          mp.x -= mdx * 0.0015;
          mp.y -= mdy * 0.0015;
        }
      }
    }
  }

  function loop() { draw(); rafId = requestAnimationFrame(loop); }
  function start() { if (running || reduceMotion) return; running = true; rafId = requestAnimationFrame(loop); }
  function stop() { running = false; if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

  window.addEventListener('mousemove', function (e) {
    var rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  });
  window.addEventListener('mouseleave', function () { mouse.active = false; });
  window.addEventListener('touchmove', function (e) {
    if (e.touches[0]) {
      var rect = canvas.getBoundingClientRect();
      mouse.x = e.touches[0].clientX - rect.left;
      mouse.y = e.touches[0].clientY - rect.top;
      mouse.active = true;
    }
  }, { passive: true });
  window.addEventListener('touchend', function () { mouse.active = false; });

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { setSize(); createParticles(); }, 200);
  });

  setSize();
  createParticles();
  draw();
  window.ParticleBg = { start: start, stop: stop, reduceMotion: reduceMotion };
})();
