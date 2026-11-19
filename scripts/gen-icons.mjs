import sharp from 'sharp'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const PAPER = '#F7F4EE'
const CINNABAR = '#8C2F28'
const RES = 'android/app/src/main/res'

const LEGACY = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 }
const FOREGROUND = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 }
const NOTIFY = { mdpi: 24, hdpi: 36, xhdpi: 48, xxhdpi: 72, xxxhdpi: 96 }

function sealSvg(size, background = true) {
  const pad = Math.round(size * 0.2)
  const inner = size - pad * 2
  const stroke = Math.max(2, Math.round(size * 0.02))
  const fontSize = Math.round(inner * 0.33)
  const common = `text-anchor="middle" font-family="SimSun, serif" font-weight="bold" font-size="${fontSize}" fill="${CINNABAR}"`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  ${background ? `<rect width="${size}" height="${size}" fill="${PAPER}"/>` : ''}
  <rect x="${pad}" y="${pad}" width="${inner}" height="${inner}" fill="none" stroke="${CINNABAR}" stroke-width="${stroke}"/>
  <text x="50%" y="${pad + inner * 0.42}" ${common}>格</text>
  <text x="50%" y="${pad + inner * 0.87}" ${common}>致</text>
</svg>`
}

function notifySvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect x="2" y="2" width="${size - 4}" height="${size - 4}" fill="none" stroke="#FFFFFF" stroke-width="${Math.max(1, size * 0.08)}"/>
  <text x="50%" y="58%" text-anchor="middle" font-family="SimSun, serif" font-weight="bold" font-size="${size * 0.6}" fill="#FFFFFF">格</text>
</svg>`
}

mkdirSync('public', { recursive: true })

for (const [density, size] of Object.entries(LEGACY)) {
  const dir = join(RES, `mipmap-${density}`)
  mkdirSync(dir, { recursive: true })
  const svg = Buffer.from(sealSvg(size))
  await sharp(svg).png().toFile(join(dir, 'ic_launcher.png'))
  await sharp(svg).png().toFile(join(dir, 'ic_launcher_round.png'))
}

for (const [density, size] of Object.entries(FOREGROUND)) {
  const dir = join(RES, `mipmap-${density}`)
  mkdirSync(dir, { recursive: true })
  await sharp(Buffer.from(sealSvg(size, false))).png().toFile(join(dir, 'ic_launcher_foreground.png'))
}

for (const [density, size] of Object.entries(NOTIFY)) {
  const dir = join(RES, `drawable-${density}`)
  mkdirSync(dir, { recursive: true })
  await sharp(Buffer.from(notifySvg(size))).png().toFile(join(dir, 'ic_stat_gezhi.png'))
}

writeFileSync(
  join(RES, 'values', 'ic_launcher_background.xml'),
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${PAPER}</color>\n</resources>\n`,
)

await sharp(Buffer.from(sealSvg(512))).png().toFile('public/favicon-512.png')
const favicon = sealSvg(64)
writeFileSync('public/favicon.svg', favicon)
console.log('icons generated')
