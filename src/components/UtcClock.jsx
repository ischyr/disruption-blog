import { useEffect, useState } from 'react'

const pad = (n) => String(n).padStart(2, '0')

function now() {
  const d = new Date()
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

// Ticking [UTC hh:mm:ss] readout — a small "the lights are on" touch.
export default function UtcClock({ className = '' }) {
  const [t, setT] = useState(now)

  useEffect(() => {
    const id = setInterval(() => setT(now()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <span
      className={`utc-clock ${className}`.trim()}
      title="Coordinated Universal Time"
      aria-label={`UTC ${t}`}
    >
      <span className="utc-label">UTC</span>
      <span className="utc-time">{t}</span>
    </span>
  )
}
