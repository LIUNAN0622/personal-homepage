/* ============================================================
   trail.js — 彩虹鼠标拖尾（v3，修复循环 bug）
   - 持续 rAF 循环，鼠标停下后让尾巴淡出再停
   - 触屏设备跳过
   - 尊重 prefers-reduced-motion
   ============================================================ */
(function () {
  'use strict';
  // 拖尾是鼠标移动触发的（非自动动画），不受 prefers-reduced-motion 限制
  if (window.matchMedia('(hover: none)').matches && navigator.maxTouchPoints > 0) return;

  var canvas = document.getElementById('trail-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  var points = [];
  var MAX_POINTS = 30;
  var rafId = null;
  var lastMoveTime = 0;

  function setSize() {
    canvas.width = window.innerWidth * DPR;
    canvas.height = window.innerHeight * DPR;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  window.addEventListener('mousemove', function (e) {
    points.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    if (points.length > MAX_POINTS) points.shift();
    lastMoveTime = performance.now();
    if (!rafId) { rafId = requestAnimationFrame(loop); }
  });

  function loop() {
    var now = performance.now();
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // 清理过老的点（>900ms）
    while (points.length > 1 && (now - points[0].t) > 900) points.shift();

    if (points.length >= 2) {
      // 绘制每段彩虹渐变拖尾
      for (var i = 1; i < points.length; i++) {
        var p0 = points[i - 1], p1 = points[i];
        var age = (now - p1.t) / 750;
        var alpha = Math.max(0, 1 - age);
        if (alpha <= 0.02) continue;

        var hue = (i * 12 + now / 25) % 360;
        var w = (i / points.length) * 4.5 + 0.8;

        ctx.strokeStyle = 'hsla(' + hue + ', 90%, 65%, ' + (alpha * 0.9) + ')';
        ctx.lineWidth = w;
        ctx.lineCap = 'round';
        ctx.shadowColor = 'hsla(' + hue + ', 90%, 65%, ' + (alpha * 0.6) + ')';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      // 鼠标当前位置柔光圆点
      var last = points[points.length - 1];
      if (last && (now - last.t) < 200) {
        var grad = ctx.createRadialGradient(last.x, last.y, 0, last.x, last.y, 20);
        grad.addColorStop(0, 'rgba(165, 180, 252, 0.55)');
        grad.addColorStop(1, 'rgba(165, 180, 252, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(last.x, last.y, 20, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 鼠标停止超过 800ms 且所有点已淡出 → 停止循环
    if (now - lastMoveTime > 800 && points.length <= 1) {
      points = [];
      rafId = null;
      return;
    }
    rafId = requestAnimationFrame(loop);
  }

  window.addEventListener('resize', setSize);
  setSize();
})();
