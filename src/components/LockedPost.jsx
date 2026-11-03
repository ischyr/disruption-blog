import { useState } from 'react'
import { unlockKey } from '../lib/unlock'

// Password screen for write-ups of still-active HackTheBox machines (posts
// with `active: "<password>"` in their frontmatter). The page only knows a
// SHA-256 of the password; a correct entry is remembered for the session.
// Note: this hides the write-up on the site, but the source is in the public
// repo, so it is a courtesy screen rather than real protection.

// how long the "padlock opens, card fades out" exit plays before the
// write-up replaces it (keep in sync with .locked.opening in index.css)
const EXIT_MS = 520
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export default function LockedPost({ slug, hash, onUnlock }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)
  // bumped on every wrong attempt so the shake replays each time
  const [attempt, setAttempt] = useState(0)
  const [opening, setOpening] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!value || busy || opening) return
    setBusy(true)
    const ok = (await sha256(value)) === hash
    setBusy(false)
    if (!ok) {
      setError(true)
      setAttempt((n) => n + 1)
      return
    }
    try {
      sessionStorage.setItem(unlockKey(slug), hash)
    } catch {
      /* private mode: stays unlocked until the page is left */
    }
    if (reduceMotion()) {
      onUnlock()
      return
    }
    setOpening(true)
    setTimeout(onUnlock, EXIT_MS)
  }

  return (
    <div className={`locked${opening ? ' opening' : ''}`}>
      <svg
        className="locked-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path className="locked-shackle" d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
        <rect x="4" y="10.5" width="16" height="10.5" rx="2" />
      </svg>
      <h2 className="locked-title">This machine is still active</h2>
      <p className="locked-text">
        HackTheBox doesn't allow public write-ups for active machines, so this one is
        password-protected until the box retires.
      </p>

      <form
        key={attempt}
        className={`locked-form${attempt > 0 ? ' shake' : ''}`}
        onSubmit={submit}
      >
        <input
          type="password"
          className={`locked-input${error ? ' error' : ''}`}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError(false)
          }}
          placeholder="Password"
          autoFocus={attempt > 0}
          autoComplete="off"
          aria-label="Password"
          aria-invalid={error}
        />
        <button type="submit" className="btn btn-primary" disabled={busy || opening}>
          Unlock
        </button>
      </form>
      {error && (
        <p className="locked-error" role="alert">
          Wrong password.
        </p>
      )}
    </div>
  )
}
