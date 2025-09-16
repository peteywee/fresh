#!/usr/bin/env tsx
/** Generate PWA icon set from base SVG.
 * Requires: pnpm add -D sharp
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'public', 'icons', 'logo.svg');
const OUT = path.join(ROOT, 'public', 'icons');

const sizes = [16, 32, 48, 64, 180, 192, 256, 384, 512, 1024];

async function ensure() {
  await fs.mkdir(OUT, { recursive: true });
}

async function generate() {
  await ensure();
  const exists = await fs
    .stat(SRC)
    .then(() => true)
    .catch(() => false);
  if (!exists) throw new Error('Source SVG missing: ' + SRC);

  for (const size of sizes) {
    const file = path.join(OUT, `icon-${size}.png`);
    await sharp(SRC)
      .resize(size, size, { fit: 'contain', background: '#ffffff' })
      .png()
      .toFile(file);
    console.log('Generated', file);
  }

  // maskable variants with padding
  for (const size of [192, 512]) {
    const file = path.join(OUT, `icon-${size}-maskable.png`);
    const inner = Math.round(size * 0.75);
    const pad = Math.round((size - inner) / 2);
    await sharp(SRC)
      .resize(inner, inner)
      .extend({ top: pad, bottom: pad, left: pad, right: pad, background: '#2563eb' })
      .png()
      .toFile(file);
    console.log('Generated maskable', file);
  }
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
