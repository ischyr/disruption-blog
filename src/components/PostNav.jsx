import { Link } from 'react-router-dom'

function Adjacent({ post, dir }) {
  if (!post) return <div className="adjacent-empty" aria-hidden="true" />

  const label = dir === 'prev' ? '← Previous Post' : 'Next Post →'

  return (
    <Link to={`/blog/${post.slug}`} className={`adjacent adjacent-${dir}`}>
      {post.image && <img className="adjacent-bg" src={post.image} alt="" />}
      <span className="adjacent-overlay" />
      <span className="adjacent-content">
        <span className="adjacent-label">{label}</span>
        <span className="adjacent-title">{post.title}</span>
      </span>
    </Link>
  )
}

export default function PostNav({ prev, next }) {
  if (!prev && !next) return null

  return (
    <nav className="post-nav" aria-label="More posts">
      <Adjacent post={prev} dir="prev" />
      <Adjacent post={next} dir="next" />
    </nav>
  )
}
