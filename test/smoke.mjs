// smoke.mjs — step the pond without a browser and assert it stays finite.
//
// The site's engine can be exercised this way because `world.ts` has no DOM
// dependency; the port keeps that property deliberately. What this catches is
// the failure that would otherwise only show up as a silently empty pond after
// ten minutes of use: a NaN in the spine, which propagates through the
// follow-the-leader pass and turns every later sample into "no hit".

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'client.js'), 'utf8');

let factory = null;
globalThis.window = {
  __ModuleLoader__: { load: (m) => { factory = m.factory; } },
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  addEventListener() {},
  removeEventListener() {},
  devicePixelRatio: 1,
};
globalThis.document = {
  body: { hasAttribute: () => false, appendChild() {}, insertBefore() {}, firstChild: null, style: {} },
  head: { appendChild() {} },
  documentElement: { style: {}, addEventListener() {}, removeEventListener() {} },
  createElement: () => ({
    dataset: {}, style: {}, setAttribute() {}, remove() {}, appendChild() {},
    getBoundingClientRect: () => ({ width: 0, height: 0, left: 0, top: 0 }),
    getContext: () => null,
  }),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener() {},
  removeEventListener() {},
  hidden: false,
};
globalThis.ResizeObserver = class { observe() {} disconnect() {} };
globalThis.IntersectionObserver = class { observe() {} disconnect() {} };
globalThis.MutationObserver = class { observe() {} disconnect() {} };
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};

new Function(src)();
factory(() => { throw new Error('no require'); });

// The generated file wraps each source module in an IIFE, so the pure ones can
// be lifted back out and evaluated on their own — which also proves they carry
// no hidden dependency on the DOM.
const between = (from, to) => {
  const start = src.indexOf(from);
  return src.slice(start, src.indexOf(to, start));
};
const scope = new Function(
  between('const __m_world = (() => {', 'const __m_shape = (() => {') +
    '\n' +
    between('const __m_shape = (() => {', 'const __m_renderer = (() => {') +
    '\nreturn { World, KOI_NODES, classify, bodyHalfWidth, angleDiff, hash3 };'
)();

const { World, KOI_NODES, classify, bodyHalfWidth } = scope;

const failures = [];
const check = (ok, label, detail) => {
  console.log((ok ? '  ok   ' : '  FAIL ') + label + (detail ? ' — ' + detail : ''));
  if (!ok) failures.push(label);
};

console.log('pond smoke');

const world = new World({ budget: 0.55 });
world.resize(1440, 900);
check(world.koi.length >= 3 && world.koi.length <= 8, 'seeds a school inside the budget (' + world.koi.length + ')');

// Ten minutes at 60 Hz with a moving pointer, repeated feeds and swipes.
let t = 0;
const step = 1 / 60;
let finite = true;
let ateSomething = false;
for (let i = 0; i < 36000; i++) {
  t += step;
  world.pointer.x = 720 + Math.cos(t * 0.7) * 420;
  world.pointer.y = 450 + Math.sin(t * 0.91) * 260;
  world.pointer.active = true;
  world.pointer.speed = 200 + Math.sin(t) * 150;
  if (i % 3000 === 0) world.feed(world.pointer.x, world.pointer.y);
  if (i % 4500 === 1200) world.pointer.speed = 1800; // a swipe, to trigger a startle
  const before = world.bites.length;
  world.step(step);
  if (world.bites.length > before) ateSomething = true;
  if (i % 600 === 0) {
    for (const k of world.koi) {
      for (let n = 0; n < KOI_NODES * 2; n++) {
        if (!Number.isFinite(k.nodes[n])) finite = false;
      }
      if (!Number.isFinite(k.heading) || !Number.isFinite(k.speed) || !Number.isFinite(k.depth)) finite = false;
    }
  }
}
check(finite, 'ten simulated minutes keep every spine node finite');
check(ateSomething, 'a fed koi takes a pellet');
check(world.koi.every((k) => k.nodes[0] > -k.length && k.nodes[0] < 1440 + k.length), 'koi stay near the pond');
check(world.pellets.length <= 24, 'pellets stay capped (' + world.pellets.length + ')');
check(world.ripples.length < 400, 'ripples stay bounded (' + world.ripples.length + ')');

// A resize that changes the box by more than a quarter re-seeds; a small one
// must not, or the school would teleport every time a panel opens.
const before = world.koi.length;
world.resize(1460, 910);
check(world.koi.length === before, 'a small resize keeps the school');
const snapshot = world.koi.map((k) => k.id + ':' + k.nodes[0].toFixed(1)).join(',');
world.resize(720, 500);
check(world.koi.map((k) => k.id + ':' + k.nodes[0].toFixed(1)).join(',') !== snapshot, 'a large resize re-seeds');

// The outline, in body space.
check(bodyHalfWidth(0) < 0.001, 'the snout tapers to a point');
check(bodyHalfWidth(0.3) > bodyHalfWidth(0.74), 'the stalk is narrower than the shoulders');

const hit = { flag: 0, across: 1, du: 1, da: 0 };
// A point on the spine at mid-body is the dorsal ridge, which the renderer
// etches with the densest glyphs.
check(classify(0.5, 0, 0, 1, hit) === true && hit.flag === 4, 'the spine centre is the dorsal ridge');
check(classify(0.2, 0.09, 0, 1, hit) === true && hit.flag === 1, 'the flank is body');
check(classify(0.5, 0.5, 0, 1, hit) === false, 'far off the flank is outside');
check(classify(0.9, 0.08, 0, 1, hit) === true && hit.flag === 2, 'the tail is a fin');

console.log('');
if (failures.length > 0) {
  console.log('FAILED: ' + failures.length);
  process.exit(1);
}
console.log('all checks passed');