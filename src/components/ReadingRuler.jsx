import { useEffect, useState } from 'react'

const BAND = 46 // px height of the clear reading band

// An optional focus line: dims the page above and below a clear band that
// follows the pointer, to help keep your place while reading.
export default function ReadingRuler() {
  const [enabled, setEnabled] = useState(
    () => typeof localStorage !== 'undefined' && localStorage.getItem('reading-ruler') === '1'
  )
  const [y, setY] = useState(
    typeof window !== 'undefined' ? window.innerHeight / 2 : 300
  )

  useEffect(() => {
    localStorage.setItem('reading-ruler', enabled ? '1' : '0')
    if (!enabled) return
    let frame = 0
    const onMove = (e) => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        setY(e.clientY)
      })
    }
    window.addEventListener('pointermove', onMove)
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [enabled])

  const topH = Math.max(0, y - BAND / 2)
  const bottomTop = y + BAND / 2

  return (
    <>
      <button
        type="button"
        className={`ruler-toggle${enabled ? ' active' : ''}`}
        onClick={() => setEnabled((v) => !v)}
        aria-pressed={enabled}
        aria-label="Toggle reading ruler"
        title="Reading ruler (focus line)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 8h18M3 16h18" />
          <path d="M3 12h18" strokeWidth="2.5" />
        </svg>
      </button>

      {enabled && (
        <div className="ruler" aria-hidden="true">
          <div className="ruler-mask" style={{ height: `${topH}px` }} />
          <div
            className="ruler-mask ruler-mask-bottom"
            style={{ top: `${bottomTop}px` }}
          />
        </div>
      )}
    </>
  )
}
