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
const ID = '@local/dsh-cngtn-pond';

/** Required Client services: the theme registry owns the token layer. */
const inject = ['theme'];

/**
 * Pond settings.
 *
 * Three sources, in increasing priority:
 *
 *  1. the defaults below;
 *  2. the bundle's own \`config\` in \`cordis.patch.yml\`, so a profile can ship a
 *     house style;
 *  3. what the user picked in the Pond panel, kept in \`localStorage\` so it
 *     survives a restart without any host write.
 *
 * The values are validated here rather than trusted: a config file is just
 * text, and an out-of-range count would either empty the pond or flood it.
 */
const STORAGE_KEY = 'cngtn-pond:settings';
const DEFAULTS = { fish: null, young: true, palette: 'mixed' };

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw === null ? {} : JSON.parse(raw);
    return parsed !== null && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeSettings(raw) {
  const source = raw !== null && typeof raw === 'object' ? raw : {};
  const fish = Number.isFinite(source.fish) ? Math.min(12, Math.max(3, Math.round(source.fish))) : null;
  const palette = PALETTE_PRESETS.includes(source.palette) ? source.palette : DEFAULTS.palette;
  const young = typeof source.young === 'boolean' ? source.young : DEFAULTS.young;
  return { fish, young, palette };
}

function persistSettings(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // A blocked storage API must not stop the pond from changing.
  }
}

/** The live engine, so the panel and the console API can retune it in place. */
let activeEngine = null;

/** Apply a settings patch to the running pond and remember it. */
function applySettings(patch) {
  const next = normalizeSettings({ ...readStored(), ...patch });
  persistSettings(next);
  if (activeEngine !== null) {
    try {
      activeEngine.setOptions(next);
    } catch (error) {
      console.error('[cngtn-pond] settings failed:', error && error.message);
    }
  }
  refreshPanel();
  return next;
}

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
function mountPond(settings) {
  try {
    if (typeof document === 'undefined' || document.body === null) return () => {};

    // One canvas per document, even across a hot reload of this plugin.
    const stale = document.querySelector('#cngtn-pond-canvas');
    if (stale !== null) stale.remove();

    const canvas = document.createElement('canvas');
    canvas.id = 'cngtn-pond-canvas';
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
        fish: settings.fish,
        young: settings.young,
        palette: settings.palette,
      });
      activeEngine = engine;
    } catch (error) {
      canvas.remove();
      console.error('[cngtn-pond] engine unavailable:', error && error.message);
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
      if (activeEngine === engine) activeEngine = null;
    };
  } catch (error) {
    console.error('[cngtn-pond] mount failed:', error && (error.stack || error.message));
    return () => {};
  }
}

/** Insert the cngtn stylesheet once; the returned disposer removes it. */
function injectStyles() {
  try {
    if (typeof document === 'undefined' || document.head === null) return () => {};
    const tagId = ID + '/styles';
    const existing = document.querySelector('style[data-plugin-css="' + tagId + '"]');
    if (existing !== null) return () => existing.remove();
    const tag = document.createElement('style');
    tag.dataset.plugin = ID;
    tag.dataset.pluginCss = tagId;
    tag.textContent = buildStyles();
    document.head.appendChild(tag);
    return () => tag.remove();
  } catch (error) {
    console.error('[cngtn-pond] styles failed:', error && (error.stack || error.message));
    return () => {};
  }
}

/**
 * The Pond panel: three controls, no host form API.
 *
 * DSH's bundle-config slot hands a plugin a host-owned form whose shape is not
 * part of the published contract, so this panel is plain DOM instead: it renders
 * with the theme's own tokens, works whether or not the slot exists, and cannot
 * break the settings page if it fails.
 */
let panel = null;

function panelStyles() {
  return {
    position: 'fixed',
    top: '96px',
    right: '24px',
    width: '268px',
    zIndex: '60',
    padding: '14px 16px 12px',
    borderRadius: '12px',
    border: '0.5px solid var(--dsw-alias-border-l2)',
    backgroundColor: 'color-mix(in srgb, var(--dsw-alias-bg-overlay, #fbfaf7) 86%, transparent)',
    backdropFilter: 'blur(20px) saturate(150%)',
    WebkitBackdropFilter: 'blur(20px) saturate(150%)',
    boxShadow: 'var(--dsw-shadow-lv3)',
    color: 'var(--dsw-alias-label-primary)',
    font: 'var(--dsw-font-xs-13, 13px/20px var(--dsw-font-family))',
  };
}

function row() {
  const el = document.createElement('div');
  el.style.cssText = 'display:flex;align-items:center;gap:10px;margin-top:10px';
  return el;
}

function label(text) {
  const el = document.createElement('span');
  el.textContent = text;
  el.style.cssText = 'flex:0 0 58px;color:var(--dsw-alias-label-secondary)';
  return el;
}

/** The count the pond is actually drawing, so the slider never lies. */
function liveFishCount(fallback) {
  if (activeEngine !== null) {
    try {
      return activeEngine.world.koi.length;
    } catch {
      // fall through to the stored value
    }
  }
  return fallback;
}

