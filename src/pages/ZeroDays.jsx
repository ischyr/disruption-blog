import { useMemo, useState } from 'react'
import data from '../data/pzero-0day.json'

const SHEET =
  data.source ||
  'https://googleprojectzero.blogspot.com/p/0day.html'

function linkFor(z) {
  return z.advisory || z.analysis || `https://nvd.nist.gov/vuln/detail/${z.cve}`
}

export default function ZeroDays() {
  const [year, setYear] = useState('all')

  const years = useMemo(() => {
    const set = new Set(data.items.map((z) => z.year).filter(Boolean))
    return [...set].sort((a, b) => b.localeCompare(a))
  }, [])

  const items = useMemo(() => {
    if (year === 'all') return data.items
    return data.items.filter((z) => z.year === year)
  }, [year])

  return (
    <div className="page">
      <div className="ctf-head">
        <div>
          <h1 className="page-title">0-Day In The Wild</h1>
          <p className="page-subtitle">
            Vulnerabilities confirmed exploited in the wild as zero-days, from
            Google Project Zero&apos;s public tracker. The {data.items.length}{' '}
            most recent of the catalogue.
          </p>
        </div>
        <a className="btn" href={SHEET} target="_blank" rel="noreferrer">
          Full tracker →
        </a>
      </div>

      {data.items.length > 0 ? (
        <>
          <div className="tag-filter cve-filter">
            <button
              type="button"
              className={`tag-chip${year === 'all' ? ' active' : ''}`}
              onClick={() => setYear('all')}
            >
              all
            </button>
            {years.map((y) => (
              <button
                key={y}
                type="button"
                className={`tag-chip${year === y ? ' active' : ''}`}
                onClick={() => setYear(y)}
              >
                {y}
              </button>
            ))}
          </div>

          <p className="count-line">{items.length} zero-days shown</p>

          <div className="zd-grid" key={year}>
            {items.map((z) => (
              <a
                key={z.cve}
                className="zd-card"
                href={linkFor(z)}
                target="_blank"
                rel="noreferrer"
              >
                <div className="zd-top">
                  <span className="zd-cve">{z.cve}</span>
                  {z.type && <span className="zd-type">{z.type}</span>}
                </div>

                <h3 className="zd-target">
                  {z.vendor}
                  {z.product ? ` · ${z.product}` : ''}
                </h3>

                {z.description && <p className="zd-desc">{z.description}</p>}

                <div className="zd-foot">
                  {z.discovered && <span>discovered {z.discovered}</span>}
                  {z.patched && <span>patched {z.patched}</span>}
                </div>
              </a>
            ))}
          </div>
        </>
      ) : (
        <div className="ctf-error">
          <p>Couldn&apos;t load the tracker — view it on Project Zero directly.</p>
          <a className="btn btn-primary" href={SHEET} target="_blank" rel="noreferrer">
            Open the 0day tracker →
          </a>
        </div>
      )}

      <p className="ctf-note">
        Refreshed from Project Zero on each deploy ·{' '}
        <a href={SHEET} target="_blank" rel="noreferrer">
          see the source sheet →
        </a>
      </p>
    </div>
  )
}
