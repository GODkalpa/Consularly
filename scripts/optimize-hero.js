#!/usr/bin/env node
/*
  Optimize hero image into AVIF and WebP.
  Usage: npm run img:hero
  Requires: sharp (dev dependency). If not installed, this script will prompt you.
*/

const fs = require('fs')
const path = require('path')

let sharp
try {
  sharp = require('sharp')
} catch (e) {
  console.error('\n[optimize-hero] "sharp" is not installed. Install it first:')
  console.error('  npm i -D sharp\n')
  process.exit(1)
}

const root = process.cwd()
const pub = path.join(root, 'public')
const inputPng = path.join(pub, 'hero.png')
const outAvif = path.join(pub, 'hero.avif')
const outWebp = path.join(pub, 'hero.webp')

if (!fs.existsSync(inputPng)) {
  console.error('[optimize-hero] Missing public/hero.png')
  process.exit(1)
}

;(async () => {
  const src = sharp(inputPng)
  const meta = await src.metadata()
  const pngSize = fs.statSync(inputPng).size

  // Create AVIF (best compression for photographic screenshot)
  await src
    .clone()
    .avif({ quality: 60, speed: 2, chromaSubsampling: '4:4:4' })
    .toFile(outAvif)

  // Create WebP as wider fallback
  await src
    .clone()
    .webp({ quality: 78 })
    .toFile(outWebp)

  const avifSize = fs.statSync(outAvif).size
  const webpSize = fs.statSync(outWebp).size

  const kb = (b) => Math.round(b / 102.4) / 10

  console.log('\n[optimize-hero] Done.')
  console.log(`- Source PNG: ${kb(pngSize)} KB (${meta.width}x${meta.height})`)
  console.log(`- AVIF:       ${kb(avifSize)} KB -> public/hero.avif`)
  console.log(`- WebP:       ${kb(webpSize)} KB -> public/hero.webp\n`)
})().catch((err) => {
  console.error('[optimize-hero] Failed:', err)
  process.exit(1)
})
