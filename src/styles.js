/**
 * styles.js — the parts of the daoho.dev look that a token cannot express.
 *
 * A token can restate a colour, a radius, a shadow. It cannot:
 *
 *  - load a webfont (Geist Mono is vendored, because Windows does not have it);
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
   with \`--dsw-specific-sidebar-fill\`. Left alone it is a solid paper band
   across the top of an otherwise glass window.

   It becomes a frosted sheet like the panels. The menu lives in a shadow root,
   so its buttons cannot be restyled from here, but it inherits the theme's font
   and label tokens and floats above this strip — the blur is what makes the two
   read as one surface.

   The pseudo-element owns no children, so the containing-block hazard that
   forced the panels onto \`::before\` does not apply, and the drag region is
   untouched. */
html[data-windows-titlebar] body [data-slot="root"] > div::before {
  background-color: color-mix(in srgb, var(--dsw-specific-sidebar-fill) 58%, transparent);
  -webkit-backdrop-filter: blur(22px) saturate(150%);
  backdrop-filter: blur(22px) saturate(150%);
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

/* The sidebar keeps its hairline, drawn above the glass. */
html body [data-slot="root"] > div > div:nth-child(1) {
  border-right: 1px solid var(--dsw-alias-border-l1);
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
  -webkit-backdrop-filter: blur(18px) saturate(145%);
  backdrop-filter: blur(18px) saturate(145%);
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
  #daoho-pond-canvas { display: none; }
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
}

/* ── Print ────────────────────────────────────────────────────────────────
   The pond is decoration; paper is what gets printed. */
@media print {
  #daoho-pond-canvas { display: none; }
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
}
`;
}