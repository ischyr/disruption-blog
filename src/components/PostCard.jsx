import { formatDate } from '../lib/posts'
import TransitionLink from './TransitionLink'
import DecryptText from './DecryptText'
import BookmarkButton from './BookmarkButton'

const MAX_TAGS = 3

export default function PostCard({ post }) {
  const extraTags = post.tags.length - MAX_TAGS

  return (
    <article className="card post-card">
      <BookmarkButton slug={post.slug} variant="icon" />
      <TransitionLink to={`/blog/${post.slug}`} className="card-inner">
        {post.image && (
          <div className="card-cover">
            <img
              src={post.image}
              alt=""
              loading="lazy"
              style={{ viewTransitionName: `cover-${post.slug}` }}
            />
          </div>
        )}

        <div className="card-content">
          {post.tags.length > 0 && (
            <div className="tag-row">
              {post.tags.slice(0, MAX_TAGS).map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
              {extraTags > 0 && <span className="tag-more">+{extraTags}</span>}
            </div>
          )}

          <h3 className="card-title">
            <DecryptText text={post.title} />
          </h3>
          <p className="card-excerpt">{post.excerpt}</p>

          <div className="card-foot">
            <span className="card-meta">
              <span className="card-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                {formatDate(post.date)}
              </span>
              <span className="card-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="13" r="8" />
                  <path d="M12 9v4l2.5 2.5M9 2h6" />
                </svg>
                {post.readTime}
              </span>
            </span>
            <span className="read-link">Read →</span>
          </div>
        </div>
      </TransitionLink>
    </article>
  )
}
