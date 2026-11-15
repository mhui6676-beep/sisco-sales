(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 移动端导航 ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("nav-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "收起导航菜单" : "展开导航菜单");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  /* ---------- 产品筛选 ---------- */
  var filterBar = document.querySelector(".filters");
  var grid = document.getElementById("productGrid");
  var empty = document.getElementById("gridEmpty");
  if (filterBar && grid && empty) {
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".p-card"));
    var buttons = Array.prototype.slice.call(filterBar.querySelectorAll(".filter-btn"));

    function applyFilter(cat) {
      var visible = 0;
      cards.forEach(function (card) {
        var match = cat === "all" || card.dataset.cat === cat;
        card.hidden = !match;
        if (match) visible++;
      });
      empty.hidden = visible !== 0;
      buttons.forEach(function (btn) {
        var on = btn.dataset.cat === cat;
        btn.classList.toggle("is-on", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }

    filterBar.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter-btn");
      if (btn) applyFilter(btn.dataset.cat);
    });

    var requested = new URLSearchParams(location.search).get("cat");
    if (requested) applyFilter(requested);
  }

  /* ---------- 详情页图廊 ---------- */
  var main = document.getElementById("galleryMain");
  var thumbs = document.getElementById("galleryThumbs");
  if (main && thumbs) {
    thumbs.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-src]");
      if (!btn) return;
      main.src = btn.dataset.src;
      Array.prototype.forEach.call(thumbs.querySelectorAll("button"), function (b) {
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
    });
  }

  /* ---------- 滚动进场 ---------- */
  var revealTargets = document.querySelectorAll(
    ".sec-head, .p-card, .ind-card, .stat, .honor-card, .culture-card, .about-facts, .factory-shots, .ccard, .quote-form, .timeline li"
  );
  if (revealTargets.length) {
    if (reduced || !("IntersectionObserver" in window)) {
      revealTargets.forEach(function (el) {
        el.classList.add("is-in");
      });
    } else {
      revealTargets.forEach(function (el, i) {
        el.classList.add("reveal");
        el.style.transitionDelay = Math.min(i % 6, 5) * 70 + "ms";
      });
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              io.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );
      revealTargets.forEach(function (el) {
        io.observe(el);
      });
    }
  }

  /* ---------- 数字滚动 ---------- */
  function animateNumber(el, from, to, decimals, duration, done) {
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      var v = from + (to - from) * eased;
      el.textContent = v.toFixed(decimals);
      if (p < 1) requestAnimationFrame(step);
      else if (done) done();
    }
    requestAnimationFrame(step);
  }

  function startCounters(root) {
    var nodes = (root || document).querySelectorAll(".count[data-to], .read b[data-count]");
    Array.prototype.forEach.call(nodes, function (el) {
      if (el.dataset.done === "1") return;
      el.dataset.done = "1";
      var to = parseFloat(el.dataset.to || el.dataset.count);
      var dec = parseInt(el.dataset.dec || "0", 10);
      if (reduced) {
        el.textContent = to.toFixed(dec);
        return;
      }
      animateNumber(el, 0, to, dec, 1400);
    });
  }

  /* ---------- 仪表盘 ---------- */
  var needle = document.getElementById("gaugeNeedle");
  function setNeedle(deg) {
    if (needle) needle.style.transform = "rotate(" + deg.toFixed(2) + "deg)";
  }
  function gaugeAngle(value, min, max) {
    var ratio = (value - min) / (max - min);
    return -135 + Math.max(0, Math.min(1, ratio)) * 270;
  }

  var trend = document.getElementById("trendCanvas");
  function drawTrend(t) {
    if (!trend) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var cssW = trend.clientWidth || 640;
    var cssH = trend.clientHeight || 78;
    if (trend.width !== Math.round(cssW * dpr) || trend.height !== Math.round(cssH * dpr)) {
      trend.width = Math.round(cssW * dpr);
      trend.height = Math.round(cssH * dpr);
    }
    var ctx = trend.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    // 底纹网格
    ctx.strokeStyle = "rgba(255,255,255,.06)";
    ctx.lineWidth = 1;
    for (var i = 1; i < 4; i++) {
      var y = (cssH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cssW, y);
      ctx.stroke();
    }

    // 两条曲线，末端跟着时间往前推
    function series(seed, color, amp, width) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineJoin = "round";
      for (var x = 0; x <= cssW; x += 4) {
        var p = x / cssW;
        var v =
          Math.sin(p * 7 + seed + t * 0.6) * 0.42 +
          Math.sin(p * 15 + seed * 2.2 + t * 0.35) * 0.2 +
          Math.sin(p * 3.1 - t * 0.25) * 0.38;
        var y = cssH / 2 - v * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    series(0.4, "rgba(46,155,255,.95)", cssH * 0.38, 2);
    series(2.1, "rgba(25,227,176,.75)", cssH * 0.27, 1.6);
  }

  function startDashboard() {
    startCounters(document);
    if (!needle) return;
    var base = 128.6;
    setNeedle(gaugeAngle(base, 0, 200));
    if (reduced) return;
    // 指针在目标值附近缓慢摆动，像真实仪表的余振
    var t0 = null;
    function tick(ts) {
      if (t0 === null) t0 = ts;
      var t = (ts - t0) / 1000;
      setNeedle(gaugeAngle(base + Math.sin(t * 0.9) * 7 + Math.sin(t * 2.3) * 2.5, 0, 200));
      drawTrend(t);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if (needle || trend) {
    if ("IntersectionObserver" in window) {
      // 仪表盘移到了首屏下方的演示区，观察点也跟着换
      var dash = document.querySelector(".live-panel");
      if (dash) {
        var dio = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (e) {
              if (e.isIntersecting) {
                startDashboard();
                dio.disconnect();
              }
            });
          },
          { threshold: 0.2 }
        );
        dio.observe(dash);
      } else {
        startDashboard();
      }
    } else {
      startDashboard();
    }
  } else {
    startCounters(document);
  }

  /* ---------- 首屏：滚动当镜头，鼠标当视线 ---------- */
  // 为什么自己写这一套而不是上 Three.js：这类效果靠的是分层位移和光，
  // 用 CSS 变量 + 一段 requestAnimationFrame 就能做出来，
  // 换来的是首屏几百毫秒就能看，不用等 3D 引擎和贴图下载。
  var hero = document.querySelector(".hero");
  if (hero) {
    var layers = [];
    Array.prototype.forEach.call(hero.querySelectorAll("[data-depth]"), function (el) {
      layers.push({ el: el, depth: parseFloat(el.dataset.depth) || 0 });
    });

    // 前景浮尘：让深色画面里有东西在缓慢飘，不至于死板
    var dustBox = hero.querySelector(".hero-dust");
    if (dustBox) {
      for (var d = 0; d < 46; d++) {
        var p = document.createElement("span");
        p.className = "dust";
        p.style.left = (Math.random() * 100).toFixed(2) + "%";
        p.style.top = (Math.random() * 100).toFixed(2) + "%";
        p.style.setProperty("--size", (1 + Math.random() * 2.4).toFixed(2) + "px");
        p.style.setProperty("--delay", (-Math.random() * 12).toFixed(2) + "s");
        p.style.setProperty("--dur", (9 + Math.random() * 12).toFixed(2) + "s");
        dustBox.appendChild(p);
      }
    }

    var tx = 0;
    var ty = 0;
    var mx = 0;
    var my = 0;
    var scrollP = 0;
    var lastP = -1;
    var running = false;
    var onScreen = true;

    // 动画循环只在"画面还在动"的时候跑，静止时立刻停下，
    // 否则页面会一直占着 CPU 跑空转帧，笔记本上会发烫。
    function kick() {
      if (running || !onScreen) return;
      running = true;
      requestAnimationFrame(tick);
    }

    function readScroll() {
      var h = hero.offsetHeight || 1;
      // 首屏滚过一半就完成"推进"，避免文字已经淡没了画面还在动
      scrollP = Math.max(0, Math.min(1, (window.pageYOffset || 0) / (h * 0.8)));
      kick();
    }

    function onMove(e) {
      var r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      // 跟随鼠标的柔光位置，让边缘光像是被观看的角度带出来的
      hero.style.setProperty("--mx", ((tx + 1) * 50).toFixed(1) + "%");
      hero.style.setProperty("--my", ((ty + 1) * 50).toFixed(1) + "%");
      kick();
    }

    function tick() {
      mx += (tx - mx) * 0.07;
      my += (ty - my) * 0.07;
      var moving = Math.abs(tx - mx) > 0.001 || Math.abs(ty - my) > 0.001;
      if (moving || scrollP !== lastP) {
        layers.forEach(function (l) {
          var dx = (-mx * l.depth * 54).toFixed(1) + "px";
          var dy = (-my * l.depth * 34 - scrollP * l.depth * 110).toFixed(1) + "px";
          l.el.style.setProperty("--px", dx);
          l.el.style.setProperty("--py", dy);
        });
        hero.style.setProperty("--sc", (1 + scrollP * 0.24).toFixed(3));
        hero.style.setProperty("--fade", (1 - scrollP * 0.62).toFixed(3));
        lastP = scrollP;
      }
      running = false;
      // 还有没收敛完的差值就继续跑，彻底静止后停掉
      if (moving) kick();
    }

    if (!reduced) {
      hero.addEventListener("pointermove", onMove);
      hero.addEventListener("pointerleave", function () {
        tx = 0;
        ty = 0;
        kick();
      });
      window.addEventListener("scroll", readScroll, { passive: true });
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(
          function (entries) {
            onScreen = entries[0].isIntersecting;
            if (onScreen) readScroll();
          },
          { threshold: 0 }
        ).observe(hero);
      }
      readScroll();
    }
  }

  /* 统计区进入视口时也播一次数字 */
  var statsSec = document.querySelector(".stats");
  if (statsSec && "IntersectionObserver" in window) {
    var sio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            startCounters(e.target);
            sio.unobserve(e.target);
          }
        });
      },
      { threshold: 0.25 }
    );
    sio.observe(statsSec);
  }

  /* ---------- 表单 ---------- */
  var form = document.getElementById("contactForm");
  if (form && window.FormValidator) {
    var V = window.FormValidator;

    // 从产品页跳转过来时预填意向产品，少打一遍字
    var wanted = new URLSearchParams(location.search).get("product");
    if (wanted) {
      var sel = form.querySelector("#product");
      if (sel) {
        var matched = Array.prototype.filter.call(sel.options, function (o) {
          return o.value === wanted;
        })[0];
        if (matched) sel.value = wanted;
      }
    }

    function showErrors(errors) {
      var field = form.querySelector('[data-for="product"]');
      if (field) field.textContent = "";
      Object.keys(errors).forEach(function (name) {
        var el = form.querySelector('[data-for="' + name + '"]');
        if (el) el.textContent = errors[name];
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = {};
      new FormData(form).forEach(function (v, k) {
        data[k] = v;
      });
      var res = V.validateAll(data);
      showErrors(res.errors);
      var tip = form.querySelector("#formTip");
      if (!res.valid) {
        tip.classList.remove("ok");
        tip.textContent = "还有必填项没填好，请检查标红的字段";
        var first = form.querySelector(".err:not(:empty)");
        if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      tip.classList.add("ok");
      tip.textContent = "已收到，我们会尽快与您联系";
      form.reset();
    });

    form.addEventListener("input", function (e) {
      var name = e.target.name;
      if (!name) return;
      var el = form.querySelector('[data-for="' + name + '"]');
      if (el && el.textContent) {
        var res = V.validateField(name, e.target.value);
        el.textContent = res.ok ? "" : res.message;
      }
    });
  }
})();
