/**
 * tokens.js — the daoho.dev palette, expressed as DSH theme tokens.
 *
 * `overrideTokens` requires every entry to be a `{ light, dark }` pair of
 * strings; a bare string throws, because a value that only works in one colour
 * scheme goes illegible in the other. Everything here is therefore written as a
 * pair, even when both sides are identical.
 *
 * The palette is the site's own, read out of `tailwind.config.ts` and the two
 * koi palettes in `renderer.ts`. Two rules drove the derivations:
 *
 *  - Paper and ink are warm, never neutral grey. Every surface keeps the same
 *    hue family as `#f5f4f1` / `#1a1917`, so a panel never looks like a different
 *    material than the page.
 *  - The only saturated colour is the koi vermilion. It is the accent, the
 *    primary button, and the business state — and it is deliberately *not* the
 *    error colour, because "error" and "brand" must never be confusable.
 */

// ── Paper and ink ─────────────────────────────────────────────────────────
const PAPER = {
  bg: '#f5f4f1',
  layer1: '#f8f7f4',
  layer2: '#f2f1ed',
  layer3: '#ecebe6',
  overlay: '#fbfaf7',
  sidebar: '#efeEE9',
  composer: '#f9f8f5',
  control: '#ffffff',
  controlHover: '#f4f3ef',
  subtle: 'rgba(38, 37, 35, 0.045)',
  subtleHover: 'rgba(38, 37, 35, 0.07)',
  subtleActive: 'rgba(38, 37, 35, 0.10)',
  text: '#262523',
  textSecondary: '#6b6862',
  textTertiary: '#8a8680',
  textCaption: '#a9a5a0',
  textDisabled: '#bdb9b3',
  accent: '#cc3e1c',
  accentHover: '#b53517',
  accentPressed: '#9c2c12',
  accentSoft: '#f7ddd3',
  accentSofter: '#fbf0eb',
  onAccent: '#fdfcfa',
  success: '#4d7c0f',
  successSoft: '#e8f0d8',
  caution: '#9d5d00',
  cautionSoft: '#fbf0d8',
  critical: '#b3261e',
  criticalSoft: '#f8e2df',
  focus: '#262523',
  smoke: 'rgba(38, 37, 35, 0.32)',
  smokeStrong: 'rgba(38, 37, 35, 0.52)',
  scroll: 'rgba(38, 37, 35, 0.26)',
  scrollHover: 'rgba(38, 37, 35, 0.42)',
  shadowSoft: 'rgba(38, 37, 35, 0.07)',
  shadowHard: 'rgba(38, 37, 35, 0.05)',
  shadowDeep: 'rgba(38, 37, 35, 0.12)',
};

const INK = {
  bg: '#1a1917',
  layer1: '#201f1c',
  layer2: '#252320',
  layer3: '#2b2925',
  overlay: '#2e2c28',
  sidebar: '#151412',
  composer: '#211f1c',
  control: '#2b2925',
  controlHover: '#332f2a',
  subtle: 'rgba(255, 247, 240, 0.055)',
  subtleHover: 'rgba(255, 247, 240, 0.08)',
  subtleActive: 'rgba(255, 247, 240, 0.11)',
  text: '#fff7f0',
  textSecondary: '#b8b2a8',
  textTertiary: '#8e887e',
  textCaption: '#6f6a62',
  textDisabled: '#5a554e',
  accent: '#e86038',
  accentHover: '#f07049',
  accentPressed: '#d4512c',
  accentSoft: '#3a1f16',
  accentSofter: '#2a1710',
  onAccent: '#1a1917',
  success: '#8fbb4a',
  successSoft: '#2a3218',
  caution: '#e0a94a',
  cautionSoft: '#332a15',
  critical: '#ff8f7a',
  criticalSoft: '#3a1c17',
  focus: '#fff7f0',
  smoke: 'rgba(0, 0, 0, 0.55)',
  smokeStrong: 'rgba(0, 0, 0, 0.72)',
  scroll: 'rgba(255, 247, 240, 0.24)',
  scrollHover: 'rgba(255, 247, 240, 0.40)',
  shadowSoft: 'rgba(0, 0, 0, 0.30)',
  shadowHard: 'rgba(0, 0, 0, 0.22)',
  shadowDeep: 'rgba(0, 0, 0, 0.45)',
};

