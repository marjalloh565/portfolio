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

    function tick() {
      out.textContent = new Date().toLocaleTimeString('en-US', {
        timeZone: 'America/Chicago',
        hour: 'numeric', minute: '2-digit', second: '2-digit'
      });
    }
    tick();
    setInterval(tick, 1000);
  }

  /* --- footer weather icon -----------------------------------------------
     Current conditions for Austin, TX from Open-Meteo (no API key). Swaps
     a small icon next to the clock: sun/cloud/rain/snow by weathercode,
     falling back to a sun/moon icon by local time of day if the fetch
     fails (this also supersedes the old always-on sun/moon toggle).
   * ----------------------------------------------------------------------- */
  function initWeather() {
    var icons = {
      sun: document.querySelector('[data-clock-sun]'),
      moon: document.querySelector('[data-clock-moon]'),
      cloud: document.querySelector('[data-weather-cloud]'),
      rain: document.querySelector('[data-weather-rain]'),
      snow: document.querySelector('[data-weather-snow]')
    };
    if (!icons.sun && !icons.moon && !icons.cloud && !icons.rain && !icons.snow) return;

    function show(name) {
      Object.keys(icons).forEach(function (key) {
        var el = icons[key];
        if (!el) return;
        if (key === name) el.removeAttribute('hidden');
        else el.setAttribute('hidden', '');
      });
    }

    function isDaytimeAustin() {
      var h = parseInt(new Date().toLocaleTimeString('en-US', {
        timeZone: 'America/Chicago', hour: 'numeric', hour12: false
      }), 10);
      return h >= 7 && h < 19;
    }

    function fallback() {
      show(isDaytimeAustin() ? 'sun' : 'moon');
    }

    function categoryForCode(code) {
      if (code === 0 || code === 1) return 'sun';
      if (code === 2 || code === 3 || code === 45 || code === 48) return 'cloud';
      if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99)) return 'rain';
      if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
      return 'cloud';
    }

    fallback();

    function load() {
      fetch('https://api.open-meteo.com/v1/forecast?latitude=30.27&longitude=-97.74&current_weather=true')
        .then(function (res) {
          if (!res.ok) throw new Error('weather fetch failed');
          return res.json();
        })
        .then(function (data) {
          var code = data && data.current_weather && data.current_weather.weathercode;
          if (typeof code !== 'number') throw new Error('no weathercode');
          show(categoryForCode(code));
        })
        .catch(fallback);
    }
    load();
    setInterval(load, 15 * 60 * 1000);
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
          if (!panel) return;
          if (on) panel.removeAttribute('hidden');
          else panel.setAttribute('hidden', '');
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

    function maxOffset() {
      var w = shelf.querySelector('.shelf__window');
      var winWidth = w ? w.clientWidth : 354;
      return Math.max(0, track.scrollWidth - winWidth);
    }
    function maxIndex() { return Math.max(0, Math.round(maxOffset() / STEP)); }
    function render() {
      var offset = Math.min(index * STEP, maxOffset());
      track.style.transform = 'translateX(-' + offset + 'px)';
    }

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

    var hint = ama.querySelector('[data-ama-hint]');
    if (hint) {
      var activate = function () {
        hint.innerHTML = 'Want to have a real conversation? Email me at <a href="mailto:mariam.jalloh@utexas.edu">mariam.jalloh@utexas.edu</a>';
      };
      hint.addEventListener('click', activate);
      hint.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
      });
    }
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

  /* --- insight-card expand on tap (touch devices only — hover-capable
     devices use the pure-CSS :hover version instead) -------------------- */
  function initInsightCards() {
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var rows = document.querySelectorAll('.insight-row');
    Array.prototype.forEach.call(rows, function (row) {
      var cards = row.querySelectorAll('.insight');
      Array.prototype.forEach.call(cards, function (card) {
        card.addEventListener('click', function () {
          var wasExpanded = card.classList.contains('is-expanded');
          Array.prototype.forEach.call(cards, function (c) { c.classList.remove('is-expanded'); });
          row.classList.toggle('has-expanded', !wasExpanded);
          if (!wasExpanded) card.classList.add('is-expanded');
        });
      });
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

  /* --- dock nav: shrinks once you scroll past the hero on the home page,
     and stays shrunk on every other page ---------------------------------- */
  function initDock() {
    var dock = document.querySelector('.dock');
    if (!dock) return;
    var isHome = !!document.querySelector('.hero');
    if (!isHome) { dock.classList.add('is-compact'); return; }

    function sync() {
      dock.classList.toggle('is-compact', window.scrollY > 40);
    }
    window.addEventListener('scroll', sync, { passive: true });
    sync();
  }

  /* --- boot ------------------------------------------------------------ */
  function boot() {
    initClock();
    initWeather();
    initAccordion();
    initTabs();
    initShelf();
    initAma();
    initToc();
    initCounters();
    initProjectModal();
    initGlassCursor();
    initInsightCards();
    initDock();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
