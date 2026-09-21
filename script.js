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
  function initTabs(root) {
    root = root || document;
    var groups = root.querySelectorAll('[data-tabs]');
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

  /* --- case-study table of contents scrollspy -------------------------- *
     root: element to search for .cs-toc/sections in (default document).
     scrollEl: element whose scroll drives the sync (default window) — pass
     the modal body when the TOC is scrolling inside a nested container
     rather than the page itself.
   * --------------------------------------------------------------------- */
  function initToc(root, scrollEl) {
    root = root || document;
    scrollEl = scrollEl || window;
    var toc = root.querySelector('.cs-toc');
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

    var isNestedScroll = scrollEl !== window;
    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href').slice(1);
        var target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        if (isNestedScroll) {
          target.scrollIntoView({ block: 'start', behavior: 'smooth' });
        } else {
          history.pushState(null, '', '#' + id);
          target.scrollIntoView({ block: 'start', behavior: 'smooth' });
        }
      });
    });

    var ticking = false;
    scrollEl.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { sync(); ticking = false; });
    }, { passive: true });
    sync();
  }

  /* --- count-up stats -------------------------------------------------- */
  function initCounters(root) {
    root = root || document;
    var nodes = root.querySelectorAll('[data-count-to]');
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

  /* --- project case-study modal -----------------------------------------
     Case-study links (project cards, "Read the case study" links) open
     their target page's .cs content (toc + sections) in an in-page window
     instead of navigating away, matching the original design's modal.
     The standalone pages under projects/ still work as real, linkable
     pages on their own — this just intercepts clicks on them.
   * --------------------------------------------------------------------- */
  function initProjectModal() {
    if (!('fetch' in window) || !('DOMParser' in window)) return;

    var modal, windowEl, bodyEl, labelEl;
    var lastFocus = null;
    var openToken = 0;

    function build() {
      if (modal) return;
      modal = document.createElement('div');
      modal.className = 'proj-modal';
      modal.hidden = true;
      modal.innerHTML =
        '<div class="proj-modal__window" tabindex="-1" role="dialog" aria-modal="true">' +
          '<div class="proj-modal__header">' +
            '<button type="button" class="proj-modal__icon-btn" data-proj-close aria-label="Close">⌂</button>' +
            '<div class="proj-modal__label"></div>' +
            '<button type="button" class="proj-modal__icon-btn" data-proj-expand aria-label="Expand">⤢</button>' +
          '</div>' +
          '<div class="proj-modal__body"></div>' +
        '</div>';
      document.body.appendChild(modal);
      windowEl = modal.querySelector('.proj-modal__window');
      bodyEl = modal.querySelector('.proj-modal__body');
      labelEl = modal.querySelector('.proj-modal__label');

      modal.addEventListener('click', function (e) {
        if (e.target === modal) close();
      });
      modal.querySelector('[data-proj-close]').addEventListener('click', close);
      modal.querySelector('[data-proj-expand]').addEventListener('click', function () {
        windowEl.classList.toggle('is-expanded');
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal && !modal.hidden) close();
      });
    }

    function close() {
      if (!modal || modal.hidden) return;
      modal.hidden = true;
      document.documentElement.classList.remove('proj-modal-open');
      windowEl.classList.remove('is-expanded');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function open(url, triggerEl) {
      build();
      var token = ++openToken;
      lastFocus = triggerEl || null;
      modal.hidden = false;
      document.documentElement.classList.add('proj-modal-open');
      bodyEl.innerHTML = '<div class="proj-modal__loading">Loading…</div>';
      labelEl.textContent = '';
      windowEl.focus();

      fetch(url).then(function (res) {
        if (!res.ok) throw new Error('fetch failed: ' + res.status);
        return res.text();
      }).then(function (html) {
        if (token !== openToken) return; // a newer open() superseded this one
        html = html.replace(/\.\.\/assets\//g, 'assets/');
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var cs = doc.querySelector('.cs');
        if (!cs) throw new Error('no .cs content in ' + url);
        var title = doc.querySelector('.cs-title');
        labelEl.textContent = title ? 'case study · ' + title.textContent : '';
        bodyEl.innerHTML = '';
        bodyEl.appendChild(cs);
        bodyEl.scrollTop = 0;
        initToc(bodyEl, bodyEl);
        initTabs(bodyEl);
        initCounters(bodyEl);
      }).catch(function () {
        if (token !== openToken) return;
        bodyEl.innerHTML = '<div class="proj-modal__loading">Couldn’t load this case study. <a href="' + url + '">Open it directly →</a></div>';
      });
    }

    document.addEventListener('click', function (e) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href*="projects/"][href$=".html"]');
      if (!a || e.defaultPrevented) return;
      e.preventDefault();
      open(a.href, a);
    });
  }

  /* --- custom glass cursor ---------------------------------------------- */
  function initGlassCursor() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    var dot = document.createElement('div');
    dot.className = 'glass-cursor';
    document.body.appendChild(dot);

    var x = window.innerWidth / 2, y = window.innerHeight / 2;
    var cx = x, cy = y;
    var visible = false;

    document.addEventListener('mousemove', function (e) {
      x = e.clientX; y = e.clientY;
      if (!visible) { cx = x; cy = y; visible = true; dot.classList.add('is-visible'); }
    });
    document.addEventListener('mouseleave', function () { dot.classList.remove('is-visible'); });
    document.addEventListener('mousedown', function () { dot.classList.add('is-down'); });
    document.addEventListener('mouseup', function () { dot.classList.remove('is-down'); });

    (function tick() {
      cx += (x - cx) * 0.4;
      cy += (y - cy) * 0.4;
      dot.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%)';
      requestAnimationFrame(tick);
    })();
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
    initProjectModal();
    initGlassCursor();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
