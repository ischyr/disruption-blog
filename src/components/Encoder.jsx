import { useState } from 'react'
import CopyButton from './CopyButton'

const td = new TextDecoder()
const te = new TextEncoder()

function rot13(s) {
  return s.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base)
  })
}

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
function b32enc(bytes) {
  let bits = 0, val = 0, out = ''
  for (const b of bytes) {
    val = (val << 8) | b
    bits += 8
    while (bits >= 5) {
      out += B32[(val >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += B32[(val << (5 - bits)) & 31]
  while (out.length % 8) out += '='
  return out
}
function b32dec(str) {
  const clean = str.replace(/=+$/, '').toUpperCase().replace(/\s/g, '')
  let bits = 0, val = 0
  const out = []
  for (const c of clean) {
    const idx = B32.indexOf(c)
    if (idx < 0) throw new Error('invalid base32')
    val = (val << 5) | idx
    bits += 5
    if (bits >= 8) {
      out.push((val >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return new Uint8Array(out)
}

const HTML_MAP = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'" }

const CODECS = {
  base64: {
    enc: (t) => btoa(String.fromCharCode(...te.encode(t))),
    dec: (t) => td.decode(Uint8Array.from(atob(t.trim()), (c) => c.charCodeAt(0))),
  },
  url: { enc: encodeURIComponent, dec: decodeURIComponent },
  hex: {
    enc: (t) => [...te.encode(t)].map((b) => b.toString(16).padStart(2, '0')).join(''),
    dec: (t) => {
      const clean = t.replace(/[^0-9a-fA-F]/g, '')
      if (clean.length % 2) throw new Error('odd hex length')
      return td.decode(Uint8Array.from(clean.match(/../g) || [], (h) => parseInt(h, 16)))
    },
  },
  html: {
    enc: (t) =>
      t
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;'),
    dec: (t) =>
      t.replace(/&(#x?[0-9a-fA-F]+|\w+);/g, (m, e) => {
        if (e[0] === '#') {
          const n = /^#x/i.test(e) ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
          return Number.isNaN(n) ? m : String.fromCodePoint(n)
        }
        return e in HTML_MAP ? HTML_MAP[e] : m
      }),
  },
  rot13: { enc: rot13, dec: rot13 },
  base32: {
    enc: (t) => b32enc(te.encode(t)),
    dec: (t) => td.decode(b32dec(t)),
  },
}

const CODEC_LIST = ['base64', 'url', 'hex', 'html', 'rot13', 'base32']

export default function Encoder() {
  const [codec, setCodec] = useState('base64')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const run = (dir) => {
    setError('')
    try {
      setOutput(CODECS[codec][dir](input))
    } catch (e) {
      setOutput('')
      setError(`Could not ${dir === 'enc' ? 'encode' : 'decode'}: ${e.message}`)
    }
  }

  return (
    <div className="enc">
      <div className="enc-codecs">
        {CODEC_LIST.map((c) => (
          <button
            key={c}
            type="button"
            className={`cvss-opt${codec === c ? ' active' : ''}`}
            onClick={() => setCodec(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <label className="enc-label">Input</label>
      <textarea
        className="enc-area"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="text or encoded data…"
        spellCheck="false"
      />

      <div className="enc-actions">
        <button type="button" className="btn btn-primary enc-btn" onClick={() => run('enc')}>
          Encode
        </button>
        <button type="button" className="btn enc-btn" onClick={() => run('dec')}>
          Decode
        </button>
        {output && (
          <button
            type="button"
            className="btn enc-btn"
            onClick={() => {
              setInput(output)
              setOutput('')
              setError('')
            }}
            title="Chain: use the output as the new input"
          >
            ↑ use as input
          </button>
        )}
      </div>

      <label className="enc-label">
        Output
        {output && <CopyButton text={output} className="enc-copy" />}
      </label>
      <textarea
        className="enc-area enc-out"
        value={error || output}
        readOnly
        placeholder="result…"
        data-error={error ? 'true' : undefined}
      />
    </div>
  )
}