const tokens = {};
/** Register one value pair: `light` for the paper palette, `dark` for the ink one. */
const set = (name, light, dark) => {
  tokens[name] = { light, dark };
};
const pair = (name, key) => set(name, PAPER[key], INK[key]);

// ── Typography ────────────────────────────────────────────────────────────
// The site sets everything in Geist Mono: headings, prose, nav, the pond's own
// glyphs. The theme does the same, and only re-points the two *built-in* stacks,
// never `--dsw-font-family` / `--ds-font-family-code` themselves — those resolve
// as `<user list>, <built-in stack>`, so a font chosen in Settings still wins
// while every default becomes monospace.
//
// Geist Mono is vendored with the bundle (SIL OFL) because it is not installed
// on Windows; Cascadia Code NF and Cascadia Mono follow it in the stack so the
// pond and the interface share the same cell metrics even before the webfont
// settles.
const MONO =
  '"Geist Mono", "Cascadia Code NF", "Cascadia Mono", Consolas, "SF Mono", ui-monospace, monospace';
const SANS = '"Geist Sans", "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif';

set('--dsh-font-family-text-default', MONO, MONO);
set('--dsh-font-family-code-default', MONO, MONO);
set('--dsw-font-family-brand', SANS, SANS);

// ── The type ramp ─────────────────────────────────────────────────────────
// The site's ramp is unusually small and flat: 11/12/13/14/15/16 px, with the
// same monospace everywhere. DSH consumes the ramp as composite shorthands, so
// each step is re-declared whole; the emphasis steps keep their weight but drop
// to 500, because a 600-weight monospace at 11px turns into a black smear.
const ramp = (name, size, line, weight = 400) =>
  set(name, `${weight} ${size}px/${line}px var(--dsw-font-family)`, `${weight} ${size}px/${line}px var(--dsw-font-family)`);

ramp('--dsw-font-xxxs-11', 11, 15);
ramp('--dsw-font-xxxs-strong-11', 11, 15, 500);
ramp('--dsw-font-xxs-12', 12, 18);
ramp('--dsw-font-xxs-strong-12', 12, 18, 500);
ramp('--dsw-font-xs-13', 13, 20);
ramp('--dsw-font-xs-strong-13', 13, 20, 500);
ramp('--dsw-font-s-14', 14, 22);
ramp('--dsw-font-s-strong-14', 14, 22, 500);
ramp('--dsw-font-base-16', 15, 24);
ramp('--dsw-font-base-strong-16', 15, 24, 500);
ramp('--dsw-font-m-18', 16, 26, 500);
ramp('--dsw-font-l-20', 18, 26, 500);
ramp('--dsw-font-xl-24', 21, 28, 500);

// ── Shape ─────────────────────────────────────────────────────────────────
// The site is nearly square: photographs are square, media is 6px, cards are
// 8px, and only the mobile pill is fully round. DSH ships 4/8/12/16/20/28; the
// ladder below is one step tighter across the board, which is the single most
// visible change a paper theme can make.
set('--dsw-radius-xs', '4px', '4px');
set('--dsw-radius-sm', '6px', '6px');
set('--dsw-radius-md', '8px', '8px');
set('--dsw-radius-lg', '10px', '10px');
set('--dsw-radius-xl', '12px', '12px');
set('--dsw-radius-panel', '14px', '14px');
// The shell ships a squircle; the site uses true arcs.
set('--dsw-corner-shape', 'round', 'round');

// ── Motion ────────────────────────────────────────────────────────────────
// The site's transitions are short and settle quickly; the easing is the same
// standard curve DSH already uses, so only the duration is worth restating.
set('--ds-ease-in-out', 'cubic-bezier(0.33, 0, 0.67, 1)', 'cubic-bezier(0.33, 0, 0.67, 1)');

