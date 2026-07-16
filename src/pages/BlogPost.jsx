import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { posts, getPost, formatDate, resolveImages, relatedPosts, loadPostBody } from '../lib/posts'
import { extractHeadings } from '../lib/toc'
import { site } from '../config'
import Markdown from '../components/Markdown'
import TableOfContents from '../components/TableOfContents'
import RecentPosts from '../components/RecentPosts'
import PostNav from '../components/PostNav'
import PostQR from '../components/PostQR'
import AuthorCard from '../components/AuthorCard'
import MachineCard from '../components/MachineCard'
import BookmarkButton from '../components/BookmarkButton'

export default function BlogPost() {
  const { slug } = useParams()
  const post = getPost(slug)

  // The body lives in its own code-split chunk; fetch it when the slug changes.
  // We store the body together with the slug it belongs to, then derive loading
  // state — so the effect only ever calls setState from its async callback.
  const [loaded, setLoaded] = useState({ slug: null, body: '' })
  const [excerptOpen, setExcerptOpen] = useState(false)

  useEffect(() => {
    if (!post) return
    let active = true
    loadPostBody(slug)
      .then((raw) => active && setLoaded({ slug, body: raw }))
      .catch(() => active && setLoaded({ slug, body: '' }))
    return () => {
      active = false
    }
  }, [slug, post])

  const ready = loaded.slug === slug
  const rawBody = ready ? loaded.body : ''
  const loading = Boolean(post) && !ready

  const headings = useMemo(() => extractHeadings(rawBody), [rawBody])
  const body = useMemo(
    () => (post ? resolveImages(rawBody, post.images) : ''),
    [rawBody, post]
  )
  const hasToc = headings.length >= 2

  // neighbours (posts are sorted newest-first): prev = newer, next = older
  const idx = posts.findIndex((p) => p.slug === slug)
  const prev = idx > 0 ? posts[idx - 1] : null
  const next = idx >= 0 && idx < posts.length - 1 ? posts[idx + 1] : null
  const suggestions = relatedPosts(slug, 5)
  const hasSidebar = hasToc || suggestions.length > 0

  if (!post) {
    return (
      <div className="page">
        <p className="shell-line">
          <span className="shell-prompt">[{site.handle}@blog]$</span> cat{' '}
          {slug}.md
          <br />
          <span className="error">cat: {slug}.md: No such file or directory</span>
        </p>
        <Link to="/blog" className="cat-link">
          ← cd ~/blog
        </Link>
      </div>
    )
  }

  return (
    <div className={`page ${hasSidebar ? 'post-layout' : 'page-narrow'}`}>
      {hasSidebar && (
        <aside className="post-rail-left">
          <PostQR />
        </aside>
      )}

      <div className="post-main">
        <Link to="/blog" className="cat-link back-link">
          ← cd ~/blog
        </Link>

        <article className="post">
          <div className="post-header">
            {post.image && (
              <div className="post-cover">
                <img
                  src={post.image}
                  alt=""
                  style={{ viewTransitionName: `cover-${post.slug}` }}
                />
              </div>
            )}
            <div className="post-header-body">
              <div className="post-title-row">
                <h1 className="post-title">{post.title}</h1>
                <BookmarkButton slug={post.slug} variant="label" />
              </div>
              <div className="card-meta">
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
              </div>
              {post.tags.length > 0 && (
                <div className="tag-row">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/blog?tag=${encodeURIComponent(tag)}`}
                      className="tag tag-link"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              )}
              {post.excerpt && (
                <div className={`post-excerpt${excerptOpen ? ' open' : ''}`}>
                  <p className="post-excerpt-text">{post.excerpt}</p>
                  {post.excerpt.length > 140 && (
                    <button
                      type="button"
                      className="post-excerpt-toggle"
                      onClick={() => setExcerptOpen((o) => !o)}
                      aria-expanded={excerptOpen}
                    >
                      {excerptOpen ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <MachineCard machine={post.machine} />
          {loading ? (
            <div className="post-skeleton" aria-hidden="true">
              <span className="post-skeleton-line" />
              <span className="post-skeleton-line" />
              <span className="post-skeleton-line short" />
              <span className="post-skeleton-block" />
              <span className="post-skeleton-line" />
              <span className="post-skeleton-line short" />
            </div>
          ) : (
            <Markdown>{body}</Markdown>
          )}
        </article>

        <PostNav prev={prev} next={next} />
        <AuthorCard />
      </div>

      {hasSidebar && (
        <aside className="post-sidebar">
          {hasToc && <TableOfContents headings={headings} />}
          <RecentPosts posts={suggestions} title="Related Posts" />
        </aside>
      )}
    </div>
  )
}
