import { useState } from 'react'
import { site } from '../config'
import { tracks } from '../data/learningPaths'

function levelClass(level) {
  const l = level.toLowerCase()
  if (l.startsWith('begin')) return 'lvl-beginner'
  if (l.startsWith('inter')) return 'lvl-intermediate'
  if (l.startsWith('adv')) return 'lvl-advanced'
  return 'lvl-expert'
}

export default function StartHere() {
  const [active, setActive] = useState(tracks[0].id)
  const track = tracks.find((t) => t.id === active)

  return (
    <div className="page page-narrow">
      <h1 className="page-title">Start Here</h1>
      <p className="page-subtitle">
        A roadmap into offensive security — what to learn, which certs to chase,
        and where to practice, level by level. Two tracks: breaking in
        (pentesting) and writing the exploits (exploitation).
      </p>

      <div className="track-tabs">
        {tracks.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`track-tab${active === t.id ? ' active' : ''}`}
            onClick={() => setActive(t.id)}
          >
            {t.name}
          </button>
        ))}
      </div>

      <p className="track-blurb">{track.blurb}</p>

      <div className="path">
        {track.levels.map((lv, i) => (
          <div className={`path-level ${levelClass(lv.level)}`} key={lv.level}>
            <div className="path-rail">
              <span className="path-dot">{i + 1}</span>
            </div>

            <div className="path-card">
              <div className="path-head">
                <span className="path-level-name">{lv.level}</span>
                <span className="path-time">{lv.time}</span>
              </div>
              <p className="path-focus">{lv.focus}</p>

              <div className="path-block">
                <span className="path-block-label">Learn</span>
                <div className="tag-row">
                  {lv.skills.map((s) => (
                    <span key={s} className="tag">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {lv.certs.length > 0 && (
                <div className="path-block">
                  <span className="path-block-label">Certifications</span>
                  <div className="tag-row">
                    {lv.certs.map((c) => (
                      <span key={c.name} className="cert-chip" title={c.issuer}>
                        {c.name}
                        <span className="cert-chip-issuer">{c.issuer}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="path-block">
                <span className="path-block-label">Practice &amp; resources</span>
                <ul className="path-resources">
                  {lv.resources.map((r) => (
                    <li key={r.url}>
                      <a href={r.url} target="_blank" rel="noreferrer">
                        {r.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="start-cta">
        <p>Want a guided path instead of piecing it together alone?</p>
        <a
          className="btn btn-primary"
          href={site.academy}
          target="_blank"
          rel="noreferrer"
        >
          Train with Disruption Academy →
        </a>
      </div>
    </div>
  )
}
