// Gera os ícones PNG do PWA sem dependências externas.
// Fundo na cor da marca + círculo branco no centro (placeholder simples e nítido).
// Rode com: node scripts/generate-icons.mjs
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = resolve(__dirname, '..', 'public')
mkdirSync(publicDir, { recursive: true })

// Cor da marca (verde-petróleo) #0f766e
const BG = [0x0f, 0x76, 0x6e]
const FG = [0xff, 0xff, 0xff]

// CRC32 para os chunks PNG.
const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

function makePng(size, circleRatio) {
  const cx = size / 2
  const cy = size / 2
  const r = (size / 2) * circleRatio
  // Linhas: cada uma começa com filtro 0 e tem RGBA por pixel.
  const raw = Buffer.alloc((size * 4 + 1) * size)
  let p = 0
  for (let y = 0; y < size; y++) {
    raw[p++] = 0 // filtro None
    for (let x = 0; x < size; x++) {
      const dist = Math.hypot(x + 0.5 - cx, y + 0.5 - cy)
      const cor = dist <= r ? FG : BG
      raw[p++] = cor[0]
      raw[p++] = cor[1]
      raw[p++] = cor[2]
      raw[p++] = 0xff
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const arquivos = [
  ['pwa-192x192.png', 192, 0.55],
  ['pwa-512x512.png', 512, 0.55],
  // Maskable: círculo menor para caber na zona segura.
  ['pwa-maskable-512x512.png', 512, 0.42],
  ['apple-touch-icon.png', 180, 0.55],
]

for (const [nome, size, ratio] of arquivos) {
  writeFileSync(resolve(publicDir, nome), makePng(size, ratio))
  console.log('gerado:', nome)
}
