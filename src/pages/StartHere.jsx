import { useEffect, useState } from 'react'
import { site } from '../config'
import { tracks } from '../data/learningPaths'

function levelClass(level) {
  const l = level.toLowerCase()
  if (l.startsWith('begin')) return 'lvl-beginner'
  if (l.startsWith('inter')) return 'lvl-intermediate'
  if (l.startsWith('adv')) return 'lvl-advanced'
  return 'lvl-expert'
}

/* ── progress tracker for the active track ── */
function RoadmapProgress({ track }) {
  const [done, setDone] = useState({})

  useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem(`roadmap-${track.id}`)) || {})
    } catch {
      setDone({})
    }
  }, [track.id])

  const toggle = (level) => {
    setDone((prev) => {
      const next = { ...prev, [level]: !prev[level] }
      localStorage.setItem(`roadmap-${track.id}`, JSON.stringify(next))
      return next
    })
  }

  const total = track.levels.length
  const completed = track.levels.filter((l) => done[l.level]).length
  const pct = Math.round((completed / total) * 100)

  return (
    <section className="roadmap-progress">
      <h2 className="section-title">Track your progress</h2>
      <div className="progress-bar">
        <div style={{ width: `${pct}%` }} />
      </div>
      <p className="progress-pct">
        {pct}% — {completed}/{total} levels through the {track.name} path
      </p>

      <div className="progress-levels">
        {track.levels.map((l) => {
          const checked = !!done[l.level]
          return (
            <label
              key={l.level}
              className={`progress-item${checked ? ' done' : ''}`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(l.level)}
              />
              <span className="progress-check">{checked ? '✓' : ''}</span>
              <span className="progress-name">{l.level}</span>
              <span className="progress-time">{l.time}</span>
            </label>
          )
        })}
      </div>
    </section>
  )
}

/* ── cert decision helper ── */
const HELPER_LEVELS = [
  { key: 'beginner', label: 'Just starting' },
  { key: 'intermediate', label: 'Some experience' },
  { key: 'advanced', label: 'Experienced' },
]

const HELPER_FOCUS = [
  { key: 'web', label: 'Web apps' },
  { key: 'ad', label: 'Network & AD' },
  { key: 'redteam', label: 'Red teaming' },
  { key: 'exploit', label: 'Exploit dev' },
]

const RECS = {
  beginner: {
    web: { name: 'eJPT', issuer: 'INE', url: 'https://ine.com', why: 'Lock in the fundamentals, then grind the (free) PortSwigger Web Security Academy for web.' },
    ad: { name: 'eJPT', issuer: 'INE', url: 'https://ine.com', why: 'Start with the basics — networking and your first taste of Active Directory.' },
    redteam: { name: 'PNPT', issuer: 'TCM Security', url: 'https://certifications.tcm-sec.com/pnpt/', why: 'A practical, beginner-friendly path with an AD-focused exam and a real report.' },
    exploit: { name: 'Foundations first', issuer: 'pwn.college', url: 'https://pwn.college', why: 'Learn C, assembly and debugging before chasing an exploit-dev certificate.' },
  },
  intermediate: {
    web: { name: 'CPTS', issuer: 'Hack The Box', url: 'https://www.hackthebox.com', why: 'Hands-on, report-based, with strong web + AD coverage before you specialize.' },
    ad: { name: 'OSCP', issuer: 'OffSec', url: 'https://www.offsec.com/courses/pen-200/', why: 'The industry-standard hands-on cert — heavy on enumeration and Active Directory.' },
    redteam: { name: 'CRTP', issuer: 'Altered Security', url: 'https://www.alteredsecurity.com', why: 'The best-value introduction to Active Directory attacks and red teaming.' },
    exploit: { name: 'OSED', issuer: 'OffSec', url: 'https://www.offsec.com/courses/exp-301/', why: 'Windows user-mode exploit development — the natural first exploit-dev cert.' },
  },
  advanced: {
    web: { name: 'OSWE', issuer: 'OffSec', url: 'https://www.offsec.com/courses/web-300/', why: 'White-box web exploitation and bug-chaining — the web specialist certificate.' },
    ad: { name: 'OSEP', issuer: 'OffSec', url: 'https://www.offsec.com/courses/pen-300/', why: 'Evasion and advanced AD / lateral movement for experienced testers.' },
    redteam: { name: 'CRTO', issuer: 'Zero-Point Security', url: 'https://training.zeropointsecurity.co.uk', why: 'Modern red team ops with C2 — the go-to red teaming certification.' },
    exploit: { name: 'OSEE', issuer: 'OffSec', url: 'https://www.offsec.com/courses/exp-401/', why: 'Advanced Windows exploitation — the apex exploit-dev certificate.' },
  },
}

function CertHelper() {
  const [level, setLevel] = useState(null)
  const [focus, setFocus] = useState(null)
  const rec = level && focus ? RECS[level][focus] : null

  return (
    <section className="cert-helper">
      <h2 className="section-title">Which cert next?</h2>
      <p className="helper-intro">Answer two questions for a suggestion.</p>

      <div className="helper-q">
        <span className="helper-label">Where are you?</span>
        <div className="helper-opts">
          {HELPER_LEVELS.map((o) => (
            <button
              key={o.key}
              type="button"
              className={level === o.key ? 'active' : ''}
              onClick={() => setLevel(o.key)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="helper-q">
        <span className="helper-label">What interests you most?</span>
        <div className="helper-opts">
          {HELPER_FOCUS.map((o) => (
            <button
              key={o.key}
              type="button"
              className={focus === o.key ? 'active' : ''}
              onClick={() => setFocus(o.key)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {rec && (
        <div className="helper-result">
          <span className="helper-result-label">Recommended next</span>
          <div className="helper-rec">
            <span className="cert-chip">
              {rec.name}
              <span className="cert-chip-issuer">{rec.issuer}</span>
            </span>
          </div>
          <p>{rec.why}</p>
          <a className="cat-link" href={rec.url} target="_blank" rel="noreferrer">
            explore it →
          </a>
        </div>
      )}
    </section>
  )
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

      <RoadmapProgress track={track} />
      <CertHelper />

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
