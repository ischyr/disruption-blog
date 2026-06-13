import { Link } from 'react-router-dom'
import { posts } from '../lib/posts'
import { useSaved } from '../lib/bookmarks'
import PostCard from '../components/PostCard'

export default function Saved() {
  const slugs = useSaved()
  // preserve saved order (newest-saved first); drop any slugs no longer present
  const savedPosts = slugs
    .map((slug) => posts.find((p) => p.slug === slug))
    .filter(Boolean)

  return (
    <div className="page">
      <h1 className="page-title">Saved</h1>
      <p className="page-subtitle">
        Your reading list — bookmarked posts, stored locally in this browser.
        Nothing leaves your machine.
      </p>

      {savedPosts.length > 0 ? (
        <>
          <p className="count-line">
            {savedPosts.length} {savedPosts.length === 1 ? 'post' : 'posts'} saved
          </p>
          <div className="post-grid post-grid-3" key={savedPosts.length}>
            {savedPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </>
      ) : (
        <div className="saved-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />
          </svg>
          <p className="shell-output">
            Nothing saved yet — hit{' '}
            <span className="kbd-inline">Save</span> on any post to build your
            reading list.
          </p>
          <Link to="/blog" className="btn">
            Browse the blog →
          </Link>
        </div>
      )}
    </div>
  )
}
