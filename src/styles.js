/**
 * styles.js — the parts of the daoho.dev look that a token cannot express.
 *
 * A token can restate a colour, a radius, a shadow. It cannot:
 *
 *  - load a webfont (Geist Mono is vendored, because Windows does not have it);
 *  - place the pond's canvas in the paint order;
 *  - make the shell's frame transparent so the water shows through it;
 *  - restate the site's link treatment, which is an underline rather than a
 *    colour, or its selection colour.
 *
 * Everything here is scoped to `body` or to a `data-*` hook the shell already
 * publishes — never to a hashed CSS-module class — so a DSH update cannot
 * silently turn one of these rules into a stray outline somewhere else.
 *
 * Four declarations carry `!important`, and only four. They are the ones that
 * remove a *painted surface*: the body fill, the frame fill, the centre column
 * fill and the composer fill. The shell declares those with a two-class
 * selector under `[data-windows-titlebar]` (`[data-windows-titlebar] .frame`),
 * which outranks anything a theme can write without also naming a hashed class.
 * Removing the surface is the whole point of a transparent-pond theme, so the
 * flag is honest here rather than a shortcut; everything else stays flag-free.
 */

// Geist Mono 400 and Geist Sans 400/500, base64 WOFF2. SIL Open Font License
// 1.1; the licence text ships beside the sources in `fonts/OFL.txt`.
export function buildStyles(fontCss) {
  return `
/* ── Fonts ────────────────────────────────────────────────────────────────
   The site sets everything in Geist Mono. It is not installed on Windows, so
   the bundle carries the same WOFF2 the site serves, and Cascadia Code NF
   follows it in the stack so the pond's glyph grid and the interface share
   metrics before the webfont settles. */
${fontCss}

/* ── Paint order ──────────────────────────────────────────────────────────
   The shell sets \`body { isolation: isolate }\`, which makes the body a stacking
   context. A negative z-index inside it therefore paints *behind the body's own
   background* and is never seen, so the pond cannot use one.

   Instead the two layers are ordered explicitly, both non-negative:

     #daoho-pond-canvas     z-index: 0   the water
     [data-slot="root"]>div z-index: 1   the shell frame

   Everything the shell renders lives inside the frame, so the whole interface
   paints above the water; only the regions the rules below leave transparent
   let it show. */
#daoho-pond-canvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
  display: block;
}

/* ── Paper ────────────────────────────────────────────────────────────────
   The site's page colour, on the element that actually paints the window. The
   token layer already sets \`--dsw-alias-bg-base\`; this pins the body itself so
   the pond always has paper behind it, whatever the shell paints on top.

   \`html body\` rather than \`body\`, and the flag: token layers stack and the last
   one wins, but stylesheets do not — a material theme earlier in the bundle
   list may have painted Mica here, and Mica is a background *image* over a
   translucent fill, so both declarations are needed. */
html body {
  background-color: var(--dsw-alias-bg-base) !important;
  background-image: none !important;
}

/* ── The frame ────────────────────────────────────────────────────────────
   Lifted one level above the canvas and made transparent, so the water shows
   wherever a panel does not paint its own paper. Only the frame's own fill is
   removed: the sidebar, the status strip and the composer keep theirs below.

   On Windows the shell paints the frame with \`--dsw-specific-sidebar-fill\`
   because that fill also backs the titlebar strip. The strip is painted by the
   frame's \`::before\`, which is left alone — so the titlebar stays paper while
   the frame's body becomes water. */
body [data-slot="root"] > div {
  position: relative;
  z-index: 1;
  background-color: transparent !important;
}

/* ── Transparency chain ───────────────────────────────────────────────────
   The centre column and the transcript are opaque in the stock theme, which
   would hide the pond completely. They become transparent here; the sidebar,
   the status strip and the composer keep solid paper because text sits
   directly on them.

   The column classes are hashed CSS-module names, so the centre column is
   reached through the \`data-slot="main"\` hook it contains, and the transcript
   through the \`data-conversation-*\` hooks the shell publishes. */
body [data-slot="main"],
body [data-slot="main.conversation"],
body [data-slot="main.conversation"] > div,
body [data-conversation-content],
body [data-conversation-scroll],
body [data-conversation-region="chat"] {
  background-color: transparent;
}
/* The centre column itself: the only element whose child is the main slot. */
body div:has(> [data-slot="main"]) {
  background-color: transparent !important;
}

/* ── Content surfaces that stay solid ─────────────────────────────────────
   Navigation, the status strip and the composer are read at a glance, so they
   keep paper. They are also the boxes the koi steer around.

   Scoped through \`html\` as well, so an earlier material theme that tinted the
   navigation pane (Mica Alt) cannot keep its gradient once this theme is
   active. */
html body [data-slot="sidebar"] {
  background-color: var(--dsw-specific-sidebar-fill);
  background-image: none;
  border-right: 1px solid var(--dsw-alias-border-l1);
}
html body [data-shell-bottom] {
  background-color: var(--dsw-alias-bg-base);
  border-top: 1px solid var(--dsw-alias-border-l1);
}
html body [data-composer-card] {
  background-color: var(--dsw-alias-bg-base) !important;
  background-image: none !important;
  border: 1px solid var(--dsw-alias-border-l2);
  box-shadow: var(--dsw-shadow-lv2);
}
/* The site's composer carries a hairline and nothing else; an accent underline
   would fight the pond. */
html body [data-composer-card]:focus-within {
  border-color: var(--dsw-alias-border-l3);
}

/* ── Link treatment ───────────────────────────────────────────────────────
   The site never colours a link; it underlines one, faintly, and firms the
   underline on hover. Reproduced here for prose links only. */
body [data-chat-flow] a,
body [data-daoho-prose] a {
  color: inherit;
  text-decoration-line: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 4px;
  text-decoration-color: color-mix(in srgb, currentColor 35%, transparent);
  transition: text-decoration-color 150ms ease;
}
body [data-chat-flow] a:hover,
body [data-chat-flow] a:focus-visible,
body [data-daoho-prose] a:hover,
body [data-daoho-prose] a:focus-visible {
  text-decoration-color: currentColor;
}

/* ── Selection ────────────────────────────────────────────────────────────
   Vermilion, at the same strength the site uses for its document selection. */
body ::selection {
  background-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 26%, transparent);
}

/* ── Focus ────────────────────────────────────────────────────────────────
   A hairline ring, offset one pixel — the site's focus outline is a thin
   stroke, not a glow. */
body :focus-visible {
  outline-offset: 1px;
}

/* ── Menus and popovers ───────────────────────────────────────────────────
   Paper, not glass: the menu fill is opaque and the acrylic blur is switched
   off in the token layer. */
body [data-menu-material],
body [role="menu"],
body [role="listbox"] {
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
}

/* ── Scrollbars ───────────────────────────────────────────────────────────
   Thinner than the stock 5px, and warm. */
body {
  --dsh-scrollbar-width: 4px;
  --dsh-scrollbar-thumb-border: 1px;
}

/* ── Reduced transparency ─────────────────────────────────────────────────
   A user who asked Windows for less transparency gets flat paper: the pond
   stops painting (the engine clears it) and the frame regains its own fill so
   nothing depends on the canvas. */
@media (prefers-reduced-transparency: reduce) {
  #daoho-pond-canvas { display: none; }
  body [data-slot="root"] > div {
    background-color: var(--dsw-alias-bg-base) !important;
  }
  body div:has(> [data-slot="main"]) {
    background-color: var(--dsw-alias-bg-base) !important;
  }
}

/* ── Print ────────────────────────────────────────────────────────────────
   The pond is decoration; paper is what gets printed. */
@media print {
  #daoho-pond-canvas { display: none; }
}
`;
}