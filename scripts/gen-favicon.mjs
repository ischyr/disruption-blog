// Generates public/favicon.ico to match the navbar logo mark:
// a white ">_" terminal prompt on a dark (#141416) rounded square with a
// #2a2a2e border. Pure Node (uses built-in zlib for PNG compression), no deps.
//
//   node scripts/gen-favicon.mjs
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import zlib from 'node:zlib'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = join(here, '..', 'public')

// ── colors ──
const FILL = [20, 20, 22] // #141416
const BORDER = [42, 42, 46] // #2a2a2e
const GLYPH = [250, 250, 250] // #fafafa

// ── geometry in a 32-unit grid ──
const R = 7 // corner radius
const BW = 1.2 // border thickness
const HW = 1.4 // glyph stroke half-width (round caps)
// ">" as two segments, then "_" — mirrors the navbar prompt
const SEGMENTS = [
  [9.5, 11, 14.5, 16],
  [14.5, 16, 9.5, 21],
  [16.5, 21, 22.5, 21],
]

function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy || 1
  let t = ((px - ax) * dx + (py - ay) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  const cx = ax + t * dx
  const cy = ay + t * dy
  return Math.hypot(px - cx, py - cy)
}

function render(N) {
  const S = 8 // supersampling factor for anti-aliasing
  const out = Buffer.alloc(N * N * 4)
  for (let py = 0; py < N; py++) {
    for (let px = 0; px < N; px++) {
      let inside = 0
      let sr = 0
      let sg = 0
      let sb = 0
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          const x = ((px + (sx + 0.5) / S) / N) * 32
          const y = ((py + (sy + 0.5) / S) / N) * 32
          // signed distance to rounded box centered at (16,16), half (16,16)
          const qx = Math.abs(x - 16) - (16 - R)
          const qy = Math.abs(y - 16) - (16 - R)
          const d =
            Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
            Math.min(Math.max(qx, qy), 0) -
            R
          if (d > 0) continue // outside → transparent
          let col = d >= -BW ? BORDER : FILL
          let gd = Infinity
          for (const s of SEGMENTS) {
            const dist = segDist(x, y, s[0], s[1], s[2], s[3])
            if (dist < gd) gd = dist
          }
          if (gd <= HW) col = GLYPH
          inside++
          sr += col[0]
          sg += col[1]
          sb += col[2]
        }
      }
      const idx = (py * N + px) * 4
      if (inside > 0) {
        out[idx] = Math.round(sr / inside)
        out[idx + 1] = Math.round(sg / inside)
        out[idx + 2] = Math.round(sb / inside)
        out[idx + 3] = Math.round((inside / (S * S)) * 255)
      }
    }
  }
  return out
}

// ── PNG encoding ──
const CRC_TABLE = (() => {
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
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

function encodePNG(N, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(N, 0)
  ihdr.writeUInt32BE(N, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  const stride = N * 4
  const raw = Buffer.alloc((stride + 1) * N)
  for (let y = 0; y < N; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = zlib.deflateSync(raw, { level: 9 })
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ── ICO container (PNG-compressed entries) ──
const sizes = [16, 32, 48]
const pngs = sizes.map((n) => ({ n, data: encodePNG(n, render(n)) }))

const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0) // reserved
header.writeUInt16LE(1, 2) // type: icon
header.writeUInt16LE(pngs.length, 4)

const dir = Buffer.alloc(16 * pngs.length)
let offset = 6 + 16 * pngs.length
pngs.forEach((p, i) => {
  const e = i * 16
  dir[e] = p.n >= 256 ? 0 : p.n // width
  dir[e + 1] = p.n >= 256 ? 0 : p.n // height
  dir[e + 2] = 0 // palette
  dir[e + 3] = 0 // reserved
  dir.writeUInt16LE(1, e + 4) // color planes
  dir.writeUInt16LE(32, e + 6) // bits per pixel
  dir.writeUInt32LE(p.data.length, e + 8)
  dir.writeUInt32LE(offset, e + 12)
  offset += p.data.length
})

const ico = Buffer.concat([header, dir, ...pngs.map((p) => p.data)])
writeFileSync(join(outDir, 'favicon.ico'), ico)
console.log(`favicon.ico written (${ico.length} bytes, sizes: ${sizes.join(', ')})`)
