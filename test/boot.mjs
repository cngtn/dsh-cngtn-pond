/**
 * boot.mjs — load the built client half in a stubbed DOM and assert the contract.
 *
 * Three things this catches that a syntax check cannot:
 *
 *  1. The factory registers, and the module exports exactly `apply` + `inject`.
 *  2. Every token in the layer is a `{ light, dark }` pair of strings — the one
 *     rule `overrideTokens` enforces at runtime by throwing, which would take the
 *     whole web boot down with it.
 *  3. `apply()` runs its three effects without throwing, and each disposer is a
 *     function (so the shell can unload the plugin cleanly).
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'client.js'), 'utf8');

let factory = null;
const element = () => ({
  id: '',
  dataset: {},
  style: {},
  setAttribute() {},
  removeAttribute() {},
  remove() {},
  appendChild() {},
  getBoundingClientRect: () => ({ width: 1440, height: 900, left: 0, top: 0, right: 1440, bottom: 900 }),
  getContext: () => null,
});

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
  createElement: element,
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

const failures = [];
const check = (ok, label, detail) => {
  if (ok) {
    console.log('  ok   ' + label);
  } else {
    failures.push(label + (detail ? ' — ' + detail : ''));
    console.log('  FAIL ' + label + (detail ? ' — ' + detail : ''));
  }
};

console.log('boot contract');

new Function(src)();
check(factory !== null, 'factory registered');

const mod = factory((name) => { throw new Error('unexpected require(' + name + ')'); });
check(typeof mod.apply === 'function', 'exports apply');
check(Array.isArray(mod.inject) && mod.inject.includes('theme'), 'inject lists the theme service');

let layer = null;
const disposers = [];
const ctx = {
  theme: { overrideTokens: (id, tokens) => { layer = { id, tokens }; return () => {}; } },
  effect: (fn) => { const d = fn(); disposers.push(d); return d; },
};

try {
  mod.apply(ctx);
  check(true, 'apply() runs');
} catch (error) {
  check(false, 'apply() runs', error.message);
}

check(layer !== null, 'token layer registered');
if (layer) {
  check(layer.id === '@local/dsh-cngtn-pond', 'layer id is the plugin id');

  // The same rule the theme runtime enforces, verbatim.
  const bad = [];
  for (const [name, value] of Object.entries(layer.tokens)) {
    if (typeof value === 'string') bad.push(name + ' (bare string)');
    else if (value === null || typeof value !== 'object') bad.push(name + ' (not an object)');
    else if (typeof value.light !== 'string' || typeof value.dark !== 'string') bad.push(name + ' (missing a mode)');
    else if (value.light === '' || value.dark === '') bad.push(name + ' (empty value)');
  }
  check(bad.length === 0, 'every token is a { light, dark } string pair', bad.slice(0, 4).join(', '));
  check(Object.keys(layer.tokens).length > 200, 'token layer is complete (' + Object.keys(layer.tokens).length + ' tokens)');

  // A paper theme must not leave the stock blue accent anywhere it matters.
  const accent = layer.tokens['--dsw-alias-brand-primary'];
  check(accent && accent.light.toLowerCase() === '#cc3e1c', 'brand is the koi vermilion (light)');
  check(accent && accent.dark.toLowerCase() === '#e86038', 'brand is the koi vermilion (dark)');

  const bg = layer.tokens['--dsw-alias-bg-base'];
  check(bg && bg.light === '#f5f4f1' && bg.dark === '#1a1917', 'paper and ink are the site colours');

  const radius = layer.tokens['--dsw-radius-md'];
  check(radius && radius.light === '8px', 'corners are tighter than the stock 12px');

  const shape = layer.tokens['--dsw-corner-shape'];
  check(shape && shape.light === 'round', 'corners are arcs, not squircles');

  // Panels and flyouts are frosted, not opaque: the pond has to read through
  // them or the theme's whole subject is hidden. The blur is published as the
  // token the shell consults, and the surface fill stays translucent.
  const blur = layer.tokens['--dsw-menu-backdrop-filter'];
  check(blur && /blur\(/.test(blur.light), 'menus are frosted (blur published as a token)');
  const fill = layer.tokens['--dsw-menu-surface-fill'];
  check(fill && /transparent|color-mix/.test(fill.light), 'menu fill is translucent, not opaque');

  // The theme must not impose a font: those tokens are the built-in stacks that
  // sit behind the user's choice in Settings, so overriding them would pin the
  // whole GUI to one typeface.
  for (const name of [
    '--dsh-font-family-text-default',
    '--dsh-font-family-code-default',
    '--dsw-font-family-brand',
  ]) {
    check(!(name in layer.tokens), name + ' is left to the shell and the user');
  }
}

// The stylesheet is a string inside the bundle; these checks prove the two
// surfaces that were easy to get wrong are still wired to the shell's own hooks
// rather than to a hashed class.
const stylesheet = src.slice(src.indexOf('const __m_styles'), src.indexOf('const __m_apply'));

check(
  stylesheet.includes('[data-conversation-composer-overlay]'),
  'the Trajectory overlay is styled through its own hook'
);
check(
  stylesheet.includes('tr[data-trajectory-row-key] > td:first-child') &&
    stylesheet.includes('tr[data-trajectory-row-key] > td:last-child'),
  'Trajectory rows are rounded through their first and last cell'
);
check(
  stylesheet.includes('border-spacing: 0 6px'),
  'Trajectory rows are separated by a 6px gap'
);
check(
  !/\[data-chat-flow\]:not\(/.test(stylesheet),
  'the transcript column is not frosted (prose stays crisp)'
);

check(disposers.length === 3, 'three effects registered', String(disposers.length));
check(disposers.every((d) => typeof d === 'function'), 'every effect returned a disposer');

console.log('');
if (failures.length > 0) {
  console.log('FAILED: ' + failures.length);
  process.exit(1);
}
console.log('all checks passed');