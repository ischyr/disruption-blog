import { useState } from 'react'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fmtDate(d) {
  if (!d) return ''
  const [y, m, day] = String(d).split('-')
  if (!m) return y
  return `${MONTHS[Number(m) - 1]} ${day ? String(Number(day)) + ', ' : ''}${y}`
}

function platformClass(p = '') {
  const s = p.toLowerCase()
  if (s.includes('hack')) return 'plat-htb'
  if (s.includes('try')) return 'plat-thm'
  return ''
}

function Avatar({ src }) {
  const [broken, setBroken] = useState(false)
  if (src && !broken) {
    return (
      <img
        className="machine-avatar"
        src={src}
        alt=""
        loading="lazy"
        onError={() => setBroken(true)}
      />
    )
  }
  return (
    <span className="machine-avatar machine-avatar-fallback">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="4" width="18" height="7" rx="1.5" />
        <rect x="3" y="13" width="18" height="7" rx="1.5" />
        <path d="M7 7.5h.01M7 16.5h.01" />
      </svg>
    </span>
  )
}

export default function MachineCard({ machine }) {
  if (!machine) return null
  const m = machine

  const stats = [
    ['Platform', m.platform, platformClass(m.platform)],
    ['OS', m.os, ''],
    ['Difficulty', m.difficulty, `diff-${String(m.difficulty).toLowerCase()}`],
    ['Points', m.points, ''],
    ['Released', fmtDate(m.released), ''],
    ['Target', m.ip, 'mono'],
  ].filter(([, value]) => value !== '' && value != null)

  return (
    <aside className="machine-card">
      <Avatar src={m.avatar} />
      <dl className="machine-grid">
        {stats.map(([label, value, cls]) => (
          <div className="machine-stat" key={label}>
            <dt className="machine-label">{label}</dt>
            <dd className={`machine-value ${cls}`.trim()}>{value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  )
}
