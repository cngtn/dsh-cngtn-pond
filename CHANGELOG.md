# Changelog

## 1.5.0

The three native Windows caption buttons now follow the theme.

The desktop preload reads `--dsw-specific-sidebar-fill`, converts it to
`rgba()`, and forwards it to `setTitleBarOverlay` over IPC, so that token — not
CSS — decides the colour of the minimise / maximise / close block. It was the
paper colour, so the block stayed opaque while the strip around it was water.

The token is now `transparent` in both modes, and the sidebar's own surfaces are
painted from `--dsw-alias-bg-base` instead, which is what they were mixing the
token into anyway. One value now drives both the panel and the native chrome.

Verified on the desktop app: the caption block reports
`rgba(0, 0, 0, 0)` and the pond runs behind it, in light and dark alike, with
the sidebar card unchanged.

The hover fill Electron paints behind a pressed caption button is still the
shell's own; a theme cannot reach it.

## 1.4.0

The right panel becomes the same floating card as the sidebar, in both its
docked and its expanded presentation.

- **Docked:** the panel is inset to the sidebar's 10/12/20/18px box, so the two
  panels share one inset, one 14px radius, one hairline and one progressive
  shadow. The grid track and the resize handle stay where the shell put them.
- **Expanded:** the card spans the conversation at the same inset, with the
  frosted sheet painted on its own pseudo-element. The transcript behind it is
  blurred rather than visible through it, and the column is raised above the
  centre column so nothing paints over the card.
- **One frame, no seam:** the dock pane's own flush hairline and single-sided
  radius are dropped, because they landed on top of the card's border and read
  as a second, darker line.
- **Closed means closed:** the card, the frosted sheet and the raised stacking
  are all gated on the panel's open state, so hiding the panel no longer leaves
  a sheet over the chat.

## 1.3.0

- The sidebar floats as a card: 14px radius, hairline, progressive shadow, and
  rows clipped to the card's corners.
- The Windows titlebar is transparent, so the pond reaches the top edge.
- The Host config is the single writer, so a saved form reaches the pond.

## 1.2.0

- Seven koi varieties, live pond settings, and the user's own font.
- A `cngtnPond` console API for the panel and for scripting.

## 1.1.0

- A schemastery `Config` on the Host half, so the pond settings render on the
  plugin page.

## 1.0.0

- First publishable bundle: paper-and-ink tokens, the frosted transparency
  chain, and the ASCII koi pond behind the shell.
