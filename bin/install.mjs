#!/usr/bin/env node
/**
 * install.mjs — put the theme into a DeepSeek Harness profile.
 *
 *   npx github:cngtn/dsh-cngtn-pond
 *   npx github:cngtn/dsh-cngtn-pond --profile web
 *   npx github:cngtn/dsh-cngtn-pond --uninstall
 *
 * `npx` gives us a throwaway copy of this package. A DSH profile cannot use
 * that copy: the path lives in an npx cache that is wiped on the next run, and
 * the profile's `package.json` would point at a directory that no longer
 * exists. So the installer does what a package manager would do, explicitly:
 *
 *   1. copy the bundle to a stable place — `~/.dsh/themes/dsh-cngtn-pond`;
 *   2. link it into `<profile>/node_modules/@local/dsh-cngtn-pond`;
 *   3. record it as a `file:` dependency and add it to `dsh.profile.bundles`.
 *
 * Step 3 is what makes the theme survive a `pnpm install`: the dependency is
 * already declared, so the package manager recreates the link instead of
 * pruning it. Step 2 is what makes it work now, without waiting for an install.
 *
 * Everything it touches is backed up first, and `--uninstall` reverses all
 * three steps.
 */

import {
  copyFileSync,
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ID = '@local/dsh-cngtn-pond';
const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Files the shell loads at runtime. Fonts are already inlined in client.js. */
const FILES = ['index.js', 'client.js', 'cordis.patch.yml', 'icon.svg', 'package.json', 'README.md'];
const DIRS = ['locale'];

const argv = process.argv.slice(2);
const flag = (name) => argv.includes('--' + name);
const value = (name, fallback) => {
  const i = argv.indexOf('--' + name);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : fallback;
};

const say = (line = '') => console.log(line);
const fail = (line) => {
  console.error('error: ' + line);
  process.exit(1);
};

if (flag('help') || argv.includes('-h')) {
  say('dsh-cngtn-pond — a paper-and-ink theme for DeepSeek Harness');
  say('');
  say('  npx github:cngtn/dsh-cngtn-pond [options]');
  say('');
  say('  --profile <name>   DSH profile to install into (default: desktop)');
  say('  --uninstall        remove the theme from that profile');
  say('  --list             list the profiles found on this machine');
  say('  --help             this text');
  process.exit(0);
}

// `DSH_HOME` exists so the installer can be exercised against a throwaway
// profile; it is also how a non-default DSH installation is pointed at.
const dshRoot = process.env.DSH_HOME ? resolve(process.env.DSH_HOME) : join(homedir(), '.dsh');
const profilesRoot = join(dshRoot, 'profiles');

if (!existsSync(profilesRoot)) {
  fail('no DSH profiles found at ' + profilesRoot + ' — is DeepSeek Harness installed?');
}

const profiles = readdirSync(profilesRoot, { withFileTypes: true })
  .filter((e) => e.isDirectory() && existsSync(join(profilesRoot, e.name, 'package.json')))
  .map((e) => e.name);

if (flag('list')) {
  say('profiles: ' + (profiles.length ? profiles.join(', ') : '(none)'));
  process.exit(0);
}

const profileName = value('profile', 'desktop');
const profileDir = join(profilesRoot, profileName);
const manifestPath = join(profileDir, 'package.json');

if (!existsSync(manifestPath)) {
  fail('profile "' + profileName + '" not found. Available: ' + (profiles.join(', ') || '(none)'));
}

const themeDir = join(dshRoot, 'themes', 'dsh-cngtn-pond');
const linkDir = join(profileDir, 'node_modules', '@local', 'dsh-cngtn-pond');

function readManifest() {
  return JSON.parse(readFileSync(manifestPath, 'utf8'));
}

function writeManifest(json) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  copyFileSync(manifestPath, manifestPath + '.' + stamp + '.bak');
  writeFileSync(manifestPath, JSON.stringify(json, null, 2) + '\n');
}

function isLink(p) {
  try {
    return lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
}

function removeLink() {
  if (!existsSync(linkDir) && !isLink(linkDir)) return false;
  try {
    if (isLink(linkDir)) unlinkSync(linkDir);
    else rmSync(linkDir, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

if (flag('uninstall')) {
  const json = readManifest();
  let changed = false;

  const bundles = json?.dsh?.profile?.bundles;
  if (Array.isArray(bundles) && bundles.includes(ID)) {
    json.dsh.profile.bundles = bundles.filter((b) => b !== ID);
    changed = true;
  }
  if (json.dependencies && ID in json.dependencies) {
    delete json.dependencies[ID];
    changed = true;
  }
  if (changed) writeManifest(json);

  const unlinked = removeLink();
  if (existsSync(themeDir)) rmSync(themeDir, { recursive: true, force: true });

  say('Removed ' + ID + ' from profile "' + profileName + '".');
  say('  manifest updated: ' + (changed ? 'yes (backup written)' : 'no'));
  say('  node_modules link removed: ' + (unlinked ? 'yes' : 'no'));
  say('  theme copy removed: ' + (existsSync(themeDir) ? 'no' : 'yes'));
  say('');
  say('Restart DeepSeek Harness to return to the stock design.');
  process.exit(0);
}

if (!existsSync(join(PKG_ROOT, 'client.js'))) {
  fail('client.js is missing from the package — run `npm run build` before publishing.');
}

mkdirSync(themeDir, { recursive: true });
for (const file of FILES) {
  const from = join(PKG_ROOT, file);
  if (existsSync(from)) copyFileSync(from, join(themeDir, file));
}
for (const dir of DIRS) {
  const from = join(PKG_ROOT, dir);
  if (existsSync(from)) cpSync(from, join(themeDir, dir), { recursive: true });
}

const shots = join(PKG_ROOT, 'docs');
if (existsSync(shots)) {
  mkdirSync(join(themeDir, 'docs'), { recursive: true });
  for (const name of readdirSync(shots)) {
    if (name.endsWith('.png')) copyFileSync(join(shots, name), join(themeDir, 'docs', name));
  }
}

mkdirSync(dirname(linkDir), { recursive: true });
removeLink();
let linked = 'junction';
try {
  symlinkSync(themeDir, linkDir, 'junction');
} catch {
  cpSync(themeDir, linkDir, { recursive: true });
  linked = 'copy';
}

const json = readManifest();
json.dependencies ??= {};
json.dependencies[ID] = 'file:' + themeDir.replace(/\\/g, '/');
json.dsh ??= {};
json.dsh.profile ??= {};
json.dsh.profile.bundles ??= [];
if (!json.dsh.profile.bundles.includes(ID)) json.dsh.profile.bundles.push(ID);
writeManifest(json);

say('');
say('  ' + ID + ' installed into profile "' + profileName + '"');
say('');
say('  theme copy   ' + themeDir);
say('  profile link ' + linkDir + ' (' + linked + ')');
say('  manifest     ' + manifestPath + ' (backup written)');
say('');
say('  Only one theme at a time: token layers stack and the last one wins,');
say('  so disable any other theme bundle before restarting.');
say('');
say('  Restart DeepSeek Harness to load the pond.');