// ── Surfaces ──────────────────────────────────────────────────────────────
pair('--dsw-alias-bg-base', 'bg');
pair('--dsw-alias-bg-layer-1', 'layer1');
pair('--dsw-alias-bg-layer-2', 'layer2');
pair('--dsw-alias-bg-layer-3', 'layer3');
pair('--dsw-alias-bg-overlay', 'overlay');
pair('--dsw-alias-bg-module-platform', 'layer2');
pair('--dsw-alias-bg-multi-select', 'layer3');
set('--dsw-alias-bg-skeleton', 'rgba(38, 37, 35, 0.055)', 'rgba(255, 247, 240, 0.06)');
pair('--dsw-alias-bg-document-preview', 'layer1');
set(
  '--dsw-alias-bg-document-selection',
  'color-mix(in srgb, #cc3e1c 26%, transparent)',
  'color-mix(in srgb, #e86038 30%, transparent)'
);

// ── Masks ─────────────────────────────────────────────────────────────────
pair('--dsw-alias-bg-mask-1', 'smoke');
pair('--dsw-alias-bg-mask-2', 'smoke');
pair('--dsw-alias-bg-mask-3', 'smokeStrong');
set('--dsw-alias-bg-mask-drop', 'rgba(245, 244, 241, 0.78)', 'rgba(32, 31, 28, 0.78)');
set('--dsw-alias-bg-mask-photo', 'rgba(26, 25, 23, 0.88)', 'rgba(0, 0, 0, 0.9)');

// ── Strokes ───────────────────────────────────────────────────────────────
// The site draws every border as `foreground` at 8–12%: hairlines only, and
// always warm. Never a neutral grey, or the paper reads cold.
set('--dsw-alias-border-l1', 'rgba(38, 37, 35, 0.08)', 'rgba(255, 247, 240, 0.07)');
set('--dsw-alias-border-l2', 'rgba(38, 37, 35, 0.12)', 'rgba(255, 247, 240, 0.10)');
set('--dsw-alias-border-l2-darkmode-thin', 'rgba(38, 37, 35, 0.12)', 'rgba(255, 247, 240, 0.07)');
set('--dsw-alias-border-l3', 'rgba(38, 37, 35, 0.18)', 'rgba(255, 247, 240, 0.14)');
set('--dsw-alias-border-l4', 'rgba(38, 37, 35, 0.26)', 'rgba(255, 247, 240, 0.20)');
set('--dsw-alias-border-inverted', 'transparent', 'rgba(255, 247, 240, 0.06)');
set('--dsw-alias-border-inverted2', 'transparent', 'rgba(255, 247, 240, 0.08)');

// ── Brand: the koi vermilion ──────────────────────────────────────────────
// Values are step 3 of each palette's `hi` ramp in renderer.ts — the one that
// stays legible against paper and ink alike.
pair('--dsw-alias-brand-primary', 'accent');
set('--dsw-alias-brand-primary-invert', PAPER.onAccent, INK.onAccent);
pair('--dsw-alias-brand-text', 'text');
pair('--dsw-alias-brand-primary-new-colorprimary-new-color', 'accent');
pair('--dsw-alias-link', 'text');
pair('--dsw-alias-state-business-primary', 'accent');
pair('--dsw-alias-state-business-tertiary', 'accentSoft');

