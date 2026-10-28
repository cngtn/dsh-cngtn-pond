/**
 * Host half of the cngtn-pond bundle.
 *
 * The restyle itself is browser-side: the Client half stacks a paper-and-ink
 * token layer over the active theme through the `theme` service, injects one
 * stylesheet for the parts a token cannot express, and mounts the koi-pond
 * canvas behind the shell.
 *
 * This half exists for one reason beyond activation: **the configuration
 * schema**. A bundle's settings page is rendered by the Plugins page from the
 * Host row's declared config, so the schema has to live here even though the
 * values are consumed in the browser. Declaring them makes the three pond
 * settings appear on the plugin's own page in the plugin manager, next to every
 * other bundle that ships preferences.
 *
 * `volatile()` marks each field as live-editable: the settings document can be
 * rewritten without restarting the Host, which is what lets the Pond form save
 * and take effect immediately.
 */
import z from '@deepseek-ai/schemastery';

/** Pigment pools the renderer knows. Kept in step with `src/world.js`. */
const PALETTES = ['mixed', 'warm', 'cool', 'mono'];

export default class CngtnPondTheme {
  static inject = ['settings'];

  static Config = z.object({
    /** Total school size, young koi included. */
    fish: z.number().min(3).max(12).step(1).default(6).volatile(),
    /** Which pigments the fish draw from. */
    palette: z.union(PALETTES).default('mixed').volatile(),
    /** Whether the two small koi that keep to the deep water appear. */
    young: z.boolean().default(true).volatile(),
  });

  constructor(ctx, config) {
    this.ctx = ctx;
    this.config = config;
    // `auto: false` keeps the Host from rewriting the document on its own; the
    // settings page owns every write, which is what makes the form's Save the
    // single source of truth.
    ctx.inject(['settings'], (child) => {
      child.effect(() => child.settings.configure({ auto: false }, ctx.fiber));
    });
  }
}
