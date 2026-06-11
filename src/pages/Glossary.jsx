import { useMemo, useState } from 'react'
import { glossary } from '../data/glossary'

export default function Glossary() {
  const [q, setQ] = useState('')

  const sorted = useMemo(
    () => [...glossary].sort((a, b) => a.term.localeCompare(b.term)),
    []
  )

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase()
    if (!ql) return sorted
    return sorted.filter(
      (t) =>
        t.term.toLowerCase().includes(ql) ||
        t.definition.toLowerCase().includes(ql)
    )
  }, [q, sorted])

  const groups = useMemo(() => {
    const map = new Map()
    filtered.forEach((t) => {
      const letter = t.term[0].toUpperCase()
      if (!map.has(letter)) map.set(letter, [])
      map.get(letter).push(t)
    })
    return [...map.entries()]
  }, [filtered])

  return (
    <div className="page page-narrow">
      <h1 className="page-title">Glossary</h1>
      <p className="page-subtitle">
        A quick reference of offensive-security terms and acronyms.
      </p>

      <div className="search-box glossary-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search terms…"
          aria-label="Search glossary"
        />
      </div>

      <p className="count-line">
        {filtered.length} {filtered.length === 1 ? 'term' : 'terms'}
      </p>

      {groups.length > 0 ? (
        groups.map(([letter, items]) => (
          <section key={letter} className="glossary-group">
            <h2 className="glossary-letter">{letter}</h2>
            <dl className="glossary-list">
              {items.map((t) => (
                <div key={t.term} className="glossary-item">
                  <dt>{t.term}</dt>
                  <dd>{t.definition}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))
      ) : (
        <p className="shell-output">No terms match your search.</p>
      )}
    </div>
  )
}