// ── Buttons ───────────────────────────────────────────────────────────────
pair('--dsw-alias-button-primary-fill', 'accent');
pair('--dsw-alias-button-primary-hover', 'accentHover');
set('--dsw-alias-button-primary-dimmed', 'rgba(38, 37, 35, 0.18)', 'rgba(255, 247, 240, 0.14)');
pair('--dsw-alias-button-info-fill', 'accent');
pair('--dsw-alias-button-info-hover', 'accentHover');
pair('--dsw-alias-button-contrast-fill', 'text');
set('--dsw-alias-button-elevated-fill', PAPER.control, INK.control);
set('--dsw-alias-button-floating-fill', PAPER.control, INK.control);
set('--dsw-alias-button-floating-hover', PAPER.controlHover, INK.controlHover);
pair('--dsw-alias-button-ghost-active-fill', 'subtle');
pair('--dsw-alias-button-ghost-active-hover', 'subtleHover');
pair('--dsw-alias-button-ghost-active-border', 'textTertiary');
set('--dsw-alias-button-tool-bar-fill', 'rgba(38, 37, 35, 0.55)', 'rgba(20, 19, 17, 0.6)');
set('--dsw-alias-button-tool-bar-fill-invisible', 'rgba(38, 37, 35, 0.4)', 'rgba(20, 19, 17, 0.46)');
set('--dsw-alias-button-tool-bar-hover', 'rgba(38, 37, 35, 0.7)', 'rgba(20, 19, 17, 0.75)');

// ── Rows and controls ─────────────────────────────────────────────────────
pair('--dsw-alias-interactive-bg-hover', 'subtleHover');
pair('--dsw-alias-interactive-bg-active', 'subtleActive');
set('--dsw-alias-interactive-bg-hover-accent', 'rgba(204, 62, 28, 0.08)', 'rgba(232, 96, 56, 0.12)');
set('--dsw-alias-interactive-bg-hover-danger', 'rgba(179, 38, 30, 0.08)', 'rgba(255, 143, 122, 0.12)');
set('--dsw-alias-interactive-bg-hover-solid', PAPER.controlHover, INK.controlHover);
set('--dsw-alias-switch-thumb', '#ffffff', '#fff7f0');

// ── Labels ────────────────────────────────────────────────────────────────
pair('--dsw-alias-label-primary', 'text');
set('--dsw-alias-label-primary-dimmed', 'rgba(38, 37, 35, 0.78)', 'rgba(255, 247, 240, 0.88)');
set('--dsw-alias-label-primary-inverted', PAPER.bg, INK.bg);
set('--dsw-alias-label-primary-foreground', '#fdfcfa', '#1a1917');
pair('--dsw-alias-label-primary-bluish', 'accent');
pair('--dsw-alias-label-secondary', 'textSecondary');
pair('--dsw-alias-label-tertiary', 'textTertiary');
pair('--dsw-alias-label-caption', 'textCaption');
pair('--dsw-alias-label-dimmed', 'textDisabled');
pair('--dsw-alias-label-document-preview', 'textSecondary');
pair('--dsw-alias-label-deep-diving', 'accent');
set('--dsw-alias-label-deep-diving-shimmer', '#e86038', '#ff9a7a');
set('--dsw-alias-label-shimmer', 'rgba(38, 37, 35, 0.28)', 'rgba(255, 247, 240, 0.4)');

// ── States ────────────────────────────────────────────────────────────────
pair('--dsw-alias-state-success-primary', 'success');
pair('--dsw-alias-state-success-secondary', 'success');
pair('--dsw-alias-state-success-tertiary', 'successSoft');
pair('--dsw-alias-state-warn-primary', 'caution');
pair('--dsw-alias-state-warn-secondary', 'caution');
pair('--dsw-alias-state-warn-label', 'caution');
pair('--dsw-alias-state-warn-tertiary', 'cautionSoft');
pair('--dsw-alias-state-error-primary', 'critical');
pair('--dsw-alias-state-error-secondary', 'critical');
pair('--dsw-alias-state-idle-primary', 'textTertiary');

// ── Code and diffs ────────────────────────────────────────────────────────
set('--dsw-alias-code-diff-added', 'rgba(77, 124, 15, 0.10)', 'rgba(143, 187, 74, 0.12)');
set('--dsw-alias-code-diff-deleted', 'rgba(179, 38, 30, 0.10)', 'rgba(255, 143, 122, 0.12)');
set('--dsw-alias-file-diff-added-bg', '#eef3e2', '#1d2416');
set('--dsw-alias-file-diff-added-gutter', '#f4f7ec', '#161c11');
pair('--dsw-alias-file-diff-added-marker', 'success');
set('--dsw-alias-file-diff-deleted-bg', '#f8e6e3', '#2c1714');
set('--dsw-alias-file-diff-deleted-gutter', '#fbf0ee', '#1f100e');
pair('--dsw-alias-file-diff-deleted-marker', 'critical');

