/**
 * apply.js — the Client plugin body.
 *
 * Three effects, in the order the site layers itself: the pond first (so its
 * canvas exists before anything is measured), then the token layer, then the
 * stylesheet.
 *
 * `ctx.effect` runs its callback synchronously and takes the returned disposer,
 * so a failure inside one of them is caught here and reported with a real stack
 * instead of taking the whole web boot down as "entry failed". The theme is
 * allowed to be the only thing that works: if the canvas cannot be created, the
 * paper palette still applies.
 */

/** Layer identity for the token override; also the plugin's display id. */
const ID = '@local/dsh-daoho-pond';

/** Required Client services: the theme registry owns the token layer. */
const inject = ['theme'];

/**
 * Mount the pond behind the shell.
 *
 * The canvas is the body's first child and carries `z-index: -1`. That places it
 * above the body's own background (which is the paper) and below every in-flow
 * descendant, so the shell's panels paint over the water and only the regions
 * the stylesheet made transparent let it show. Appending it last would put it on
 * top of the sidebar instead — a positioned element at `z-index: 0` beats static
 * content.
 */
function mountPond() {
  try {
    if (typeof document === 'undefined' || document.body === null) return () => {};

    // One canvas per document, even across a hot reload of this plugin.
    const stale = document.querySelector('#daoho-pond-canvas');
    if (stale !== null) stale.remove();

    const canvas = document.createElement('canvas');
    canvas.id = 'daoho-pond-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    // The canvas never takes input, so a click anywhere still reaches the
    // control under it.
    canvas.style.pointerEvents = 'none';
    document.body.insertBefore(canvas, document.body.firstChild);

    let engine = null;
    try {
      engine = new PondEngine(canvas, {
        // The shell has less open water than a full-screen page: fewer fish, and
        // a cap on the grid so a very large window stays cheap.
        budget: 0.7,
        maxCells: 26000,
      });
    } catch (error) {
      canvas.remove();
      console.error('[daoho-pond] engine unavailable:', error && error.message);
      return () => {};
    }

    // The shell swaps the palette by toggling an attribute on the body, not by
    // remounting anything, so the pond follows it with an observer.
    const paletteObserver = new MutationObserver(() => engine.setTheme(engine.readIsLight()));
    paletteObserver.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] });

    return () => {
      paletteObserver.disconnect();
      engine.destroy();
      canvas.remove();
    };
  } catch (error) {
    console.error('[daoho-pond] mount failed:', error && (error.stack || error.message));
    return () => {};
  }
}

/** Insert the daoho stylesheet once; the returned disposer removes it. */
function injectStyles() {
  try {
    if (typeof document === 'undefined' || document.head === null) return () => {};
    const tagId = ID + '/styles';
    const existing = document.querySelector('style[data-plugin-css="' + tagId + '"]');
    if (existing !== null) return () => existing.remove();
    const tag = document.createElement('style');
    tag.dataset.plugin = ID;
    tag.dataset.pluginCss = tagId;
    tag.textContent = buildStyles(FONT_CSS);
    document.head.appendChild(tag);
    return () => tag.remove();
  } catch (error) {
    console.error('[daoho-pond] styles failed:', error && (error.stack || error.message));
    return () => {};
  }
}

/** Client plugin body: the pond, the token layer, then the stylesheet. */
function apply(ctx) {
  try {
    const theme = ctx.theme;
    ctx.effect(() => mountPond(), 'daoho-pond: koi pond');
    ctx.effect(() => theme.overrideTokens(ID, tokens), 'daoho-pond: token layer');
    ctx.effect(() => injectStyles(), 'daoho-pond: stylesheet');
  } catch (error) {
    console.error('[daoho-pond] apply failed:', error && (error.stack || error.message));
    throw error;
  }
}