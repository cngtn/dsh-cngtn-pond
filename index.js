/**
 * Host half of the daoho-pond bundle.
 *
 * The whole restyle is browser-side: the Client half stacks a paper-and-ink
 * token layer over the active theme through the `theme` service, injects one
 * stylesheet for the parts a token cannot express, and mounts the koi-pond
 * canvas behind the shell. Nothing here is model-facing, so the Host half only
 * has to exist for the bundle row to activate.
 */
export function apply() {}