// ── Markdown ──────────────────────────────────────────────────────────────
// Code and command cards are frosted, not paper. They sit directly over the
// pond, so an opaque fill would cut a hole in it; the stylesheet puts the blur
// on the card itself, and the token only has to stop being opaque.
set(
  '--dsw-alias-markdown-code-block',
  'color-mix(in srgb, #f8f7f4 30%, transparent)',
  'color-mix(in srgb, #201f1c 30%, transparent)'
);
set(
  '--dsw-alias-markdown-code-block-banner',
  'color-mix(in srgb, #f2f1ed 38%, transparent)',
  'color-mix(in srgb, #252320 36%, transparent)'
);
pair('--dsw-alias-markdown-inline-code', 'layer2');
set('--dsw-alias-markdown-code-segment-selected', PAPER.control, INK.control);
pair('--dsw-alias-markdown-code-segment-unselected', 'layer1');
pair('--dsw-alias-markdown-citation', 'layer2');
pair('--dsw-alias-markdown-tag', 'layer3');
pair('--dsw-alias-markdown-placeholder', 'subtle');
set('--dsw-alias-turn-trigger-bg', 'var(--dsw-alias-markdown-code-block)', 'var(--dsw-alias-interactive-bg-hover)');
set('--dsw-alias-turn-trigger-bg-hover', 'var(--dsw-alias-interactive-bg-hover)', 'var(--dsw-alias-interactive-bg-active)');

// ── Menus and panels: glass over paper ────────────────────────────────────
// The site has one opaque surface because it has one surface. A shell does
// not: panels sit on top of the pond, and covering the water with paper hides
// the whole point of the theme. So every surface that floats above the page is
// a *frosted* sheet instead — a translucent paper tint plus a backdrop blur,
// so the koi read through it as soft moving texture rather than disappearing.
//
// The blur is published as the token the shell already consults, and the
// stylesheet carries the tint and the `::before` recipe that makes it safe to
// apply (see `styles.js`: a backdrop-filter on an element that owns a fixed
// child would drag that child into the element's own coordinate space).
set('--dsw-menu-backdrop-filter', 'blur(26px) saturate(160%)', 'blur(26px) saturate(160%)');
set(
  '--dsw-menu-surface-fill',
  'color-mix(in srgb, #fbfaf7 55%, transparent)',
  'color-mix(in srgb, #2e2c28 58%, transparent)'
);
set(
  '--dsw-specific-menu',
  'color-mix(in srgb, #fbfaf7 55%, transparent)',
  'color-mix(in srgb, #2e2c28 58%, transparent)'
);
set(
  '--dsw-alias-menu-group-header-fill',
  'color-mix(in srgb, #f2f1ed 78%, transparent)',
  'color-mix(in srgb, #252320 82%, transparent)'
);
pair('--dsw-alias-menu-icon', 'textSecondary');
set('--dsw-alias-tooltip-bg', '#262523', '#2e2c28');
set('--dsw-alias-tooltip-key-bg', 'rgba(255, 247, 240, 0.12)', 'rgba(255, 247, 240, 0.1)');
set('--dsw-alias-toast-bg', '#262523', '#33302b');
set('--dsw-alias-toast-label', '#fdfcfa', '#fff7f0');

// ── Scrollbars ────────────────────────────────────────────────────────────
pair('--dsw-alias-scrollbar-bg-l1', 'scroll');
set('--dsw-alias-scrollbar-bg-l2', 'rgba(38, 37, 35, 0.32)', 'rgba(255, 247, 240, 0.3)');
pair('--dsw-alias-scrollbar-hover-l1', 'scrollHover');
set('--dsw-alias-scrollbar-hover-l2', 'rgba(38, 37, 35, 0.48)', 'rgba(255, 247, 240, 0.46)');

