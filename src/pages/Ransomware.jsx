import { useMemo, useState } from 'react'
import data from '../data/ransomware.json'

const SOURCE = 'https://www.ransomware.live/recentvictims'

function ago(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const days = Math.round((Date.now() - d.getTime()) / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 31) return `${days}d ago`
  const mo = Math.round(days / 30)
  return `${mo}mo ago`
}

function groupUrl(group) {
  return group
    ? `https://www.ransomware.live/group/${encodeURIComponent(group)}`
    : SOURCE
}

export default function Ransomware() {
  const [q, setQ] = useState('')

  const items = useMemo(() => {
    const ql = q.trim().toLowerCase()
    if (!ql) return data.items
    return data.items.filter(
      (v) =>
        v.victim.toLowerCase().includes(ql) ||
        v.group.toLowerCase().includes(ql) ||
        v.sector.toLowerCase().includes(ql) ||
        v.country.toLowerCase().includes(ql)
    )
  }, [q])

  return (
    <div className="page">
      <div className="ctf-head">
        <div>
          <h1 className="page-title">Ransomware Watch</h1>
          <p className="page-subtitle">
            The {data.items.length} most recently reported ransomware victims,
            tracked from public leak sites by ransomware.live. Links go to the
            threat group&apos;s profile — never to a leak site.
          </p>
        </div>
        <a className="btn" href={SOURCE} target="_blank" rel="noreferrer">
          ransomware.live →
        </a>
      </div>

      {data.items.length > 0 ? (
        <>
          <div className="blog-controls">
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Filter by victim, group, sector, country…"
                aria-label="Filter ransomware victims"
              />
            </div>
          </div>

          <p className="count-line">{items.length} shown</p>

          <div className="rw-list" key={q}>
            {items.map((v, i) => (
              <a
                key={`${v.victim}-${i}`}
                className="rw-card"
                href={groupUrl(v.group)}
                target="_blank"
                rel="noreferrer"
              >
                <div className="rw-top">
                  <h3 className="rw-victim">{v.victim}</h3>
                  {v.group && <span className="rw-group">{v.group}</span>}
                  <span className="rw-when">{ago(v.discovered || v.attackdate)}</span>
                </div>

                {v.description && <p className="rw-desc">{v.description}</p>}

                <div className="rw-foot">
                  {v.sector && <span className="rw-sector">{v.sector}</span>}
                  {v.country && <span className="rw-country">{v.country}</span>}
                  {v.domain && <span className="rw-domain">{v.domain}</span>}
                </div>
              </a>
            ))}
          </div>
        </>
      ) : (
        <div className="ctf-error">
          <p>Couldn&apos;t load the feed — check ransomware.live directly.</p>
          <a className="btn btn-primary" href={SOURCE} target="_blank" rel="noreferrer">
            Open ransomware.live →
          </a>
        </div>
      )}

      <p className="ctf-note">
        Refreshed from ransomware.live on each deploy ·{' '}
        <a href={SOURCE} target="_blank" rel="noreferrer">
          see the live feed →
        </a>
      </p>
    </div>
  )
}
