import { useMemo, useState } from 'react'
import kev from '../data/cisa-kev.json'

const CISA_URL = 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog'

function fmtDate(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// days until (positive) / since (negative) the remediation due date
function dueInfo(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const ms = d.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)
  const days = Math.round(ms / 86400000)
  if (days > 0) return { label: `due in ${days}d`, state: days <= 14 ? 'soon' : 'ok' }
  if (days === 0) return { label: 'due today', state: 'soon' }
  return { label: `overdue ${Math.abs(days)}d`, state: 'overdue' }
}

export default function KevBoard() {
  const [q, setQ] = useState('')
  const [ransomOnly, setRansomOnly] = useState(false)

  const items = useMemo(() => {
    const ql = q.trim().toLowerCase()
    return kev.items.filter((v) => {
      if (ransomOnly && !v.ransomware) return false
      if (!ql) return true
      return (
        v.cveID.toLowerCase().includes(ql) ||
        v.vendor.toLowerCase().includes(ql) ||
        v.product.toLowerCase().includes(ql) ||
        v.name.toLowerCase().includes(ql)
      )
    })
  }, [q, ransomOnly])

  return (
    <div className="page">
      <div className="ctf-head">
        <div>
          <h1 className="page-title">CISA KEV</h1>
          <p className="page-subtitle">
            The {kev.items.length} most recently added entries from CISA&apos;s{' '}
            Known Exploited Vulnerabilities catalog — flaws confirmed to be
            exploited in the wild, with federal remediation deadlines.
          </p>
        </div>
        <a className="btn" href={CISA_URL} target="_blank" rel="noreferrer">
          Full catalog →
        </a>
      </div>

      {kev.items.length > 0 ? (
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
                placeholder="Filter by CVE, vendor, product…"
                aria-label="Filter KEV entries"
              />
            </div>
            <button
              type="button"
              className={`tag-chip${ransomOnly ? ' active' : ''}`}
              onClick={() => setRansomOnly((v) => !v)}
            >
              ⚠ ransomware-linked
            </button>
          </div>

          <p className="count-line">
            {items.length} of {kev.items.length} shown · catalog v{kev.version} ·{' '}
            {kev.total.toLocaleString()} total entries
          </p>

          <div className="kev-list" key={`${q}-${ransomOnly}`}>
            {items.map((v) => {
              const due = dueInfo(v.dueDate)
              return (
                <a
                  key={v.cveID}
                  className="kev-card"
                  href={`https://nvd.nist.gov/vuln/detail/${v.cveID}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="kev-top">
                    <span className="kev-cve">{v.cveID}</span>
                    {v.ransomware && (
                      <span className="kev-ransom" title="Known to be used in ransomware campaigns">
                        ⚠ ransomware
                      </span>
                    )}
                    {due && <span className={`kev-due kev-due-${due.state}`}>{due.label}</span>}
                  </div>

                  <h3 className="kev-name">{v.name}</h3>
                  <p className="kev-desc">{v.description}</p>

                  <div className="kev-foot">
                    <span className="kev-vendor">
                      {v.vendor} · {v.product.trim()}
                    </span>
                    <span className="kev-dates">
                      added {fmtDate(v.dateAdded)} · due {fmtDate(v.dueDate)}
                    </span>
                  </div>
                </a>
              )
            })}
          </div>
        </>
      ) : (
        <div className="ctf-error">
          <p>Couldn&apos;t load the catalog — check it on CISA directly.</p>
          <a className="btn btn-primary" href={CISA_URL} target="_blank" rel="noreferrer">
            Open the KEV catalog →
          </a>
        </div>
      )}

      <p className="ctf-note">
        Refreshed from CISA on each deploy ·{' '}
        <a href={CISA_URL} target="_blank" rel="noreferrer">
          cisa.gov/known-exploited-vulnerabilities-catalog →
        </a>
      </p>
    </div>
  )
}
