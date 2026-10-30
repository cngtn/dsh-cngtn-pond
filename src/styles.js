/**
 * styles.js — the parts of the original look that a token cannot express.
 *
 * A token can restate a colour, a radius, a shadow. It cannot:
 *
 *  - place the pond's canvas in the paint order;
 *  - make the shell's frame transparent so the water shows through it;
 *  - build a frosted panel, because the blur has to live on a pseudo-element;
 *  - restate the site's link treatment, which is an underline rather than a
 *    colour, or its selection colour.
 *
 * Everything here is scoped to `body`, `html body`, or to a `data-*` hook the
 * shell publishes — never to a hashed CSS-module class — so a DSH update cannot
 * silently turn one of these rules into a stray outline somewhere else.
 *
 * Four declarations carry `!important`, and only four kinds. They are the ones
 * that remove a *painted surface*: the body fill, the frame fill, the centre
 * column fill, and the fills of the panels that become glass. The shell declares
 * those with a two-class selector under `[data-windows-titlebar]`
 * (`[data-windows-titlebar] .frame`), which outranks anything a theme can write
 * without also naming a hashed class. Removing the surface is the whole point of
 * a transparent-pond theme, so the flag is honest here rather than a shortcut;
 * every purely stylistic rule stays flag-free.
 */

