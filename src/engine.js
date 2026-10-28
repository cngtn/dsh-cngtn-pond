/**
 * engine.js — the pond's lifecycle, ported from the original site's `koi-pond.tsx`.
 *
 * The React component on the site does four things this module also does, in
 * plain DOM: own the rAF loop with a fixed-step accumulator, keep the canvas
 * sized to its box, measure the content the koi must swim around, and translate
 * pointer/click input into curiosity, food and fright. What it adds is what a
 * shell needs and a landing page does not: it survives being mounted into a live
 * application, it pauses when the window is hidden or the canvas is covered, and
 * it tears every listener down on dispose.
 *
 * One thing it deliberately does *not* do is steer the koi around the shell's
 * panels. On the site the prose block is the only thing over the water, so the
 * fish avoid it and fade beneath it. In a shell every panel is a frosted sheet:
 * the whole point of the theme is that a koi swims *under* the sidebar and the
 * composer and reads through the blur. Steering them away would leave every
 * glass panel empty, which is exactly the failure this module used to have.
 */

import { World, clamp } from './world.js';
import { KoiRenderer } from './renderer.js';

const STEP = 1 / 60;
const MAX_STEPS = 4;
// Content over the pond carries this attribute; koi steer around it and fade beneath it.
const AVOID_TARGETS = '[data-cngtn-avoid]';
// Re-measure the content boxes this often, in frames, to follow layout shifts.
const MEASURE_EVERY_FRAMES = 30;
// Content boxes closer than this merge, so koi aren't squeezed into the slot between them.
const MERGE_GAP_PX = 72;
const INTERACTIVE =
  "a, button, input, textarea, select, label, [role='button'], [role='menuitem'], [contenteditable='true'], [data-cngtn-ignore]";

/**
 * Surfaces that genuinely hide the water. Only the status strip is opaque in
 * this theme; the sidebar, the right panel and the composer are frosted glass,
 * so a koi under one is *meant* to be seen. Steering away from them would make
 * the glass pointless.
 *
 * Every entry is a `data-*` hook the shell publishes itself — never a hashed
 * CSS-module class — so a DSH update cannot silently turn this list into a
 * no-op.
 */
const OPAQUE_SELECTORS = ['[data-shell-bottom]'];

/**
 * Text that sits directly on the water and therefore needs the fish faded
 * beneath it: one block per message, plus the hero heading.
 *
 * The fade is gentle — 0.55, not the site's 0.15 — because in this theme the
 * water is the subject. A koi under a paragraph should read as a fish seen
 * through frosted glass, not as a watermark.
 */
const TRANSLUCENT_SELECTORS = ['[data-chat-turn]', '[data-slot="conversation.header"]'];

function mergeNearby(boxes) {
  const merged = [];
  for (const b of [...boxes].sort((p, q) => p.top - q.top)) {
    const near = merged.find(
      (m) => b.top - m.bottom < MERGE_GAP_PX && b.left - m.right < MERGE_GAP_PX && m.left - b.right < MERGE_GAP_PX
    );
    if (!near) {
      merged.push({ ...b });
      continue;
    }
    near.left = Math.min(near.left, b.left);
    near.right = Math.max(near.right, b.right);
    near.bottom = Math.max(near.bottom, b.bottom);
  }
  return merged;
}

