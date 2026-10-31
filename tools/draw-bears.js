#!/usr/bin/env node
/*
 * Draws the site's bear-couple stickers as small SVG files in ../bears/.
 * These are original drawings (a generic chibi bear couple), built from shared
 * parts so both characters look the same in every sticker.
 *
 *   node tools/draw-bears.js
 *
 * Plain node, no dependencies. The site never loads this file.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'bears');

// ---------------------------------------------------------------- palette
const OL = '#4a2a1f'; // warm dark-brown outline
const COL = {
  he: { fur: '#c98a55', light: '#f1d5b2', ear: '#e9a487' },
  she: { fur: '#fff7ec', light: '#fff7ec', ear: '#f6bcc5' }
};
const BLUSH = '#f4909f';
const ROSE = '#d8456e';
const HEART = '#e8506f';
const GOLD = '#ffd25e';
const TEAR = '#9fd4f2';
const HALO = '#fff8f3'; // die-cut rim, so the dark outline still reads on the dark theme
const SW = 4; // outline width in viewBox units

const n = v => +(+v).toFixed(1);
const st = (w, fill) => `fill="${fill || 'none'}" stroke="${OL}" stroke-width="${n(w)}" stroke-linecap="round" stroke-linejoin="round"`;
const ell = (x, y, rx, ry, fill, w) => `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(ry)}" ${w ? st(w, fill) : `fill="${fill}"`}/>`;
const circ = (x, y, r, fill, w) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" ${w ? st(w, fill) : `fill="${fill}"`}/>`;
const line = (d, w, fill) => `<path d="${d}" ${st(w, fill)}/>`;
const g = (t, body, cls) => `<g${cls ? ` class="${cls}"` : ''}${t ? ` transform="${t}"` : ''}>${body}</g>`;
const anim = (cls, body) => `<g class="${cls}">${body}</g>`;

// ---------------------------------------------------------------- bear parts
// Every bear is drawn in its own local space: head centre at (0, 0), feet near y = 70.

function ears(c, w, who) {
  let s = '';
  for (const x of [-24, 24]) s += circ(x, -21, 11, c.fur, w) + circ(x * 0.97, -20.4, 5.6, c.ear);
  if (who === 'she') s += bow(w);
  return s;
}

// Her rose bow, on her left ear (the viewer's right).
function bow(w) {
  const lw = w * 0.75;
  return g('translate(27 -29) rotate(18)',
    line('M0 0L-10 -7Q-13.5 0 -10 7Z', lw, ROSE) + line('M0 0L10 -7Q13.5 0 10 7Z', lw, ROSE) + circ(0, 0, 3.6, ROSE, lw));
}

function face(kind, who, w, dx, dy, er) {
  dx = dx || 0; dy = dy || 0; er = er || 3.4;
  const c = COL[who];
  const L = dx - 12, R = dx + 12, fw = w * 0.72;
  const dot = (x, y, r) => circ(x, y, r || er, OL) + circ(x + (r || er) * 0.38, y - (r || er) * 0.42, (r || er) * 0.33, '#fff');
  const happy = x => line(`M${n(x - 4)} ${n(dy + 1.5)}q4 -5.5 8 0`, fw);
  const shut = x => line(`M${n(x - 4)} ${n(dy - 0.5)}q4 4.5 8 0`, fw);
  const brows = line(`M${n(L - 5)} ${n(dy - 7.5)}L${n(L + 3)} ${n(dy - 10)}M${n(R + 5)} ${n(dy - 7.5)}L${n(R - 3)} ${n(dy - 10)}`, fw);
  const m = {
    w: line(`M${n(dx - 5)} ${n(dy + 9.8)}q2.5 3.5 5 0q2.5 3.5 5 0`, fw),
    small: line(`M${n(dx - 3.5)} ${n(dy + 10.5)}q3.5 3 7 0`, fw),
    frown: line(`M${n(dx - 4)} ${n(dy + 13)}q4 -3.5 8 0`, fw),
    flat: line(`M${n(dx - 2.8)} ${n(dy + 11.5)}h5.6`, fw),
    open: line(`M${n(dx - 5.5)} ${n(dy + 9.5)}q5.5 9 11 0z`, fw, '#c94c66'),
    o: circ(dx, dy + 12, 2.5, OL),
    kiss: line(`M${n(dx + 0.5)} ${n(dy + 8.3)}q3.6 1.6 0 3.3q3.6 1.6 0 3.3`, fw)
  };
  const eyes = {
    dots: dot(L, dy) + dot(R, dy),
    happy: happy(L) + happy(R),
    shut: shut(L) + shut(R),
    up: dot(L - 1.5, dy - 2) + dot(R - 1.5, dy - 2),
    big: dot(L, dy, er * 1.2) + dot(R, dy, er * 1.2),
    wink: happy(L) + dot(R, dy)
  };
  const E = {
    happy: [eyes.dots, m.w], smile: [eyes.happy, m.w], cheer: [eyes.happy, m.open],
    sad: [eyes.dots + brows, m.frown], bow: [eyes.shut + brows, m.flat], down: [eyes.shut + brows, m.frown],
    content: [eyes.shut, m.w], sleep: [eyes.shut, m.small], hope: [eyes.big + brows, m.small],
    think: [eyes.up + line(`M${n(R - 4)} ${n(dy - 10)}q4 -3 8 0`, fw), m.flat],
    whisper: [eyes.dots, m.o], wow: [eyes.big, m.o], kiss: [eyes.wink, m.kiss], shy: [eyes.happy, m.small]
  }[kind];
  const blushR = kind === 'shy' ? 7.5 : 6;
  return (who === 'he' ? ell(dx, dy + 9, 11, 8, c.light) : '') +
    ell(L - 10, dy + 8, blushR, blushR * 0.6, BLUSH) + ell(R + 10, dy + 8, blushR, blushR * 0.6, BLUSH) +
    E[0] + ell(dx, dy + 5.5, 3.6, 2.6, OL) + E[1];
}

function bodyParts(kind, c, w, who) {
  const belly = (y, rx, ry) => who === 'he' ? ell(0, y, rx, ry, c.light) : '';
  if (kind === 'stand') return ell(0, 43, 25, 24, c.fur, w) + belly(47, 14, 12) + ell(-12, 64, 10, 7, c.fur, w) + ell(12, 64, 10, 7, c.fur, w);
  if (kind === 'walk') return ell(0, 43, 25, 24, c.fur, w) + belly(47, 14, 12) + ell(-12, 64, 10, 7, c.fur, w) +
    g('rotate(-18 14 60)', ell(14, 60, 10, 7, c.fur, w));
  if (kind === 'sit' || kind === 'knees') {
    let s = ell(0, 44, 29, 23, c.fur, w) + belly(46, 16, 13);
    if (kind === 'sit') for (const x of [-16, 16]) s += ell(x, 63, 10.5, 8, c.fur, w) + ell(x, 64, 5, 3.8, c.ear);
    else s += ell(-13, 65, 9, 6.5, c.fur, w) + ell(13, 65, 9, 6.5, c.fur, w) + circ(-11, 47, 12.5, c.fur, w) + circ(11, 47, 12.5, c.fur, w);
    return s;
  }
  if (kind === 'bust') return line('M-36 50C-36 32 -21 22 0 22C21 22 36 32 36 50Z', w, c.fur) + belly(42, 14, 9);
  return '';
}

// An outlined, round-ended limb along path d.
function limb(d, c, w, width, cls) {
  width = width || 12;
  const s = `<path d="${d}" fill="none" stroke="${OL}" stroke-width="${n(width + 2 * w)}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${c.fur}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
  return cls ? anim(cls, s) : s;
}

const tf = o => `translate(${n(o.x)} ${n(o.y)})${o.rot ? ` rotate(${o.rot})` : ''} scale(${o.s || 1})`;
const ctx = o => ({ c: COL[o.who], w: (o.sw || SW) / (o.s || 1), T: tf(o) });

// o: { who, x, y, s, rot, body, face, fx, fy, er, tilt, headDy,
//      armsBack: [d], armsFront: [d], back, mid (over the front arms), paws: [[x, y]] (over mid),
//      front, faceExtra, armCls }
function bear(o) {
  const { c, w, T } = ctx(o);
  const arms = (list, cls) => (list || []).map(d => limb(d, c, w, o.armW, cls)).join('');
  const head = g(`translate(0 ${o.headDy || 0})${o.tilt ? ` rotate(${o.tilt})` : ''}`,
    ears(c, w, o.who) + ell(0, 0, 35, 30, c.fur, w) + face(o.face || 'happy', o.who, w, o.fx, o.fy, o.er) + (o.faceExtra || ''));
  const paws = (o.paws || []).map(([x, y]) => circ(x, y, 6.5, c.fur, w)).join('');
  return g(T, (o.back || '') + arms(o.armsBack, o.armCls) + bodyParts(o.body || 'stand', c, w, o.who) + head +
    arms(o.armsFront, o.armCls) + (o.mid || '') + paws + (o.front || ''));
}

// Draws extra things in a bear's local space (for arms that reach across the other bear).
const inBear = (o, fn) => { const k = ctx(o); return g(k.T, fn(k)); };

// ---------------------------------------------------------------- props
const HEART_D = 'M0 8C-3 5.5 -12 0 -12 -5.5C-12 -10.5 -5.5 -12.5 0 -6.5C5.5 -12.5 12 -10.5 12 -5.5C12 0 3 5.5 0 8Z';
const heart = (x, y, s, w, opt) => {
  opt = opt || {};
  const inner = `<path d="${HEART_D}" ${st(w / s, opt.fill || HEART)}${opt.cls ? ` class="${opt.cls}"` : ''}/>` +
    (opt.shine === false ? '' : `<path d="M-7.5 -6.5q1.5 -2.5 4 -2" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="${n(2.2)}" stroke-linecap="round"/>`) + (opt.extra || '');
  return g(`translate(${n(x)} ${n(y)}) scale(${s})${opt.rot ? ` rotate(${opt.rot})` : ''}`, inner);
};
const crackedHeart = (x, y, s, w) => heart(x, y, s, w, { fill: '#e46a85', extra: line('M0 -6.5L-2.5 -2L1.5 1L-1 5', w / s) });
const tear = (x, y, s, w) => g(`translate(${n(x)} ${n(y)}) scale(${s})`, line('M0 -5Q4 1 2.6 3.4A3 3 0 0 1 -2.6 3.4Q-4 1 0 -5Z', w * 0.6 / s, TEAR));
const sparkle = (x, y, s, w, cls) => g(`translate(${n(x)} ${n(y)}) scale(${s})`,
  `<path d="M0 -7Q1.2 -1.2 7 0Q1.2 1.2 0 7Q-1.2 1.2 -7 0Q-1.2 -1.2 0 -7Z" ${st(w * 0.6 / s, GOLD)}${cls ? ` class="${cls}"` : ''}/>`);
const label = (x, y, size, text, fill, extra) =>
  `<text x="${n(x)}" y="${n(y)}" font-family="Georgia,'Times New Roman',serif" font-size="${size}" font-weight="700" text-anchor="middle" fill="${fill || OL}"${extra || ''}>${text}</text>`;

// ---------------------------------------------------------------- animations
// Slow and subtle; only for viewers who have not asked for reduced motion. Motion
// only, never opacity: a half-faded shape would turn its pale rim grey on the dark theme.
const ANIM = {
  bob: '.a-bob{animation:bob 4.5s ease-in-out infinite}@keyframes bob{50%{transform:translateY(-2px)}}',
  pulse: '.a-pulse{transform-box:fill-box;transform-origin:center;animation:pulse 2.8s ease-in-out infinite}@keyframes pulse{50%{transform:scale(1.1)}}',
  float: '.a-float{animation:float 6s ease-in-out infinite}@keyframes float{50%{transform:translateY(-6px)}}',
  twinkle: '.a-twinkle{transform-box:fill-box;transform-origin:center;animation:twinkle 3.2s ease-in-out infinite}@keyframes twinkle{50%{transform:scale(.65) rotate(20deg)}}',
  pat: '.a-pat{animation:pat 1.8s ease-in-out infinite}@keyframes pat{50%{transform:translateY(2.5px)}}',
  cheer: '.a-cheer{animation:cheer 1.6s ease-in-out infinite}@keyframes cheer{50%{transform:translateY(-3px)}}',
  glow: '.a-glow{transform-box:fill-box;transform-origin:center;animation:glow 3s ease-in-out infinite}@keyframes glow{50%{transform:scale(.85)}}',
  sway: '.a-sway{transform-box:fill-box;transform-origin:50% 100%;animation:sway 5s ease-in-out infinite}@keyframes sway{50%{transform:rotate(4deg)}}',
  zz: '.a-zz{animation:zz 4s ease-in-out infinite}@keyframes zz{50%{transform:translate(3px,-4px)}}'
};
const DELAYS = '.d1{animation-delay:-1.2s}.d2{animation-delay:-2.4s}.d3{animation-delay:-3.6s}';

// opts.fit: the drawing's rendered bounds [x0, y0, x1, y1] (rim included), measured
// from a render. The drawing is then moved so those bounds sit in the middle of the
// 200 x 200 box, shrunk only if it would come closer than FIT_MARGIN to an edge.
// Re-measure if you change a fitted sticker's geometry.
const FIT_MARGIN = 9;
function fitTransform(b) {
  const s = Math.min(1, (200 - 2 * FIT_MARGIN) / (b[2] - b[0]), (200 - 2 * FIT_MARGIN) / (b[3] - b[1]));
  return `translate(100 100) scale(${+s.toFixed(3)}) translate(${n(-(b[0] + b[2]) / 2)} ${n(-(b[1] + b[3]) / 2)})`;
}

function svg(body, opts) {
  opts = opts || {};
  const used = Object.keys(ANIM).filter(k => new RegExp(`\\ba-${k}\\b`).test(body));
  const style = used.length ? `<style>@media (prefers-reduced-motion:no-preference){${used.map(k => ANIM[k]).join('')}${DELAYS}}</style>` : '';
  const r = opts.halo || 3.5;
  if (opts.fit) body = g(fitTransform(opts.fit), body);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">${style}` +
    `<defs><filter id="cut" filterUnits="userSpaceOnUse" x="0" y="0" width="200" height="200"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/>` +
    `<feFlood flood-color="${HALO}"/><feComposite in2="d" operator="in" result="h"/><feMerge><feMergeNode in="h"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>` +
    `<g filter="url(#cut)">${body}</g></svg>\n`;
}

// ---------------------------------------------------------------- arm poses (local space)
const ARMS = {
  sideL: 'M-21 28Q-28 40 -26 50', sideR: 'M21 28Q28 40 26 50',
  upL: 'M-20 27Q-33 12 -37 -6', upR: 'M20 27Q33 12 37 -6',
  heartL: 'M-21 25C-48 4 -46 -46 -20 -51C-9 -53 -2 -46 0 -40', heartR: 'M21 25C48 4 46 -46 20 -51C9 -53 2 -46 0 -40',
  kneesL: 'M-22 30Q-30 50 -6 56', kneesR: 'M22 30Q30 50 6 56'
};

// ---------------------------------------------------------------- stickers
const HE = { who: 'he' }, SHE = { who: 'she' };
const B = (base, o) => Object.assign({}, base, o);
const S = {};

// Opening screen: still.
S.sorry = () => {
  const o = B(HE, { x: 100, y: 74, s: 1.4, face: 'bow', fy: 4, headDy: 5, armsFront: ['M-20 28Q-23 42 -12 45', 'M20 28Q23 42 12 45'], paws: [[-12, 45], [12, 45]] });
  const w = SW / o.s;
  o.faceExtra = tear(-18, 12, 0.9, w);
  o.mid = heart(0, 45, 0.95, w);
  return svg(bear(o), { fit: [46, 30.5, 153.5, 178.5] });
};

S.hurt = () => {
  const o = B(HE, { x: 100, y: 76, s: 1.35, body: 'sit', face: 'sad', fy: 2, tilt: -5, armsFront: ['M-22 29Q-26 44 -13 45', 'M22 29Q26 44 13 45'], paws: [[-13, 45], [13, 45]] });
  o.mid = crackedHeart(0, 43, 1.15, SW / o.s);
  return svg(bear(o));
};

S.regret = () => {
  const o = B(HE, { x: 100, y: 94, s: 1.2, body: 'knees', face: 'down', fy: 8, headDy: 7, armsFront: [ARMS.kneesL, ARMS.kneesR] });
  const cloud = line('M70 40C62 40 60 30 68 28C67 19 80 15 86 21C90 12 106 12 110 21C118 16 132 21 130 30C138 31 138 40 130 40Z', SW, '#cfc8d2');
  let drops = '';
  for (const [x, y] of [[80, 50], [96, 54], [112, 50], [124, 56]]) drops += g(`translate(${x} ${y}) scale(.75)`, line('M0 -5Q4 1 2.6 3.4A3 3 0 0 1 -2.6 3.4Q-4 1 0 -5Z', 3.5, TEAR));
  return svg(cloud + drops + bear(o));
};

S.begin = () => {
  const o = B(HE, { x: 100, y: 76, s: 1.35, face: 'hope', tilt: 6, armsFront: ['M-20 28Q-24 40 -15 40', 'M20 28Q24 40 15 40'], paws: [[-15, 40], [15, 40]] });
  o.mid = heart(0, 39, 1.35, SW / o.s);
  return svg(bear(o));
};

// Lemma screens.
S.thinking = () => {
  // One paw taps her chin; the other holds the pencil up beside her head.
  const o = B(SHE, { x: 96, y: 82, s: 1.25, body: 'sit', face: 'think', tilt: -5, armsFront: ['M21 28Q28 36 13 29', 'M-21 28Q-36 32 -39 18'], paws: [[-39, 18]] });
  const w = SW / o.s;
  o.mid = g('translate(-39 18) rotate(-12)', line('M-3.5 -32h7v26l-3.5 7l-3.5 -7z', w * 0.8, GOLD) + line('M-3.5 -32h7v-5h-7z', w * 0.8, '#f2a7b3') + `<path d="M-1.6 -3L0 1L1.6 -3Z" fill="${OL}"/>`);
  const bubble = circ(146, 58, 3, '#fff', 2.5) + circ(154, 46, 5, '#fff', 2.5) +
    line('M146 24C140 10 158 0 168 8C178 2 194 10 188 24C194 34 182 44 172 38C164 46 148 40 150 32C140 32 140 24 146 24Z', 3, '#fff') +
    label(167, 32, 22, '?');
  return svg(anim('a-bob', bubble) + bear(o), { fit: [28, 0, 194.5, 176] });
};

S.hint = () => {
  const o = B(HE, { x: 90, y: 82, s: 1.3, face: 'whisper', fx: 4, tilt: 4, armsBack: [ARMS.sideL], armsFront: ['M20 28Q36 26 30 12'] });
  const w = SW / o.s;
  o.front = line('M38 6q4 4 0 9M43 3q6 7 0 15', w * 0.7);
  const bulb = g('translate(160 46)',
    `<circle r="23" fill="#fff0c2" class="a-glow"/>` +
    line('M0 -15C-9 -15 -13 -8 -12 -2C-11 4 -6 6 -6 12H6C6 6 11 4 12 -2C13 -8 9 -15 0 -15Z', 3, GOLD) +
    line('M-5 12h10v6h-10z', 3, '#d9cfd4') + line('M-3 4l3 -5l3 5', 2.2) +
    line('M0 -21v-6M-15 -15l-4 -4M15 -15l4 -4M-20 -2h-6M20 -2h6', 3));
  return svg(bulb + bear(o), { fit: [39, 14, 190.5, 179.5] });
};

S.wrong = () => {
  const she = B(SHE, { x: 140, y: 100, s: 0.95, body: 'sit', face: 'smile', fx: -3, tilt: -6, armsBack: [ARMS.sideL, ARMS.sideR] });
  const he = B(HE, { x: 62, y: 84, s: 1.05, face: 'smile', fx: 4, tilt: 5, armsBack: [ARMS.sideL] });
  const pat = inBear(he, k => anim('a-pat', limb('M20 27C38 2 52 -20 66 -14', k.c, k.w)));
  return svg(bear(she) + bear(he) + pat + heart(102, 36, 0.6, SW, { cls: 'a-pulse' }));
};

S.correct = () => {
  const he = B(HE, { x: 62, y: 92, s: 1.0, face: 'cheer', armsBack: [ARMS.upL, ARMS.upR], armCls: 'a-cheer' });
  const she = B(SHE, { x: 140, y: 96, s: 0.95, face: 'cheer', armsBack: [ARMS.upL, ARMS.upR], armCls: 'a-cheer d1' });
  const sp = sparkle(100, 46, 1.1, SW, 'a-twinkle') + sparkle(22, 30, 0.8, SW, 'a-twinkle d1') + sparkle(180, 34, 0.9, SW, 'a-twinkle d2') +
    sparkle(101, 104, 0.7, SW, 'a-twinkle d3');
  return svg(sp + bear(he) + bear(she), { fit: [11.5, 21.5, 189.5, 168.5] });
};

S.heart = () => {
  const o = B(HE, { x: 100, y: 102, s: 1.15, face: 'smile', armsBack: [ARMS.heartL, ARMS.heartR] });
  const hs = heart(32, 60, 0.7, SW, { cls: 'a-pulse' }) + heart(170, 74, 0.55, SW, { cls: 'a-pulse d2' }) + sparkle(168, 28, 0.7, SW, 'a-twinkle');
  return svg(hs + bear(o));
};

S.promise = () => {
  const he = B(HE, { x: 60, y: 96, s: 1.0, face: 'happy', fx: 4, armsBack: [ARMS.sideL], armsFront: ['M20 28Q32 28 40 16'] });
  const she = B(SHE, { x: 140, y: 99, s: 0.95, face: 'happy', fx: -4, armsBack: [ARMS.sideR], armsFront: ['M-20 28Q-32 28 -40 14'] });
  return svg(bear(he) + bear(she) + heart(100, 64, 0.75, SW, { cls: 'a-pulse' }), { fit: [19, 50.5, 181.5, 172] });
};

S.boxes = () => {
  const o = B(SHE, { x: 100, y: 88, s: 1.15, face: 'wow', fy: 4, headDy: 2, armsFront: ['M-20 28Q-34 38 -30 52', 'M20 28Q34 38 30 52'] });
  const glow = `<ellipse cx="100" cy="132" rx="34" ry="20" fill="#ffeab0" class="a-glow"/>`;
  const box = line('M52 138h96v44h-96z', SW, '#f3a6b6') + line('M92 138h16v44h-16z', SW, ROSE) +
    line('M48 132h104v10h-104z', SW, '#f7c3cd');
  const lid = g('translate(166 150) rotate(28)', line('M-14 -30h28v56h-28z', SW, '#f7c3cd') + line('M-4 -30h8v56h-8z', SW * 0.8, ROSE));
  return svg(lid + bear(o) + glow + heart(100, 122, 0.9, SW, { cls: 'a-pulse' }) + box +
    sparkle(60, 112, 0.6, SW, 'a-twinkle') + sparkle(142, 108, 0.6, SW, 'a-twinkle d2'), { fit: [42.5, 40.5, 198, 187] });
};

// Distance bar icons: read at 40 to 48 px, so thicker lines and no animation.
const icon = o => svg(bear(Object.assign({ x: 100, y: 90, s: 1.95, body: 'bust', sw: 8, er: 4.6 }, o)), { halo: 5 });
S.me = () => icon(B(HE, { fx: 8, face: 'happy' }));
S.you = () => icon(B(SHE, { fx: -8, face: 'happy' }));

// Finale.
S.hug = () => {
  const she = B(SHE, { x: 124, y: 96, s: 1.05, face: 'content', fx: -3, tilt: -9, armsBack: [ARMS.sideR] });
  const he = B(HE, { x: 77, y: 94, s: 1.08, face: 'content', fx: 3, tilt: 9, armsBack: [ARMS.sideL] });
  const hisArm = inBear(he, k => limb('M20 30Q46 48 70 36', k.c, k.w));
  const herArm = inBear(she, k => limb('M-20 30Q-46 50 -72 40', k.c, k.w));
  const hearts = anim('a-float', heart(100, 30, 0.7, SW)) + anim('a-float d2', heart(40, 46, 0.5, SW)) + anim('a-float d3', heart(162, 42, 0.55, SW));
  return svg(hearts + bear(she) + bear(he) + herArm + hisArm);
};

S.together = () => {
  const moon = line('M44 20A22 22 0 1 0 66 52A17 17 0 1 1 44 20Z', SW, '#ffe9a8');
  const stars = sparkle(150, 26, 0.75, SW, 'a-twinkle') + sparkle(178, 56, 0.55, SW, 'a-twinkle d1') + sparkle(116, 40, 0.5, SW, 'a-twinkle d2') + sparkle(22, 92, 0.5, SW, 'a-twinkle d3');
  const he = B(HE, { x: 76, y: 108, s: 1.0, rot: 7, body: 'sit', face: 'content', fx: 3, armsBack: [ARMS.sideL] });
  const she = B(SHE, { x: 132, y: 112, s: 0.95, rot: -7, body: 'sit', face: 'content', fx: -3, armsBack: [ARMS.sideR] });
  return svg(moon + stars + bear(she) + bear(he) + heart(104, 70, 0.55, SW, { cls: 'a-pulse' }));
};

// Extras.
S.pie = () => {
  const o = B(SHE, { x: 100, y: 78, s: 1.3, body: 'sit', face: 'happy', armsFront: ['M-21 28Q-26 42 -14 46', 'M21 28Q26 42 14 46'] });
  const w = SW / o.s;
  o.mid = g('translate(0 44)', line('M-20 -8L20 -8L0 18Z', w, '#ffe2a8') + line('M-22 -11Q0 -16 22 -11L20 -6Q0 -10 -20 -6Z', w, '#e2a35c') +
    label(0, 6, 15, 'π', '#b5534f'));
  return svg(bear(o) + sparkle(160, 40, 0.7, SW, 'a-twinkle'), { fit: [48.5, 22.5, 169, 175.5] });
};

S.balloon = () => {
  const o = B(HE, { x: 86, y: 92, s: 1.2, face: 'smile', armsBack: [ARMS.sideL, 'M20 27Q36 16 40 -2'] });
  const w = SW / o.s;
  const balloon = anim('a-sway', g('', line('M134 92Q138 74 140 70', 2.4) + heart(140, 50, 2.1, SW, { extra: label(0, 3, 9, '∞', '#fff') }) +
    line('M136 70l4 5l4 -5z', 2.5, HEART)));
  return svg(balloon + bear(o) + inBear(o, k => circ(40, -2, 6.5, k.c.fur, w)), { fit: [38.5, 23, 170.5, 182.5] });
};

S.chalkboard = () => {
  const board = line('M30 16h140v72h-140z', SW, '#9c6a46') + `<rect x="37" y="23" width="126" height="58" fill="#3f5a4f"/>` +
    label(100, 60, 22, '1 + 1 = 1', '#fff') + heart(150, 34, 0.45, 2, { fill: '#f6a8b8', shine: false }) +
    line('M56 88v12M144 88v12', SW);
  const he = B(HE, { x: 60, y: 126, s: 0.85, face: 'smile', armsBack: [ARMS.sideL], armsFront: ['M20 27Q34 16 40 0'] });
  const she = B(SHE, { x: 142, y: 128, s: 0.82, face: 'happy', fx: -2, armsBack: [ARMS.sideL, ARMS.sideR] });
  return svg(board + bear(he) + bear(she));
};

S.flower = () => {
  const he = B(HE, { x: 62, y: 96, s: 1.0, face: 'happy', fx: 4, tilt: 4, armsBack: [ARMS.sideL], armsFront: ['M20 28Q36 34 44 22'] });
  const she = B(SHE, { x: 142, y: 100, s: 0.95, face: 'shy', fx: -3, tilt: -6, armsFront: ['M-20 28Q-12 40 -2 40', 'M20 28Q12 40 2 40'] });
  let petals = '';
  for (let k = 0; k < 5; k++) { const a = k * 72 * Math.PI / 180; petals += circ(Math.sin(a) * 7, -Math.cos(a) * 7, 5.5, '#f7a3b7', 2.4); }
  const flower = line('M106 96Q104 108 104 120', 3, 'none') + line('M104 110q-8 -6 -12 0q6 6 12 0z', 2, '#8fc79a') +
    anim('a-sway', g('translate(106 90)', petals + circ(0, 0, 4.5, GOLD, 2.4)));
  return svg(bear(she) + bear(he) + flower + inBear(he, k => circ(44, 22, 6.5, k.c.fur, k.w)) + heart(150, 34, 0.55, SW, { cls: 'a-pulse' }));
};

S.asleep = () => {
  const he = B(HE, { x: 76, y: 106, s: 1.05, body: 'sit', face: 'content', fx: 4, armsBack: [ARMS.sideL] });
  const she = B(SHE, { x: 122, y: 130, s: 0.9, rot: -22, body: 'sit', face: 'sleep', armsBack: [ARMS.sideR] });
  const zz = anim('a-zz', label(156, 44, 16, 'z') + label(168, 32, 12, 'z'));
  return svg(bear(he) + bear(she) + zz, { fit: [33.5, 22, 174, 201] });
};

S.kiss = () => {
  const o = B(HE, { x: 86, y: 82, s: 1.3, face: 'kiss', fx: 3, armsBack: [ARMS.sideL], armsFront: ['M20 28Q30 22 18 12'] });
  const hearts = anim('a-float', heart(150, 70, 0.85, SW)) + anim('a-float d2', heart(170, 44, 0.55, SW)) + heart(138, 102, 0.5, SW, { cls: 'a-pulse' });
  return svg(bear(o) + hearts, { fit: [35, 27, 182, 179.5] });
};

S.walk = () => {
  const he = B(HE, { x: 64, y: 92, s: 1.0, body: 'walk', face: 'happy', fx: 4, armsBack: [ARMS.sideL], armsFront: ['M20 28Q30 44 36 48'] });
  const she = B(SHE, { x: 136, y: 96, s: 0.95, body: 'walk', face: 'smile', fx: -3, armsBack: [ARMS.sideR], armsFront: ['M-20 28Q-30 44 -38 48'] });
  return svg(anim('a-bob', bear(he)) + anim('a-bob d2', bear(she)) + heart(100, 60, 0.6, SW, { cls: 'a-pulse' }), { fit: [23, 48, 177.5, 168] });
};

S.bigheart = () => {
  const o = B(SHE, { x: 100, y: 74, s: 1.15, body: 'sit', face: 'content', fy: 1 });
  const w = SW / o.s;
  o.mid = heart(0, 52, 2.4, w, { cls: 'a-pulse' });
  o.armsFront = ['M-22 28Q-34 40 -18 50', 'M22 28Q34 40 18 50'];
  return svg(bear(o) + sparkle(30, 40, 0.7, SW, 'a-twinkle') + sparkle(172, 52, 0.6, SW, 'a-twinkle d2'), { fit: [20.5, 24, 179.5, 161] });
};

// ---------------------------------------------------------------- write
const FILES = {
  sorry: 'sorry', hurt: 'hurt', regret: 'regret', begin: 'begin', thinking: 'thinking', hint: 'hint',
  wrong: 'wrong', correct: 'correct', heart: 'heart', promise: 'promise', boxes: 'boxes', me: 'me', you: 'you',
  hug: 'hug', together: 'together',
  pie: 'extra-pie', balloon: 'extra-balloon', chalkboard: 'extra-chalkboard', flower: 'extra-flower',
  asleep: 'extra-asleep', kiss: 'extra-kiss', walk: 'extra-walk', bigheart: 'extra-bigheart'
};

fs.mkdirSync(OUT, { recursive: true });
for (const [key, name] of Object.entries(FILES)) {
  const out = S[key]();
  fs.writeFileSync(path.join(OUT, name + '.svg'), out);
  console.log(`${name}.svg ${(out.length / 1024).toFixed(1)} KB`);
}