export function buildStyles() {
  return `
/* ── Paint order ──────────────────────────────────────────────────────────
   The shell sets \`body { isolation: isolate }\`, which makes the body a stacking
   context. A negative z-index inside it therefore paints *behind the body's own
   background* and is never seen, so the pond cannot use one.

   Instead the two layers are ordered explicitly, both non-negative:

     #cngtn-pond-canvas     z-index: 0   the water
     [data-slot="root"]>div z-index: 1   the shell frame

   Everything the shell renders lives inside the frame, so the whole interface
   paints above the water; only the regions the rules below leave transparent
   let it show. */
#cngtn-pond-canvas {
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
   removed: the panels keep theirs below.

   On Windows the shell paints the frame with \`--dsw-specific-sidebar-fill\`
   because that fill also backs the titlebar strip. The strip is painted by the
   frame's \`::before\`, which is left alone — so the titlebar stays paper while
   the frame's body becomes water. */
body [data-slot="root"] > div {
  position: relative;
  z-index: 1;
  background-color: transparent !important;
}

/* ── The Windows titlebar strip ───────────────────────────────────────────
   The strip that carries the window caption and the \`Application / Edit\` menu
   is the frame's \`::before\`: 40px tall, \`-webkit-app-region: drag\`, painted
   with \`--dsw-specific-sidebar-fill\`.

   It is **transparent**: no fill, no blur. The pond runs all the way to the top
   edge of the window, and the caption floats over the water like the rest of the
   interface.

   Two consequences, both accepted deliberately:

   - The minimise / maximise / close buttons are drawn by Electron in a block
     whose colour comes from the same token, and Windows composites that block
     without alpha. They stay an opaque block in the top-right corner; nothing in
     a theme can change that.
   - The caption text and the menu labels sit directly on moving glyphs. They
     keep their own hover fills and the label colours, which is enough to read
     them, but there is no paper behind them.

   The drag region is untouched: the pseudo-element owns no children, so it
   cannot become a containing block for anything. */
html[data-windows-titlebar] body [data-slot="root"] > div::before {
  background-color: transparent;
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
}

/* ── Transparency chain ───────────────────────────────────────────────────
   The centre column and the transcript are opaque in the stock theme, which
   would hide the pond completely. They become transparent here; the panels
   become glass further down.

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

/* ── Glass panels ─────────────────────────────────────────────────────────
   The site can cover its water with paper because it has exactly one surface.
   A shell cannot: navigation, the composer and the side panels all float over
   the pond, and painting them opaque hides the theme entirely. So each one is a
   frosted sheet — a translucent paper tint over a backdrop blur — and the koi
   read through it as slow moving texture.

   Two rules make this safe, and both matter:

   1. **The blur is always on a \`::before\`, never on the panel.** A
      \`backdrop-filter\` makes its element a containing block for \`position:
      fixed\` descendants. The sidebar owns a fixed collapse button; blurring the
      column directly drags that button from y=6 to y=46, out of the titlebar and
      over the first row. The pseudo-element keeps the blur in its own layer, so
      the button never moves.

   2. **The panel's own fill is cleared, not just recoloured.** The shell paints
      the sidebar column, the sidebar root, the right pane and the composer card
      each with their own background; leaving any of them opaque defeats the blur
      beneath it.

   The tints are strong enough to hold body text at readable contrast while
   still letting a koi's colour through. */
html body [data-slot="root"] > div > div:nth-child(1),
html body [data-slot="sidebar"],
html body [data-slot="sidebar"] > *,
html body [data-rightbar-col],
html body [data-rightbar-col] > *,
html body [data-rightbar-col] section,
html body [data-composer-card] {
  background-color: transparent !important;
  background-image: none !important;
}

html body [data-slot="root"] > div > div:nth-child(1),
html body [data-rightbar-col],
html body [data-composer-card] {
  position: relative;
}

html body [data-slot="root"] > div > div:nth-child(1)::before,
html body [data-rightbar-col]::before,
html body [data-composer-card]::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  backdrop-filter: blur(24px) saturate(150%);
}
html body [data-slot="root"] > div > div:nth-child(1)::before {
  background-color: color-mix(in srgb, var(--dsw-specific-sidebar-fill) 40%, transparent);
}
html body [data-rightbar-col]::before {
  background-color: color-mix(in srgb, var(--dsw-alias-bg-base) 40%, transparent);
}
html body [data-composer-card]::before {
  border-radius: inherit;
  background-color: color-mix(in srgb, var(--dsw-alias-bg-base) 34%, transparent);
}

/* ── The sidebar, as a floating card ──────────────────────────────────────
   The frame is a three-column grid (sidebar / centre / right), and the sidebar
   column is its first cell. Rather than margin the cell — which would leave the
   grid's 280px track half empty and desynchronise the resize handle — the cell
   keeps its track and gains **padding**, so the card is drawn inside it:

     column 280px  →  card 264px, inset 8px on every side

   The column's own fill is already transparent (above), and its \`::before\`
   carries the glass. Rounding both the column and that pseudo-element gives the
   card its corners; \`overflow: hidden\` clips the sidebar's own rows to them, so
   a hover fill or a long workspace name cannot spill past the radius.

   The inner sidebar root is a fixed 280px box, which would overflow the padded
   cell; it is widened to 100% so the rows reflow into the card. That is the one
   structural assumption here — if a future build drops the fixed width, the
   override is a no-op.

   The shadow is what makes the card read as *above* the water rather than cut
   out of it, and it is the only shadow the theme gives a panel. */
html body [data-slot="root"] > div > div:nth-child(1) {
  padding: 10px 12px 20px 18px;
  /* Visible, so the card's shadow can fall outside the column. Clipping the
     column was what kept the shadow to a 12px band at its edge. The rows are
     clipped by the inner root instead (below), which is the same box. */
  overflow: visible;
}

/* The card *is* the pseudo-element, and it is inset from the column on all four
   sides — more on the left and the bottom, where the window edge is. The column
   keeps the full grid track, so the resize handle and the centre column stay
   where the shell put them; only the painted card moves inward.

   The chrome lives here rather than on the column for the same reason: a border
   or a shadow on the column would sit at x=0 and read as a seam against the
   screen edge instead of as a floating edge. */
html body [data-slot="root"] > div > div:nth-child(1)::before {
  inset: 10px 12px 20px 18px;
  border-radius: 14px;
  border: 0.5px solid var(--dsw-alias-border-l1);
  /* Seven stacked layers, not one: see \`--cngtn-shadow-card\` in tokens.js. */
  box-shadow: var(--cngtn-shadow-card);
  background-color: color-mix(in srgb, var(--dsw-specific-sidebar-fill) 55%, transparent);
}

/* Collapsed, the column is an 18px rail holding one expand button. A card there
   would be a sliver, so the card styling is dropped and the rail stays bare. The
   shell marks the frame, not the column, so the rule reaches down from there. */
html body [data-slot="root"] > div[data-sidebar-collapsed] > div:nth-child(1) {
  padding: 0;
  overflow: visible;
}

html body [data-slot="root"] > div[data-sidebar-collapsed] [data-slot="sidebar"] > div {
  border-radius: 0;
  overflow: visible;
}

html body [data-slot="root"] > div[data-sidebar-collapsed] > div:nth-child(1)::before {
  inset: 0;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  background-color: transparent;
}

/* The inner root is a fixed-width box; let it follow the padded cell, and give
   it the card's shape so rows clip to the rounded corners. Its box is exactly
   the card's box — the column's padding is the inset — so the two radii agree
   without a second measurement. */
html body [data-slot="sidebar"] > div {
  width: 100% !important;
  max-width: 100%;
  box-sizing: border-box;
  border-radius: 14px;
  overflow: hidden;
}

html body [data-rightbar-col]::before {
  inset: 10px 18px 20px 12px;
  border-radius: 14px;
  border: 0.5px solid var(--dsw-alias-border-l1);
  box-shadow: var(--cngtn-shadow-card);
  background-color: color-mix(in srgb, var(--dsw-alias-bg-base) 55%, transparent);
}

html body [data-slot="root"] > div[data-rightbar-collapsed] [data-rightbar-col]::before {
  display: none;
}

/* Closed panel: no card, whatever the track still occupies. */
html body [data-rightbar-col]:not(:has([data-sidebar-right-open]))::before {
  display: none;
}

html body [data-rightbar-col] [data-sidebar-right-panel="push"][data-sidebar-right-open] {
  top: 10px;
  right: 18px;
  bottom: 20px;
  left: 12px;
  width: auto !important;
  max-width: none;
  box-sizing: border-box;
  border-radius: 14px;
  overflow: clip;
}

/* The dock pane's own hairline and single-sided radius are the old flush edge. */
html body [data-rightbar-col] [data-dockkit-pane],
html body [data-rightbar-col] [data-dockkit-content]:not([data-dockkit-float]),
html body [data-rightbar-col] [data-dockkit-empty] {
  border: 0 !important;
  border-radius: inherit !important;
  background-color: transparent !important;
}

html body [data-slot="root"] > div[data-rightbar-fullscreen] > [data-rightbar-col]:has([data-sidebar-right-open]) {
  z-index: 15;
}

html body [data-rightbar-col] [data-sidebar-right-panel="fullscreen"][data-sidebar-right-open] {
  top: 10px;
  right: 18px;
  bottom: 20px;
  left: auto;
  width: calc(100vw - var(--dsh-windows-sidebar-width, 280px) - 30px) !important;
  max-width: none !important;
  box-sizing: border-box;
  border-radius: 14px;
  border: 0.5px solid var(--dsw-alias-border-l1);
  box-shadow: var(--cngtn-shadow-card);
  overflow: clip;
  isolation: isolate;
}

html body [data-rightbar-col] [data-sidebar-right-panel="fullscreen"][data-sidebar-right-open] > * {
  width: 100%;
}

html body [data-rightbar-col] [data-sidebar-right-panel="fullscreen"][data-sidebar-right-open]::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  border-radius: inherit;
  background-color: color-mix(in srgb, var(--dsw-alias-bg-base) 58%, transparent);
  -webkit-backdrop-filter: blur(26px) saturate(150%);
  backdrop-filter: blur(26px) saturate(150%);
}

html body [data-slot="root"] > div[data-rightbar-fullscreen] > [data-rightbar-col]::before {
  display: none;
}

/* The status strip is a 1px rule, not a surface, so it stays paper and the rule
   reads as a rule. */
html body [data-shell-bottom] {
  background-color: var(--dsw-alias-bg-base);
  border-top: 1px solid var(--dsw-alias-border-l1);
}

html body [data-composer-card] {
  border: 1px solid var(--dsw-alias-border-l2);
  box-shadow: var(--dsw-shadow-lv2);
}
/* The site's composer carries a hairline and nothing else; an accent underline
   would fight the pond. */
html body [data-composer-card]:focus-within {
  border-color: var(--dsw-alias-border-l3);
}

/* ── The composer's paper curtain ─────────────────────────────────────────
   The shell fades the transcript into the composer with a
   \`linear-gradient(transparent, paper 36px)\` painted on the composer's seat.
   That gradient is the one thing that still hides the water there: it covers the
   last 130px of the transcript with solid paper, and no blur below it can show
   through. Removing it lets the last message sit directly over the pond. */
html body [data-composer-seat] {
  background-image: none !important;
}

/* ── Two frosted blocks in the transcript ─────────────────────────────────
   The transcript itself stays clear water, so the response prose is read
   straight off the page — the way the site reads its own text. Only two blocks
   get a sheet of glass, because only two are bounded surfaces rather than
   flowing text:

   - the sent message bubble, the one block the user owns;
   - the code / command card, where monospace output would otherwise sit on
     moving glyphs.

   The fills are made translucent in the token layer; the blur lives here. Both
   elements are self-contained (no \`position: fixed\` descendant), so the filter
   can sit on the element instead of a pseudo-element.

   The command card's output pane is the shell's \`ioCard\`; its class is hashed,
   so it is matched on the module-name suffix the same way the bubble is. If a
   future build renames it, the card simply keeps its paper fill — no layout
   depends on this rule. */
html body [class*="_bubble"],
html body .md-code-block,
html body [class*="_ioCard"] {
  /* 14px, not 30: the koi is an 8px glyph grid, and a wider radius averages it
     into a flat wash. At 14px the fish is clearly softened but still reads as a
     shape, which is what makes the glass legible as glass. */
  -webkit-backdrop-filter: blur(14px) saturate(155%);
  backdrop-filter: blur(14px) saturate(155%);
}

/* The code block's banner sits in a wrapper the renderer paints with the plain
   page colour, which would put an opaque 42px band across the top of an
   otherwise frosted card. The wrapper is a hashed class, so it is reached
   through the \`data-code-block-banner\` hook it contains. */
html body div:has(> [data-code-block-banner]) {
  background-color: transparent;
}

/* ── The Trajectory tab ───────────────────────────────────────────────────
   Trajectory is not a transcript: it is a ledger of every step, rendered as a
   real <table> inside its own overlay. The overlay paints the page colour, so
   the tab is the one view where the pond disappears completely; the rows are
   table cells with no surface of their own, so the list reads as one long
   striped block rather than as items.

   Two changes, both scoped to hooks the shell publishes:

   1. **The pane becomes glass.** \`[data-conversation-composer-overlay]\` only
      exists in this tab (the Chat view does not render it), which makes it a
      precise hook rather than a guess. Its sticky filter bar keeps a stronger
      tint so the checkboxes and search stay legible while the ledger scrolls
      underneath.

   2. **Each row becomes a card.** A \`<tr>\` cannot carry a radius, so the row is
      rounded through its two cells: the first gets the left corners, the last
      the right ones, and both share one tint and one blur. \`border-spacing\`
      supplies the gap between cards. This keeps \`table-layout: fixed\` and the
      virtualiser's row measurement intact — the only thing that changes is that
      a row is now 36px tall instead of 30px, which the virtualiser measures.

   The cells are hashed classes, so everything here is reached through
   \`[data-trajectory-scroll]\` and \`[data-trajectory-row-key]\`. */
html body [data-conversation-composer-overlay] {
  background-color: transparent !important;
  background-image: none !important;
}

/* The filter bar: sticky, so it needs its own material to stay readable. */
html body [data-conversation-composer-overlay] > div:first-child {
  background-color: color-mix(in srgb, var(--dsw-alias-bg-base) 58%, transparent) !important;
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  backdrop-filter: blur(16px) saturate(150%);
}

/* The split pane that wraps the scroll area: the only \`:has()\` besides the
   centre column, and for the same reason — the wrapper has no hook of its own. */
html body div:has(> [data-trajectory-scroll]) {
  background-color: transparent !important;
  background-image: none !important;
}

html body [data-trajectory-scroll] {
  background-color: color-mix(in srgb, var(--dsw-alias-bg-base) 18%, transparent) !important;
  -webkit-backdrop-filter: blur(14px) saturate(150%);
  backdrop-filter: blur(14px) saturate(150%);
}

html body [data-trajectory-scroll] > table {
  background-color: transparent !important;
  background-image: none !important;
  border-collapse: separate !important;
  border-spacing: 0 6px !important;
}

html body [data-trajectory-scroll] tr[data-trajectory-row-key] > td {
  background-color: color-mix(in srgb, var(--dsw-alias-bg-base) 30%, transparent) !important;
  border-top: 0.5px solid var(--dsw-alias-border-l1);
  border-bottom: 0.5px solid var(--dsw-alias-border-l1);
  -webkit-backdrop-filter: blur(14px) saturate(150%);
  backdrop-filter: blur(14px) saturate(150%);
}

html body [data-trajectory-scroll] tr[data-trajectory-row-key] > td:first-child {
  border-left: 0.5px solid var(--dsw-alias-border-l1);
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
}

html body [data-trajectory-scroll] tr[data-trajectory-row-key] > td:last-child {
  border-right: 0.5px solid var(--dsw-alias-border-l1);
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
}

html body [data-trajectory-scroll] tr[data-trajectory-row-key]:hover > td {
  background-color: color-mix(in srgb, var(--dsw-alias-bg-base) 46%, transparent) !important;
}

/* ── Link treatment ───────────────────────────────────────────────────────
   The site never colours a link; it underlines one, faintly, and firms the
   underline on hover. Reproduced here for prose links only. */
body [data-chat-flow] a,
body [data-cngtn-prose] a {
  color: inherit;
  text-decoration-line: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 4px;
  text-decoration-color: color-mix(in srgb, currentColor 35%, transparent);
  transition: text-decoration-color 150ms ease;
}
body [data-chat-flow] a:hover,
body [data-chat-flow] a:focus-visible,
body [data-cngtn-prose] a:hover,
body [data-cngtn-prose] a:focus-visible {
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

/* ── Scrollbars ───────────────────────────────────────────────────────────
   Thinner than the stock 5px, and warm. */
body {
  --dsh-scrollbar-width: 4px;
  --dsh-scrollbar-thumb-border: 1px;
}

/* ── Reduced transparency ─────────────────────────────────────────────────
   A user who asked Windows for less transparency gets flat paper: the pond
   stops painting (the engine clears it) and every glass panel regains its own
   fill, so nothing depends on the canvas. */
@media (prefers-reduced-transparency: reduce) {
  #cngtn-pond-canvas { display: none; }
  body [data-slot="root"] > div {
    background-color: var(--dsw-alias-bg-base) !important;
  }
  body div:has(> [data-slot="main"]) {
    background-color: var(--dsw-alias-bg-base) !important;
  }
  html body [data-slot="root"] > div > div:nth-child(1),
  html body [data-rightbar-col],
  html body [data-composer-card] {
    background-color: var(--dsw-alias-bg-base) !important;
  }
  html body [data-slot="root"] > div > div:nth-child(1)::before,
  html body [data-rightbar-col]::before,
  html body [data-composer-card]::before {
    display: none;
  }
  html body [class*="_bubble"],
  html body .md-code-block,
  html body [class*="_ioCard"] {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
  html[data-windows-titlebar] body [data-slot="root"] > div::before {
    background-color: var(--dsw-specific-sidebar-fill);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
  html body [data-conversation-composer-overlay] {
    background-color: var(--dsw-alias-bg-base) !important;
  }
  html body [data-conversation-composer-overlay] > div:first-child,
  html body [data-trajectory-scroll],
  html body [data-trajectory-scroll] tr[data-trajectory-row-key] > td {
    background-color: var(--dsw-alias-bg-base) !important;
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}

/* ── Print ────────────────────────────────────────────────────────────────
   The pond is decoration; paper is what gets printed. */
@media print {
  #cngtn-pond-canvas { display: none; }
  html body [data-slot="root"] > div > div:nth-child(1)::before,
  html body [data-rightbar-col]::before,
  html body [data-composer-card]::before {
    display: none;
  }
  html body [class*="_bubble"],
  html body .md-code-block,
  html body [class*="_ioCard"],
  html body [data-trajectory-scroll],
  html body [data-trajectory-scroll] tr[data-trajectory-row-key] > td {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}
`;
}
