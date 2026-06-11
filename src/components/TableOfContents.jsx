import { useEffect, useRef, useState } from 'react'

// Offset so a heading lands just below the sticky navbar after scrolling.
const SCROLL_OFFSET = 90

export default function TableOfContents({ headings }) {
  const [activeId, setActiveId] = useState(headings[0]?.id)
  const visible = useRef(new Map())

  useEffect(() => {
    visible.current = new Map()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visible.current.set(entry.target.id, entry.isIntersecting)
        }
        // active = first heading (in document order) currently in the band
        const firstVisible = headings.find((h) => visible.current.get(h.id))
        if (firstVisible) setActiveId(firstVisible.id)
      },
      { rootMargin: '-72px 0px -58% 0px', threshold: 0 }
    )

    const els = headings
      .map((h) => document.getElementById(h.id))
      .filter(Boolean)
    els.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [headings])

  const handleClick = (e, id) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (!el) return
    const top =
      el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET
    window.scrollTo({ top, behavior: 'smooth' })
    setActiveId(id)
    if (window.history?.replaceState) {
      window.history.replaceState(null, '', `#${id}`)
    }
  }

  return (
    <nav className="toc-inner" aria-label="Table of contents">
      <div className="toc-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
        <span>Contents</span>
        <span className="toc-count">{headings.length}</span>
      </div>

      <div className="toc-list">
        {headings.map((h) => (
          <a
            key={h.id}
            href={`#${h.id}`}
            onClick={(e) => handleClick(e, h.id)}
            className={
              'toc-link toc-depth-' + h.depth + (activeId === h.id ? ' active' : '')
            }
          >
            {h.text}
          </a>
        ))}
      </div>
    </nav>
  )
}
