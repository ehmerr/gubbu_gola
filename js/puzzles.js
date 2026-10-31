/*
 * Interactive widgets and the answer checker.
 * Nothing here touches the page until main.js calls it.
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------- answers

  var NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  var TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  // "  Box Four! " -> "4", "a Cardioid" -> "cardioid", "10 days" -> "10", "twenty-five primes" -> "25".
  function normaliseAnswer(raw) {
    var s = String(raw == null ? '' : raw).toLowerCase();
    s = s.replace(/[^a-z0-9]+/g, ' ').trim();
    s = s.replace(/^(?:a|an|the)\s+/, '').replace(/^(?:box|day)\s*/, '').replace(/\s*(?:days?|primes?)$/, '');
    var words = s.split(' ');
    var out = [];
    for (var k = 0; k < words.length; k++) {
      var tens = TENS.indexOf(words[k]);
      if (tens > 1) {
        var unit = NUMBER_WORDS.indexOf(words[k + 1]);
        if (unit >= 1 && unit <= 9) { out.push(String(tens * 10 + unit)); k++; }
        else out.push(String(tens * 10));
        continue;
      }
      var i = NUMBER_WORDS.indexOf(words[k]);
      out.push(i === -1 ? words[k] : String(i));
    }
    return out.join('');
  }

  function isCorrect(raw, accepted) {
    var given = normaliseAnswer(raw);
    if (!given) return false;
    return accepted.some(function (a) { return normaliseAnswer(a) === given; });
  }

  // ---------------------------------------------------------------- helpers

  function fill(template, values) {
    return String(template).replace(/\{(\w+)\}/g, function (m, key) {
      return key in values ? values[key] : m;
    });
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  // A decorative sticker <img>, or null when no file is set. A file that fails
  // to load removes itself (opts.hideOnError hides it instead), then opts.onFail runs.
  function sticker(src, className, opts) {
    src = typeof src === 'string' ? src.trim() : '';
    if (!src) return null;
    opts = opts || {};
    var img = el('img', 'bear' + (className ? ' ' + className : ''));
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.setAttribute('decoding', 'async');
    if (!opts.eager) img.setAttribute('loading', 'lazy');
    img.addEventListener('error', function () {
      if (opts.hideOnError) img.hidden = true;
      else if (img.parentNode) img.parentNode.removeChild(img);
      if (opts.onFail) opts.onFail();
    });
    img.src = src;
    return img;
  }

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  // ---------------------------------------------------------------- curves

  // Draws a parametric curve (x(t), y(t)), y up, slowly, fitted to the canvas.
  // opts.fill: once drawn, fade in a translucent fill. opts.onDone: called once it is all finished.
  function makeCurve(canvas, fn, t0, t1, opts) {
    var samples = opts.samples || 720;
    var points = [];
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (var i = 0; i <= samples; i++) {
      var p = fn(t0 + (t1 - t0) * i / samples);
      points.push(p);
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    }

    var FILL_MS = 700;
    var FILL_ALPHA = 0.2;
    var progress = 0;
    var fillAmount = 0;
    var done = false;
    var started = false;
    var startTime = 0;
    var raf = null;

    function draw() {
      var rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return; // hidden: draw again on show
      var dpr = window.devicePixelRatio || 1;
      var w = Math.round(rect.width * dpr);
      var h = Math.round(rect.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      var ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);

      var pad = opts.padding || 24;
      var scale = Math.min((rect.width - 2 * pad) / (maxX - minX), (rect.height - 2 * pad) / (maxY - minY));
      var cx = rect.width / 2, cy = rect.height / 2;
      var mx = (minX + maxX) / 2, my = (minY + maxY) / 2;
      function px(x) { return cx + (x - mx) * scale; }
      function py(y) { return cy - (y - my) * scale; }

      if (opts.axes) {
        ctx.strokeStyle = cssVar('--rule');
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, py(0)); ctx.lineTo(rect.width, py(0));
        ctx.moveTo(px(0), 0); ctx.lineTo(px(0), rect.height);
        ctx.stroke();
      }

      var last = Math.floor(progress * samples);
      ctx.strokeStyle = cssVar('--accent');
      ctx.lineWidth = opts.lineWidth || 2.25;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(px(points[0].x), py(points[0].y));
      for (var k = 1; k <= last; k++) ctx.lineTo(px(points[k].x), py(points[k].y));
      if (fillAmount > 0) {
        ctx.fillStyle = cssVar('--accent');
        ctx.globalAlpha = FILL_ALPHA * fillAmount;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.stroke();

      if (progress < 1) {
        // The pen tip, while drawing.
        ctx.fillStyle = cssVar('--accent');
        ctx.beginPath();
        ctx.arc(px(points[last].x), py(points[last].y), 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function complete() {
      progress = 1;
      if (opts.fill) fillAmount = 1;
      draw();
      if (!done) {
        done = true;
        if (opts.onDone) opts.onDone();
      }
    }

    function frame(ts) {
      if (!startTime) startTime = ts;
      var elapsed = ts - startTime;
      // Ease in and out so the pen slows at the ends.
      var lin = Math.min(1, elapsed / opts.duration);
      progress = lin < 0.5 ? 2 * lin * lin : 1 - Math.pow(-2 * lin + 2, 2) / 2;
      var total = opts.duration + (opts.fill ? FILL_MS : 0);
      if (elapsed >= total) { raf = null; complete(); return; }
      if (opts.fill && lin >= 1) fillAmount = Math.min(1, (elapsed - opts.duration) / FILL_MS);
      draw();
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (started) { draw(); return; }
      started = true;
      if (prefersReducedMotion() || typeof requestAnimationFrame !== 'function') {
        complete();
        return;
      }
      raf = requestAnimationFrame(frame);
    }

    window.addEventListener('resize', draw);
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) mq.addEventListener('change', draw);
    }

    return {
      start: start,
      finish: function () {
        if (raf) cancelAnimationFrame(raf);
        raf = null;
        started = true;
        complete();
      }
    };
  }

  // Lemma 2: r = a(1 - sin θ), y up, so the cusp points up like a heart.
  function cardioid(container, ctx) {
    var canvas = el('canvas', 'curve-canvas');
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', ctx.lemma.canvasLabel || '');
    container.appendChild(canvas);
    var curve = makeCurve(canvas, function (t) {
      var r = 1 - Math.sin(t);
      return { x: r * Math.cos(t), y: r * Math.sin(t) };
    }, Math.PI / 2, Math.PI / 2 + 2 * Math.PI, { duration: 3800, axes: true, padding: 28 });
    return { onShow: curve.start, onSolved: curve.finish };
  }

  // Finale: x = 16 sin³t, y = 13 cos t − 5 cos 2t − 2 cos 3t − cos 4t.
  function heart(canvas, onDone) {
    return makeCurve(canvas, function (t) {
      return {
        x: 16 * Math.pow(Math.sin(t), 3),
        y: 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
      };
    }, 0, 2 * Math.PI, { duration: 4500, padding: 20, lineWidth: 2.5, fill: true, onDone: onDone });
  }

  // ---------------------------------------------------------------- Lemma 3: sieve

  function isPrime(n) {
    if (n < 2) return false;
    for (var d = 2; d * d <= n; d++) if (n % d === 0) return false;
    return true;
  }

  function sieve(container, ctx) {
    var ui = ctx.ui;
    var crossed = [];
    var kept = [];
    var cells = [];

    var grid = el('div', 'sieve');
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-label', ui.sieveGrid);

    for (var n = 1; n <= 100; n++) {
      var cell = el('button', 'sieve-cell', String(n));
      cell.type = 'button';
      cell.setAttribute('data-n', String(n));
      cells[n] = cell;
      grid.appendChild(cell);
    }

    var meta = el('div', 'sieve-meta');
    var count = el('p', 'sieve-count');
    count.setAttribute('aria-live', 'polite');
    var helper = el('button', 'btn btn-quiet', ui.sieveForMe);
    helper.type = 'button';
    helper.hidden = true;
    meta.appendChild(count);
    meta.appendChild(helper);

    container.appendChild(grid);
    container.appendChild(meta);

    function updateCount() {
      var standing = 0;
      for (var i = 1; i <= 100; i++) if (!crossed[i]) standing++;
      count.textContent = fill(ui.sieveCount, { n: standing });
    }

    function cross(i, delay) {
      if (crossed[i]) return false;
      crossed[i] = true;
      cells[i].style.transitionDelay = delay ? delay + 'ms' : '';
      cells[i].classList.add('is-crossed');
      cells[i].setAttribute('aria-label', i + ', ' + ui.crossedOut);
      return true;
    }

    function keep(p) {
      kept[p] = true;
      cells[p].classList.add('is-kept');
      cells[p].setAttribute('aria-label', p + ', ' + ui.prime);
    }

    function tap(i) {
      if (crossed[i] || kept[i]) return;
      if (isPrime(i)) {
        keep(i);
        var step = 0;
        for (var m = 2 * i; m <= 100; m += i) {
          if (cross(m, step * 35)) step++;
        }
      } else {
        cross(i, 0);
      }
      updateCount();
    }

    function sieveAll() {
      var gap = prefersReducedMotion() ? 0 : 450;
      cross(1, 0);
      updateCount();
      [2, 3, 5, 7].forEach(function (p, k) {
        setTimeout(function () { tap(p); }, gap * k);
      });
      setTimeout(function () {
        for (var i = 11; i <= 100; i++) if (isPrime(i) && !kept[i]) keep(i);
      }, gap * 4);
    }

    grid.addEventListener('click', function (e) {
      var target = e.target.closest ? e.target.closest('.sieve-cell') : null;
      if (target) tap(Number(target.getAttribute('data-n')));
    });
    helper.addEventListener('click', function () {
      helper.hidden = true;
      sieveAll();
    });

    updateCount();

    return {
      onHint: function (shown) { if (shown >= 2) helper.hidden = false; },
      onSolved: function () { helper.hidden = true; sieveAll(); }
    };
  }

  // ---------------------------------------------------------------- Lemma 4: boxes

  function boxes(container, ctx) {
    var ui = ctx.ui;
    var wrap = el('div', 'boxes');
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', ui.boxesGroup);
    var cards = [];

    ctx.lemma.boxes.forEach(function (label, i) {
      var card = el('button', 'box-card');
      card.type = 'button';
      card.setAttribute('aria-pressed', 'false');
      card.appendChild(el('span', 'box-name', fill(ui.boxName, { n: i + 1 })));
      card.appendChild(el('span', 'box-text', '“' + label + '”'));
      card.addEventListener('click', function () {
        cards.forEach(function (c) { c.setAttribute('aria-pressed', String(c === card)); });
        ctx.setAnswer(String(i + 1));
      });
      cards.push(card);
      wrap.appendChild(card);
    });

    container.appendChild(wrap);

    return {
      onSolved: function () {
        var n = Number(normaliseAnswer(ctx.lemma.displayAnswer));
        if (cards[n - 1]) cards[n - 1].classList.add('is-heart');
      }
    };
  }

  // ---------------------------------------------------------------- Lemma 5: distance

  function distance(container, ctx) {
    var ui = ctx.ui;
    var START = ctx.lemma.startKm;
    var MAX_DAYS = 14;
    var CLOSE = 1 / 16; // from here on the two labels would collide, so they fade out
    var day = 0;

    var track = el('div', 'distance-track');
    track.setAttribute('aria-hidden', 'true');
    var gap = el('div', 'distance-gap');
    var me = el('div', 'distance-dot me');
    me.appendChild(el('span', null, ctx.lemma.meLabel));
    var you = el('div', 'distance-dot you');
    you.appendChild(el('span', null, ctx.lemma.youLabel));
    // Optional bear stills at either end; a failed one falls back to the dot.
    var bears = ctx.bears || {};
    [[me, bears.me], [you, bears.you]].forEach(function (pair) {
      var dot = pair[0];
      var img = sticker(pair[1], 'distance-bear', {
        onFail: function () {
          dot.classList.remove('has-bear');
          if (!track.querySelector('.distance-bear')) track.classList.remove('has-bears');
        }
      });
      if (!img) return;
      dot.classList.add('has-bear');
      dot.insertBefore(img, dot.firstChild);
      track.classList.add('has-bears');
    });
    // A small heart over the pair once they are within 1 km (the answer).
    var heartMark = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    heartMark.setAttribute('class', 'distance-heart');
    heartMark.setAttribute('viewBox', '-13 -13 26 22');
    heartMark.setAttribute('focusable', 'false');
    var heartPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    heartPath.setAttribute('d', 'M0 8C-3 5.5 -12 0 -12 -5.5C-12 -10.5 -5.5 -12.5 0 -6.5C5.5 -12.5 12 -10.5 12 -5.5C12 0 3 5.5 0 8Z');
    heartMark.appendChild(heartPath);
    track.appendChild(gap);
    track.appendChild(me);
    track.appendChild(you);
    track.appendChild(heartMark);

    var readout = el('p', 'distance-readout');
    readout.setAttribute('aria-live', 'polite');

    var actions = el('div', 'actions');
    var nextBtn = el('button', 'btn btn-quiet', ui.nextDay);
    nextBtn.type = 'button';
    var resetBtn = el('button', 'btn btn-quiet', ui.startOver);
    resetBtn.type = 'button';
    actions.appendChild(nextBtn);
    actions.appendChild(resetBtn);

    container.appendChild(track);
    container.appendChild(readout);
    container.appendChild(actions);

    function render() {
      var km = START / Math.pow(2, day);
      // CSS stops "me" just short of "you", so the two never sit exactly on top of each other.
      track.style.setProperty('--pos', (1 - km / START) * 100 + '%');
      track.classList.toggle('is-close', km / START <= CLOSE);
      track.classList.toggle('is-together', km < 1);
      // Whole kilometres without decimals ("1230"), otherwise two places ("0.60").
      var kmText = Number.isInteger(km) ? String(km) : km.toFixed(2);
      readout.textContent = fill(ui.distanceReadout, { day: day, km: kmText });
      nextBtn.disabled = day >= MAX_DAYS;
    }

    nextBtn.addEventListener('click', function () { if (day < MAX_DAYS) { day++; render(); } });
    resetBtn.addEventListener('click', function () { day = 0; render(); });
    render();
    return {};
  }

  window.PROOF_UTILS = { normaliseAnswer: normaliseAnswer, isCorrect: isCorrect, fill: fill, sticker: sticker };
  window.PUZZLES = { cardioid: cardioid, sieve: sieve, boxes: boxes, distance: distance, heart: heart };
})();
