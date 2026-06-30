// Gera os ícones do app (PWA) a partir da logo da clínica.
// Usa só o emblema (pés + asas + auréola), sem o texto.
// Rodar: node scripts/gerar-icones.cjs
const Jimp = require('jimp')
const path = require('path')

const PUBLIC = path.join(__dirname, '..', 'public')
const LOGO = path.join(PUBLIC, 'logo.png')
const BRANCO = 0xffffffff

// Recorte do emblema na logo (a logo tem 673x573; o texto fica embaixo).
const CROP = { x: 0, y: 0, w: 673, h: 300 }

async function gerar(emblema, size, padding, arquivo) {
  const inner = Math.round(size * (1 - padding))
  const logo = emblema.clone().contain(inner, inner)
  const canvas = new Jimp(size, size, BRANCO)
  canvas.composite(logo, Math.round((size - logo.bitmap.width) / 2), Math.round((size - logo.bitmap.height) / 2))
  await canvas.writeAsync(path.join(PUBLIC, arquivo))
  console.log('ok:', arquivo)
}

async function main() {
  const src = await Jimp.read(LOGO)
  const emblema = src.clone().crop(CROP.x, CROP.y, CROP.w, CROP.h)
  // Ícones normais: pouca borda. Maskable: mais borda (zona de segurança).
  await gerar(emblema, 192, 0.1, 'pwa-192x192.png')
  await gerar(emblema, 512, 0.1, 'pwa-512x512.png')
  await gerar(emblema, 512, 0.3, 'pwa-maskable-512x512.png')
  await gerar(emblema, 180, 0.1, 'apple-touch-icon.png')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
