/*
 * Navigation, lemma flow and saved progress.
 * Screens: 0 opening, 1..5 lemmas, 6 finale, 7 "Proof, in full".
 */
(function () {
  'use strict';

  var C = window.CONTENT;
  var PUZZLES = window.PUZZLES;
  var U = window.PROOF_UTILS;
  var fill = U.fill;
  var TOTAL = C.lemmas.length;
  var FINALE = TOTAL + 1;
  var FULL = TOTAL + 2;
  var STORAGE_KEY = 'a-proof-i-owe-you:v1';
  var BEAR_SWAP_MS = 3000; // how long the hint / wrong-answer bear stays
  var BEAR_FADE_MS = 160;

  var sticker = U.sticker;
  var BEARS = C.bears || {};
  function bearPath(value) { return typeof value === 'string' ? value.trim() : ''; }
  function bear(key) { return bearPath(BEARS[key]); }
  var EXTRAS = (Array.isArray(BEARS.extras) ? BEARS.extras : []).map(bearPath).filter(Boolean);

  // ---------------------------------------------------------------- state

  var state = { solved: C.lemmas.map(function () { return false; }), furthest: 0 };

  function loadState() {
    try {
      var data = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
      if (data && Array.isArray(data.solved)) {
        for (var i = 0; i < TOTAL; i++) state.solved[i] = data.solved[i] === true;
      }
      if (data && typeof data.furthest === 'number' && isFinite(data.furthest)) state.furthest = Math.floor(data.furthest);
    } catch (e) { /* no storage: start fresh */ }
    // Never further than the first unsolved lemma.
    var firstUnsolved = state.solved.indexOf(false);
    var allowed = firstUnsolved === -1 ? FINALE : firstUnsolved + 1;
    state.furthest = Math.max(0, Math.min(state.furthest, allowed));
  }

  function saveState() {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  function clearState() {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  }

  // ---------------------------------------------------------------- helpers

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var HEART_PATH = 'M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.6 4.5c2.1 0 3.6 1.2 5.4 3.3 1.8-2.1 3.3-3.3 5.4-3.3 3.6 0 5.7 3.8 4.2 7.2C19.5 16.4 12 21 12 21z';

  // A small decorative heart (inline SVG), coloured by CSS.
  function heartIcon(className) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', className);
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', HEART_PATH);
    svg.appendChild(path);
    return svg;
  }

  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  // Plain text only (never HTML): blank lines become paragraphs, arrays become a list.
  function fillText(container, text) {
    container.textContent = '';
    if (Array.isArray(text)) {
      var ul = el('ul');
      text.forEach(function (item) { ul.appendChild(el('li', null, item)); });
      container.appendChild(ul);
      return container;
    }
    String(text).split(/\n\s*\n/).forEach(function (para) {
      container.appendChild(el('p', null, para));
    });
    return container;
  }

  function renderMath(node) {
    if (typeof renderMathInElement !== 'function') return;
    try {
      renderMathInElement(node, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false
      });
    } catch (e) { /* leave the plain text */ }
  }

  function warnPlaceholders() {
    var slots = [['opening line', C.opening.ownWords]];
    C.opening.letter.forEach(function (part) { slots.push(['letter (' + part.title + ')', part.text]); });
    C.lemmas.forEach(function (l, i) { slots.push(['note ' + (i + 1) + ' (' + l.noteTitle + ')', l.note]); });
    slots.push(['final message', C.finale.message]);
    slots.push(['signature', C.finale.signature]);
    var unfilled = slots.filter(function (s) { return JSON.stringify(s[1]).indexOf('[[') !== -1; })
      .map(function (s) { return s[0]; });
    if (unfilled.length) {
      console.warn('A Proof I Owe You: placeholders still to write in js/content.js: ' + unfilled.join(', '));
    }
  }

  // ---------------------------------------------------------------- screens

  var screens = [];
  var controllers = [];
  var lemmaBears = [];
  var current = -1;

  function show(index) {
    var next = screens[index];
    if (!next) return;
    if (lemmaBears[current]) lemmaBears[current].leave();
    if (current !== -1 && screens[current]) {
      screens[current].hidden = true;
      screens[current].classList.remove('is-entering');
    }
    current = index;
    next.hidden = false;
    // The opening (the apology) never animates.
    if (index !== 0 && !reducedMotion()) {
      next.classList.remove('is-entering');
      void next.offsetWidth; // restart the fade
      next.classList.add('is-entering');
    }

    if (index <= FINALE && index > state.furthest) {
      state.furthest = index;
      saveState();
    }

    if (index >= 1 && index <= TOTAL) updateProgress(index);
    if (index === FULL) buildFullProof();

    window.scrollTo(0, 0);
    var heading = next.querySelector('h1, h2');
    if (heading) heading.focus({ preventScroll: true });

    var ctl = controllers[index];
    if (ctl && ctl.onShow) ctl.onShow();
  }

  // ---------------------------------------------------------------- opening

  // The apology parts, styled like the lemma notes. withBears: the opening's
  // second and third cards ("How it hurt you", "What I regret") get their stickers.
  var LETTER_BEARS = [null, 'letterHurt', 'letterRegret'];

  function appendLetter(container, withBears) {
    C.opening.letter.forEach(function (part, i) {
      var note = el('div', 'note');
      var img = withBears && LETTER_BEARS[i] ? sticker(bear(LETTER_BEARS[i]), 'note-bear') : null;
      if (img) {
        note.classList.add('has-bear');
        note.appendChild(img);
      }
      note.appendChild(el('h3', null, part.title));
      note.appendChild(fillText(el('div', 'note-body'), part.text));
      container.appendChild(note);
    });
  }

  function buildOpening() {
    var o = C.opening;
    document.getElementById('opening-eyebrow').textContent = o.eyebrow;
    document.getElementById('opening-heading').textContent = o.label;
    document.getElementById('opening-theorem').textContent = o.theorem;
    fillText(document.getElementById('opening-own'), o.ownWords);
    appendLetter(document.getElementById('opening-letter'), true);

    // The sorry bear sits beside the theorem (above it on a phone).
    var sorry = sticker(bear('openingSorry'), 'opening-bear', { eager: true });
    if (sorry) {
      var heading = document.getElementById('opening-heading');
      var row = el('div', 'bear-row');
      var text = el('div', 'bear-row-text');
      heading.parentNode.insertBefore(row, heading);
      text.appendChild(heading);
      text.appendChild(document.getElementById('opening-theorem'));
      row.appendChild(text);
      row.appendChild(sorry);
    }
    document.getElementById('opening-transition').textContent = o.transition;

    var begin = document.getElementById('begin-btn');
    var cont = document.getElementById('continue-btn');
    var pleading = sticker(bear('begin'), 'begin-bear', { eager: true });
    if (pleading) {
      begin.parentNode.classList.add('has-bear');
      begin.parentNode.appendChild(pleading);
    }
    var hasProgress = state.furthest > 0 || state.solved.indexOf(true) !== -1;
    begin.textContent = hasProgress ? o.restartButton : o.beginButton;
    begin.className = hasProgress ? 'btn' : 'btn btn-primary';
    begin.addEventListener('click', function () { show(1); });
    if (hasProgress) {
      cont.textContent = o.continueButton;
      cont.hidden = false;
      cont.addEventListener('click', function () { show(Math.max(1, state.furthest)); });
    }

    var section = document.getElementById('screen-opening');
    renderMath(section);
    return section;
  }

  // ---------------------------------------------------------------- lemmas

  var progressNodes = [];

  function updateProgress(index) {
    progressNodes.forEach(function (p) {
      p.dots.forEach(function (dot, i) {
        dot.classList.toggle('is-done', state.solved[i]);
        dot.classList.toggle('is-current', i === index - 1);
      });
    });
  }

  function buildLemma(lemma, i) {
    var n = i + 1;
    var ui = C.ui;
    var idBase = 'lemma-' + n;

    var section = el('section', 'screen lemma');
    section.id = 'screen-' + idBase;
    section.hidden = true;
    section.setAttribute('aria-labelledby', idBase + '-title');

    // Progress
    var progress = el('div', 'progress');
    progress.appendChild(el('p', null, fill(ui.progress, { n: n, total: TOTAL })));
    var dotsWrap = el('span', 'dots');
    dotsWrap.setAttribute('aria-hidden', 'true');
    var dots = C.lemmas.map(function () { return dotsWrap.appendChild(heartIcon('dot')); });
    progress.appendChild(dotsWrap);
    progressNodes.push({ dots: dots });
    // One extra sticker peeks from the corner, cycling through bears.extras.
    var peek = EXTRAS.length ? sticker(EXTRAS[i % EXTRAS.length], 'bear-peek') : null;
    if (peek) progress.appendChild(peek);

    // Heading and prompt
    var label = el('p', 'lemma-label', fill(ui.lemmaLabel, { n: n }));
    var title = el('h2', null, lemma.title);
    title.id = idBase + '-title';
    title.tabIndex = -1;
    var prompt = fillText(el('div', 'prompt'), lemma.prompt);
    var widgetEl = el('div', 'widget');

    // Answer form
    var form = el('form', 'answer-form');
    form.noValidate = true;
    form.setAttribute('autocomplete', 'off');
    var inputLabel = el('label', null, ui.answerLabel);
    inputLabel.htmlFor = idBase + '-answer';
    var row = el('div', 'answer-row');
    var input = el('input');
    input.type = 'text';
    input.id = idBase + '-answer';
    input.setAttribute('autocapitalize', 'off');
    input.setAttribute('autocorrect', 'off');
    input.setAttribute('spellcheck', 'false');
    input.setAttribute('enterkeyhint', 'done');
    var checkBtn = el('button', 'btn btn-primary', ui.check);
    checkBtn.type = 'submit';
    row.appendChild(input);
    row.appendChild(checkBtn);
    form.appendChild(inputLabel);
    form.appendChild(row);

    var feedback = el('p', 'feedback');
    feedback.setAttribute('aria-live', 'polite');

    // Hints
    var hints = el('div', 'hints');
    var hintList = el('ol', 'hint-list');
    hintList.setAttribute('aria-live', 'polite');
    var hintActions = el('div', 'hint-actions');
    var hintBtn = el('button', 'btn btn-quiet', ui.hintButton);
    hintBtn.type = 'button';
    // Hints are always on offer: she never has to get something wrong first.
    hintBtn.hidden = !lemma.hints.length;
    var showBtn = el('button', 'btn btn-quiet', ui.showMe);
    showBtn.type = 'button';
    showBtn.hidden = true;
    hintActions.appendChild(hintBtn);
    hintActions.appendChild(showBtn);
    hints.appendChild(hintList);
    hints.appendChild(hintActions);

    // Solved: reveal, note, next
    var solvedBox = el('div', 'solved');
    solvedBox.hidden = true;
    solvedBox.tabIndex = -1;
    var reveal = fillText(el('div', 'reveal'), lemma.reveal);
    var note = el('aside', 'note note-promise');
    note.setAttribute('aria-label', fill(ui.noteLabel, { n: n }));
    note.appendChild(el('h3', null, fill(ui.noteLabel, { n: n }) + ' · ' + lemma.noteTitle));
    note.appendChild(fillText(el('div', 'note-body'), lemma.note));
    var nextBtn = el('button', 'btn btn-primary', n === TOTAL ? ui.finish : ui.next);
    nextBtn.type = 'button';
    var nextRow = el('div', 'actions');
    nextRow.appendChild(nextBtn);
    solvedBox.appendChild(reveal);
    solvedBox.appendChild(note);
    solvedBox.appendChild(nextRow);

    // The lemma bear sits beside the feedback and hints, so she sees it react.
    var overrides = Array.isArray(BEARS.lemmaOverrides) ? BEARS.lemmaOverrides : [];
    var bearSrc = {
      thinking: bearPath(overrides[i]) || bear('thinking'),
      hint: bear('hint'),
      wrong: bear('wrong'),
      correct: bear('correct')
    };
    var bearCtl = makeLemmaBear(bearSrc);
    var reactRow = hints;
    if (bearCtl) {
      reactRow = el('div', 'bear-row bear-row-lemma');
      var reactText = el('div', 'bear-row-text');
      reactText.appendChild(feedback);
      reactText.appendChild(hints);
      reactRow.appendChild(reactText);
      reactRow.appendChild(bearCtl.img);
      lemmaBears[n] = bearCtl;
    }

    [progress, label, title, prompt, widgetEl, form].concat(bearCtl ? [reactRow] : [feedback, hints], [solvedBox]).forEach(function (node) {
      section.appendChild(node);
    });

    // Widget
    var widget = {};
    if (lemma.widget && PUZZLES[lemma.widget]) {
      widget = PUZZLES[lemma.widget](widgetEl, {
        lemma: lemma,
        ui: ui,
        bears: { me: bear('distanceMe'), you: bear('distanceYou') },
        setAnswer: function (value) { input.value = value; }
      }) || {};
    }

    // Flow
    var hintsShown = 0;
    var solved = false;

    function shake() {
      if (reducedMotion()) return;
      row.classList.remove('shake');
      void row.offsetWidth;
      row.classList.add('shake');
    }
    row.addEventListener('animationend', function () { row.classList.remove('shake'); });

    function markSolved(message, animate) {
      solved = true;
      input.value = lemma.displayAnswer;
      input.readOnly = true;
      checkBtn.disabled = true;
      hintBtn.hidden = true;
      showBtn.hidden = true;
      if (message) feedback.textContent = message;
      solvedBox.hidden = false;
      if (bearCtl) bearCtl.solve(animate);
      if (widget.onSolved) widget.onSolved();
      if (animate) {
        state.solved[i] = true;
        if (state.furthest < n) state.furthest = n;
        saveState();
        updateProgress(n);
        solvedBox.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
        solvedBox.focus({ preventScroll: true });
      }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (solved) return;
      if (!input.value.trim()) {
        feedback.textContent = ui.empty;
        return;
      }
      if (U.isCorrect(input.value, lemma.answers)) {
        markSolved(ui.correct, true);
      } else {
        feedback.textContent = ui.notQuite;
        shake();
        if (bearCtl) bearCtl.react('wrong');
      }
    });

    hintBtn.addEventListener('click', function () {
      if (hintsShown >= lemma.hints.length) return;
      var li = el('li');
      li.appendChild(el('span', 'hint-tag', fill(ui.hintLabel, { n: hintsShown + 1 })));
      li.appendChild(document.createTextNode(lemma.hints[hintsShown]));
      hintList.appendChild(li);
      renderMath(li);
      hintsShown++;
      if (bearCtl) bearCtl.react('hint');
      if (widget.onHint) widget.onHint(hintsShown);
      if (hintsShown >= lemma.hints.length) {
        hintBtn.hidden = true;
        showBtn.hidden = false;
        showBtn.focus();
      }
    });

    showBtn.addEventListener('click', function () { markSolved(ui.shown, true); });
    nextBtn.addEventListener('click', function () { show(n + 1); });

    renderMath(section);
    if (state.solved[i]) markSolved('', false);

    controllers[n] = widget;
    return section;
  }

  // The swapping bear on a lemma screen: thinking, a few seconds of hint or
  // wrong, back to thinking, and correct for good once solved. A state with no
  // file falls back to thinking; with no file at all the bear is hidden.
  function makeLemmaBear(src) {
    var first = src.thinking || src.hint || src.wrong || src.correct;
    if (!first) return null;
    var img = sticker(first, 'lemma-bear', { hideOnError: true });
    var shown = null;
    var solved = false;
    var backTimer = null;
    var fadeTimer = null;

    function setState(name, instant) {
      var path = src[name] || (name === 'thinking' ? '' : src.thinking);
      img.setAttribute('data-state', path === src[name] ? name : 'thinking');
      if (path === shown && !img.hidden) return;
      shown = path;
      clearTimeout(fadeTimer);
      if (!path) { img.hidden = true; return; }
      if (instant || img.hidden || reducedMotion()) {
        img.classList.remove('is-fading');
        img.hidden = false;
        img.src = path;
        return;
      }
      img.classList.add('is-fading');
      fadeTimer = setTimeout(function () {
        img.hidden = false;
        img.src = path;
        img.classList.remove('is-fading');
      }, BEAR_FADE_MS);
    }

    function clearBack() {
      clearTimeout(backTimer);
      backTimer = null;
    }

    img.hidden = true;
    setState('thinking', true);

    return {
      img: img,
      react: function (name) {
        if (solved) return;
        clearBack();
        setState(name);
        backTimer = setTimeout(function () { backTimer = null; setState('thinking'); }, BEAR_SWAP_MS);
      },
      solve: function (animate) {
        solved = true;
        clearBack();
        setState('correct', !animate);
      },
      leave: function () {
        clearBack();
        setState(solved ? 'correct' : 'thinking', true);
      }
    };
  }

  // ---------------------------------------------------------------- finale

  function buildFinale() {
    var f = C.finale;
    var section = document.getElementById('screen-finale');
    document.getElementById('finale-heading-text').textContent = f.heading;
    var canvas = document.getElementById('finale-canvas');
    canvas.setAttribute('aria-label', f.canvasLabel);
    fillText(document.getElementById('finale-formula'), f.formula);
    fillText(document.getElementById('finale-message'), f.message);
    document.getElementById('finale-closing').textContent = f.closing;
    document.getElementById('finale-signature').textContent = f.signature;

    // The hug fades in with the words; every extra sticker parades under the signature.
    var hug = sticker(bear('finaleHug'), 'finale-bear finale-text');
    if (hug) section.insertBefore(hug, document.getElementById('finale-message'));
    if (EXTRAS.length) {
      var parade = el('div', 'bear-parade finale-text');
      parade.setAttribute('aria-hidden', 'true');
      EXTRAS.forEach(function (path) { parade.appendChild(sticker(path, 'parade-bear')); });
      var signature = document.getElementById('finale-signature');
      signature.parentNode.insertBefore(parade, signature.nextSibling);
    }
    var readAgain = document.getElementById('read-again-btn');
    readAgain.textContent = f.readAgain;
    readAgain.addEventListener('click', function () { show(FULL); });
    renderMath(section);

    // Tiny hearts drifting up behind the finale (CSS animation; hidden under reduced motion).
    var drift = el('div', 'drift');
    drift.setAttribute('aria-hidden', 'true');
    for (var k = 0; k < 10; k++) {
      var h = heartIcon('drift-heart');
      var size = 10 + (k * 7) % 9;
      h.style.left = (5 + k * 9.5) + '%';
      h.style.width = size + 'px';
      h.style.height = size + 'px';
      h.style.animationDuration = (15 + (k * 3) % 11) + 's';
      h.style.animationDelay = (-((k * 5.3) % 20)) + 's';
      drift.appendChild(h);
    }
    section.insertBefore(drift, section.firstChild);

    // Curve, fill, one heartbeat, then the words. Under reduced motion the
    // curve completes at once and the text never waits.
    var heartStarted = false;
    var heart = PUZZLES.heart(canvas, function () {
      if (!section.classList.contains('is-drawing')) return;
      canvas.classList.add('is-beating');
      setTimeout(function () { section.classList.remove('is-drawing'); }, 1200);
    });
    controllers[FINALE] = {
      onShow: function () {
        if (!heartStarted) {
          heartStarted = true;
          if (!reducedMotion() && typeof requestAnimationFrame === 'function') section.classList.add('is-drawing');
        }
        heart.start();
      }
    };
    return section;
  }

  function buildFullProof() {
    var body = document.getElementById('full-body');
    body.textContent = '';
    body.appendChild(el('p', 'theorem-label', C.opening.label));
    body.appendChild(el('p', 'theorem', C.opening.theorem));
    body.appendChild(fillText(el('div', 'own-words'), C.opening.ownWords));
    appendLetter(body);
    body.appendChild(el('p', 'full-intro', C.fullProof.intro));
    C.lemmas.forEach(function (lemma, i) {
      if (!state.solved[i]) return;
      var note = el('div', 'note note-promise');
      note.appendChild(el('h3', null, fill(C.ui.lemmaLabel, { n: i + 1 }) + ' · ' + lemma.noteTitle));
      note.appendChild(fillText(el('div', 'note-body'), lemma.note));
      body.appendChild(note);
    });
    var together = sticker(bear('fullTogether'), 'full-bear');
    if (together) body.appendChild(together);
    body.appendChild(el('p', 'signature', C.finale.signature));
    renderMath(body);
  }

  function buildFull() {
    var section = document.getElementById('screen-full');
    document.getElementById('full-heading').textContent = C.fullProof.heading;
    var back = document.getElementById('back-to-end-btn');
    back.textContent = C.fullProof.back;
    back.addEventListener('click', function () { show(FINALE); });
    return section;
  }

  // ---------------------------------------------------------------- start

  function init() {
    var params = new URLSearchParams(window.location.search);
    if (params.has('reset')) {
      clearState();
      params.delete('reset');
      var query = params.toString();
      try {
        history.replaceState(null, '', window.location.pathname + (query ? '?' + query : '') + window.location.hash);
      } catch (e) { /* ignore */ }
    }
    loadState();

    screens[0] = buildOpening();
    var holder = document.getElementById('lemmas');
    C.lemmas.forEach(function (lemma, i) {
      var section = buildLemma(lemma, i);
      holder.appendChild(section);
      screens[i + 1] = section;
    });
    screens[FINALE] = buildFinale();
    screens[FULL] = buildFull();

    warnPlaceholders();
    // Always open on the theorem: it says sorry first, and offers "Continue" if there is progress.
    show(0);
  }

  init();
})();