// ── Elevation ─────────────────────────────────────────────────────────────
// One soft shadow, a hairline, and nothing else. The site's only elevated
// surface is the citation card, and its recipe is `inset highlight + contact
// shadow + wide low-alpha diffusion` — reproduced here as the three levels.
set(
  '--dsw-shadow-lv1',
  `0 1px 2px ${PAPER.shadowSoft}`,
  `0 1px 2px ${INK.shadowSoft}`
);
set(
  '--dsw-shadow-lv1-blur',
  `0 2px 6px ${PAPER.shadowSoft}`,
  `0 2px 6px ${INK.shadowSoft}`
);
set(
  '--dsw-shadow-lv2',
  `0 2px 6px ${PAPER.shadowSoft}, 0 1px 2px ${PAPER.shadowHard}`,
  `0 2px 6px ${INK.shadowSoft}, 0 1px 2px ${INK.shadowHard}`
);
set(
  '--dsw-shadow-lv3',
  `0 6px 16px ${PAPER.shadowDeep}`,
  `0 6px 16px ${INK.shadowDeep}`
);
set('--dsw-elevation-stroke', '0 0 0 .5px var(--dsw-elevation-stroke-color)', '0 0 0 .5px var(--dsw-elevation-stroke-color)');
set('--dsw-elevation-stroke-color', 'var(--dsw-alias-border-l2)', 'var(--dsw-alias-border-l2)');
set(
  '--dsw-elevation-prominent',
  `var(--dsw-elevation-stroke), 0 6px 16px ${PAPER.shadowDeep}`,
  `var(--dsw-elevation-stroke), 0 6px 16px ${INK.shadowDeep}`
);
set(
  '--dsw-elevation-soft',
  `var(--dsw-elevation-stroke), 0 1px 2px ${PAPER.shadowSoft}`,
  `var(--dsw-elevation-stroke), 0 1px 2px ${INK.shadowSoft}`
);
set(
  '--dsw-elevation-panel',
  `var(--dsw-elevation-stroke), 0 10px 24px ${PAPER.shadowDeep}`,
  `var(--dsw-elevation-stroke), 0 10px 24px ${INK.shadowDeep}`
);

// ── Focus ─────────────────────────────────────────────────────────────────
pair('--dsw-focus-ring-color', 'focus');
set('--dsw-focus-ring-width', '2px', '2px');

// ── Shell specifics ───────────────────────────────────────────────────────
pair('--dsw-specific-sidebar-fill', 'sidebar');
pair('--dsw-specific-sidebar-nav-item-active', 'subtleActive');
pair('--dsw-specific-sidebar-nav-item-active-accent', 'accentSoft');
pair('--dsw-specific-sidebar-nav-item-hover', 'subtleHover');
pair('--dsw-specific-input-major', 'composer');
set('--dsw-specific-login-input', PAPER.layer1, INK.layer1);
set('--dsw-specific-selector', PAPER.layer2, INK.layer3);
set('--dsw-specific-tip', PAPER.layer1, INK.layer2);
// The sent message is a sheet of glass, not a slab of paper: it is the one
// block in the transcript the user "owns", and it sits over the water.
set(
  '--dsw-specific-bubble',
  'color-mix(in srgb, #ecebe6 46%, transparent)',
  'color-mix(in srgb, #2b2925 44%, transparent)'
);
set(
  '--dsw-specific-bubble-highlight',
  'color-mix(in srgb, #e3e1db 52%, transparent)',
  'color-mix(in srgb, #34312c 50%, transparent)'
);

// ── Settings and onboarding ───────────────────────────────────────────────
set('--dsw-alias-settings-card-fill', PAPER.layer1, INK.layer1);
set('--dsw-alias-settings-card-stroke', 'rgba(38, 37, 35, 0.10)', 'rgba(255, 247, 240, 0.09)');
pair('--dsw-alias-onboarding-accent', 'accent');
set('--dsw-alias-onboarding-card-fill', PAPER.layer1, INK.layer1);
set('--dsw-alias-onboarding-checkbox-border', 'rgba(38, 37, 35, 0.24)', 'rgba(255, 247, 240, 0.2)');
set('--dsw-alias-onboarding-secondary-fill', PAPER.control, INK.layer3);

