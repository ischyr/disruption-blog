import { Link } from 'react-router-dom'
import { site } from '../config'
import { posts, formatDate } from '../lib/posts'
import { tools } from '../data/tools'
import { certs } from '../data/certs'
import PostCard from '../components/PostCard'
import StatIcon from '../components/StatIcon'
import TerminalDots from '../components/TerminalDots'
import ContributionHeatmap from '../components/ContributionHeatmap'
import Reveal from '../components/Reveal'
import Typewriter from '../components/Typewriter'
import HeroSearch from '../components/HeroSearch'

export default function Home() {
  const featured = posts[0]
  const latest = posts.slice(0, 2)

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-left">
          <span className="hero-pill">
            <span className="pill-dot" />
            Offensive security research &amp; tooling
          </span>
          <h1 className="hero-title">
            Exploits, write-ups &amp; research.{' '}
            <span className="dim">Documented.</span>
          </h1>
          <p className="hero-sub">
            I specialize in <Typewriter phrases={site.specialties} />
          </p>
          <div className="hero-actions">
            <Link to="/blog" className="btn btn-primary">
              Read the blog
            </Link>
            <Link to="/about" className="btn">
              About me
            </Link>
          </div>
          <HeroSearch />
        </div>

        {featured && (
          <Link to={`/blog/${featured.slug}`} className="hero-card">
            <div className="card-titlebar">
              <TerminalDots />
              <span className="titlebar-label">
                {site.handle} · latest post
              </span>
            </div>
            <div className="finding-body">
              <div className="finding-label">Post</div>
              <div className="finding-value">{featured.title}</div>

              <div className="finding-label">Published</div>
              <div className="finding-meta">
                {formatDate(featured.date)} · {featured.readTime}
              </div>

              <div className="finding-label">Preview</div>
              <div className="finding-snippet">
                {featured.body.trim().slice(0, 260)}
              </div>

              <div className="finding-foot">
                <div className="tag-row">
                  {featured.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="cat-link">read full post →</span>
              </div>
            </div>
          </Link>
        )}
      </section>

      <Reveal>
        <section className="stats">
          <Link to="/blog" className="stat">
            <StatIcon type="articles" />
            <span className="stat-value">{posts.length}</span>
            <span className="stat-label">articles published</span>
          </Link>
          <Link to="/tools" className="stat">
            <StatIcon type="tools" />
            <span className="stat-value">{tools.length}</span>
            <span className="stat-label">tools released</span>
          </Link>
          <Link to="/about" className="stat">
            <StatIcon type="certs" />
            <span className="stat-value">{certs.length}</span>
            <span className="stat-label">certifications</span>
          </Link>
        </section>
      </Reveal>

      <Reveal>
        <section className="activity">
          <div className="section-header">
            <h2>Posting activity</h2>
          </div>
          <ContributionHeatmap />
        </section>
      </Reveal>

      <Reveal>
        <section className="latest">
          <div className="section-header">
            <h2>Latest posts</h2>
            <Link to="/blog" className="cat-link">
              view all →
            </Link>
          </div>
          <div className="post-grid">
            {latest.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      </Reveal>

    </div>
  )
}
