import { Link } from 'react-router-dom'
import { formatDate } from '../lib/posts'

export default function RecentPosts({ posts, title = 'Recent Posts' }) {
  if (!posts.length) return null

  return (
    <div className="suggest-panel">
      <div className="suggest-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3v5h5" />
          <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
          <path d="M12 7v5l3 2" />
        </svg>
        <span>{title}</span>
      </div>

      <div className="suggest-list">
        {posts.map((p) => (
          <Link key={p.slug} to={`/blog/${p.slug}`} className="suggest-item">
            <div className="suggest-thumb">
              {p.image ? (
                <img src={p.image} alt="" loading="lazy" />
              ) : (
                <svg
                  className="suggest-thumb-fallback"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <rect x="4" y="3" width="16" height="18" rx="2" />
                  <path d="M8 8h8M8 12h8M8 16h5" />
                </svg>
              )}
            </div>
            <div className="suggest-info">
              <span className="suggest-title">{p.title}</span>
              <span className="suggest-date">{formatDate(p.date)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