export class PondEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.world = new World({ budget: options.budget ?? 0.7 });
    this.renderer = new KoiRenderer(canvas, { maxCells: options.maxCells ?? 26000 });
    this.raf = 0;
    this.last = 0;
    this.acc = 0;
    this.frames = 0;
    this.lastPointerTime = 0;
    this.visible = true;
    this.disposed = false;
    this.hidden = false;
    this.isLight = undefined;
    this.onStats = options.onStats ?? null;
    this.reported = { koi: -1, pellets: -1 };

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedTransparency = window.matchMedia('(prefers-reduced-transparency: reduce)');

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.schedule();
    });

    this.resizeObserver.observe(canvas);
    this.intersectionObserver.observe(canvas);
    this.reducedMotion.addEventListener('change', this.onPreferenceChange);
    this.reducedTransparency.addEventListener('change', this.onPreferenceChange);
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    window.addEventListener('click', this.onClick);
    document.documentElement.addEventListener('pointerleave', this.onPointerLeave);
    window.addEventListener('blur', this.onPointerLeave);
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    this.setTheme(this.readIsLight());
    this.resize();
    this.schedule();
  }

  destroy() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    this.reducedMotion.removeEventListener('change', this.onPreferenceChange);
    this.reducedTransparency.removeEventListener('change', this.onPreferenceChange);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('click', this.onClick);
    document.documentElement.removeEventListener('pointerleave', this.onPointerLeave);
    window.removeEventListener('blur', this.onPointerLeave);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  /** True when the shell is painting its light palette. */
  readIsLight() {
    return !document.body.hasAttribute('data-ds-dark-theme');
  }

  setTheme(isLight) {
    if (this.isLight === isLight) return;
    this.isLight = isLight;
    this.renderer.setTheme(isLight);
    if (this.reducedMotion.matches) this.drawStill();
  }

  onPreferenceChange = () => {
    this.schedule();
  };

  onVisibilityChange = () => {
    this.hidden = document.hidden;
    this.schedule();
  };

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    this.renderer.resize(rect.width, rect.height, Math.min(window.devicePixelRatio || 1, 2));
    this.world.resize(rect.width, rect.height);
    this.measureContent();
    this.report();
    if (this.reducedMotion.matches) this.drawStill();
  }

  // Only call back when a count changes, so the host doesn't re-render every frame.
  report() {
    if (!this.onStats) return;
    const koi = this.world.koi.length;
    const pellets = this.world.pellets.length;
    if (koi === this.reported.koi && pellets === this.reported.pellets) return;
    this.reported = { koi, pellets };
    this.onStats(this.reported);
  }

  schedule = () => {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    if (this.disposed || !this.visible || this.hidden) return;
    // A user who asked the OS for less transparency gets the paper, not a pond.
    if (this.reducedTransparency.matches) {
      this.renderer.clear();
      return;
    }
    if (this.reducedMotion.matches) {
      this.drawStill();
      return;
    }
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  };

  /** Canvas-space rects for one selector list, skipping anything unrendered. */
  rectsFor(selectors) {
    const origin = this.canvas.getBoundingClientRect();
    const nodes = selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)));
    return nodes
      .map((el) => el.getBoundingClientRect())
      .filter((b) => b.width > 0 && b.height > 0)
      .map((b) => ({
        left: b.left - origin.left,
        top: b.top - origin.top,
        right: b.right - origin.left,
        bottom: b.bottom - origin.top,
      }));
  }

  measureContent() {
    // `data-koi-avoid` is the site's own contract: steer around it *and* fade
    // beneath it. The shell's opaque panels only steer; the text blocks only
    // fade. Keeping the two lists apart matters, because merging an opaque
    // full-height sidebar with the composer would otherwise produce one huge box
    // that washes out half the pond.
    const own = mergeNearby(this.rectsFor([AVOID_TARGETS]));
    const opaque = mergeNearby(this.rectsFor(OPAQUE_SELECTORS));
    const translucent = mergeNearby(this.rectsFor(TRANSLUCENT_SELECTORS));
    // Blocks that paint their own frosted tint. The water under them is restored
    // to full strength: the tint already carries legibility, and a koi faded to
    // 55 % behind a blur is indistinguishable from a blur that is not working.
    const frosted = this.rectsFor(['[data-code-wrap]', '[class*="_ioCard"]']);

    // Steering is limited to the panels that genuinely hide water. The faded
    // boxes only dim what is drawn beneath them; adding them to `avoid` would
    // let the composer's full-width seat merge with the sidebar into one wall
    // and push every fish out of the centre column.
    this.world.avoid = [...own, ...opaque];
    this.renderer.setDimBoxes([
      // The site's own contract: faint, so a koi reads as being under the words.
      { boxes: own, floor: 0.15 },
      // The transcript: every message is text on water, so a koi has to be a
      // whisper there or the paragraph stops being readable.
      { boxes: translucent, floor: 0.55 },
      { boxes: frosted, floor: 1, mode: 'restore' },
    ]);
  }

  frame = (now) => {
    if (this.disposed) return;
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    this.acc += dt;
    let steps = 0;
    while (this.acc >= STEP && steps < MAX_STEPS) {
      this.world.step(STEP);
      this.acc -= STEP;
      steps++;
    }
    if (steps === MAX_STEPS) this.acc = 0;
    if (++this.frames % MEASURE_EVERY_FRAMES === 0) this.measureContent();
    this.renderer.render(this.world, dt);
    this.report();
    this.raf = requestAnimationFrame(this.frame);
  };

  // Reduced motion: let the koi spread out, then hold a single frame.
  drawStill() {
    if (this.world.time < 4) {
      for (let i = 0; i < 240; i++) this.world.step(STEP);
    }
    this.measureContent();
    this.renderer.render(this.world, STEP);
    this.report();
  }

  toLocal(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x, y, inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height };
  }

  onPointerMove = (e) => {
    const { x, y, inside } = this.toLocal(e);
    const p = this.world.pointer;
    const elapsed = Math.max(1, e.timeStamp - this.lastPointerTime) / 1000;
    const speed = Math.hypot(x - p.x, y - p.y) / elapsed;
    p.speed += (Math.min(speed, 5000) - p.speed) * 0.5;
    this.lastPointerTime = e.timeStamp;
    p.x = x;
    p.y = y;
    p.active = inside && e.pointerType !== 'touch';
  };

  // Clicks on empty space drop food; links, buttons, and text selection are left
  // alone.
  onClick = (e) => {
    if (this.reducedMotion.matches || this.reducedTransparency.matches) return;
    // The path recorded at dispatch, not target.closest(): a control that
    // re-renders as it is clicked can leave the target detached, with no
    // ancestors left to find the button through.
    if (e.composedPath().some((n) => n instanceof Element && n.matches(INTERACTIVE))) return;
    if (window.getSelection()?.toString()) return;
    const { x, y, inside } = this.toLocal(e);
    if (!inside) return;
    this.world.feed(x, y);
    this.report();
  };

  onPointerLeave = () => {
    this.world.pointer.active = false;
    this.world.pointer.speed = 0;
  };

  /** Exposed for the smoke test: step the simulation without a browser clock. */
  static step(world, seconds) {
    const steps = Math.round(seconds / STEP);
    for (let i = 0; i < steps; i++) world.step(STEP);
    return clamp(steps, 0, Infinity);
  }
}