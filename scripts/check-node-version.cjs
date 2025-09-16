#!/usr/bin/env node
const semver = require('semver');
// Pinned Node.js major version policy: use latest stable 20.x
// Keep this in sync with package.json "engines" fields and .nvmrc
const expected = '20.x';
const current = process.versions.node;
// semver.satisfies does not accept wildcard "20.x" directly for full match semantics.
// We'll coerce to a range ^20.0.0 <21.0.0
const range = '>=20 <21';
if (!semver.satisfies(current, range)) {
  console.error(`\n[fresh] Unsupported Node version ${current}. Required: ${expected} (range ${range}).\n` +
    'Install and select Node 20 (e.g. nvm install 20 && nvm use 20) before running dev scripts.\n');
  process.exit(1);
}
console.log(`[fresh] Node version ${current} OK (expected ${expected})`);
