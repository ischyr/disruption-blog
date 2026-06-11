import { useMemo } from 'react'
import { warStories } from '../data/warstories'
import { formatDate } from '../lib/posts'
import TerminalDots from '../components/TerminalDots'

export default function WarStories() {
  const stories = useMemo(
    () => [...warStories].sort((a, b) => new Date(b.date) - new Date(a.date)),
    []
  )

  return (
    <div className="page page-narrow">
      <h1 className="page-title">War Stories</h1>
      <p className="page-subtitle">
        Short, sanitized tales from the field — the weird, the funny, and the
        "they really shipped that?" No client names, no real data.
      </p>

      {stories.length > 0 ? (
        <div className="story-list">
          {stories.map((s) => (
            <article className="story" key={s.title}>
              <div className="card-titlebar">
                <TerminalDots />
                <span className="card-filename">{formatDate(s.date)}</span>
              </div>
              <div className="story-body">
                <h3 className="story-title">{s.title}</h3>
                {s.tags?.length > 0 && (
                  <div className="tag-row">
                    {s.tags.map((t) => (
                      <span key={t} className="tag">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <p className="story-text">{s.body}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="shell-output">No war stories yet.</p>
      )}
    </div>
  )
}
