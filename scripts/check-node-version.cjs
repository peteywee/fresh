#!/usr/bin/env node
const semver = require('semver');
const expected = '>=20 <21';
const current = process.versions.node;
if (!semver.satisfies(current, expected)) {
  console.error(`\n[fresh] Unsupported Node version ${current}. Required: ${expected}.\nPlease switch (e.g. with nvm use 20) before running dev scripts.\n`);
  process.exit(1);
}
console.log(`[fresh] Node version ${current} OK (${expected})`);
