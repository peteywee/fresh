#!/usr/bin/env node
const { execSync } = require('child_process');
const semver = require('semver');

// Recommended version used in CI; allow any Node >=20 for local dev
const RECOMMENDED_NODE_VERSION = '20.19.4';
const MIN_NODE_VERSION = '20.0.0';
const REQUIRED_PNPM_VERSION = '9.0.0';

function checkNodeVersion() {
  const currentNodeVersion = process.version;

  console.log(`Current Node.js version: ${currentNodeVersion}`);
  console.log(`Minimum required Node.js version: >=${MIN_NODE_VERSION}`);
  console.log(`Recommended Node.js version (CI): ${RECOMMENDED_NODE_VERSION}`);

  // Hard requirement: Node >= 20.0.0
  if (!semver.satisfies(currentNodeVersion, `>=${MIN_NODE_VERSION}`)) {
    console.error(
      `❌ Node.js version >=${MIN_NODE_VERSION} is required, but ${currentNodeVersion} is installed.`
    );
    console.error('Please install a compatible version using:');
    console.error(`  nvm install ${RECOMMENDED_NODE_VERSION}`);
    console.error(`  nvm use ${RECOMMENDED_NODE_VERSION}`);
    process.exit(1);
  }

  // Soft recommendation: use CI-pinned version locally for parity
  if (!semver.satisfies(currentNodeVersion, `^${RECOMMENDED_NODE_VERSION}`)) {
    console.warn(
      `⚠️  Using Node ${currentNodeVersion}. CI runs on ${RECOMMENDED_NODE_VERSION}. ` +
      'For parity, consider switching via:\n' +
      `  nvm install ${RECOMMENDED_NODE_VERSION}\n` +
      `  nvm use ${RECOMMENDED_NODE_VERSION}`
    );
  }

  console.log('✅ Node.js version is compatible');
}

function checkPnpmVersion() {
  try {
    const pnpmVersion = execSync('pnpm --version', { encoding: 'utf8' }).trim();
    console.log(`Current pnpm version: ${pnpmVersion}`);
    console.log(`Required pnpm version: >=${REQUIRED_PNPM_VERSION}`);
    
    if (!semver.gte(pnpmVersion, REQUIRED_PNPM_VERSION)) {
      console.error(`❌ pnpm version >=${REQUIRED_PNPM_VERSION} is required, but ${pnpmVersion} is installed.`);
      console.error('Please install the correct version using:');
      console.error(`  npm install -g pnpm@latest`);
      process.exit(1);
    }
    
    console.log('✅ pnpm version is compatible');
  } catch (error) {
    console.error('❌ pnpm is not installed. Please install it using:');
    console.error('  npm install -g pnpm@latest');
    process.exit(1);
  }
}

checkNodeVersion();
checkPnpmVersion();
console.log('🎉 All version requirements satisfied!');
