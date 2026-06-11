import { useMemo, useState } from 'react'
import { snippets } from '../data/snippets'
import Markdown from '../components/Markdown'

export default function Snippets() {
  const [q, setQ] = useState('')
  const [tag, setTag] = useState('')

  const allTags = useMemo(() => {
    const set = new Set()
    snippets.forEach((s) => s.tags.forEach((t) => set.add(t)))
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [])

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase()
    return snippets.filter((s) => {
      if (tag && !s.tags.includes(tag)) return false
      if (!ql) return true
      return (
        s.title.toLowerCase().includes(ql) ||
        s.desc.toLowerCase().includes(ql) ||
        s.code.toLowerCase().includes(ql) ||
        s.tags.some((t) => t.toLowerCase().includes(ql))
      )
    })
  }, [q, tag])

  return (
    <div className="page">
      <h1 className="page-title">Snippets</h1>
      <p className="page-subtitle">
        A library of reusable one-liners and small scripts — the commands I
        reach for again and again.
      </p>

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
            placeholder="Search snippets…"
            aria-label="Search snippets"
          />
        </div>

        <div className="tag-filter">
          <button
            type="button"
            className={`tag-chip${!tag ? ' active' : ''}`}
            onClick={() => setTag('')}
          >
            all
          </button>
          {allTags.map((t) => (
            <button
              type="button"
              key={t}
              className={`tag-chip${tag === t ? ' active' : ''}`}
              onClick={() => setTag(tag === t ? '' : t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <p className="count-line">
        {filtered.length} {filtered.length === 1 ? 'snippet' : 'snippets'}
      </p>

      {filtered.length > 0 ? (
        <div className="snippet-list">
          {filtered.map((s) => (
            <article className="snippet" key={s.title}>
              <div className="snippet-head">
                <h3 className="snippet-title">{s.title}</h3>
                <div className="tag-row">
                  {s.tags.map((t) => (
                    <span key={t} className="tag">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <p className="snippet-desc">{s.desc}</p>
              <Markdown>{`\`\`\`${s.lang}\n${s.code}\n\`\`\``}</Markdown>
            </article>
          ))}
        </div>
      ) : (
        <p className="shell-output">No snippets match — try a different search.</p>
      )}
    </div>
  )
}
