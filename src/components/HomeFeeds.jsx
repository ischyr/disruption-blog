import { Link } from 'react-router-dom'
import kev from '../data/cisa-kev.json'
import cves from '../data/cves.json'
import zero from '../data/pzero-0day.json'
import rw from '../data/ransomware.json'
import ctf from '../data/ctf-events.json'

const N = 3

function fmtDay(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function ago(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const days = Math.round((Date.now() - d.getTime()) / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return '1d'
  if (days < 31) return `${days}d`
  return `${Math.round(days / 30)}mo`
}

function sevCls(s) {
  return `sev-${(s || 'none').toLowerCase()}`
}

function Panel({ to, label, count, live, children }) {
  return (
    <div className="feed-panel">
      <Link to={to} className="feed-panel-head">
        <span className={`feed-dot${live ? ' feed-dot-live' : ''}`} />
        <span className="feed-title">{label}</span>
        {count != null && <span className="feed-count">{count}</span>}
        <span className="feed-all">all →</span>
      </Link>
      <div className="feed-rows">{children}</div>
    </div>
  )
}

export default function HomeFeeds() {
  return (
    <section className="home-feeds">
      <div className="section-header">
        <h2>Live security feeds</h2>
        <span className="feed-refresh">auto-refreshed daily</span>
      </div>

      <div className="feed-grid">
        <Panel to="/kev" label="CISA KEV" count={kev.total} live>
          {kev.items.slice(0, N).map((v) => (
            <div className="feed-row" key={v.cveID}>
              <span className="feed-mono">{v.cveID}</span>
              <span className="feed-text">
                {v.vendor} {v.product.trim()}
              </span>
              {v.ransomware && <span className="feed-flag" title="ransomware-linked">⚠</span>}
            </div>
          ))}
        </Panel>

        <Panel to="/cves" label="Latest CVEs" count={cves.items.length} live>
          {cves.items.slice(0, N).map((c) => (
            <div className="feed-row" key={c.id}>
              <span className={`feed-score ${sevCls(c.severity)}`}>
                {c.score != null ? c.score.toFixed(1) : '—'}
              </span>
              <span className="feed-mono feed-text">{c.id}</span>
              <span className={`feed-sev ${sevCls(c.severity)}`}>{c.severity}</span>
            </div>
          ))}
        </Panel>

        <Panel to="/0day" label="0-Day ITW" count={zero.items.length}>
          {zero.items.slice(0, N).map((z) => (
            <div className="feed-row" key={z.cve}>
              <span className="feed-mono">{z.cve}</span>
              <span className="feed-text">
                {z.vendor}
                {z.product ? ` · ${z.product}` : ''}
              </span>
            </div>
          ))}
        </Panel>

        <Panel to="/ransomware" label="Ransomware" count={rw.items.length} live>
          {rw.items.slice(0, N).map((v, i) => (
            <div className="feed-row" key={`${v.victim}-${i}`}>
              <span className="feed-text feed-strong">{v.victim}</span>
              {v.group && <span className="feed-grouptag">{v.group}</span>}
              <span className="feed-when">{ago(v.discovered || v.attackdate)}</span>
            </div>
          ))}
        </Panel>

        <Panel to="/ctf" label="CTF Events" count={ctf.length}>
          {ctf.slice(0, N).map((e) => (
            <div className="feed-row" key={e.id}>
              <span className="feed-text feed-strong">{e.title}</span>
              <span className="feed-when">{fmtDay(e.start)}</span>
            </div>
          ))}
        </Panel>

        <div className="feed-panel">
          <div className="feed-panel-head feed-panel-head-static">
            <span className="feed-dot" />
            <span className="feed-title">Explore</span>
          </div>
          <div className="feed-rows">
            <Link className="feed-row feed-row-link" to="/toolbox">
              <span className="feed-text feed-strong">Toolbox</span>
              <span className="feed-text">CVSS · encoders · revshells</span>
            </Link>
            <Link className="feed-row feed-row-link" to="/glossary">
              <span className="feed-text feed-strong">Glossary</span>
              <span className="feed-text">offensive-security terms</span>
            </Link>
            <Link className="feed-row feed-row-link" to="/graph">
              <span className="feed-text feed-strong">Graph</span>
              <span className="feed-text">posts &amp; tags, connected</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
