// Génère public/og-image.png (1200×630) pour les aperçus de lien (Open Graph).
// Logo Pitstoppd centré sur fond sombre. Lancer : node scripts/gen-og-image.js
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const out = join(__dirname, '..', 'public', 'og-image.png')

// Logo source : viewBox 0 0 58 18 (3 cercles). Mis à l'échelle et centré dans 1200×630.
const logoWidth = 480
const scale = logoWidth / 58
const logoHeight = 18 * scale
const tx = (1200 - logoWidth) / 2
const ty = (630 - logoHeight) / 2

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0a0a0a"/>
  <g transform="translate(${tx} ${ty}) scale(${scale})">
    <circle cx="9" cy="9" r="8" fill="#E8002D"/>
    <circle cx="29" cy="9" r="8" fill="#E8002D"/>
    <circle cx="49" cy="9" r="8" fill="#d4d4d4"/>
  </g>
</svg>`

await sharp(Buffer.from(svg)).png().toFile(out)
console.log(`✓ ${out}`)
