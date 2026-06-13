import { useState } from 'react'
import events from '../data/ctf-events.json'

const CTFTIME_URL = 'https://ctftime.org/event/list/upcoming'

function fmt(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  })
}

function EventLogo({ src, alt }) {
  const [broken, setBroken] = useState(false)
  if (!src || broken) return <span className="ctf-logo ctf-logo-fallback">{'>_'}</span>
  return (
    <img
      className="ctf-logo"
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  )
}

export default function CtfEvents() {
  return (
    <div className="page page-narrow">
      <div className="ctf-head">
        <div>
          <h1 className="page-title">CTF Events</h1>
          <p className="page-subtitle">
            The next {events.length || 10} upcoming CTFs, from CTFtime.
          </p>
        </div>
        <a className="btn" href={CTFTIME_URL} target="_blank" rel="noreferrer">
          View all on CTFtime →
        </a>
      </div>

      {events.length > 0 ? (
        <div className="ctf-list">
          {events.map((e) => (
            <a
              key={e.id}
              className="ctf-card"
              href={e.ctftime_url || CTFTIME_URL}
              target="_blank"
              rel="noreferrer"
            >
              <EventLogo src={e.logo} alt="" />
              <div className="ctf-body">
                <h3 className="ctf-name">{e.title}</h3>
                <div className="ctf-meta">
                  {e.format && <span>{e.format}</span>}
                  <span>{e.onsite ? e.location || 'On-site' : 'Online'}</span>
                  {e.restrictions && e.restrictions !== 'Open' && (
                    <span>{e.restrictions}</span>
                  )}
                  {Number(e.weight) > 0 && <span>weight {e.weight}</span>}
                </div>
              </div>
              <div className="ctf-when">
                <span className="ctf-date">{fmt(e.start)} UTC</span>
                <span className="ctf-teams">{e.participants} teams</span>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="ctf-error">
          <p>Couldn&apos;t load events — check the live list instead.</p>
          <a className="btn btn-primary" href={CTFTIME_URL} target="_blank" rel="noreferrer">
            Open the upcoming list on CTFtime →
          </a>
        </div>
      )}

      <p className="ctf-note">
        Refreshed from CTFtime on each deploy ·{' '}
        <a href={CTFTIME_URL} target="_blank" rel="noreferrer">
          see the live list →
        </a>
      </p>
    </div>
  )
}
