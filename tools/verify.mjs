// verify.mjs — inspect a running DSH page over CDP and print the theme's state.
//
// Usage:
//   node tools/verify.mjs http://127.0.0.1:9333
//
// The desktop app opens a debugging port with `--remote-debugging-port=9333`;
// the `web` profile needs no flag, because it is already an HTTP page. Either
// way this prints the same table, so a claim about the theme can be re-checked
// on any machine instead of being taken from a screenshot.

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright-core'));
} catch {
  console.error('playwright-core is not installed. Run: npm i -D playwright-core');
  process.exit(2);
}

const endpoint = process.argv[2];
if (!endpoint) {
  console.error('usage: node tools/verify.mjs <cdp-endpoint|url>');
  process.exit(2);
}

const browser = endpoint.startsWith('http')
  ? await chromium.connectOverCDP(endpoint)
  : await chromium.launch({ channel: 'chrome', headless: true });

let page;
if (endpoint.startsWith('http')) {
  page = browser.contexts()[0].pages()[0];
} else {
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(endpoint, { waitUntil: 'load' });
}

await page.waitForTimeout(4000);

const state = await page.evaluate(() => {
  const canvas = document.querySelector('#daoho-pond-canvas');
  const body = getComputedStyle(document.body);
  const read = (name) => body.getPropertyValue(name).trim();
  let painted = null;
  if (canvas) {
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let n = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 8) n++;
    painted = n;
  }
  const frame = document.querySelector('[data-slot="root"] > div');
  const centre = document.querySelector('[data-slot="main"]')?.parentElement;
  return {
    dark: document.body.hasAttribute('data-ds-dark-theme'),
    canvas: canvas ? `${canvas.width}x${canvas.height}` : null,
    painted,
    canvasZ: canvas ? getComputedStyle(canvas).zIndex : null,
    bg: read('--dsw-alias-bg-base'),
    label: read('--dsw-alias-label-primary'),
    accent: read('--dsw-alias-brand-primary'),
    radius: read('--dsw-radius-md'),
    corner: read('--dsw-corner-shape'),
    menu: read('--dsw-menu-surface-fill'),
    blur: read('--dsw-menu-backdrop-filter'),
    font: read('--dsh-font-family-text-default').split(',')[0],
    build: read('--dsw-daoho-build'),
    frameBg: frame ? getComputedStyle(frame).backgroundColor : null,
    centreBg: centre ? getComputedStyle(centre).backgroundColor : null,
    daohoStyles: [...document.querySelectorAll('style[data-plugin-css]')].filter((s) =>
      /daoho/.test(s.dataset.pluginCss)
    ).length,
  };
});

const pad = (k) => (k + ' ').padEnd(16, '.');
for (const [key, value] of Object.entries(state)) console.log(pad(key) + ' ' + value);

await browser.close();