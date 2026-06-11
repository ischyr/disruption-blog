import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { posts } from '../lib/posts'
import PostCard from '../components/PostCard'

export default function Blog() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const tag = params.get('tag') || ''

  const allTags = useMemo(() => {
    const set = new Set()
    posts.forEach((p) => p.tags.forEach((t) => set.add(t)))
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [])

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase()
    return posts.filter((p) => {
      if (tag && !p.tags.includes(tag)) return false
      if (!ql) return true
      return (
        p.title.toLowerCase().includes(ql) ||
        p.excerpt.toLowerCase().includes(ql) ||
        p.tags.some((t) => t.toLowerCase().includes(ql))
      )
    })
  }, [q, tag])

  const update = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const isFiltering = Boolean(q || tag)

  return (
    <div className="page">
      <h1 className="page-title">Blog</h1>
      <p className="page-subtitle">
        Security research, exploit development, and technical write-ups
        covering various aspects of offensive security and penetration
        testing.
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
            onChange={(e) => update('q', e.target.value)}
            placeholder="Search posts…"
            aria-label="Search posts"
          />
        </div>

        <div className="tag-filter">
          <button
            type="button"
            className={`tag-chip${!tag ? ' active' : ''}`}
            onClick={() => update('tag', '')}
          >
            all
          </button>
          {allTags.map((t) => (
            <button
              type="button"
              key={t}
              className={`tag-chip${tag === t ? ' active' : ''}`}
              onClick={() => update('tag', tag === t ? '' : t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <p className="count-line">
        {filtered.length} {filtered.length === 1 ? 'article' : 'articles'}
        {isFiltering ? ' matched' : ' published'}
      </p>

      {filtered.length > 0 ? (
        <div className="post-grid">
          {filtered.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <p className="shell-output">
          No posts match — try a different search or clear the filter.
        </p>
      )}
    </div>
  )
}
