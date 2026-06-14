import { useMemo, useState } from 'react'
import data from '../data/cves.json'

const NVD_URL = 'https://nvd.nist.gov/vuln/search'
const FILTERS = ['all', 'critical', 'high']

function sevClass(severity) {
  return `sev-${(severity || 'none').toLowerCase()}`
}

function fmtDate(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Cves() {
  const [filter, setFilter] = useState('all')

  const items = useMemo(() => {
    if (filter === 'all') return data.items
    return data.items.filter((c) => c.severity.toLowerCase() === filter)
  }, [filter])

  return (
    <div className="page">
      <div className="ctf-head">
        <div>
          <h1 className="page-title">Latest CVEs</h1>
          <p className="page-subtitle">
            Recently published <strong>critical</strong> and <strong>high</strong>{' '}
            severity vulnerabilities from the last {data.window || '30d'}, scored
            via NVD&apos;s primary CVSS rating.
          </p>
        </div>
        <a className="btn" href={NVD_URL} target="_blank" rel="noreferrer">
          Search NVD →
        </a>
      </div>

      {data.items.length > 0 ? (
        <>
          <div className="tag-filter cve-filter">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={`tag-chip${filter === f ? ' active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <p className="count-line">{items.length} CVEs shown</p>

          <div className="cve-grid" key={filter}>
            {items.map((c) => (
              <a
                key={c.id}
                className={`cve-card ${sevClass(c.severity)}`}
                href={`https://nvd.nist.gov/vuln/detail/${c.id}`}
                target="_blank"
                rel="noreferrer"
              >
                <div className="cve-top">
                  <span className={`cve-score ${sevClass(c.severity)}`}>
                    {c.score != null ? c.score.toFixed(1) : '—'}
                  </span>
                  <div className="cve-headline">
                    <span className="cve-id">{c.id}</span>
                    <span className={`cve-sev ${sevClass(c.severity)}`}>{c.severity}</span>
                  </div>
                </div>

                <p className="cve-desc">{c.description}</p>

                <div className="cve-foot">
                  {c.cwe && !/noinfo|other/i.test(c.cwe) && (
                    <span className="cve-cwe">{c.cwe}</span>
                  )}
                  <span className="cve-date">{fmtDate(c.published)}</span>
                </div>
              </a>
            ))}
          </div>
        </>
      ) : (
        <div className="ctf-error">
          <p>Couldn&apos;t load CVEs — search the NVD directly.</p>
          <a className="btn btn-primary" href={NVD_URL} target="_blank" rel="noreferrer">
            Open NVD search →
          </a>
        </div>
      )}

      <p className="ctf-note">
        Refreshed from the NVD API on each deploy ·{' '}
        <a href={NVD_URL} target="_blank" rel="noreferrer">
          nvd.nist.gov →
        </a>
      </p>
    </div>
  )
}
