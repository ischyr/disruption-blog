import { useMemo, useState } from 'react'

function b64urlDecode(s) {
  let t = s.replace(/-/g, '+').replace(/_/g, '/')
  while (t.length % 4) t += '='
  const bin = atob(t)
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
}

function decode(token) {
  const parts = token.trim().split('.')
  if (parts.length < 2) throw new Error('not a JWT (need header.payload.signature)')
  const header = JSON.parse(b64urlDecode(parts[0]))
  const payload = JSON.parse(b64urlDecode(parts[1]))
  return { header, payload, sig: parts[2] || '' }
}

function fmtTime(sec) {
  return new Date(sec * 1000).toLocaleString('en-US', { timeZone: 'UTC' }) + ' UTC'
}

function relative(sec) {
  let diff = sec - Math.floor(Date.now() / 1000)
  const past = diff < 0
  diff = Math.abs(diff)
  const d = Math.floor(diff / 86400)
  const h = Math.floor((diff % 86400) / 3600)
  const mn = Math.floor((diff % 3600) / 60)
  const parts = [d && `${d}d`, h && `${h}h`, mn && `${mn}m`].filter(Boolean).slice(0, 2)
  const span = parts.join(' ') || '<1m'
  return past ? `expired ${span} ago` : `expires in ${span}`
}

async function verifyHs256(token, secret) {
  const [h, p, sig] = token.trim().split('.')
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${h}.${p}`))
  const b64 = btoa(String.fromCharCode(...new Uint8Array(mac)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return b64 === sig
}

export default function JwtDecoder() {
  const [token, setToken] = useState('')
  const [secret, setSecret] = useState('')
  const [verdict, setVerdict] = useState(null)

  const result = useMemo(() => {
    if (!token.trim()) return null
    try {
      return { ok: true, ...decode(token) }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  }, [token])

  const verify = async () => {
    setVerdict(null)
    try {
      setVerdict((await verifyHs256(token, secret)) ? 'valid' : 'invalid')
    } catch {
      setVerdict('error')
    }
  }

  const exp = result?.ok && result.payload?.exp
  const alg = result?.ok && result.header?.alg

  return (
    <div className="jwt">
      <textarea
        className="enc-area"
        value={token}
        onChange={(e) => {
          setToken(e.target.value)
          setVerdict(null)
        }}
        placeholder="paste a JWT — eyJ…"
        spellCheck="false"
      />

      {result && !result.ok && <p className="enc-error-msg">⚠ {result.error}</p>}

      {result?.ok && (
        <>
          <div className="jwt-tags">
            {alg && <span className="tag">alg: {alg}</span>}
            {exp && (
              <span className={`tag ${exp * 1000 < Date.now() ? 'jwt-expired' : 'jwt-live'}`}>
                {relative(exp)}
              </span>
            )}
          </div>

          <div className="jwt-grid">
            <div className="jwt-box">
              <span className="jwt-box-label">Header</span>
              <pre>{JSON.stringify(result.header, null, 2)}</pre>
            </div>
            <div className="jwt-box">
              <span className="jwt-box-label">Payload</span>
              <pre>{JSON.stringify(result.payload, null, 2)}</pre>
            </div>
          </div>

          {(result.payload.iat || result.payload.nbf || result.payload.exp) && (
            <div className="jwt-times">
              {result.payload.iat && <span>issued: {fmtTime(result.payload.iat)}</span>}
              {result.payload.nbf && <span>not before: {fmtTime(result.payload.nbf)}</span>}
              {result.payload.exp && <span>expires: {fmtTime(result.payload.exp)}</span>}
            </div>
          )}

          <div className="jwt-verify">
            <input
              value={secret}
              onChange={(e) => {
                setSecret(e.target.value)
                setVerdict(null)
              }}
              placeholder="HS256 secret (optional)"
              spellCheck="false"
            />
            <button type="button" className="btn enc-btn" onClick={verify}>
              Verify HS256
            </button>
            {verdict === 'valid' && <span className="jwt-live">✓ signature valid</span>}
            {verdict === 'invalid' && <span className="jwt-expired">✗ signature mismatch</span>}
            {verdict === 'error' && <span className="jwt-expired">couldn’t verify</span>}
          </div>
        </>
      )}
    </div>
  )
}
