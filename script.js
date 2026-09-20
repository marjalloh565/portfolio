/* ===========================================================
   Mariam Jalloh — portfolio
   Vanilla JS. Every block is defensive: if the markup it drives
   isn't on the page, it quietly does nothing.
   =========================================================== */

(function () {
  'use strict';

  /* --- Austin local clock in the footer -------------------------------- */
  function initClock() {
    var out = document.querySelector('[data-clock]');
    if (!out) return;
    var sun = document.querySelector('[data-clock-sun]');
    var moon = document.querySelector('[data-clock-moon]');

    function tick() {
      var now = new Date();
      out.textContent = now.toLocaleTimeString('en-US', {
        timeZone: 'America/Chicago',
        hour: 'numeric', minute: '2-digit', second: '2-digit'
      });
      var h = parseInt(now.toLocaleTimeString('en-US', {
        timeZone: 'America/Chicago', hour: 'numeric', hour12: false
      }), 10);
      var isDay = h >= 7 && h < 19;
      if (sun) sun.hidden = !isDay;
      if (moon) moon.hidden = isDay;
    }
    tick();
    setInterval(tick, 1000);
  }

  /* --- resume accordion ------------------------------------------------ */
  function initAccordion() {
    var triggers = document.querySelectorAll('.acc-trigger');
    Array.prototype.forEach.call(triggers, function (btn) {
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
    });
  }

  /* --- generic tab groups ---------------------------------------------- *
     <div data-tabs>
       <button role="tab" aria-controls="panel-id">…</button>
       …
     </div>
     Panels live anywhere on the page, keyed by id.
   * --------------------------------------------------------------------- */
  function initTabs() {
    var groups = document.querySelectorAll('[data-tabs]');
    Array.prototype.forEach.call(groups, function (group) {
      var tabs = group.querySelectorAll('[role="tab"]');

      function select(tab) {
        Array.prototype.forEach.call(tabs, function (t) {
          var on = t === tab;
          t.setAttribute('aria-selected', on ? 'true' : 'false');
          t.setAttribute('tabindex', on ? '0' : '-1');
          var panel = document.getElementById(t.getAttribute('aria-controls'));
          if (panel) panel.hidden = !on;
        });
      }

      Array.prototype.forEach.call(tabs, function (tab, i) {
        tab.addEventListener('click', function () { select(tab); });
        tab.addEventListener('keydown', function (e) {
          var next = null;
          if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
          if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
          if (next) { e.preventDefault(); next.focus(); select(next); }
        });
      });
    });
  }

  /* --- book carousel --------------------------------------------------- */
  function initShelf() {
    var shelf = document.querySelector('[data-shelf]');
    if (!shelf) return;
    var track = shelf.querySelector('.shelf__track');
    var prev = shelf.querySelector('[data-shelf-prev]');
    var next = shelf.querySelector('[data-shelf-next]');
    var books = track ? track.children.length : 0;
    if (!track || !books) return;

    var STEP = 122; // 110px cover + 12px gap
    var index = 0;

    function visibleCount() {
      var w = shelf.querySelector('.shelf__window');
      return Math.max(1, Math.floor((w ? w.clientWidth : 354) / STEP));
    }
    function render() {
      track.style.transform = 'translateX(-' + (index * STEP) + 'px)';
    }
    function maxIndex() { return Math.max(0, books - visibleCount()); }

    if (next) next.addEventListener('click', function () {
      index = index >= maxIndex() ? 0 : index + 1;
      render();
    });
    if (prev) prev.addEventListener('click', function () {
      index = index <= 0 ? maxIndex() : index - 1;
      render();
    });
    window.addEventListener('resize', function () {
      if (index > maxIndex()) { index = maxIndex(); render(); }
    });
    render();
  }

  /* --- ask-me-anything ------------------------------------------------- */
  function initAma() {
    var ama = document.querySelector('[data-ama]');
    if (!ama) return;
    var chips = ama.querySelectorAll('[data-ama-chip]');
    var qRow = ama.querySelector('[data-ama-q-row]');
    var qEl = ama.querySelector('[data-ama-q]');
    var aEl = ama.querySelector('[data-ama-a]');
    var dots = ama.querySelector('[data-ama-loading]');
    var counts = {};
    var timer = null;

    Array.prototype.forEach.call(chips, function (chip) {
      chip.addEventListener('click', function () {
        var key = chip.getAttribute('data-ama-chip');
        var answers = [];
        try { answers = JSON.parse(chip.getAttribute('data-ama-answers')) || []; } catch (e) { answers = []; }
        if (!answers.length) return;

        counts[key] = counts[key] || 0;
        var answer = answers[counts[key] % answers.length];
        counts[key] += 1;

        if (qEl) qEl.textContent = chip.textContent;
        if (qRow) qRow.hidden = false;
        if (aEl) aEl.hidden = true;
        if (dots) dots.hidden = false;

        clearTimeout(timer);
        timer = setTimeout(function () {
          if (dots) dots.hidden = true;
          if (aEl) { aEl.textContent = answer; aEl.hidden = false; }
        }, 700);
      });
    });
  }

  /* --- case-study table of contents scrollspy -------------------------- */
  function initToc() {
    var toc = document.querySelector('.cs-toc');
    if (!toc) return;
    var links = Array.prototype.slice.call(toc.querySelectorAll('a[href^="#"]'));
    var sections = links
      .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
      .filter(Boolean);
    if (!sections.length) return;

    function sync() {
      var mid = window.innerHeight / 2;
      var best = 0, bestDist = Infinity;
      sections.forEach(function (sec, i) {
        var r = sec.getBoundingClientRect();
        var dist = Math.abs((r.top + r.bottom) / 2 - mid);
        if (dist < bestDist) { bestDist = dist; best = i; }
      });
      links.forEach(function (a, i) { a.classList.toggle('is-active', i === best); });
    }

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { sync(); ticking = false; });
    }, { passive: true });
    sync();
  }

  /* --- count-up stats -------------------------------------------------- */
  function initCounters() {
    var nodes = document.querySelectorAll('[data-count-to]');
    if (!nodes.length) return;

    function run(el) {
      var target = parseInt(el.getAttribute('data-count-to'), 10) || 0;
      var suffix = el.getAttribute('data-count-suffix') || '';
      var start = Date.now(), dur = 2200;
      (function step() {
        var p = Math.min(1, (Date.now() - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) setTimeout(step, 30);
      })();
    }

    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(nodes, run);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    Array.prototype.forEach.call(nodes, function (n) { io.observe(n); });
  }

  /* --- boot ------------------------------------------------------------ */
  function boot() {
    initClock();
    initAccordion();
    initTabs();
    initShelf();
    initAma();
    initToc();
    initCounters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
