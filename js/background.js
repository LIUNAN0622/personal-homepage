/* ============================================================
   background.js — 首屏时钟卡实时更新（时钟位于首屏右列顶部）
   ============================================================ */
(function () {
  'use strict';
  var timeEl = document.getElementById('clock-time');
  var dateEl = document.getElementById('clock-date');
  if (!timeEl || !dateEl) return;

  var weekMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function update() {
    var d = new Date();
    timeEl.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    dateEl.textContent = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + weekMap[d.getDay()];
  }
  update();
  setInterval(update, 1000);
})();
