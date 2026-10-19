/* ============================================================
   main.js — 页面交互（v3 沉浸式）
   - 导航栏滚动玻璃化 + 平滑跳转 + 汉堡菜单
   - 滚动进度条
   - 滚动揭示
   - 打字机 slogan 轮播
   - 数字 count-up 动画
   - 卡片 3D 倾斜跟随鼠标
   - 离开首屏暂停粒子
   ============================================================ */
(function () {
  'use strict';

  /* ---------- DOM ---------- */
  var navbar    = document.getElementById('navbar');
  var navToggle = document.getElementById('nav-toggle');
  var navMenu   = document.getElementById('nav-menu');
  var navOverlay = document.getElementById('nav-overlay');
  var navLinks  = document.querySelectorAll('.nav-link');
  var navLogo   = document.querySelector('.nav-logo');
  var hero      = document.getElementById('home');
  var progress  = document.getElementById('scroll-progress');
  var backtop   = document.getElementById('backtop');

  /* ---------- 1. 滚动：导航栏 + 进度条 + 粒子启停 + 返回顶部 ---------- */
  function onScroll() {
    var sy = window.pageYOffset;
    navbar.classList.toggle('scrolled', sy > 60);

    // 滚动进度条
    var docH = document.documentElement.scrollHeight - window.innerHeight;
    if (docH > 0) progress.style.width = (sy / docH * 100) + '%';

    // 返回顶部按钮
    if (backtop) backtop.classList.toggle('show', sy > 600);

    // 离开首屏暂停粒子
    if (window.ParticleBg && hero) {
      var heroBottom = hero.offsetHeight - 80;
      if (sy > heroBottom) ParticleBg.stop();
      else ParticleBg.start();
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- 2. 锚点平滑跳转 ---------- */
  navLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = this.getAttribute('href');
      if (id && id.charAt(0) === '#') {
        var target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          var offset = navbar.offsetHeight + 8;
          var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top: top, behavior: 'smooth' });
          closeMenu();
        }
      }
    });
  });
  if (navLogo) navLogo.addEventListener('click', function (e) {
    e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); closeMenu();
  });

  /* ---------- 3. 汉堡菜单 ---------- */
  function openMenu() {
    navMenu.classList.add('open'); navOverlay.classList.add('show');
    navToggle.classList.add('active'); navToggle.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    navMenu.classList.remove('open'); navOverlay.classList.remove('show');
    navToggle.classList.remove('active'); navToggle.setAttribute('aria-expanded', 'false');
  }
  if (navToggle) navToggle.addEventListener('click', function () {
    navMenu.classList.contains('open') ? closeMenu() : openMenu();
  });
  if (navOverlay) navOverlay.addEventListener('click', closeMenu);

  /* ---------- 4. 滚动揭示 ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('active');
          // 触发该卡片内的 count-up
          var nums = en.target.querySelectorAll('[data-count]');
          nums.forEach(startCountUp);
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add('active');
      el.querySelectorAll('[data-count]').forEach(startCountUp);
    });
  }

  /* 滚动兑底：快速滑动跨过 IntersectionObserver 触发窗口时，直接激活已滚过的元素，避免数字停在 0 */
  var bailTimer = null;
  window.addEventListener('scroll', function () {
    if (bailTimer) return;
    bailTimer = setTimeout(function () {
      bailTimer = null;
      revealEls.forEach(function (el) {
        if (el.classList.contains('active')) return;
        if (el.getBoundingClientRect().bottom < window.innerHeight) {
          el.classList.add('active');
          el.querySelectorAll('[data-count]').forEach(startCountUp);
        }
      });
    }, 200);
  }, { passive: true });

  /* ---------- 5. 数字 count-up 动画 ---------- */
  function startCountUp(el) {
    if (el.dataset.counted === '1') return;
    el.dataset.counted = '1';
    var target = parseFloat(el.dataset.count);
    var prefix = el.dataset.prefix || '';
    var suffix = el.dataset.suffix || '';
    var decimals;
    if (el.dataset.decimals !== undefined) {
      decimals = parseInt(el.dataset.decimals, 10);          // 显式指定小数位
    } else {
      decimals = (target % 1 !== 0) ? 1 : 0;                 // 默认：小数1位、整数0位
    }
    var dur = 1400, start = 0, t0 = null;
    function tick(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);   // easeOutCubic
      var val = start + (target - start) * eased;
      el.textContent = prefix + val.toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + target.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(tick);
  }

  /* ---------- 6. 打字机 slogan 轮播 ---------- */
  var typedEl = document.getElementById('typed-text');
  if (typedEl) {
    var phrases = [
      '产品经理 / 项目管理 / 开发测试',
      '深圳大学计算机技术硕士',
      '扎实工程基础 + 团队管理经验',
      '中共党员 · 推免至深圳大学',
      '第一作者两篇学术论文 · 专业前 4.1%'
    ];
    var pi = 0, ci = 0, deleting = false;
    var printing = false;   // 打印中标志：打印时暂停打字机，保证标语定格
    function typeLoop() {
      if (printing) { setTimeout(typeLoop, 250); return; }   // 打印中：挂起等待
      var cur = phrases[pi];
      if (deleting) {
        ci--;
        typedEl.textContent = cur.substring(0, ci);
        if (ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; setTimeout(typeLoop, 400); return; }
        setTimeout(typeLoop, 35);
      } else {
        ci++;
        typedEl.textContent = cur.substring(0, ci);
        if (ci === cur.length) { deleting = true; setTimeout(typeLoop, 1800); return; }
        setTimeout(typeLoop, 80);
      }
    }
    typeLoop();
  }

  /* ---------- 7. 卡片 3D 倾斜跟随鼠标 ---------- */
  var tilts = document.querySelectorAll('.tilt');
  if (!window.matchMedia('(hover: none)').matches) {
    tilts.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var cx = (e.clientX - r.left) / r.width - 0.5;
        var cy = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(1000px) rotateY(' + (cx * 8) + 'deg) rotateX(' + (-cy * 8) + 'deg) translateY(-6px)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  /* ---------- 8. 证书轮播 ---------- */
  var certTrack = document.getElementById('cert-track');
  var certPrev = document.getElementById('cert-prev');
  var certNext = document.getElementById('cert-next');
  var certDots = document.getElementById('cert-dots');
  var certLightbox = document.getElementById('cert-lightbox');
  var certLightboxImg = document.getElementById('cert-lightbox-img');
  var certLightboxClose = document.getElementById('cert-lightbox-close');

  if (certTrack) {
    var slides = certTrack.querySelectorAll('.cert-slide');
    var certIndex = 0;
    var certAutoTimer = null;

    // 生成圆点
    slides.forEach(function (_, i) {
      var dot = document.createElement('span');
      dot.className = 'cert-dot' + (i === 0 ? ' active' : '');
      dot.addEventListener('click', function () { goToSlide(i); resetAuto(); });
      certDots.appendChild(dot);
    });

    function goToSlide(i) {
      certIndex = (i + slides.length) % slides.length;
      certTrack.style.transform = 'translateX(-' + (certIndex * 100) + '%)';
      certDots.querySelectorAll('.cert-dot').forEach(function (d, di) {
        d.classList.toggle('active', di === certIndex);
      });
    }
    function nextSlide() { goToSlide(certIndex + 1); }
    function prevSlide() { goToSlide(certIndex - 1); }
    function startAuto() { stopAuto(); certAutoTimer = setInterval(nextSlide, 4000); }
    function stopAuto() { if (certAutoTimer) { clearInterval(certAutoTimer); certAutoTimer = null; } }
    function resetAuto() { stopAuto(); startAuto(); }

    if (certPrev) certPrev.addEventListener('click', function () { prevSlide(); resetAuto(); });
    if (certNext) certNext.addEventListener('click', function () { nextSlide(); resetAuto(); });

    // 点击图片放大
    slides.forEach(function (slide) {
      var img = slide.querySelector('img');
      if (img) img.addEventListener('click', function () {
        certLightboxImg.src = img.src;
        certLightbox.classList.add('show');
        stopAuto();
      });
    });
    if (certLightboxClose) certLightboxClose.addEventListener('click', function () {
      certLightbox.classList.remove('show');
      startAuto();
    });
    if (certLightbox) certLightbox.addEventListener('click', function (e) {
      if (e.target === certLightbox) { certLightbox.classList.remove('show'); startAuto(); }
    });

    // 自动播放（进入视口时启动）
    if ('IntersectionObserver' in window) {
      var certIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) startAuto();
          else stopAuto();
        });
      }, { threshold: 0.3 });
      certIO.observe(document.getElementById('cert-carousel'));
    } else {
      startAuto();
    }
  }

  /* ---------- 9. 导航 scrollspy（滚动高亮当前区块） ---------- */
  var sections = document.querySelectorAll('section[id], header[id]');
  if ('IntersectionObserver' in window && sections.length) {
    var spyIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var id = en.target.id;
          navLinks.forEach(function (link) {
            link.classList.toggle('active', link.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    sections.forEach(function (s) { spyIO.observe(s); });
  }

  /* ---------- 10. 返回顶部（显隐逻辑见 onScroll） ---------- */
  if (backtop) {
    backtop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- 11. 深/浅色主题切换（localStorage 记忆） ---------- */
  var themeBtn = document.getElementById('theme-toggle');
  var htmlEl = document.documentElement;
  function setTheme(t, save) {
    htmlEl.setAttribute('data-theme', t);
    if (themeBtn) themeBtn.textContent = (t === 'light') ? '🌙' : '☀';
    if (save) { try { localStorage.setItem('liunan-theme', t); } catch (e) {} }
  }
  // 初始：读本地记忆，默认深色
  var savedTheme = 'dark';
  try { savedTheme = localStorage.getItem('liunan-theme') || 'dark'; } catch (e) {}
  setTheme(savedTheme, false);
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      setTheme(htmlEl.getAttribute('data-theme') === 'light' ? 'dark' : 'light', true);
    });
  }

  /* ---------- 11.5 打印适配：打印前切浅色主题（白底深字）+ 定格标语，打印后恢复 ---------- */
  window.addEventListener('beforeprint', function () {
    setTheme('light', false);   // 不写入 localStorage，不影响用户主题记忆
    printing = true;             // 暂停打字机
    if (typedEl && phrases) {
      pi = 0; ci = phrases[0].length; deleting = true;   // 状态定格到第一条句尾，恢复后自然衍接轮播
      typedEl.textContent = phrases[0];
    }
  });
  window.addEventListener('afterprint', function () {
    printing = false;   // 打字机自动从第一条句尾继续轮播
    var t = 'dark';
    try { t = localStorage.getItem('liunan-theme') || 'dark'; } catch (e) {}
    setTheme(t, false);
  });

  /* ---------- 12. 项目卡展开/收起 ---------- */
  document.querySelectorAll('.project-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var card = btn.closest('.project-card');
      var expanded = card.classList.toggle('expanded');
      btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      btn.querySelector('.pt-text').textContent = expanded ? '收起' : '查看成果';
    });
  });

  onScroll();
})();