// ── Static ramps ──────────────────────────────────────────────────────────
// Every alias ultimately resolves to a static ramp. Re-pointing the ramps keeps
// any alias this list misses inside the paper palette instead of falling back to
// the stock blue-tinted neutrals.
const statics = [
  // Warm neutral ramp, light → dark, at the stock ramp's positions.
  ['--dsw-static-neutral-bluish-00', '#ffffff', '#ffffff'],
  ['--dsw-static-neutral-bluish-50', '#fbfaf7', '#fbfaf7'],
  ['--dsw-static-neutral-bluish-60', '#f8f7f4', '#f8f7f4'],
  ['--dsw-static-neutral-bluish-75', '#f5f4f1', '#f5f4f1'],
  ['--dsw-static-neutral-bluish-100', '#f2f1ed', '#f2f1ed'],
  ['--dsw-static-neutral-bluish-150', '#ecebe6', '#ecebe6'],
  ['--dsw-static-neutral-bluish-200', '#e6e4de', '#e6e4de'],
  ['--dsw-static-neutral-bluish-300', '#d8d5cd', '#d8d5cd'],
  ['--dsw-static-neutral-bluish-400', '#bdb9b3', '#bdb9b3'],
  ['--dsw-static-neutral-bluish-500', '#a9a5a0', '#a9a5a0'],
  ['--dsw-static-neutral-bluish-600', '#8a8680', '#8a8680'],
  ['--dsw-static-neutral-bluish-700', '#6b6862', '#6b6862'],
  ['--dsw-static-neutral-bluish-750', '#4e4b47', '#4e4b47'],
  ['--dsw-static-neutral-bluish-800', '#3a3733', '#3a3733'],
  ['--dsw-static-neutral-bluish-850', '#2e2c28', '#2e2c28'],
  ['--dsw-static-neutral-bluish-875', '#252320', '#252320'],
  ['--dsw-static-neutral-bluish-900', '#201f1c', '#201f1c'],
  ['--dsw-static-neutral-bluish-950', '#1a1917', '#1a1917'],
  ['--dsw-static-neutral-bluish-1000', '#121110', '#121110'],
  ['--dsw-static-neutral-00', '#ffffff', '#ffffff'],
  ['--dsw-static-neutral-50', '#fbfaf7', '#fbfaf7'],
  ['--dsw-static-neutral-100', '#f5f4f1', '#f5f4f1'],
  ['--dsw-static-neutral-150', '#f0efea', '#f0efea'],
  ['--dsw-static-neutral-200', '#e6e4de', '#e6e4de'],
  ['--dsw-static-neutral-250', '#dcd9d2', '#dcd9d2'],
  ['--dsw-static-neutral-300', '#d8d5cd', '#d8d5cd'],
  ['--dsw-static-neutral-400', '#bdb9b3', '#bdb9b3'],
  ['--dsw-static-neutral-500', '#a29e98', '#a29e98'],
  ['--dsw-static-neutral-550', '#8a8680', '#8a8680'],
  ['--dsw-static-neutral-600', '#6b6862', '#6b6862'],
  ['--dsw-static-neutral-700', '#4e4b47', '#4e4b47'],
  ['--dsw-static-neutral-800', '#2e2c28', '#2e2c28'],
  ['--dsw-static-neutral-850', '#252320', '#252320'],
  ['--dsw-static-neutral-900', '#1a1917', '#1a1917'],
  ['--dsw-static-neutral-1000', '#000000', '#000000'],
  // Koi vermilion replaces the stock blue accent family.
  ['--dsw-static-deepseek-50', PAPER.accentSofter, INK.accentSofter],
  ['--dsw-static-deepseek-100', PAPER.accentSoft, INK.accentSoft],
  ['--dsw-static-deepseek-200', '#f4bda9', '#6b2a17'],
  ['--dsw-static-deepseek-300', '#ec9c80', '#8c3319'],
  ['--dsw-static-deepseek-400', '#e07452', INK.accentHover],
  ['--dsw-static-deepseek-450', '#d4512c', INK.accent],
  ['--dsw-static-deepseek-500', PAPER.accent, INK.accent],
  ['--dsw-static-deepseek-600', PAPER.accentHover, '#ef6a42'],
  ['--dsw-static-deepseek-700-delete', PAPER.accentPressed, '#3a1f16'],
  ['--dsw-static-deepseek-800', '#5a2416', '#2a1710'],
  ['--dsw-static-deepseek-900', '#3a1f16', '#1f100b'],
  ['--dsw-static-blue-50', PAPER.accentSofter, INK.accentSofter],
  ['--dsw-static-blue-50p', '#fbf0eb', '#2a1710'],
  ['--dsw-static-blue-75', '#f7ddd3', '#3a1f16'],
  ['--dsw-static-blue-100', PAPER.accentSoft, INK.accentSoft],
  ['--dsw-static-blue-300', '#ec9c80', '#ec9c80'],
  ['--dsw-static-blue-400', '#e07452', '#e07452'],
  ['--dsw-static-blue-450', '#d4512c', INK.accentHover],
  ['--dsw-static-blue-500', PAPER.accent, INK.accent],
  ['--dsw-static-blue-600', PAPER.accentHover, '#ef6a42'],
  ['--dsw-static-blue-800', PAPER.accentPressed, '#3a1f16'],
  ['--dsw-static-blue-900', '#5a2416', '#2a1710'],
  ['--dsw-static-blue-950', '#3a1f16', '#1f100b'],
  // Feedback colours: green/amber/red stay distinct from the vermilion brand.
  ['--dsw-static-green-100', PAPER.successSoft, INK.successSoft],
  ['--dsw-static-green-400', '#7ba63c', '#7ba63c'],
  ['--dsw-static-green-500', PAPER.success, INK.success],
  ['--dsw-static-green-500-a08', 'rgba(77, 124, 15, 0.08)', 'rgba(143, 187, 74, 0.08)'],
  ['--dsw-static-green-500-a12', 'rgba(77, 124, 15, 0.12)', 'rgba(143, 187, 74, 0.12)'],
  ['--dsw-static-green-900', '#2a3218', '#2a3218'],
  ['--dsw-static-amber-100', PAPER.cautionSoft, INK.cautionSoft],
  ['--dsw-static-amber-400', '#e0a94a', '#e0a94a'],
  ['--dsw-static-amber-500', PAPER.caution, INK.caution],
  ['--dsw-static-amber-600', PAPER.caution, INK.caution],
  ['--dsw-static-amber-900', '#332a15', '#332a15'],
  ['--dsw-static-red-50', PAPER.criticalSoft, INK.criticalSoft],
  ['--dsw-static-red-100', PAPER.criticalSoft, INK.criticalSoft],
  ['--dsw-static-red-400', '#ff8f7a', '#ff8f7a'],
  ['--dsw-static-red-400-a12', 'rgba(255, 143, 122, 0.12)', 'rgba(255, 143, 122, 0.12)'],
  ['--dsw-static-red-500', '#c7382c', '#c7382c'],
  ['--dsw-static-red-600', PAPER.critical, INK.critical],
  ['--dsw-static-red-600-a08', 'rgba(179, 38, 30, 0.08)', 'rgba(255, 143, 122, 0.08)'],
  ['--dsw-static-red-900', '#3a1c17', '#3a1c17'],
];
for (const [name, light, dark] of statics) set(name, light, dark);

/** Build stamps, so inspection can tell which revision is live from the page. */
set('--dsw-daoho-build', '1.0.0', '1.0.0');
set('--dsw-daoho-pond', 'live', 'live');

export { tokens, PAPER, INK, MONO, SANS };