function openPanel() {
  if (panel !== null && panel.isConnected) {
    panel.remove();
    panel = null;
    return;
  }
  if (typeof document === 'undefined' || document.body === null) return;

  const current = normalizeSettings(readStored());
  const card = document.createElement('div');
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-label', 'Pond settings');
  Object.assign(card.style, panelStyles());

  const head = row();
  head.style.marginTop = '0';
  const title = document.createElement('strong');
  title.textContent = 'Pond';
  title.style.cssText = 'flex:1;font-weight:600';
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = '×';
  close.setAttribute('aria-label', 'Close');
  close.style.cssText =
    'border:0;background:transparent;color:var(--dsw-alias-label-tertiary);font-size:16px;line-height:1;cursor:pointer;padding:2px 4px';
  close.addEventListener('click', () => openPanel());
  head.append(title, close);

  // Fish count.
  const fishRow = row();
  const fishLabel = label('Fish');
  const fish = document.createElement('input');
  fish.type = 'range';
  fish.min = '3';
  fish.max = '12';
  fish.step = '1';
  fish.value = String(current.fish ?? liveFishCount(5));
  fish.style.cssText = 'flex:1;accent-color:var(--dsw-alias-brand-primary)';
  const fishValue = document.createElement('span');
  fishValue.textContent = fish.value;
  fishValue.style.cssText = 'flex:0 0 18px;text-align:right;font-variant-numeric:tabular-nums';
  fish.addEventListener('input', () => {
    fishValue.textContent = fish.value;
    applySettings({ fish: Number(fish.value) });
  });
  fishRow.append(fishLabel, fish, fishValue);

  // Palette.
  const paletteRow = row();
  const paletteLabel = label('Colour');
  const palette = document.createElement('select');
  palette.style.cssText =
    'flex:1;min-width:0;padding:3px 6px;border-radius:6px;border:0.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:inherit;font:inherit';
  for (const [value, text] of [
    ['mixed', 'Mixed'],
    ['warm', 'Warm (red, gold)'],
    ['cool', 'Cool (blue, silver)'],
    ['mono', 'Ink only'],
  ]) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    palette.append(option);
  }
  palette.value = current.palette;
  palette.addEventListener('change', () => applySettings({ palette: palette.value }));
  paletteRow.append(paletteLabel, palette);

  // Young koi.
  const youngRow = row();
  const youngLabel = document.createElement('label');
  youngLabel.style.cssText = 'display:flex;align-items:center;gap:8px;color:var(--dsw-alias-label-secondary);cursor:pointer';
  const young = document.createElement('input');
  young.type = 'checkbox';
  young.checked = current.young;
  young.style.accentColor = 'var(--dsw-alias-brand-primary)';
  young.addEventListener('change', () => applySettings({ young: young.checked }));
  youngLabel.append(young, document.createTextNode('Two young koi'));
  youngRow.append(youngLabel);

  card.append(head, fishRow, paletteRow, youngRow);
  document.body.append(card);
  panel = card;
}

/** Re-read the stored values into an open panel, after a console-API change. */
function refreshPanel() {
  if (panel === null || !panel.isConnected) return;
  const current = normalizeSettings(readStored());
  const [fish, palette, young] = panel.querySelectorAll('input[type="range"], select, input[type="checkbox"]');
  if (fish) {
    fish.value = String(current.fish ?? liveFishCount(Number(fish.value)));
    const value = fish.nextElementSibling;
    if (value) value.textContent = fish.value;
  }
  if (palette) palette.value = current.palette;
  if (young) young.checked = current.young;
}

/** A console and script handle, so the pond can be retuned without the panel. */
function exposeApi() {
  if (typeof window === 'undefined') return;
  window.cngtnPond = {
    get: () => (activeEngine !== null ? activeEngine.getOptions() : normalizeSettings(readStored())),
    set: (patch) => applySettings(patch ?? {}),
    open: () => openPanel(),
    reset: () => applySettings(DEFAULTS),
    palettes: PALETTE_PRESETS,
    varieties: VARIETIES,
    /** The live school, for checking what the pond actually drew. */
    list: () =>
      activeEngine === null
        ? []
        : activeEngine.world.koi.map((k) => ({ id: k.id, variety: k.variety, accent: k.accent })),
  };
}

/**
 * A "Pond" button in the Settings header. Optional on purpose: if the slot
 * service is missing or the contract changes, the theme keeps working and the
 * console API plus \`config\` in the patch row remain.
 */
function installSettingsButton(ctx) {
  if (typeof ctx.inject !== 'function') return;
  try {
    ctx.inject(['slots'], (child) => {
      child.effect(() => {
        let React;
        try {
          React = require('react');
        } catch {
          return () => {};
        }
        const PondButton = () =>
          React.createElement(
            'button',
            {
              type: 'button',
              title: 'Pond settings',
              onClick: () => openPanel(),
              style: {
                height: '28px',
                padding: '0 10px',
                border: '0.5px solid var(--dsw-alias-border-l2)',
                borderRadius: '6px',
                background: 'transparent',
                color: 'var(--dsw-alias-label-secondary)',
                font: 'inherit',
                cursor: 'pointer',
              },
            },
            'Pond'
          );
        return child.slots.inject('settings.action', () =>
          child.slots.register({ name: 'settings.action', id: 'cngtn-pond', order: 20 }, PondButton)
        );
      }, 'cngtn-pond: settings action');
    });
  } catch (error) {
    console.warn('[cngtn-pond] settings button unavailable:', error && error.message);
  }
}

/** Client plugin body: the pond, the token layer, then the stylesheet. */
function apply(ctx, config) {
  try {
    const theme = ctx.theme;
    const settings = normalizeSettings({ ...(config ?? {}), ...readStored() });
    ctx.effect(() => mountPond(settings), 'cngtn-pond: koi pond');
    ctx.effect(() => theme.overrideTokens(ID, tokens), 'cngtn-pond: token layer');
    ctx.effect(() => injectStyles(), 'cngtn-pond: stylesheet');
    exposeApi();
    installSettingsButton(ctx);
  } catch (error) {
    console.error('[cngtn-pond] apply failed:', error && (error.stack || error.message));
    throw error;
  }
}